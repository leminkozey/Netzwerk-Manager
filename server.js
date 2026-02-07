const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { randomUUID } = crypto;
const WebSocket = require('ws');
const dgram = require('dgram');
const { spawn } = require('child_process');

// ═══════════════════════════════════════════════════════════════════
// Security Utilities
// ═══════════════════════════════════════════════════════════════════

// Constant-time string comparison using HMAC to prevent timing attacks
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const key = crypto.randomBytes(32);
  const hmacA = crypto.createHmac('sha256', key).update(a).digest();
  const hmacB = crypto.createHmac('sha256', key).update(b).digest();
  return crypto.timingSafeEqual(hmacA, hmacB);
}

// Simple password hashing (for local network use)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return timingSafeEqual(hash, testHash);
}

// Check if stored password is hashed or plaintext (for migration)
function isHashedPassword(stored) {
  return typeof stored === 'string' && stored.includes(':') && stored.length > 100;
}

// Symmetric encryption for sensitive data at rest (SSH passwords etc.)
const ENCRYPTION_KEY_FILE = path.join(__dirname, 'Data', '.encryption-key');
function getEncryptionKey() {
  if (fs.existsSync(ENCRYPTION_KEY_FILE)) {
    return Buffer.from(fs.readFileSync(ENCRYPTION_KEY_FILE, 'utf-8').trim(), 'hex');
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(ENCRYPTION_KEY_FILE, key.toString('hex'), 'utf-8');
  return key;
}

function encryptValue(plaintext) {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decryptValue(stored) {
  if (!stored || !stored.startsWith('enc:')) return stored || '';
  try {
    const parts = stored.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

// HTML escape to prevent XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate IP is not internal/dangerous for SSRF protection
function isAllowedProxyTarget(ip) {
  if (!ip) return false;
  // Block localhost
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') return false;
  // Block link-local
  if (ip.startsWith('169.254.')) return false;
  // Block cloud metadata endpoints
  if (ip === '169.254.169.254') return false;
  // Allow private network ranges (expected for local network manager)
  return true;
}

// Session token expiration (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

const app = express();
const PORT = process.env.PORT || 5055;
const DATA_DIR = path.join(__dirname, 'Data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const USER_FILE = path.join(DATA_DIR, 'Nutzer');
const LOGIN_TOKEN_FILE = path.join(DATA_DIR, 'LoginToken.txt');
const WINDOWS_PC_FILE = path.join(DATA_DIR, 'WindowsPC.json');
const UPTIME_FILE = path.join(DATA_DIR, 'uptime.json');
const CONFIG_FILE = path.join(__dirname, 'public', 'config.js');
const MAX_VERSIONS = 100;

// Rate-Limiting Konstanten
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 Minuten

// Runtime data not persisted
const runtime = {
  activeSession: null, // { token, deviceName, loginAt, expiresAt }
  loginAttempts: new Map(), // IP -> { count, lockedUntil, lockoutLevel }
  sockets: new Map(), // token -> WebSocket
};

// Check if session is expired
function isSessionValid() {
  if (!runtime.activeSession) return false;
  if (Date.now() > runtime.activeSession.expiresAt) {
    runtime.activeSession = null;
    return false;
  }
  return true;
}

// Only trust X-Forwarded-For when explicitly configured (set TRUST_PROXY=1)
const TRUST_PROXY = process.env.TRUST_PROXY === '1';

function getClientIp(req) {
  // Only trust X-Forwarded-For if behind a known reverse proxy
  if (TRUST_PROXY && req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  // Direct connection - use socket address
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function getAttemptData(ip) {
  if (!runtime.loginAttempts.has(ip)) {
    runtime.loginAttempts.set(ip, { count: 0, lockedUntil: 0, lockoutLevel: 1 });
  }
  return runtime.loginAttempts.get(ip);
}

function isLocked(ip) {
  const data = getAttemptData(ip);
  if (data.lockedUntil > Date.now()) {
    return { locked: true, remainingMs: data.lockedUntil - Date.now() };
  }
  return { locked: false, remainingMs: 0 };
}

function recordFailedAttempt(ip) {
  const data = getAttemptData(ip);
  data.count += 1;

  if (data.count >= MAX_ATTEMPTS) {
    // Eskalierende Sperre: 5min, 10min, 15min, etc.
    const lockoutMs = BASE_LOCKOUT_MS * data.lockoutLevel;
    data.lockedUntil = Date.now() + lockoutMs;
    data.lockoutLevel += 1;
    data.count = 0;
    return { locked: true, lockoutMs };
  }
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - data.count };
}

function resetAttempts(ip) {
  runtime.loginAttempts.set(ip, { count: 0, lockedUntil: 0, lockoutLevel: 1 });
}

// Raw body parser für Upload-Tests (muss VOR json() kommen)
// #17 Auth-Check VOR Body-Parsing um DoS durch unauthentifizierte 50MB-Uploads zu verhindern
app.use('/api/speedtest/upload', (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token || !isSessionValid() || !timingSafeEqual(runtime.activeSession.token, token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, express.raw({ type: '*/*', limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy to prevent XSS
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' ws: wss:",
  ].join('; '));
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // #23 HSTS - enforce HTTPS for 1 year (only effective when served over HTTPS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CSRF protection: validate Origin header on state-mutating requests
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.origin;
    if (origin) {
      const allowed = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];
      // Also allow the actual host the request came to
      const host = req.headers.host;
      if (host) {
        allowed.push(`http://${host}`, `https://${host}`);
      }
      if (!allowed.includes(origin)) {
        return res.status(403).json({ error: 'Invalid origin' });
      }
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const defaultState = {
  theme: 'dark',
  credentials: { username: 'admin', password: 'admin' },
  speedportInfo: {
    wifiName: '',
    wifiPassword: '',
    serialNumber: '',
    configuration: '',
    remoteUrl: '',
    devicePassword: '',
    modemId: '',
  },
  speedportVersions: [],
  raspberryInfo: {
    model: '',
    hostname: '',
    ipAddress: '',
    vpnIp: '',
    macAddress: '',
    sshUser: '',
    piholeUrl: '',
    piholeRemoteUrl: '',
  },
  raspberryVersions: [],
  deviceTokens: [],
  speedTestHistory: [],
  switchPorts: [
    { id: 'port1', label: 'Port 1', status: '', color: '#000000' },
    { id: 'port2', label: 'Port 2', status: '', color: '#000000' },
    { id: 'port3', label: 'Port 3', status: '', color: '#000000' },
    { id: 'port4', label: 'Port 4', status: '', color: '#000000' },
    { id: 'port5', label: 'Port 5', status: '', color: '#000000' },
    { id: 'port6', label: 'Port 6', status: '', color: '#000000' },
    { id: 'port7', label: 'Port 7', status: '', color: '#000000' },
    { id: 'port8', label: 'Port 8', status: '', color: '#000000' },
  ],
  routerPorts: [
    { id: 'dsl', label: 'DSL', status: '', color: '#7a7a7a' },
    { id: 'lan1', label: 'Link/LAN1', status: '', color: '#0050c8' },
    { id: 'lan2', label: 'LAN2', status: '', color: '#d1ac00' },
    { id: 'lan3', label: 'LAN3', status: '', color: '#d1ac00' },
    { id: 'lan4', label: 'LAN4', status: '', color: '#d1ac00' },
    { id: 'telefon', label: 'Telefon', status: '', color: '#d97800' },
  ],
  versions: [],
};


function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  ensureLoginTokenFile();
  if (!fs.existsSync(DATA_FILE)) {
    // Hash default password on first run
    const initial = { ...defaultState, versions: [] };
    initial.credentials.password = hashPassword(initial.credentials.password);
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    writeCredentialsFile({
      username: initial.credentials.username,
      password: initial.credentials.password,
    });
  } else {
    const existing = readState();
    const fileCredentials = readCredentialsFile();
    if (fileCredentials) {
      existing.credentials = { ...existing.credentials, ...fileCredentials };
    }
    // Migrate plaintext passwords to hashed on startup
    if (!isHashedPassword(existing.credentials.password)) {
      existing.credentials.password = hashPassword(existing.credentials.password);
      writeCredentialsFile({
        username: existing.credentials.username,
        password: existing.credentials.password,
      });
    }
    saveState(existing);
  }
}

// Synchronous mutex for state file operations to prevent race conditions
let _stateLocked = false;
const _stateWaiters = [];

function acquireStateLock() {
  return new Promise((resolve) => {
    if (!_stateLocked) {
      _stateLocked = true;
      resolve();
    } else {
      _stateWaiters.push(resolve);
    }
  });
}

function releaseStateLock() {
  if (_stateWaiters.length > 0) {
    const next = _stateWaiters.shift();
    next();
  } else {
    _stateLocked = false;
  }
}

async function withStateLock(fn) {
  await acquireStateLock();
  try {
    return fn();
  } finally {
    releaseStateLock();
  }
}

function readState() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  const versions = Array.isArray(parsed.versions) ? parsed.versions : [];

  const merged = {
    ...defaultState,
    ...parsed,
    credentials: { ...defaultState.credentials, ...(parsed.credentials || {}) },
    speedportInfo: { ...defaultState.speedportInfo, ...(parsed.speedportInfo || {}) },
    raspberryInfo: { ...defaultState.raspberryInfo, ...(parsed.raspberryInfo || {}) },
    switchPorts: parsed.switchPorts || defaultState.switchPorts,
    routerPorts: parsed.routerPorts || defaultState.routerPorts,
    versions,
    speedportVersions: Array.isArray(parsed.speedportVersions) ? parsed.speedportVersions : [],
    raspberryVersions: Array.isArray(parsed.raspberryVersions) ? parsed.raspberryVersions : [],
    deviceTokens: Array.isArray(parsed.deviceTokens) ? parsed.deviceTokens : [],
    speedTestHistory: Array.isArray(parsed.speedTestHistory) ? parsed.speedTestHistory : [],
  };
  return merged;
}

function saveState(nextState) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2));
}

function buildVersionLabel() {
  const now = new Date();
  const pad = (n) => `${n}`.padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function clonePorts(list = []) {
  return list.map((p) => ({ ...p }));
}

function addVersion(state, summary, snapshot) {
  const version = {
    id: randomUUID(),
    label: buildVersionLabel(),
    summary,
    timestamp: Date.now(),
  };
  if (snapshot) {
    version.snapshot = snapshot;
  }
  state.versions = Array.isArray(state.versions) ? state.versions : [];
  state.versions.unshift(version);
  if (state.versions.length > MAX_VERSIONS) {
    state.versions = state.versions.slice(0, MAX_VERSIONS);
  }
}

function addSpeedportVersion(state, summary, snapshot) {
  const version = {
    id: randomUUID(),
    label: buildVersionLabel(),
    summary,
    timestamp: Date.now(),
  };
  if (snapshot) {
    version.snapshot = snapshot;
  }
  state.speedportVersions = Array.isArray(state.speedportVersions) ? state.speedportVersions : [];
  state.speedportVersions.unshift(version);
  if (state.speedportVersions.length > MAX_VERSIONS) {
    state.speedportVersions = state.speedportVersions.slice(0, MAX_VERSIONS);
  }
}

function addRaspberryVersion(state, summary, snapshot) {
  const version = {
    id: randomUUID(),
    label: buildVersionLabel(),
    summary,
    timestamp: Date.now(),
  };
  if (snapshot) {
    version.snapshot = snapshot;
  }
  state.raspberryVersions = Array.isArray(state.raspberryVersions) ? state.raspberryVersions : [];
  state.raspberryVersions.unshift(version);
  if (state.raspberryVersions.length > MAX_VERSIONS) {
    state.raspberryVersions = state.raspberryVersions.slice(0, MAX_VERSIONS);
  }
}

// Credentials file format:
// Line 1: username
// Line 2: hashed password (for secure comparison)
function writeCredentialsFile(credentials) {
  if (!credentials) return;
  const username = credentials.username ?? '';
  const password = credentials.password ?? '';
  const content = `${username}\n${password}\n`;
  fs.writeFileSync(USER_FILE, content, 'utf-8');
}

function readCredentialsFile() {
  if (!fs.existsSync(USER_FILE)) return null;
  const raw = fs.readFileSync(USER_FILE, 'utf-8');
  const lines = raw.split('\n');
  return {
    username: (lines[0] ?? '').trim(),
    password: (lines[1] ?? '').trim(),
  };
}

function ensureLoginTokenFile() {
  if (fs.existsSync(LOGIN_TOKEN_FILE)) return;
  const sample = [
    '# Jede Zeile: token|Geraetename',
    '# Beispiel:',
    '# 123456789|MacBook von Max',
    '',
  ].join('\n');
  fs.writeFileSync(LOGIN_TOKEN_FILE, sample, 'utf-8');
}

function readLoginTokens() {
  if (!fs.existsSync(LOGIN_TOKEN_FILE)) return [];
  const lines = fs.readFileSync(LOGIN_TOKEN_FILE, 'utf-8').split('\n');
  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [token, name] = line.split('|').map((p) => (p || '').trim());
      return { token, name };
    })
    .filter((entry) => entry.token);
}

// #20 Cache for default-password check to avoid PBKDF2 on every request
let _defaultPwCache = { hash: null, result: false };

function isDefaultPassword(state) {
  if (state.credentials.username !== 'admin') return false;
  const hash = state.credentials.password;
  if (_defaultPwCache.hash === hash) return _defaultPwCache.result;
  const result = verifyPassword('admin', hash);
  _defaultPwCache = { hash, result };
  return result;
}

function maskStateForClient(state) {
  return {
    theme: state.theme,
    switchPorts: state.switchPorts,
    routerPorts: state.routerPorts,
    versions: state.versions,
    speedportInfo: state.speedportInfo,
    speedportVersions: state.speedportVersions,
    raspberryInfo: state.raspberryInfo,
    raspberryVersions: state.raspberryVersions,
    username: state.credentials.username,
    // #20 Warn client if default credentials are still in use
    defaultPassword: isDefaultPassword(state),
  };
}

function usePiSpeedtest() {
  return process.env.PI_SPEEDTEST_ENABLED === '1';
}

function getPiSpeedtestTarget(state) {
  const host = process.env.PI_SPEEDTEST_HOST || state.raspberryInfo?.ipAddress || '192.168.1.1';
  const port = parseInt(process.env.PI_SPEEDTEST_PORT, 10) || 8080;
  return { host, port };
}

function sendPiUnavailable(res, host, port, reason) {
  res.status(503).json({
    error: 'Raspberry Pi nicht erreichbar',
    message: `${host}:${port} ist nicht erreichbar. Laeuft der Pi-Speedtest-Server?`,
    piIp: host,
    reason,
  });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '').trim();

  // Check session exists, token matches, and not expired
  if (!isSessionValid() || !timingSafeEqual(runtime.activeSession.token, token)) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  // Extend session on activity
  runtime.activeSession.expiresAt = Date.now() + SESSION_EXPIRY_MS;
  return next();
}

// ═══════════════════════════════════════════════════════════════════
// Windows PC Functions
// ═══════════════════════════════════════════════════════════════════

// Input validation patterns
const VALIDATION = {
  ipAddress: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  macAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  sshUser: /^[a-zA-Z0-9_.-]{1,32}$/,
  sshPort: (port) => Number.isInteger(port) && port >= 1 && port <= 65535,
  name: /^[a-zA-Z0-9äöüÄÖÜß _.-]{1,50}$/,
};

function validateWindowsPCInput(field, value) {
  if (value === '' || value === undefined || value === null) return true; // Empty is allowed

  switch (field) {
    case 'ipAddress':
      return VALIDATION.ipAddress.test(value);
    case 'macAddress':
      return VALIDATION.macAddress.test(value);
    case 'sshUser':
      return VALIDATION.sshUser.test(value);
    case 'sshPort':
      return VALIDATION.sshPort(parseInt(value, 10));
    case 'name':
      return VALIDATION.name.test(value);
    case 'sshPassword':
      return typeof value === 'string' && value.length <= 128;
    default:
      return false;
  }
}

// Rate limiting for PC control actions (wake/shutdown)
const pcActionLimits = new Map();
const PC_ACTION_LIMIT_WINDOW = 60000; // 1 minute
const PC_ACTION_LIMIT_MAX = 10; // Max 10 actions per minute

function checkPCActionRateLimit(ip) {
  const now = Date.now();
  const data = pcActionLimits.get(ip);

  if (!data || now - data.windowStart > PC_ACTION_LIMIT_WINDOW) {
    pcActionLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (data.count >= PC_ACTION_LIMIT_MAX) {
    return false;
  }

  data.count++;
  return true;
}

// Separate rate limiting for status checks (more lenient)
const pcStatusLimits = new Map();
const PC_STATUS_LIMIT_WINDOW = 60000; // 1 minute
const PC_STATUS_LIMIT_MAX = 60; // Max 60 status checks per minute (1 per second)

function checkPCStatusRateLimit(ip) {
  const now = Date.now();
  const data = pcStatusLimits.get(ip);

  if (!data || now - data.windowStart > PC_STATUS_LIMIT_WINDOW) {
    pcStatusLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (data.count >= PC_STATUS_LIMIT_MAX) {
    return false;
  }

  data.count++;
  return true;
}

// Audit logging for sensitive operations
function logPCAction(action, ip, success, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[PC-AUDIT] ${timestamp} | ${action} | IP: ${ip} | Success: ${success} | ${details}`);
}

function readWindowsPCConfig() {
  if (!fs.existsSync(WINDOWS_PC_FILE)) {
    const defaultConfig = {
      macAddress: '',
      ipAddress: '',
      sshUser: '',
      sshPassword: '',
      sshPort: 22,
      name: 'Windows PC',
    };
    fs.writeFileSync(WINDOWS_PC_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  const config = JSON.parse(fs.readFileSync(WINDOWS_PC_FILE, 'utf-8'));
  // Decrypt SSH password for internal use
  if (config.sshPassword) {
    config._sshPasswordDecrypted = decryptValue(config.sshPassword);
  }
  return config;
}

function saveWindowsPCConfig(config) {
  const toSave = { ...config };
  // Encrypt SSH password before saving if it's not already encrypted
  if (toSave.sshPassword && !toSave.sshPassword.startsWith('enc:')) {
    toSave.sshPassword = encryptValue(toSave.sshPassword);
  }
  delete toSave._sshPasswordDecrypted;
  fs.writeFileSync(WINDOWS_PC_FILE, JSON.stringify(toSave, null, 2));
}

function sendWakeOnLan(macAddress) {
  return new Promise((resolve, reject) => {
    // Validate MAC address format first
    if (!VALIDATION.macAddress.test(macAddress)) {
      return reject(new Error('Ungültige MAC-Adresse'));
    }

    const mac = macAddress.replace(/[:-]/g, '');
    if (!/^[0-9A-Fa-f]{12}$/.test(mac)) {
      return reject(new Error('Ungültige MAC-Adresse'));
    }

    // Magic Packet: 6x 0xFF + 16x MAC-Adresse
    const macBuffer = Buffer.from(mac, 'hex');
    const magicPacket = Buffer.alloc(102);

    // 6 bytes of 0xFF
    for (let i = 0; i < 6; i++) {
      magicPacket[i] = 0xff;
    }

    // 16 repetitions of MAC address
    for (let i = 0; i < 16; i++) {
      macBuffer.copy(magicPacket, 6 + i * 6);
    }

    const socket = dgram.createSocket('udp4');
    socket.once('error', (err) => {
      socket.close();
      reject(new Error('Netzwerkfehler beim Senden'));
    });

    socket.bind(() => {
      socket.setBroadcast(true);
      socket.send(magicPacket, 0, magicPacket.length, 9, '255.255.255.255', (err) => {
        socket.close();
        if (err) reject(new Error('Fehler beim Senden des Wake-Pakets'));
        else resolve();
      });
    });
  });
}

function pingHost(ipAddress) {
  return new Promise((resolve) => {
    // Strict IP validation to prevent command injection
    if (!VALIDATION.ipAddress.test(ipAddress)) {
      return resolve(false);
    }

    const isWindows = process.platform === 'win32';

    // Use spawn with argument array to prevent command injection
    const args = isWindows
      ? ['-n', '1', '-w', '2000', ipAddress]
      : ['-c', '1', '-W', '2', ipAddress];

    const ping = spawn('ping', args, { timeout: 5000 });

    ping.on('close', (code) => {
      resolve(code === 0);
    });

    ping.on('error', () => {
      resolve(false);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Uptime Monitoring
// ═══════════════════════════════════════════════════════════════════

function readUptimeData() {
  try {
    if (fs.existsSync(UPTIME_FILE)) {
      return JSON.parse(fs.readFileSync(UPTIME_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return { devices: {}, outages: [] };
}

function saveUptimeData(data) {
  fs.writeFileSync(UPTIME_FILE, JSON.stringify(data, null, 2));
}

function pruneHistory(history) {
  const maxEntries = 10080; // 7 days at 1 entry/min
  if (history.length > maxEntries) {
    return history.slice(history.length - maxEntries);
  }
  return history;
}

function calculateUptimePercent(history, windowMs) {
  if (history.length === 0) return 0;
  const cutoff = Date.now() - windowMs;
  const relevant = history.filter(e => e[0] >= cutoff);
  if (relevant.length === 0) return 0;
  const onlineCount = relevant.filter(e => e[1]).length;
  return Math.round((onlineCount / relevant.length) * 1000) / 10;
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '0min';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}T`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${mins}min`);
  return parts.join(' ');
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Parse public/config.js and return the siteConfig object
function readSiteConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const src = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const vm = require('vm');
    const sandbox = {};
    vm.createContext(sandbox);
    // const → var so siteConfig lands on the sandbox global object
    const modified = src.replace(/\bconst siteConfig\b/, 'var siteConfig');
    vm.runInContext(modified, sandbox, { timeout: 1000 });
    return sandbox.siteConfig || null;
  } catch {
    return null;
  }
}

// Read uptimeDevices from public/config.js
function readUptimeDevicesFromConfig() {
  const cfg = readSiteConfig();
  const devices = cfg?.uptimeDevices;
  if (!Array.isArray(devices)) return [];
  return devices.filter(d =>
    d && typeof d.id === 'string' && d.id.length > 0
      && typeof d.name === 'string' && d.name.length > 0
      && typeof d.ip === 'string' && VALIDATION.ipAddress.test(d.ip)
  );
}

// Read uptimeInterval (seconds) from config, minimum 10s, default 60s
function readUptimeIntervalMs() {
  const cfg = readSiteConfig();
  const val = cfg?.uptimeInterval;
  if (typeof val === 'number' && val >= 10) return val * 1000;
  return 60000;
}

async function runUptimePingCycle() {
  const configDevices = readUptimeDevicesFromConfig();
  if (configDevices.length === 0) return;

  const data = readUptimeData();
  const now = Date.now();

  // Ensure each configured device has a data entry
  for (const cd of configDevices) {
    if (!data.devices[cd.id]) {
      data.devices[cd.id] = { history: [], onlineSince: null, lastSeen: null };
    }
  }

  const pingResults = await Promise.all(
    configDevices.map(cd => pingHost(cd.ip))
  );

  for (let i = 0; i < configDevices.length; i++) {
    const cd = configDevices[i];
    const online = pingResults[i];
    const dev = data.devices[cd.id];

    const wasOnline = dev.history.length > 0 ? dev.history[dev.history.length - 1][1] : null;

    // Record history entry
    dev.history.push([now, online]);
    dev.history = pruneHistory(dev.history);

    if (online) {
      dev.lastSeen = now;
      // Came online (was offline or first contact)
      if (wasOnline === false || wasOnline === null) {
        dev.onlineSince = now;
        // Close any ongoing outage for this device
        for (const outage of data.outages) {
          if (outage.device === cd.id && !outage.end) {
            outage.end = now;
            outage.durationMs = now - outage.start;
          }
        }
      }
    } else {
      // Went offline (was online)
      if (wasOnline === true) {
        dev.onlineSince = null;
        data.outages.push({ device: cd.id, start: now, end: null, durationMs: null });
      }
    }
  }

  // Keep only last 50 outages
  if (data.outages.length > 50) {
    data.outages = data.outages.slice(data.outages.length - 50);
  }

  saveUptimeData(data);
}

function buildUptimeResponse() {
  const configDevices = readUptimeDevicesFromConfig();
  const data = readUptimeData();
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Build name lookup from config
  const nameMap = {};
  for (const cd of configDevices) {
    nameMap[cd.id] = cd.name;
  }

  const devices = configDevices.map(cd => {
    const dev = data.devices[cd.id] || { history: [], onlineSince: null, lastSeen: null };
    const lastEntry = dev.history.length > 0 ? dev.history[dev.history.length - 1] : null;
    const online = lastEntry ? lastEntry[1] : false;
    const uptime24h = calculateUptimePercent(dev.history, DAY_MS);
    const uptime7d = calculateUptimePercent(dev.history, 7 * DAY_MS);
    const onlineSinceTs = dev.onlineSince || null;
    const onlineSince = onlineSinceTs ? formatDuration(now - onlineSinceTs) : null;

    return {
      id: cd.id,
      name: cd.name,
      ip: cd.ip,
      online,
      uptime24h,
      uptime7d,
      onlineSince,
      onlineSinceTs,
    };
  });

  // Build outages list (most recent first), limit 20
  const outages = data.outages
    .slice()
    .reverse()
    .slice(0, 20)
    .map(o => ({
      device: nameMap[o.device] || o.device,
      deviceId: o.device,
      timestamp: formatTimestamp(o.start),
      duration: o.end ? formatDuration(o.durationMs) : null,
      ongoing: !o.end,
    }));

  return { devices, outages };
}

function shutdownWindowsPC(config) {
  return new Promise((resolve, reject) => {
    const { ipAddress, sshUser, sshPort } = config;
    const sshPassword = config._sshPasswordDecrypted || decryptValue(config.sshPassword);

    // Validate all inputs before using them
    if (!VALIDATION.ipAddress.test(ipAddress)) {
      return reject(new Error('Ungültige IP-Adresse'));
    }
    if (!VALIDATION.sshUser.test(sshUser)) {
      return reject(new Error('Ungültiger SSH-Benutzername'));
    }
    if (!VALIDATION.sshPort(sshPort)) {
      return reject(new Error('Ungültiger SSH-Port'));
    }
    if (typeof sshPassword !== 'string' || sshPassword.length === 0) {
      return reject(new Error('SSH-Passwort fehlt'));
    }

    // Use spawn with argument array to prevent command injection
    // Use SSHPASS environment variable instead of -p flag (hidden from ps)
    const sshArgs = [
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=5',
      '-o', 'BatchMode=no',
      '-p', String(sshPort),
      `${sshUser}@${ipAddress}`,
      'shutdown /s /t 0'
    ];

    // -e flag reads password from SSHPASS environment variable
    // This keeps the password hidden from process listings (ps aux)
    const sshpass = spawn('sshpass', ['-e', 'ssh', ...sshArgs], {
      timeout: 15000,
      env: { ...process.env, SSHPASS: sshPassword },
    });

    let stderr = '';

    sshpass.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    sshpass.on('close', (code) => {
      // Code 0 = success, code 255 with connection closed = likely successful shutdown
      if (code === 0 || stderr.includes('Connection') || stderr.includes('closed')) {
        resolve();
      } else {
        reject(new Error('Shutdown fehlgeschlagen'));
      }
    });

    sshpass.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('sshpass nicht installiert'));
      } else {
        reject(new Error('SSH-Verbindung fehlgeschlagen'));
      }
    });
  });
}

app.get('/api/bootstrap', (req, res) => {
  const state = readState();
  res.json({
    theme: state.theme,
    versions: state.versions,
  });
});

app.post('/api/login', (req, res) => {
  const { username, password, deviceName = 'Unbekanntes Gerät', deviceToken } = req.body || {};
  const clientIp = getClientIp(req);

  // Rate-Limiting Check
  const lockStatus = isLocked(clientIp);
  if (lockStatus.locked) {
    const remainingMin = Math.ceil(lockStatus.remainingMs / 60000);
    return res.status(429).json({
      success: false,
      locked: true,
      remainingMs: lockStatus.remainingMs,
      message: `Zu viele Fehlversuche. Bitte ${remainingMin} Min warten.`,
    });
  }

  const state = readState();
  const fileCredentials = readCredentialsFile();
  if (fileCredentials) {
    state.credentials = { ...state.credentials, ...fileCredentials };
  }
  const fileTokens = readLoginTokens();
  const fileTokenEntries = fileTokens.filter((t) => t.token);
  const fileTokenList = fileTokenEntries.map((t) => t.token);

  const isWhitelisted = deviceToken && (
    state.deviceTokens.some(t => timingSafeEqual(t, deviceToken)) ||
    fileTokenList.some(t => timingSafeEqual(t, deviceToken))
  );

  // Use timing-safe comparison for credentials
  const storedPassword = state.credentials.password;
  let passwordValid = false;

  if (isHashedPassword(storedPassword)) {
    // Compare against hashed password
    passwordValid = verifyPassword(password, storedPassword);
  } else {
    // Legacy plaintext comparison (will be migrated on next password change)
    passwordValid = timingSafeEqual(password || '', storedPassword || '');
  }

  const usernameValid = timingSafeEqual(username || '', state.credentials.username || '');

  if (!isWhitelisted && (!usernameValid || !passwordValid)) {
    const result = recordFailedAttempt(clientIp);
    if (result.locked) {
      const lockoutMin = Math.ceil(result.lockoutMs / 60000);
      return res.status(429).json({
        success: false,
        locked: true,
        remainingMs: result.lockoutMs,
        message: `Zu viele Fehlversuche. ${lockoutMin} Min gesperrt.`,
      });
    }
    return res.status(401).json({
      success: false,
      attemptsLeft: result.attemptsLeft,
      message: `Falsche Zugangsdaten. Noch ${result.attemptsLeft} Versuche.`,
    });
  }

  // Erfolgreicher Login - Reset
  resetAttempts(clientIp);
  const token = randomUUID();
  const loginAt = Date.now();
  const expiresAt = loginAt + SESSION_EXPIRY_MS;
  const matchedFileToken = fileTokenEntries.find((t) => t.token === deviceToken);
  const effectiveDeviceName = matchedFileToken?.name || deviceName || 'Unbekanntes Gerät';
  const previousSession = runtime.activeSession;
  runtime.activeSession = { token, deviceName: effectiveDeviceName, loginAt, expiresAt };

  if (previousSession && previousSession.token !== token) {
    const prevSocket = runtime.sockets.get(previousSession.token);
    if (prevSocket && prevSocket.readyState === WebSocket.OPEN) {
      prevSocket.send(
        JSON.stringify({
          type: 'forceLogout',
          deviceName,
          loginAt,
        })
      );
    }
  }

  res.json({
    success: true,
    token,
    state: maskStateForClient(state),
  });
});

app.get('/api/state', authRequired, (req, res) => {
  const state = readState();
  res.json(maskStateForClient(state));
});

app.post('/api/theme', authRequired, async (req, res) => {
  const { theme } = req.body || {};
  if (!['dark', 'light'].includes(theme)) {
    return res.status(400).json({ error: 'Ungültiges Theme' });
  }
  await withStateLock(() => {
    const state = readState();
    state.theme = theme;
    saveState(state);
    res.json({ ok: true, theme, versions: state.versions });
  });
});

app.post('/api/ports/color', authRequired, async (req, res) => {
  const { group, id, color } = req.body || {};
  if (!group || !id || !color) {
    return res.status(400).json({ error: 'Fehlende Werte' });
  }
  // #12 Hex-Color validation
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: 'Ungültiges Farbformat (erwartet #RRGGBB)' });
  }

  await withStateLock(() => {
    const state = readState();
    const collection = group === 'switch' ? state.switchPorts : state.routerPorts;
    const port = collection.find((p) => p.id === id);
    if (!port) {
      return res.status(404).json({ error: 'Port nicht gefunden' });
    }
    port.color = color;
    saveState(state);
    res.json({ ok: true, switchPorts: state.switchPorts, routerPorts: state.routerPorts, versions: state.versions });
  });
});

app.post('/api/ports/update', authRequired, async (req, res) => {
  const { group, id, label, status } = req.body || {};
  if (!group || !id) {
    return res.status(400).json({ error: 'Fehlende Werte' });
  }
  if (!['switch', 'router'].includes(group)) {
    return res.status(400).json({ error: 'Ungültige Gruppe' });
  }

  await withStateLock(() => {
    const state = readState();
    const collection = group === 'switch' ? state.switchPorts : state.routerPorts;
    const port = collection.find((p) => p.id === id);
    if (!port) {
      return res.status(404).json({ error: 'Port nicht gefunden' });
    }

    let changed = false;
    if (typeof label === 'string') {
      const next = label.trim();
      if (next !== port.label) {
        port.label = next;
        changed = true;
      }
    }
    if (typeof status === 'string') {
      const next = status.trim();
      if (next !== port.status) {
        port.status = next;
        changed = true;
      }
    }

    if (changed) {
      addVersion(state, `Port geändert: ${port.label}`, {
        switchPorts: clonePorts(state.switchPorts),
        routerPorts: clonePorts(state.routerPorts),
      });
    }
    saveState(state);
    res.json({ ok: true, switchPorts: state.switchPorts, routerPorts: state.routerPorts, versions: state.versions });
  });
});

app.post('/api/settings/credentials', authRequired, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Passwort muss mindestens 4 Zeichen lang sein' });
  }

  await withStateLock(() => {
    const state = readState();
    state.credentials.username = username;
    // Hash the password for secure storage
    state.credentials.password = hashPassword(password);
    saveState(state);
    writeCredentialsFile({
      username,
      password: state.credentials.password,
    });
    // Invalidate active session to force re-login with new credentials
    runtime.activeSession = null;
    res.json({ ok: true, username, sessionInvalidated: true });
  });
});

app.post('/api/speedport', authRequired, async (req, res) => {
  const { wifiName, wifiPassword, serialNumber, configuration, remoteUrl, devicePassword, modemId } = req.body || {};
  // #13 Längen-Limit für alle Speedport-Felder
  const MAX_FIELD_LEN = 256;
  const fields = { wifiName, wifiPassword, serialNumber, configuration, remoteUrl, devicePassword, modemId };
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string' && val.length > MAX_FIELD_LEN) {
      return res.status(400).json({ error: `Feld ${key} zu lang (max ${MAX_FIELD_LEN} Zeichen)` });
    }
  }
  await withStateLock(() => {
    const state = readState();
    const next = {
      wifiName: wifiName ?? '',
      wifiPassword: wifiPassword ?? '',
      serialNumber: serialNumber ?? '',
      configuration: configuration ?? '',
      remoteUrl: remoteUrl ?? '',
      devicePassword: devicePassword ?? '',
      modemId: modemId ?? '',
    };
    const prev = state.speedportInfo || {};
    const changed = Object.keys(next).some((key) => `${prev[key] ?? ''}` !== `${next[key] ?? ''}`);
    state.speedportInfo = next;
    if (changed) {
      addSpeedportVersion(state, 'Speedport geändert', {
        speedportInfo: { ...state.speedportInfo },
      });
    }
    saveState(state);
    res.json({
      ok: true,
      speedportInfo: state.speedportInfo,
      speedportVersions: state.speedportVersions,
    });
  });
});

app.post('/api/raspberry', authRequired, async (req, res) => {
  const { model, hostname, ipAddress, vpnIp, macAddress, sshUser, piholeUrl, piholeRemoteUrl } = req.body || {};
  // #13 Längen-Limit für alle Raspberry-Felder
  const MAX_FIELD_LEN = 256;
  const fields = { model, hostname, ipAddress, vpnIp, macAddress, sshUser, piholeUrl, piholeRemoteUrl };
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string' && val.length > MAX_FIELD_LEN) {
      return res.status(400).json({ error: `Feld ${key} zu lang (max ${MAX_FIELD_LEN} Zeichen)` });
    }
  }
  await withStateLock(() => {
    const state = readState();
    const next = {
      model: model ?? '',
      hostname: hostname ?? '',
      ipAddress: ipAddress ?? '',
      vpnIp: vpnIp ?? '',
      macAddress: macAddress ?? '',
      sshUser: sshUser ?? '',
      piholeUrl: piholeUrl ?? '',
      piholeRemoteUrl: piholeRemoteUrl ?? '',
    };
    const prev = state.raspberryInfo || {};
    const changed = Object.keys(next).some((key) => `${prev[key] ?? ''}` !== `${next[key] ?? ''}`);
    state.raspberryInfo = next;
    if (changed) {
      addRaspberryVersion(state, 'Raspberry geändert', {
        raspberryInfo: { ...state.raspberryInfo },
      });
    }
    saveState(state);
    res.json({
      ok: true,
      raspberryInfo: state.raspberryInfo,
      raspberryVersions: state.raspberryVersions,
    });
  });
});

app.get('/api/versions', authRequired, (req, res) => {
  const state = readState();
  res.json({ versions: state.versions });
});

// Maximum allowed speedtest size (50 MB) to prevent DoS
const MAX_SPEEDTEST_SIZE_MB = 50;

app.get('/api/speedtest/download', authRequired, (req, res) => {
  // Cap size to prevent memory exhaustion DoS
  const sizeMB = Math.min(Math.max(parseInt(req.query.size) || 1, 1), MAX_SPEEDTEST_SIZE_MB);
  const sizeBytes = sizeMB * 1024 * 1024;

  // Generate random data for download test
  const buffer = Buffer.alloc(sizeBytes);
  for (let i = 0; i < sizeBytes; i += 1024) {
    buffer.writeUInt32BE(Math.random() * 0xffffffff, i);
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', sizeBytes);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(buffer);
});

app.post('/api/speedtest/upload', authRequired, (req, res) => {
  // Der Body wurde bereits von express.raw() geparst
  const receivedBytes = req.body ? req.body.length : 0;
  res.json({ ok: true, bytes: receivedBytes });
});

// Local network proxy endpoints - test to Raspberry Pi
app.get('/api/speedtest/local-ping', authRequired, (req, res) => {
  if (!usePiSpeedtest()) {
    return res.status(204).set('X-Pi-Status', 'disabled').end();
  }

  const http = require('http');
  const state = readState();
  const { host, port } = getPiSpeedtestTarget(state);

  // SSRF protection - validate target IP
  if (!isAllowedProxyTarget(host)) {
    return res.status(400).json({ error: 'Ungültige Ziel-IP-Adresse' });
  }

  const options = {
    hostname: host,
    port,
    path: '/speedtest/ping',
    method: 'HEAD',
    timeout: 2000,
  };

  const piRequest = http.request(options, (piRes) => {
    piRes.resume();
    res.status(204).set('X-Pi-Status', 'reachable').end();
  });

  piRequest.on('error', (e) => {
    sendPiUnavailable(res, host, port, e?.message || 'error');
  });

  piRequest.on('timeout', () => {
    piRequest.destroy();
    sendPiUnavailable(res, host, port, 'timeout');
  });

  piRequest.end();
});

app.get('/api/speedtest/local-download-proxy', authRequired, async (req, res) => {
  // Cap size to prevent DoS
  const sizeMB = Math.min(Math.max(parseInt(req.query.size, 10) || 1, 1), MAX_SPEEDTEST_SIZE_MB);

  if (!usePiSpeedtest()) {
    const sizeBytes = sizeMB * 1024 * 1024;
    const buffer = Buffer.alloc(sizeBytes);
    for (let i = 0; i < sizeBytes; i += 1024) {
      buffer.writeUInt32BE(Math.random() * 0xffffffff, i);
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', sizeBytes);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Pi-Status', 'disabled');
    return res.send(buffer);
  }

  const http = require('http');
  const state = readState();
  const { host, port } = getPiSpeedtestTarget(state);

  // SSRF protection - validate target IP
  if (!isAllowedProxyTarget(host)) {
    return res.status(400).json({ error: 'Ungültige Ziel-IP-Adresse' });
  }

  const options = {
    hostname: host,
    port,
    path: `/speedtest/download?size=${sizeMB}`,
    method: 'GET',
    timeout: 10000,
  };

  const piRequest = http.request(options, (piRes) => {
    if (piRes.statusCode && piRes.statusCode >= 400) {
      piRes.resume();
      return res.status(piRes.statusCode).json({
        error: 'Pi-Speedtest-Server Fehler',
        status: piRes.statusCode,
      });
    }

    const length = piRes.headers['content-length'];
    res.status(200);
    res.setHeader('Content-Type', 'application/octet-stream');
    if (length) res.setHeader('Content-Length', length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Pi-Status', 'reachable');
    piRes.pipe(res);
  });

  piRequest.on('error', (e) => {
    sendPiUnavailable(res, host, port, e?.message || 'error');
  });

  piRequest.on('timeout', () => {
    piRequest.destroy();
    sendPiUnavailable(res, host, port, 'timeout');
  });

  piRequest.end();
});

app.post('/api/speedtest/local-upload-proxy', authRequired, (req, res) => {
  if (!usePiSpeedtest()) {
    const receivedBytes = req.body ? req.body.length : 0;
    return res.json({ ok: true, bytes: receivedBytes, piStatus: 'disabled' });
  }

  const http = require('http');
  const state = readState();
  const { host, port } = getPiSpeedtestTarget(state);

  // SSRF protection - validate target IP
  if (!isAllowedProxyTarget(host)) {
    return res.status(400).json({ error: 'Ungültige Ziel-IP-Adresse' });
  }

  const headers = {
    'Content-Type': 'application/octet-stream',
  };
  const contentLength = req.headers['content-length'];
  if (contentLength) headers['Content-Length'] = contentLength;

  const options = {
    hostname: host,
    port,
    path: '/speedtest/upload',
    method: 'POST',
    headers,
    timeout: 10000,
  };

  const piRequest = http.request(options, (piRes) => {
    res.status(piRes.statusCode || 200);
    res.setHeader('X-Pi-Status', 'reachable');
    piRes.pipe(res);
  });

  piRequest.on('error', (e) => {
    sendPiUnavailable(res, host, port, e?.message || 'error');
  });

  piRequest.on('timeout', () => {
    piRequest.destroy();
    sendPiUnavailable(res, host, port, 'timeout');
  });

  req.on('aborted', () => {
    piRequest.destroy();
  });

  req.pipe(piRequest);
});

app.post('/api/speedtest/save', authRequired, async (req, res) => {
  const { download, upload, ping, type, timestamp } = req.body || {};
  await withStateLock(() => {
    const state = readState();

    const testResult = {
      id: randomUUID(),
      download: parseFloat(download) || 0,
      upload: parseFloat(upload) || 0,
      ping: parseFloat(ping) || 0,
      type: type || 'unknown',
      timestamp: timestamp || Date.now(),
    };

    state.speedTestHistory = Array.isArray(state.speedTestHistory) ? state.speedTestHistory : [];
    state.speedTestHistory.unshift(testResult);

    // Keep only last 50 tests
    if (state.speedTestHistory.length > 50) {
      state.speedTestHistory = state.speedTestHistory.slice(0, 50);
    }

    saveState(state);
    res.json({ ok: true, history: state.speedTestHistory });
  });
});

app.get('/api/speedtest/history', authRequired, (req, res) => {
  const state = readState();
  res.json({ history: state.speedTestHistory || [] });
});

app.get('/api/export', authRequired, (req, res) => {
  const state = readState();
  // Strip sensitive data from export
  const safeState = { ...state };
  delete safeState.credentials;
  delete safeState.deviceTokens;
  // Strip passwords from device info
  if (safeState.speedportInfo) {
    safeState.speedportInfo = { ...safeState.speedportInfo };
    delete safeState.speedportInfo.wifiPassword;
    delete safeState.speedportInfo.devicePassword;
  }
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.5.0',
    data: safeState,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="netzwerk-manager-backup.json"');
  res.json(exportData);
});

app.post('/api/import', authRequired, async (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Ungueltige Daten' });
  }

  // Validiere wichtige Felder
  if (!data.switchPorts && !data.routerPorts && !data.speedportInfo && !data.raspberryInfo) {
    return res.status(400).json({ error: 'Keine gueltigen Netzwerk-Manager Daten' });
  }

  // Sanitize imported string data to prevent XSS
  function sanitizePort(port) {
    return {
      ...port,
      label: escapeHtml(port.label),
      status: escapeHtml(port.status),
    };
  }

  // #14 Array-Größen begrenzen um DoS zu verhindern
  const MAX_PORTS = 64;
  const MAX_VERSIONS = 200;
  const MAX_HISTORY = 50;

  await withStateLock(() => {
    // Merge mit Default-State um fehlende Felder zu ergaenzen
    const currentState = readState();
    const newState = {
      ...defaultState,
      // SECURITY: Never import credentials from external files!
      credentials: currentState.credentials, // Keep existing credentials
      speedportInfo: { ...defaultState.speedportInfo, ...(data.speedportInfo || {}) },
      raspberryInfo: { ...defaultState.raspberryInfo, ...(data.raspberryInfo || {}) },
      // Sanitize port data (capped)
      switchPorts: (data.switchPorts || currentState.switchPorts).slice(0, MAX_PORTS).map(sanitizePort),
      routerPorts: (data.routerPorts || currentState.routerPorts).slice(0, MAX_PORTS).map(sanitizePort),
      versions: Array.isArray(data.versions) ? data.versions.slice(0, MAX_VERSIONS) : [],
      speedportVersions: Array.isArray(data.speedportVersions) ? data.speedportVersions.slice(0, MAX_VERSIONS) : [],
      raspberryVersions: Array.isArray(data.raspberryVersions) ? data.raspberryVersions.slice(0, MAX_VERSIONS) : [],
      // SECURITY: Never import device tokens from external files!
      deviceTokens: currentState.deviceTokens, // Keep existing tokens
      speedTestHistory: Array.isArray(data.speedTestHistory) ? data.speedTestHistory.slice(0, MAX_HISTORY) : [],
    };

    saveState(newState);
    // Note: credentials not written since we keep the existing ones

    res.json({ ok: true, message: 'Daten erfolgreich importiert (Zugangsdaten wurden nicht geändert)' });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Windows PC Endpoints
// ═══════════════════════════════════════════════════════════════════

// GET config - NEVER return password
app.get('/api/windows-pc', authRequired, (req, res) => {
  const config = readWindowsPCConfig();
  res.json({
    name: config.name,
    ipAddress: config.ipAddress,
    macAddress: config.macAddress,
    sshUser: config.sshUser,
    hasPassword: Boolean(config.sshPassword), // Only indicate if password is set
    sshPort: config.sshPort,
  });
});

// GET password - reveal SSH password (authenticated, decrypted)
app.get('/api/windows-pc/password', authRequired, (req, res) => {
  const config = readWindowsPCConfig();
  res.json({
    password: config._sshPasswordDecrypted || '',
  });
});

// POST config - with input validation
app.post('/api/windows-pc', authRequired, (req, res) => {
  const clientIp = getClientIp(req);
  const { name, ipAddress, macAddress, sshUser, sshPassword, sshPort } = req.body || {};

  // Validate all inputs
  const errors = [];

  if (name !== undefined && !validateWindowsPCInput('name', name)) {
    errors.push('Ungültiger Name (nur Buchstaben, Zahlen, Leerzeichen, max 50 Zeichen)');
  }
  if (ipAddress !== undefined && ipAddress !== '' && !validateWindowsPCInput('ipAddress', ipAddress)) {
    errors.push('Ungültige IP-Adresse (Format: xxx.xxx.xxx.xxx)');
  }
  if (macAddress !== undefined && macAddress !== '' && !validateWindowsPCInput('macAddress', macAddress)) {
    errors.push('Ungültige MAC-Adresse (Format: XX:XX:XX:XX:XX:XX)');
  }
  if (sshUser !== undefined && sshUser !== '' && !validateWindowsPCInput('sshUser', sshUser)) {
    errors.push('Ungültiger SSH-Benutzername (nur alphanumerisch, max 32 Zeichen)');
  }
  if (sshPort !== undefined && !validateWindowsPCInput('sshPort', sshPort)) {
    errors.push('Ungültiger SSH-Port (1-65535)');
  }
  if (sshPassword !== undefined && !validateWindowsPCInput('sshPassword', sshPassword)) {
    errors.push('Ungültiges Passwort (max 128 Zeichen)');
  }

  if (errors.length > 0) {
    logPCAction('CONFIG_UPDATE', clientIp, false, `Validation failed: ${errors.join(', ')}`);
    return res.status(400).json({ ok: false, errors });
  }

  const config = readWindowsPCConfig();

  if (name !== undefined) config.name = name;
  if (ipAddress !== undefined) config.ipAddress = ipAddress;
  if (macAddress !== undefined) config.macAddress = macAddress.toUpperCase();
  if (sshUser !== undefined) config.sshUser = sshUser;
  if (sshPassword !== undefined) config.sshPassword = sshPassword;
  if (sshPort !== undefined) config.sshPort = parseInt(sshPort, 10) || 22;

  saveWindowsPCConfig(config);
  logPCAction('CONFIG_UPDATE', clientIp, true, 'Config updated');

  // Return config without password
  res.json({
    ok: true,
    config: {
      name: config.name,
      ipAddress: config.ipAddress,
      macAddress: config.macAddress,
      sshUser: config.sshUser,
      hasPassword: Boolean(config.sshPassword),
      sshPort: config.sshPort,
    },
  });
});

// GET status - with lenient rate limiting
app.get('/api/windows-pc/status', authRequired, async (req, res) => {
  const clientIp = getClientIp(req);

  if (!checkPCStatusRateLimit(clientIp)) {
    return res.status(429).json({ online: false, error: 'Zu viele Anfragen' });
  }

  const config = readWindowsPCConfig();
  if (!config.ipAddress) {
    return res.json({ online: false, configured: false });
  }

  const online = await pingHost(config.ipAddress);
  res.json({ online, configured: true });
});

// POST wake - with rate limiting and audit logging
app.post('/api/windows-pc/wake', authRequired, async (req, res) => {
  const clientIp = getClientIp(req);

  if (!checkPCActionRateLimit(clientIp)) {
    logPCAction('WAKE', clientIp, false, 'Rate limited');
    return res.status(429).json({ success: false, message: 'Zu viele Anfragen. Bitte warten.' });
  }

  const config = readWindowsPCConfig();
  if (!config.macAddress) {
    logPCAction('WAKE', clientIp, false, 'No MAC configured');
    return res.status(400).json({ success: false, message: 'Keine MAC-Adresse konfiguriert' });
  }

  try {
    await sendWakeOnLan(config.macAddress);
    logPCAction('WAKE', clientIp, true, `MAC: ${config.macAddress}`);
    res.json({ success: true, message: 'Wake-on-LAN Paket gesendet!' });
  } catch (err) {
    logPCAction('WAKE', clientIp, false, 'Send failed');
    res.status(500).json({ success: false, message: 'Fehler beim Senden des Wake-Pakets' });
  }
});

// POST shutdown - with rate limiting and audit logging
app.post('/api/windows-pc/shutdown', authRequired, async (req, res) => {
  const clientIp = getClientIp(req);

  if (!checkPCActionRateLimit(clientIp)) {
    logPCAction('SHUTDOWN', clientIp, false, 'Rate limited');
    return res.status(429).json({ success: false, message: 'Zu viele Anfragen. Bitte warten.' });
  }

  const config = readWindowsPCConfig();
  if (!config.ipAddress || !config.sshUser || !config.sshPassword) {
    logPCAction('SHUTDOWN', clientIp, false, 'Incomplete SSH config');
    return res.status(400).json({ success: false, message: 'SSH-Zugangsdaten nicht vollständig' });
  }

  try {
    await shutdownWindowsPC(config);
    logPCAction('SHUTDOWN', clientIp, true, `Target: ${config.ipAddress}`);
    res.json({ success: true, message: 'Shutdown-Befehl gesendet!' });
  } catch (err) {
    logPCAction('SHUTDOWN', clientIp, false, 'SSH failed');
    res.status(500).json({ success: false, message: 'Shutdown fehlgeschlagen' });
  }
});

// ── Uptime API ──

app.get('/api/uptime', authRequired, (req, res) => {
  res.json(buildUptimeResponse());
});

// Reset all uptime data
app.post('/api/uptime/reset', authRequired, async (req, res) => {
  saveUptimeData({ devices: {}, outages: [] });
  await runUptimePingCycle().catch(() => {});
  res.json({ ok: true });
});

// Reset single device uptime data
app.post('/api/uptime/reset/:deviceId', authRequired, async (req, res) => {
  const id = req.params.deviceId;
  const data = readUptimeData();
  if (data.devices[id]) {
    delete data.devices[id];
    data.outages = data.outages.filter(o => o.device !== id && o.deviceId !== id);
    saveUptimeData(data);
  }
  await runUptimePingCycle().catch(() => {});
  res.json({ ok: true });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
  });

  const wss = new WebSocket.Server({ server });

  wss.on('connection', (socket, req) => {
    socket.isAlive = true;
    let authenticatedToken = null;

    // Authenticate via first message instead of URL query
    socket.on('message', (data) => {
      if (authenticatedToken) return; // Already authenticated
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'auth' && msg.token) {
          if (isSessionValid() && timingSafeEqual(runtime.activeSession.token, msg.token)) {
            authenticatedToken = msg.token;
            runtime.sockets.set(authenticatedToken, socket);
            socket.send(JSON.stringify({ type: 'auth', success: true }));
          } else {
            socket.close(4001, 'Unauthorized');
          }
        }
      } catch {
        // ignore non-JSON
      }
    });

    // Close unauthenticated connections after 5 seconds
    const authTimeout = setTimeout(() => {
      if (!authenticatedToken) {
        socket.close(4001, 'Auth timeout');
      }
    }, 5000);

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('close', () => {
      clearTimeout(authTimeout);
      if (authenticatedToken) {
        runtime.sockets.delete(authenticatedToken);
      }
    });

    socket.on('error', () => {
      socket.isAlive = false;
    });
  });

  // Heartbeat: Prüfe alle 30 Sekunden ob Verbindungen noch leben
  const heartbeatInterval = setInterval(() => {
    // Ping/Pong Check
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });

    // Cleanup: Entferne tote Einträge aus runtime.sockets
    for (const [token, socket] of runtime.sockets.entries()) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        runtime.sockets.delete(token);
      }
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Memory cleanup: Remove old rate limiting entries every hour
  setInterval(() => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Cleanup login attempts
    for (const [ip, data] of runtime.loginAttempts.entries()) {
      if (data.lockedUntil < oneHourAgo && data.count === 0) {
        runtime.loginAttempts.delete(ip);
      }
    }

    // Cleanup PC control limits
    for (const [ip, data] of pcActionLimits.entries()) {
      if (data.windowStart < oneHourAgo) {
        pcActionLimits.delete(ip);
      }
    }
    for (const [ip, data] of pcStatusLimits.entries()) {
      if (data.windowStart < oneHourAgo) {
        pcStatusLimits.delete(ip);
      }
    }
  }, 3600000); // Every hour

  // Uptime monitoring: first ping after 5s, then at configured interval
  const uptimeMs = readUptimeIntervalMs();
  console.log(`Uptime monitoring interval: ${uptimeMs / 1000}s`);
  setTimeout(() => {
    runUptimePingCycle().catch(() => {});
    setInterval(() => {
      runUptimePingCycle().catch(() => {});
    }, uptimeMs);
  }, 5000);
}

// Server starten
ensureDataFile();
startServer();
