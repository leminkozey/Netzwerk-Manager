// Catch uncaught exceptions and unhandled rejections to prevent silent crashes
process.on('uncaughtException', (err) => { console.error('Uncaught:', err); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled rejection:', reason); });

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { randomUUID } = crypto;
const WebSocket = require('ws');
const dgram = require('dgram');
const { spawn, execSync } = require('child_process');
const cron = require('node-cron');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }

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

// Password hashing with PBKDF2
const PBKDF2_ITERATIONS = 600000;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `pbkdf2:${salt}:${PBKDF2_ITERATIONS}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  let salt, iterations, hash;
  if (stored.startsWith('pbkdf2:')) {
    // New format: pbkdf2:salt:iterations:hash
    const parts = stored.split(':');
    salt = parts[1];
    iterations = parseInt(parts[2], 10);
    hash = parts[3];
  } else {
    // Legacy format: salt:hash (assumed 10000 iterations)
    const parts = stored.split(':');
    if (parts.length === 2) {
      salt = parts[0];
      iterations = 10000;
      hash = parts[1];
    } else {
      return false;
    }
  }
  if (!salt || !hash || !iterations) return false;
  const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return timingSafeEqual(hash, testHash);
}

// Check if stored hash needs re-hashing with stronger iterations (auto-migration)
function needsRehash(stored) {
  if (!stored || typeof stored !== 'string') return false;
  if (!isHashedPassword(stored)) return false;
  if (!stored.startsWith('pbkdf2:')) return true;
  const parts = stored.split(':');
  const iterations = parseInt(parts[2], 10);
  return iterations < PBKDF2_ITERATIONS;
}

// Check if stored password is hashed or plaintext (for migration)
function isHashedPassword(stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('pbkdf2:')) return true;
  // Legacy format: salt:hash (long hex string with colon)
  return stored.includes(':') && stored.length > 100;
}

// Symmetric encryption for sensitive data at rest (SSH passwords etc.)
const ENCRYPTION_KEY_FILE = path.join(__dirname, 'Data', '.encryption-key');
function getEncryptionKey() {
  if (fs.existsSync(ENCRYPTION_KEY_FILE)) {
    return Buffer.from(fs.readFileSync(ENCRYPTION_KEY_FILE, 'utf-8').trim(), 'hex');
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(ENCRYPTION_KEY_FILE, key.toString('hex'), { encoding: 'utf-8', mode: 0o600 });
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

// Hash device tokens with SHA-256 for secure storage
function hashDeviceToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// HTML escape to prevent XSS
function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str ?? '');
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
  const lower = ip.toLowerCase().trim();
  // Block hostnames (only allow IPv4 addresses to prevent DNS rebinding)
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return false;
  const parts = lower.split('.').map(Number);
  if (parts.some(p => isNaN(p) || p < 0 || p > 255)) return false;
  // Block loopback (entire 127.0.0.0/8 range)
  if (parts[0] === 127) return false;
  // Block 0.0.0.0
  if (parts[0] === 0) return false;
  // Block link-local (169.254.0.0/16)
  if (parts[0] === 169 && parts[1] === 254) return false;
  // Block broadcast
  if (parts.every(p => p === 255)) return false;
  // Allow private network ranges (expected for local network manager)
  return true;
}

// Session token expiration (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
// Absolute session timeout (7 days) - session cannot be extended beyond this
const MAX_ABSOLUTE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const app = express();
const PORT = process.env.PORT || 5055;
const DATA_DIR = path.join(__dirname, 'Data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const USER_FILE = path.join(DATA_DIR, 'Nutzer');
const LOGIN_TOKEN_FILE = path.join(DATA_DIR, 'LoginToken.txt');
const WINDOWS_PC_FILE = path.join(DATA_DIR, 'WindowsPC.json');
const CONTROL_DEVICES_FILE = path.join(DATA_DIR, 'ControlDevices.json');
const UPTIME_FILE = path.join(DATA_DIR, 'uptime.json');
const PING_MONITOR_FILE = path.join(DATA_DIR, 'ping-monitor.json');
const INFO_CARDS_FILE = path.join(DATA_DIR, 'InfoCards.json');
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

// In-memory device stats cache (deviceId → stats object), NOT persisted
const deviceStatsCache = new Map();

function broadcastToAll(type, data) {
  if (runtime.sockets.size === 0) return;
  if (!isSessionValid()) return;
  const activeToken = runtime.activeSession.token;
  const msg = JSON.stringify({ type, data });
  for (const [token, socket] of runtime.sockets.entries()) {
    if (token !== activeToken) {
      // Evict stale socket from expired/replaced session
      runtime.sockets.delete(token);
      try { socket.close(4001, 'Session expired'); } catch {}
      continue;
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      try { socket.send(msg); } catch {}
    }
  }
}

// Check if session is expired
function isSessionValid() {
  if (!runtime.activeSession) return false;
  if (Date.now() > runtime.activeSession.expiresAt) {
    runtime.activeSession = null;
    return false;
  }
  // Absolute session timeout - cannot be extended beyond MAX_ABSOLUTE_SESSION_MS
  if (Date.now() - runtime.activeSession.loginAt > MAX_ABSOLUTE_SESSION_MS) {
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
app.use(express.json({ limit: '1mb' }));

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

// CSRF protection: validate Origin/Referer on state-mutating requests
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Require at least one of Origin or Referer
    if (!origin && !referer) {
      return res.status(403).json({ error: 'Missing origin' });
    }

    let checkValue = origin;
    if (!checkValue && referer) {
      try { checkValue = new URL(referer).origin; } catch { /* invalid referer */ }
    }

    // Reject if we couldn't extract a valid origin from either header
    if (!checkValue) {
      return res.status(403).json({ error: 'Invalid origin' });
    }

    const allowed = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];
    const host = req.headers.host;
    if (host) {
      allowed.push(`http://${host}`, `https://${host}`);
    }
    if (!allowed.includes(checkValue)) {
      return res.status(403).json({ error: 'Invalid origin' });
    }
  }
  next();
});

// Serve a sanitized config.js (strips pihole credentials)
app.get('/config.js', (req, res) => {
  const cfg = readSiteConfig();
  if (!cfg) return res.status(404).end();
  // Deep clone and strip sensitive fields
  const safe = JSON.parse(JSON.stringify(cfg));
  if (safe.pihole) {
    delete safe.pihole.url;
    delete safe.pihole.password;
  }
  // Strip update commands – only expose the enabled flag
  if (safe.settings?.update) {
    delete safe.settings.update.commands;
  }
  if (safe.notifications) {
    safe.notifications = { enabled: !!safe.notifications.enabled };
  }
  // Strip stats credentials from uptimeDevices
  if (Array.isArray(safe.uptimeDevices)) {
    for (const d of safe.uptimeDevices) {
      if (d.stats) {
        delete d.stats.credentials;
        delete d.stats.credentialsFrom;
      }
    }
  }
  // Strip sensitive fields from services
  if (Array.isArray(safe.services)) {
    for (const s of safe.services) {
      delete s.service;
      if (s.host && typeof s.host === 'object') {
        delete s.host.credentialsFrom;
      }
    }
  }
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(`const siteConfig = ${JSON.stringify(safe, null, 2)};\n`);
});

// Block direct static access to config.js (served sanitized via custom route above)
app.use((req, res, next) => {
  if (req.path.toLowerCase().endsWith('config.js')) {
    return res.status(403).end();
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
    sshPassword: '',
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), { mode: 0o600 });
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
  migrateToInfoCards();
}

function migrateToInfoCards() {
  // Only migrate if InfoCards.json doesn't exist yet AND config has infoCenter
  if (fs.existsSync(INFO_CARDS_FILE)) return;
  const cfg = readSiteConfig();
  if (!cfg?.infoCenter || !Array.isArray(cfg.infoCenter)) return;

  const state = readState();
  const migrated = {};

  // Build a map of all card IDs in the new config
  const cardDefs = {};
  for (const section of cfg.infoCenter) {
    for (const card of (section.cards || [])) {
      cardDefs[card.id] = card;
    }
  }

  // Migrate switch ports
  if (cardDefs['switch'] && cardDefs['switch'].type === 'table' && Array.isArray(state.switchPorts)) {
    const rows = {};
    for (const port of state.switchPorts) {
      rows[port.id] = { status: port.status || '', color: port.color || '#000000' };
    }
    migrated['switch'] = { rows };
  }

  // Migrate router ports
  if (cardDefs['router'] && cardDefs['router'].type === 'table' && Array.isArray(state.routerPorts)) {
    const rows = {};
    for (const port of state.routerPorts) {
      rows[port.id] = { status: port.status || '', color: port.color || '#000000' };
    }
    migrated['router'] = { rows };
  }

  // Migrate raspberryInfo (pihole card)
  if (cardDefs['pihole'] && cardDefs['pihole'].type === 'info' && state.raspberryInfo) {
    const data = {};
    const allowedKeys = (cardDefs['pihole'].fields || []).map(f => f.key);
    for (const key of allowedKeys) {
      if (state.raspberryInfo[key] !== undefined) {
        data[key] = state.raspberryInfo[key]; // Already encrypted in state.json
      }
    }
    if (Object.keys(data).length > 0) migrated['pihole'] = data;
  }

  // Migrate speedportInfo
  if (cardDefs['speedport'] && cardDefs['speedport'].type === 'info' && state.speedportInfo) {
    const data = {};
    const pwKeys = getPasswordFieldKeys(cardDefs['speedport']);
    const allowedKeys = (cardDefs['speedport'].fields || []).map(f => f.key);
    for (const key of allowedKeys) {
      if (state.speedportInfo[key] !== undefined) {
        // Speedport passwords were stored as plaintext in state.json - encrypt them
        if (pwKeys.includes(key) && state.speedportInfo[key] && !state.speedportInfo[key].startsWith('enc:')) {
          data[key] = encryptValue(state.speedportInfo[key]);
        } else {
          data[key] = state.speedportInfo[key];
        }
      }
    }
    if (Object.keys(data).length > 0) migrated['speedport'] = data;
  }

  if (Object.keys(migrated).length > 0) {
    saveInfoCardsData(migrated);
    console.log(`[Migration] Migrated ${Object.keys(migrated).length} cards to InfoCards.json: ${Object.keys(migrated).join(', ')}`);
  }
}

// Synchronous mutex for state file operations to prevent race conditions
let _stateLocked = false;
const _stateWaiters = [];

function acquireStateLock() {
  return new Promise((resolve, reject) => {
    if (!_stateLocked) {
      _stateLocked = true;
      resolve();
    } else if (_stateWaiters.length > 50) {
      reject(new Error('State lock queue full'));
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

let _stateCache = null;

function readState() {
  if (_stateCache) return _stateCache;
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
  _stateCache = merged;
  return merged;
}

function saveState(nextState) {
  atomicWriteFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), { mode: 0o600 });
  _stateCache = nextState;
}

// Atomic file write: write to .tmp then rename to prevent corruption
function atomicWriteFileSync(filePath, data, options = {}) {
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, data, options);
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    // On Windows, rename can fail with EPERM/EBUSY if target is locked.
    // Fall back to direct write.
    try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup */ }
    fs.writeFileSync(filePath, data, options);
  }
}

// ── InfoCards Storage ──
function readInfoCardsData() {
  try {
    if (!fs.existsSync(INFO_CARDS_FILE)) return {};
    return JSON.parse(fs.readFileSync(INFO_CARDS_FILE, 'utf-8'));
  } catch { return {}; }
}

function saveInfoCardsData(data) {
  atomicWriteFileSync(INFO_CARDS_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function getInfoCardDefinition(cardId) {
  const cfg = readSiteConfig();
  if (!cfg?.infoCenter || !Array.isArray(cfg.infoCenter)) return null;
  for (const section of cfg.infoCenter) {
    if (!Array.isArray(section.cards)) continue;
    for (const card of section.cards) {
      if (card.id === cardId) return card;
    }
  }
  return null;
}

function getPasswordFieldKeys(cardDef) {
  if (!cardDef) return [];
  if (cardDef.type === 'info' && Array.isArray(cardDef.fields)) {
    return cardDef.fields.filter(f => f.password).map(f => f.key);
  }
  return [];
}

// Validate deviceId against prototype pollution
function isValidDeviceId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

// Sanitize version entry for import (whitelist properties, truncate strings, strip secrets)
function sanitizeVersionEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const sanitized = {};
  if (entry.timestamp !== undefined) sanitized.timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : 0;
  if (entry.label !== undefined) sanitized.label = escapeHtml(String(entry.label || '')).slice(0, 256);
  if (entry.summary !== undefined) sanitized.summary = escapeHtml(String(entry.summary || '')).slice(0, 512);
  if (entry.id !== undefined) sanitized.id = String(entry.id || '').slice(0, 64);
  if (entry.snapshot && typeof entry.snapshot === 'object' && !Array.isArray(entry.snapshot)) {
    const snap = {};
    for (const [k, v] of Object.entries(entry.snapshot)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      snap[k] = v;
    }
    sanitized.snapshot = snap;
    if (sanitized.snapshot.speedportInfo) {
      sanitized.snapshot.speedportInfo = { ...sanitized.snapshot.speedportInfo };
      delete sanitized.snapshot.speedportInfo.wifiPassword;
      delete sanitized.snapshot.speedportInfo.devicePassword;
    }
    if (sanitized.snapshot.raspberryInfo) {
      sanitized.snapshot.raspberryInfo = { ...sanitized.snapshot.raspberryInfo };
      delete sanitized.snapshot.raspberryInfo.sshPassword;
    }
  }
  return sanitized;
}

function sanitizeSpeedTestEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const safeFloat = (v, max = 100000) => {
    const n = parseFloat(v);
    return (Number.isFinite(n) && n >= 0) ? Math.min(n, max) : 0;
  };
  const allowedTypes = ['local', 'internet', 'unknown'];
  return {
    id: typeof entry.id === 'string' ? entry.id.slice(0, 64) : randomUUID(),
    download: safeFloat(entry.download),
    upload: safeFloat(entry.upload),
    ping: safeFloat(entry.ping, 60000),
    type: allowedTypes.includes(entry.type) ? entry.type : 'unknown',
    timestamp: (typeof entry.timestamp === 'number' && Number.isFinite(entry.timestamp) && entry.timestamp > 0)
      ? entry.timestamp : 0,
  };
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
  fs.writeFileSync(USER_FILE, content, { encoding: 'utf-8', mode: 0o600 });
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
  fs.writeFileSync(LOGIN_TOKEN_FILE, sample, { encoding: 'utf-8', mode: 0o600 });
}

function readLoginTokens() {
  if (!fs.existsSync(LOGIN_TOKEN_FILE)) return [];
  const raw = fs.readFileSync(LOGIN_TOKEN_FILE, 'utf-8');
  const lines = raw.split('\n');
  const entries = [];
  let needsMigration = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [token, name] = trimmed.split('|').map((p) => (p || '').trim());
    if (!token) continue;
    // If token is not already a SHA-256 hash (64 hex chars), hash it
    const isAlreadyHashed = /^[a-f0-9]{64}$/.test(token);
    if (isAlreadyHashed) {
      entries.push({ token, name });
    } else {
      entries.push({ token: hashDeviceToken(token), name });
      needsMigration = true;
    }
  }

  // Auto-migrate: rewrite file with hashed tokens
  if (needsMigration) {
    const commentLines = lines.filter(l => l.trim().startsWith('#') || l.trim() === '');
    const hashedLines = entries.map(e => e.name ? `${e.token}|${e.name}` : e.token);
    const newContent = [...commentLines, ...hashedLines, ''].join('\n');
    try {
      atomicWriteFileSync(LOGIN_TOKEN_FILE, newContent, { mode: 0o600 });
      console.log('[Security] LoginToken.txt migrated to hashed tokens');
    } catch (err) {
      console.error('[Security] Failed to migrate LoginToken.txt:', err.message);
    }
  }

  return entries;
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
  // Decrypt raspberry sshPassword for client display
  const raspberryForClient = { ...state.raspberryInfo };
  if (raspberryForClient.sshPassword) {
    raspberryForClient.sshPassword = decryptValue(raspberryForClient.sshPassword);
  }
  return {
    theme: state.theme,
    switchPorts: state.switchPorts,
    routerPorts: state.routerPorts,
    versions: state.versions,
    speedportInfo: state.speedportInfo,
    speedportVersions: state.speedportVersions,
    raspberryInfo: raspberryForClient,
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
  console.error(`[Speedtest] Pi unreachable at ${host}:${port} - ${reason}`);
  res.status(503).json({
    error: 'Speedtest server unreachable',
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

// Strict rate limiting for password reveal (5 per minute)
const pcPasswordLimits = new Map();
const PC_PASSWORD_LIMIT_WINDOW = 60000;
const PC_PASSWORD_LIMIT_MAX = 5;

function checkPasswordRateLimit(ip) {
  const now = Date.now();
  const data = pcPasswordLimits.get(ip);

  if (!data || now - data.windowStart > PC_PASSWORD_LIMIT_WINDOW) {
    pcPasswordLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (data.count >= PC_PASSWORD_LIMIT_MAX) {
    return false;
  }

  data.count++;
  return true;
}

// Sanitize log parameters to prevent log injection
function sanitizeLogParam(str) {
  return String(str).replace(/[\r\n\t\x00-\x1f]/g, '_');
}

// Audit logging for sensitive operations
function logPCAction(action, ip, success, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[PC-AUDIT] ${timestamp} | ${sanitizeLogParam(action)} | IP: ${sanitizeLogParam(ip)} | Success: ${success} | ${sanitizeLogParam(details)}`);
}

function sendWakeOnLan(macAddress) {
  return new Promise((resolve, reject) => {
    // Validate MAC address format first
    if (!VALIDATION.macAddress.test(macAddress)) {
      return reject(new Error('Invalid MAC address'));
    }

    const mac = macAddress.replace(/[:-]/g, '');
    if (!/^[0-9A-Fa-f]{12}$/.test(mac)) {
      return reject(new Error('Invalid MAC address'));
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
      reject(new Error('Network error while sending'));
    });

    socket.bind(() => {
      socket.setBroadcast(true);
      socket.send(magicPacket, 0, magicPacket.length, 9, '255.255.255.255', (err) => {
        socket.close();
        if (err) reject(new Error('Failed to send Wake-on-LAN packet'));
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

    const ping = spawn('ping', args);
    let settled = false;

    // Hard timeout: kill process if it hasn't exited after 5s
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ping.kill();
        resolve(false);
      }
    }, 5000);

    ping.on('close', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(code === 0);
      }
    });

    ping.on('error', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        ping.kill();
        resolve(false);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Uptime Monitoring
// ═══════════════════════════════════════════════════════════════════

// In-memory caches to avoid reading/writing JSON on every cycle (critical for Pi Zero 2 W)
let _uptimeCache = null;
let _uptimeDirty = false;

function readUptimeData() {
  if (_uptimeCache) return _uptimeCache;
  try {
    if (fs.existsSync(UPTIME_FILE)) {
      _uptimeCache = JSON.parse(fs.readFileSync(UPTIME_FILE, 'utf-8'));
      return _uptimeCache;
    }
  } catch { /* ignore */ }
  _uptimeCache = { devices: {}, outages: [] };
  return _uptimeCache;
}

function saveUptimeData(data) {
  _uptimeCache = data;
  _uptimeDirty = true;
}

function flushUptimeToDisk() {
  if (_uptimeDirty && _uptimeCache) {
    try {
      atomicWriteFileSync(UPTIME_FILE, JSON.stringify(_uptimeCache), { mode: 0o600 });
      _uptimeDirty = false;
    } catch (err) {
      console.error('[Uptime] Flush to disk failed:', err.message);
    }
  }
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

// ═══════════════════════════════════════════════════════════════════
// E-Mail Notifications
// ═══════════════════════════════════════════════════════════════════

function readNotificationConfig() {
  const cfg = readSiteConfig();
  const n = cfg?.notifications;
  if (!n || !n.enabled) return null;
  if (!n.smtp?.host || !n.smtp?.user || !n.smtp?.pass || !n.to) return null;
  return n;
}

const _notificationCooldowns = new Map();

function isNotificationCooldownActive(deviceId, eventType, cooldownMs) {
  const key = `${deviceId}:${eventType}`;
  const last = _notificationCooldowns.get(key);
  if (!last) return false;
  return (Date.now() - last) < cooldownMs;
}

function setNotificationCooldown(deviceId, eventType) {
  _notificationCooldowns.set(`${deviceId}:${eventType}`, Date.now());
}

function createMailTransporter(smtp) {
  if (!nodemailer) return null;
  return nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 587,
    secure: smtp.secure === true,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function buildOfflineEmailHtml(deviceName, deviceIp, timestamp) {
  const name = escapeHtml(deviceName);
  const ip = escapeHtml(deviceIp);
  const time = escapeHtml(formatTimestamp(timestamp));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#06080f;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06080f;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#0d1117;border:1px solid #1e2a3a;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #1e2a3a;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><span style="display:inline-block;background:#ef4444;color:#fff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:6px;">OFFLINE</span></td>
    <td align="right" style="color:#8b949e;font-size:13px;">${time}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:24px 32px;">
  <h2 style="margin:0 0 16px;color:#f0f6fc;font-size:20px;">&#9888;&#65039; ${name} ist offline</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161b22;border:1px solid #1e2a3a;border-radius:8px;">
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;border-bottom:1px solid #1e2a3a;">Gerät</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;border-bottom:1px solid #1e2a3a;text-align:right;">${name}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;">IP-Adresse</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;text-align:right;">${ip}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #1e2a3a;">
  <p style="margin:0;color:#484f58;font-size:12px;text-align:center;">Diese Nachricht wurde automatisch vom Netzwerk Manager gesendet.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildOnlineEmailHtml(deviceName, deviceIp, timestamp, outageDurationMs) {
  const name = escapeHtml(deviceName);
  const ip = escapeHtml(deviceIp);
  const time = escapeHtml(formatTimestamp(timestamp));
  const duration = escapeHtml(outageDurationMs ? formatDuration(outageDurationMs) : '–');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#06080f;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06080f;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#0d1117;border:1px solid #1e2a3a;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #1e2a3a;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><span style="display:inline-block;background:#22c55e;color:#fff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:6px;">ONLINE</span></td>
    <td align="right" style="color:#8b949e;font-size:13px;">${time}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:24px 32px;">
  <h2 style="margin:0 0 16px;color:#f0f6fc;font-size:20px;">&#9989; ${name} ist wieder online</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161b22;border:1px solid #1e2a3a;border-radius:8px;">
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;border-bottom:1px solid #1e2a3a;">Gerät</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;border-bottom:1px solid #1e2a3a;text-align:right;">${name}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;border-bottom:1px solid #1e2a3a;">IP-Adresse</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;border-bottom:1px solid #1e2a3a;text-align:right;">${ip}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;">Ausfallzeit</td>
        <td style="padding:12px 16px;color:#f59e0b;font-size:14px;font-weight:600;text-align:right;">${duration}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #1e2a3a;">
  <p style="margin:0;color:#484f58;font-size:12px;text-align:center;">Diese Nachricht wurde automatisch vom Netzwerk Manager gesendet.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendNotificationEmail(eventType, deviceName, deviceIp, timestamp, outageDurationMs) {
  const config = readNotificationConfig();
  if (!config) return;

  // Check event filter
  if (config.events && config.events[eventType] === false) return;

  // Check cooldown (use ?? so cooldownMinutes: 0 disables cooldown intentionally)
  const cooldownMs = (config.cooldownMinutes ?? 5) * 60000;
  const deviceKey = `${deviceName}:${deviceIp}`;
  if (isNotificationCooldownActive(deviceKey, eventType, cooldownMs)) {
    console.log(`[Notification] Cooldown aktiv, E-Mail übersprungen (${deviceName} ${eventType})`);
    return;
  }

  // Set cooldown optimistically before sending to prevent duplicates on flapping
  setNotificationCooldown(deviceKey, eventType);

  // Build email (strip control chars to prevent SMTP header injection)
  const stripCRLF = s => String(s).replace(/[\r\n\0]/g, '');
  const safeName = stripCRLF(deviceName);
  const subject = eventType === 'offline'
    ? `\u26A0\uFE0F ${safeName} ist offline`
    : `\u2705 ${safeName} ist wieder online`;

  const html = eventType === 'offline'
    ? buildOfflineEmailHtml(deviceName, deviceIp, timestamp)
    : buildOnlineEmailHtml(deviceName, deviceIp, timestamp, outageDurationMs);

  const transporter = createMailTransporter(config.smtp);
  if (!transporter) {
    console.error('[Notification] nodemailer nicht installiert');
    _notificationCooldowns.delete(`${deviceKey}:${eventType}`);
    return;
  }

  try {
    const safeFrom = stripCRLF(config.from || `"Netzwerk Manager" <${config.smtp.user}>`);
    const safeTo = stripCRLF(config.to);
    await transporter.sendMail({
      from: safeFrom,
      to: safeTo,
      subject,
      html,
    });
    console.log(`[Notification] E-Mail gesendet: ${deviceName} ${eventType}`);
  } catch (err) {
    _notificationCooldowns.delete(`${deviceKey}:${eventType}`);
    console.error(`[Notification] E-Mail-Fehler (${deviceName} ${eventType}):`, err.message);
  }
}

function buildCredentialsChangedEmailHtml(oldUsername, newUsername, clientIp, timestamp) {
  const time = escapeHtml(formatTimestamp(timestamp));
  const ip = escapeHtml(clientIp);
  const oldUser = escapeHtml(oldUsername);
  const newUser = escapeHtml(newUsername);
  const usernameChanged = oldUsername !== newUsername;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#06080f;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06080f;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#0d1117;border:1px solid #1e2a3a;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 32px 16px;border-bottom:1px solid #1e2a3a;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><span style="display:inline-block;background:#f59e0b;color:#fff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:6px;">SICHERHEIT</span></td>
    <td align="right" style="color:#8b949e;font-size:13px;">${time}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:24px 32px;">
  <h2 style="margin:0 0 16px;color:#f0f6fc;font-size:20px;">&#128274; Zugangsdaten ge\u00E4ndert</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161b22;border:1px solid #1e2a3a;border-radius:8px;">
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;border-bottom:1px solid #1e2a3a;">Benutzername</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;border-bottom:1px solid #1e2a3a;text-align:right;">${usernameChanged ? `${oldUser} &rarr; ${newUser}` : newUser}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;border-bottom:1px solid #1e2a3a;">Passwort</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;border-bottom:1px solid #1e2a3a;text-align:right;">wurde ge\u00E4ndert</td></tr>
    <tr><td style="padding:12px 16px;color:#8b949e;font-size:14px;">IP-Adresse</td>
        <td style="padding:12px 16px;color:#f0f6fc;font-size:14px;text-align:right;">${ip}</td></tr>
  </table>
  <p style="margin:16px 0 0;color:#f59e0b;font-size:13px;">Falls Sie diese \u00C4nderung nicht vorgenommen haben, pr\u00FCfen Sie sofort den Zugang zu Ihrem Netzwerk Manager.</p>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #1e2a3a;">
  <p style="margin:0;color:#484f58;font-size:12px;text-align:center;">Diese Nachricht wurde automatisch vom Netzwerk Manager gesendet.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendCredentialsChangedEmail(oldUsername, newUsername, clientIp) {
  const config = readNotificationConfig();
  if (!config) return;

  // Check event filter
  if (config.events && config.events.credentialsChanged === false) return;

  const transporter = createMailTransporter(config.smtp);
  if (!transporter) return;

  const stripCRLF = s => String(s).replace(/[\r\n\0]/g, '');
  const timestamp = Date.now();
  const html = buildCredentialsChangedEmailHtml(oldUsername, newUsername, clientIp, timestamp);

  try {
    const safeFrom = stripCRLF(config.from || `"Netzwerk Manager" <${config.smtp.user}>`);
    const safeTo = stripCRLF(config.to);
    await transporter.sendMail({
      from: safeFrom,
      to: safeTo,
      subject: '\uD83D\uDD12 Zugangsdaten ge\u00E4ndert – Netzwerk Manager',
      html,
    });
    console.log('[Notification] Credentials-Change E-Mail gesendet');
  } catch (err) {
    console.error('[Notification] Credentials-Change E-Mail-Fehler:', err.message);
  }
}

// Parse public/config.js and return the siteConfig object (cached with 30s TTL)
let _siteConfigCache = null;
let _siteConfigCacheTime = 0;
const SITE_CONFIG_TTL = 30000; // 30 seconds

function readSiteConfig() {
  const now = Date.now();
  if (_siteConfigCache !== null && (now - _siteConfigCacheTime) < SITE_CONFIG_TTL) {
    return _siteConfigCache;
  }
  try {
    if (!fs.existsSync(CONFIG_FILE)) { _siteConfigCache = null; _siteConfigCacheTime = now; return null; }
    const src = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const vm = require('vm');
    // const → var so siteConfig lands on the sandbox global object
    const modified = src.replace(/\bconst siteConfig\b/, 'var siteConfig');
    // runInNewContext creates fresh built-in copies, preventing prototype pollution
    const sandbox = vm.runInNewContext(modified + '; siteConfig;', Object.create(null), { timeout: 1000 });
    _siteConfigCache = sandbox || null;
    _siteConfigCacheTime = now;
    return _siteConfigCache;
  } catch {
    _siteConfigCache = null;
    _siteConfigCacheTime = now;
    return null;
  }
}

// Read uptimeDevices from public/config.js
function isUptimeEnabled() {
  const cfg = readSiteConfig();
  // Support both old 'uptime' and new 'deviceInfo' config keys
  if (cfg?.analysen?.deviceInfo === false) return false;
  return cfg?.analysen?.uptime !== false;
}

function readUptimeDevicesFromConfig() {
  const cfg = readSiteConfig();
  if (cfg?.analysen?.uptime === false && cfg?.analysen?.deviceInfo === false) return [];
  const devices = cfg?.uptimeDevices;
  if (!Array.isArray(devices)) return [];
  return devices.filter(d =>
    d && typeof d.id === 'string' && d.id.length > 0
      && typeof d.name === 'string' && d.name.length > 0
      && typeof d.ip === 'string' && VALIDATION.ipAddress.test(d.ip)
  ).map(d => {
    const base = { id: d.id, name: d.name, ip: d.ip };
    const VALID_STATS_TYPES = new Set(['local', 'ssh-linux']);
    if (d.stats && typeof d.stats === 'object' && VALID_STATS_TYPES.has(d.stats.type)) {
      base.stats = { ...d.stats };
      if (base.stats.credentials) base.stats.credentials = { ...base.stats.credentials };
    }
    return base;
  });
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
      data.devices[cd.id] = { history: [], onlineSince: null, pausedAt: null, lastSeen: null };
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
        if (dev.onlineSince && dev.pausedAt) {
          // Resume: shift onlineSince forward by the offline gap
          dev.onlineSince += (now - dev.pausedAt);
          dev.pausedAt = null;
        } else {
          // First contact or no previous timer
          dev.onlineSince = now;
        }
        // Close any ongoing outage for this device
        let closedOutageDuration = null;
        for (const outage of data.outages) {
          if (outage.device === cd.id && !outage.end) {
            outage.end = now;
            outage.durationMs = now - outage.start;
            closedOutageDuration = outage.durationMs;
          }
        }
        // Notify only on real recovery (not first start)
        if (wasOnline === false) {
          sendNotificationEmail('online', cd.name, cd.ip, now, closedOutageDuration).catch(() => {});
        }
      }
    } else {
      // Went offline (was online)
      if (wasOnline === true) {
        // Pause timer instead of resetting
        dev.pausedAt = now;
        data.outages.push({ device: cd.id, start: now, end: null, durationMs: null });
        sendNotificationEmail('offline', cd.name, cd.ip, now, null).catch(() => {});
      }
    }
  }

  // Keep only last 50 closed outages (preserve open ones)
  const openOutages = data.outages.filter(o => !o.end);
  const closedOutages = data.outages.filter(o => o.end);
  if (closedOutages.length > 50) {
    data.outages = [...closedOutages.slice(closedOutages.length - 50), ...openOutages];
  }

  saveUptimeData(data);
}

// Separate stats collection cycle (CPU, RAM, Temperature)
async function runDeviceStatsCycle() {
  const configDevices = readUptimeDevicesFromConfig();
  const statsDevices = configDevices.filter(cd => cd.stats);
  if (statsDevices.length === 0) return;

  const data = readUptimeData();

  const statsResults = await Promise.all(
    statsDevices.map(cd => {
      // Only collect stats for online devices
      const dev = data.devices[cd.id];
      const lastEntry = dev?.history?.length > 0 ? dev.history[dev.history.length - 1] : null;
      const online = lastEntry ? lastEntry[1] : false;
      if (!online) {
        deviceStatsCache.set(cd.id, null);
        return Promise.resolve(null);
      }
      return collectDeviceStats(cd).catch(() => null);
    })
  );

  for (let i = 0; i < statsDevices.length; i++) {
    deviceStatsCache.set(statsDevices[i].id, statsResults[i]);
  }
}

// Read statsInterval (seconds) from config, minimum 30s, default 60s
function readStatsIntervalMs() {
  const cfg = readSiteConfig();
  const val = cfg?.statsInterval;
  if (typeof val === 'number' && val >= 30) return val * 1000;
  return 60000;
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
    const dev = data.devices[cd.id] || { history: [], onlineSince: null, pausedAt: null, lastSeen: null };
    const lastEntry = dev.history.length > 0 ? dev.history[dev.history.length - 1] : null;
    const online = lastEntry ? lastEntry[1] : false;
    const uptime24h = calculateUptimePercent(dev.history, DAY_MS);
    const uptime7d = calculateUptimePercent(dev.history, 7 * DAY_MS);
    const onlineSinceTs = dev.onlineSince || null;
    const pausedAtTs = dev.pausedAt || null;
    // If paused (offline), show frozen duration; if online, show live duration
    const effectiveDuration = onlineSinceTs
      ? (pausedAtTs ? pausedAtTs - onlineSinceTs : now - onlineSinceTs)
      : 0;
    const onlineSince = effectiveDuration > 0 ? formatDuration(effectiveDuration) : null;

    const hasStats = !!(cd.stats);
    const stats = hasStats ? (deviceStatsCache.get(cd.id) || null) : undefined;

    return {
      id: cd.id,
      name: cd.name,
      ip: cd.ip,
      online,
      uptime24h,
      uptime7d,
      onlineSince,
      onlineSinceTs,
      pausedAtTs,
      hasStats,
      stats,
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

// ═══════════════════════════════════════════════════════════════════
// Ping Monitor (Latency)
// ═══════════════════════════════════════════════════════════════════

let _pingMonCache = null;
let _pingMonDirty = false;

function readPingMonitorData() {
  if (_pingMonCache) return _pingMonCache;
  try {
    if (fs.existsSync(PING_MONITOR_FILE)) {
      _pingMonCache = JSON.parse(fs.readFileSync(PING_MONITOR_FILE, 'utf-8'));
      return _pingMonCache;
    }
  } catch (err) {
    console.error('[Ping Monitor] Failed to read data file:', err.message);
  }
  _pingMonCache = { hosts: {} };
  return _pingMonCache;
}

function savePingMonitorData(data) {
  _pingMonCache = data;
  _pingMonDirty = true;
}

function flushPingMonToDisk() {
  if (_pingMonDirty && _pingMonCache) {
    try {
      atomicWriteFileSync(PING_MONITOR_FILE, JSON.stringify(_pingMonCache), { mode: 0o600 });
      _pingMonDirty = false;
    } catch (err) {
      console.error('[Ping Monitor] Flush to disk failed:', err.message);
    }
  }
}

function isPingMonitorEnabled() {
  const cfg = readSiteConfig();
  return cfg?.analysen?.pingMonitor !== false;
}

function readPingMonitorHostsFromConfig() {
  const cfg = readSiteConfig();
  if (cfg?.analysen?.pingMonitor === false) return [];
  const hosts = cfg?.pingMonitor?.hosts ?? cfg?.pingMonitorHosts;
  if (!Array.isArray(hosts)) return [];
  return hosts.filter(h =>
    h && typeof h.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(h.id)
      && typeof h.name === 'string' && h.name.length > 0
      && typeof h.ip === 'string' && VALIDATION.ipAddress.test(h.ip)
      && isAllowedProxyTarget(h.ip)
  );
}

function readPingMonitorIntervalMs() {
  const cfg = readSiteConfig();
  const val = cfg?.pingMonitor?.interval ?? cfg?.pingMonitorInterval;
  if (typeof val === 'number' && val >= 10) return val * 1000;
  return 60000;
}

function pingLatency(ipAddress) {
  return new Promise((resolve) => {
    if (!VALIDATION.ipAddress.test(ipAddress)) {
      return resolve(null);
    }

    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const args = isWindows
      ? ['-n', '1', '-w', '2000', ipAddress]
      : isMac
        ? ['-c', '1', '-t', '3', ipAddress]
        : ['-c', '1', '-W', '2', ipAddress];

    const ping = spawn('ping', args);
    let settled = false;
    let stdout = '';

    // Hard timeout: kill process if it hasn't exited after 5s
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ping.kill();
        resolve(null);
      }
    }, 5000);

    ping.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ping.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) return resolve(null);
      // Try per-packet line: "time=12.3 ms"
      const perPacket = stdout.match(/(?:time|zeit)[=<](\d+(?:\.\d+)?)\s*ms/i);
      if (perPacket) {
        return resolve(parseFloat(perPacket[1]));
      }
      // Fallback: round-trip stats line (macOS/BSD): "min/avg/max/stddev = 9.9/9.9/9.9/0.0 ms"
      const stats = stdout.match(/=\s*[\d.]+\/([\d.]+)\/[\d.]+\/[\d.nan]+\s*ms/);
      if (stats) {
        return resolve(parseFloat(stats[1]));
      }
      resolve(null);
    });

    ping.on('error', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        ping.kill();
        resolve(null);
      }
    });
  });
}

async function runPingMonitorCycle() {
  const configHosts = readPingMonitorHostsFromConfig();
  if (configHosts.length === 0) return;

  const data = readPingMonitorData();
  const now = Date.now();

  for (const h of configHosts) {
    if (!data.hosts[h.id]) {
      data.hosts[h.id] = { history: [] };
    }
  }

  const results = await Promise.all(
    configHosts.map(h => pingLatency(h.ip))
  );

  for (let i = 0; i < configHosts.length; i++) {
    const h = configHosts[i];
    const ms = results[i];
    const host = data.hosts[h.id];
    host.history.push([now, ms]);
    host.history = pruneHistory(host.history);
  }

  // Remove orphaned hosts no longer in config
  const configIds = new Set(configHosts.map(h => h.id));
  for (const id of Object.keys(data.hosts)) {
    if (!configIds.has(id)) delete data.hosts[id];
  }

  savePingMonitorData(data);
}

function buildPingMonitorResponse() {
  const configHosts = readPingMonitorHostsFromConfig();
  const data = readPingMonitorData();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - DAY_MS;

  const hosts = configHosts.map(ch => {
    const host = data.hosts[ch.id] || { history: [] };
    const recent = host.history.filter(e => e[0] >= cutoff);
    const valid = recent.filter(e => e[1] !== null);
    const lost = recent.filter(e => e[1] === null).length;

    const lastEntry = host.history.length > 0 ? host.history[host.history.length - 1] : null;
    const currentPing = lastEntry ? lastEntry[1] : null;

    let avg = null, min = null, max = null;
    if (valid.length > 0) {
      const values = valid.map(e => e[1]);
      avg = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
      let lo = values[0], hi = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i] < lo) lo = values[i];
        if (values[i] > hi) hi = values[i];
      }
      min = Math.round(lo * 10) / 10;
      max = Math.round(hi * 10) / 10;
    }

    const lossPercent = recent.length > 0
      ? Math.round((lost / recent.length) * 1000) / 10
      : 0;

    // Downsample chart to max 120 points
    let chart;
    if (recent.length <= 120) {
      chart = recent.map(e => ({ ts: e[0], ms: e[1] }));
    } else {
      const step = recent.length / 120;
      chart = [];
      for (let i = 0; i < 120; i++) {
        const idx = Math.floor(i * step);
        chart.push({ ts: recent[idx][0], ms: recent[idx][1] });
      }
      // Ensure the most recent data point is always included
      const last = recent[recent.length - 1];
      chart[chart.length - 1] = { ts: last[0], ms: last[1] };
    }

    return {
      id: ch.id,
      name: ch.name,
      ip: ch.ip,
      currentPing,
      avg,
      min,
      max,
      lossPercent,
      chart,
    };
  });

  return { hosts };
}

function sshCommand(config, command) {
  return new Promise((resolve, reject) => {
    // Validate command against allowlist
    if (!ALLOWED_SSH_COMMANDS.has(command)) {
      return reject(new Error('Command not allowed'));
    }

    const { ipAddress, sshUser, sshPort } = config;
    const sshPassword = config._sshPasswordDecrypted || decryptValue(config.sshPassword);

    // Validate all inputs before using them
    if (!VALIDATION.ipAddress.test(ipAddress)) {
      return reject(new Error('Invalid IP address'));
    }
    if (!VALIDATION.sshUser.test(sshUser)) {
      return reject(new Error('Invalid SSH username'));
    }
    if (!VALIDATION.sshPort(sshPort)) {
      return reject(new Error('Invalid SSH port'));
    }
    if (typeof sshPassword !== 'string' || sshPassword.length === 0) {
      return reject(new Error('SSH password missing'));
    }

    // Use spawn with argument array to prevent command injection
    // Use SSHPASS environment variable instead of -p flag (hidden from ps)
    const sshArgs = [
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=5',
      '-o', 'BatchMode=no',
      '-p', String(sshPort),
      `${sshUser}@${ipAddress}`,
      command
    ];

    // -e flag reads password from SSHPASS environment variable
    // This keeps the password hidden from process listings (ps aux)
    const sshpass = spawn('sshpass', ['-e', 'ssh', ...sshArgs], {
      env: { ...process.env, SSHPASS: sshPassword },
    });
    let settled = false;
    let stderr = '';

    // Hard timeout: kill SSH process after 15s
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        sshpass.kill();
        reject(new Error('SSH timeout'));
      }
    }, 15000);

    sshpass.stderr.on('data', (data) => {
      if (stderr.length < 65536) stderr += data.toString();
    });

    sshpass.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Code 0 = success, code 255 with connection closed = likely successful shutdown
      if (code === 0 || stderr.includes('Connection') || stderr.includes('closed')) {
        resolve();
      } else {
        reject(new Error('Command failed'));
      }
    });

    sshpass.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sshpass.kill();
      if (err.code === 'ENOENT') {
        reject(new Error('sshpass not installed'));
      } else {
        reject(new Error('SSH connection failed'));
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Device Stats Collection (CPU, RAM, Temperature)
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_STATS_COMMANDS = new Set([
  'cat /proc/loadavg',
  'nproc',
  'cat /sys/class/thermal/thermal_zone0/temp',
  'cat /proc/meminfo',
]);

function sshCommandWithOutput(config, command) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_STATS_COMMANDS.has(command)) {
      return reject(new Error('Stats command not allowed'));
    }

    const { ipAddress, sshUser, sshPort } = config;
    const sshPassword = config._sshPasswordDecrypted || decryptValue(config.sshPassword);

    if (!VALIDATION.ipAddress.test(ipAddress)) return reject(new Error('Invalid IP address'));
    if (!VALIDATION.sshUser.test(sshUser)) return reject(new Error('Invalid SSH username'));
    if (!VALIDATION.sshPort(sshPort)) return reject(new Error('Invalid SSH port'));
    if (typeof sshPassword !== 'string' || sshPassword.length === 0) return reject(new Error('SSH password missing'));

    const sshArgs = [
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=5',
      '-o', 'BatchMode=no',
      '-p', String(sshPort),
      `${sshUser}@${ipAddress}`,
      command,
    ];

    const sshpass = spawn('sshpass', ['-e', 'ssh', ...sshArgs], {
      env: { ...process.env, SSHPASS: sshPassword },
    });

    let settled = false;
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        sshpass.kill();
        reject(new Error('SSH stats timeout'));
      }
    }, 10000);

    const MAX_OUTPUT = 512 * 1024; // 512 KB
    sshpass.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT && !settled) {
        settled = true; clearTimeout(timer); sshpass.kill();
        reject(new Error('SSH output too large'));
      }
    });
    sshpass.stderr.on('data', (data) => {
      if (stderr.length < MAX_OUTPUT) stderr += data.toString();
    });

    sshpass.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Stats command failed (code ${code})`));
      }
    });

    sshpass.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sshpass.kill();
      reject(new Error(err.code === 'ENOENT' ? 'sshpass not installed' : 'SSH connection failed'));
    });
  });
}

function parseLinuxStats(loadavgStr, nprocStr, tempStr, meminfoStr) {
  const result = {
    cpuLoad: null, cpuCores: null, cpuLoadPercent: null,
    temperature: null,
    ramUsedBytes: null, ramTotalBytes: null, ramUsedPercent: null,
  };

  // Parse load average (1-min)
  if (loadavgStr) {
    const load1 = parseFloat(loadavgStr.split(' ')[0]);
    if (!isNaN(load1)) result.cpuLoad = Math.round(load1 * 100) / 100;
  }

  // Parse core count
  if (nprocStr) {
    const cores = parseInt(nprocStr, 10);
    if (!isNaN(cores) && cores > 0) result.cpuCores = cores;
  }

  // Calculate load percent
  if (result.cpuLoad !== null && result.cpuCores !== null) {
    result.cpuLoadPercent = Math.round((result.cpuLoad / result.cpuCores) * 10000) / 100;
  }

  // Parse temperature (millidegrees → °C)
  if (tempStr) {
    const raw = parseInt(tempStr, 10);
    if (!isNaN(raw)) result.temperature = Math.round(raw / 100) / 10;
  }

  // Parse meminfo
  if (meminfoStr) {
    const lines = meminfoStr.split('\n');
    let memTotal = null, memAvailable = null;
    for (const line of lines) {
      const match = line.match(/^(\w+):\s+(\d+)\s+kB/);
      if (!match) continue;
      if (match[1] === 'MemTotal') memTotal = parseInt(match[2], 10) * 1024;
      if (match[1] === 'MemAvailable') memAvailable = parseInt(match[2], 10) * 1024;
    }
    if (memTotal !== null && memAvailable !== null) {
      result.ramTotalBytes = memTotal;
      result.ramUsedBytes = memTotal - memAvailable;
      result.ramUsedPercent = Math.round((result.ramUsedBytes / memTotal) * 10000) / 100;
    }
  }

  return result;
}

function readLocalStats() {
  try {
    const loadavgStr = fs.readFileSync('/proc/loadavg', 'utf-8').trim();
    let nprocStr = null;
    try {
      nprocStr = execSync('nproc', { timeout: 2000, encoding: 'utf-8' }).trim();
    } catch { /* ignore */ }
    let tempStr = null;
    try {
      tempStr = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf-8').trim();
    } catch { /* ignore — not all Linux systems have thermal zones */ }
    const meminfoStr = fs.readFileSync('/proc/meminfo', 'utf-8');
    return parseLinuxStats(loadavgStr, nprocStr, tempStr, meminfoStr);
  } catch {
    return null;
  }
}

async function collectDeviceStats(deviceConfig) {
  const { stats } = deviceConfig;
  if (!stats) return null;

  try {
    if (stats.type === 'local') {
      return readLocalStats();
    }

    if (stats.type === 'ssh-linux') {
      // Resolve SSH credentials
      let sshConfig;
      if (stats.credentialsFrom) {
        if (typeof stats.credentialsFrom !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(stats.credentialsFrom)) return null;
        const creds = readControlDeviceCredentials(stats.credentialsFrom);
        if (!creds.sshUser || !creds.sshPassword) return null;
        sshConfig = {
          ipAddress: deviceConfig.ip,
          sshUser: creds.sshUser,
          sshPassword: creds.sshPassword,
          _sshPasswordDecrypted: creds._sshPasswordDecrypted,
          sshPort: creds.sshPort || 22,
        };
      } else if (stats.credentials) {
        const pw = stats.credentials.sshPassword;
        sshConfig = {
          ipAddress: deviceConfig.ip,
          sshUser: stats.credentials.sshUser,
          sshPassword: pw,
          _sshPasswordDecrypted: decryptValue(pw),
          sshPort: stats.credentials.sshPort || 22,
        };
      } else {
        return null;
      }

      // Run 4 SSH commands in parallel
      const [loadavgStr, nprocStr, tempStr, meminfoStr] = await Promise.all([
        sshCommandWithOutput(sshConfig, 'cat /proc/loadavg').catch(() => null),
        sshCommandWithOutput(sshConfig, 'nproc').catch(() => null),
        sshCommandWithOutput(sshConfig, 'cat /sys/class/thermal/thermal_zone0/temp').catch(() => null),
        sshCommandWithOutput(sshConfig, 'cat /proc/meminfo').catch(() => null),
      ]);

      return parseLinuxStats(loadavgStr, nprocStr, tempStr, meminfoStr);
    }

    return null;
  } catch (err) {
    console.error(`[Stats] Error collecting stats for ${deviceConfig.id}:`, err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Generic Control Devices
// ═══════════════════════════════════════════════════════════════════

// Command mapping per device type
const DEVICE_COMMANDS = {
  'ssh-windows': {
    shutdown: 'shutdown /s /t 0',
    restart: 'shutdown /r /t 0',
  },
  'ssh-linux': {
    shutdown: 'sudo shutdown -h now',
    restart: 'sudo reboot',
  },
};

// Allowed SSH commands whitelist (built from DEVICE_COMMANDS)
const ALLOWED_SSH_COMMANDS = new Set(
  Object.values(DEVICE_COMMANDS).flatMap(cmds => Object.values(cmds))
);

function getDeviceCommand(type, action) {
  return DEVICE_COMMANDS[type]?.[action] || null;
}

function readControlDevicesData() {
  try {
    if (fs.existsSync(CONTROL_DEVICES_FILE)) {
      return JSON.parse(fs.readFileSync(CONTROL_DEVICES_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function saveControlDevicesData(data) {
  atomicWriteFileSync(CONTROL_DEVICES_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function readControlDeviceCredentials(deviceId) {
  const data = readControlDevicesData();
  const creds = data[deviceId] || { hostname: '', ipAddress: '', macAddress: '', sshUser: '', sshPassword: '', sshPort: 22 };
  // Ensure hostname and ipAddress fields exist (backward compat)
  if (creds.hostname === undefined) creds.hostname = '';
  if (creds.ipAddress === undefined) creds.ipAddress = '';
  if (creds.sshPassword) {
    creds._sshPasswordDecrypted = decryptValue(creds.sshPassword);
  }
  return creds;
}

function saveControlDeviceCredentials(deviceId, creds) {
  const data = readControlDevicesData();
  const toSave = { ...creds };
  if (toSave.sshPassword && !toSave.sshPassword.startsWith('enc:')) {
    toSave.sshPassword = encryptValue(toSave.sshPassword);
  }
  delete toSave._sshPasswordDecrypted;
  data[deviceId] = toSave;
  saveControlDevicesData(data);
}

function readControlDevicesFromConfig() {
  const cfg = readSiteConfig();
  const devices = cfg?.controlDevices;
  if (!Array.isArray(devices)) return [];
  return devices.filter(d =>
    d && typeof d.id === 'string' && d.id.length > 0
      && typeof d.name === 'string' && d.name.length > 0
      && typeof d.type === 'string'
      && typeof d.ip === 'string' && VALIDATION.ipAddress.test(d.ip)
      && Array.isArray(d.actions)
  );
}

function logControlAction(deviceId, action, ip, success, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[CONTROL-AUDIT] ${timestamp} | ${sanitizeLogParam(deviceId)} | ${sanitizeLogParam(action)} | IP: ${sanitizeLogParam(ip)} | Success: ${success} | ${sanitizeLogParam(details)}`);
}

// ═══════════════════════════════════════════════════════════════════
// Service / Container Management
// ═══════════════════════════════════════════════════════════════════

const SERVICE_NAME_PATTERN = /^[a-zA-Z0-9_.-]{1,100}$/;
const VALID_SERVICE_TYPES = new Set(['systemd', 'pm2', 'docker']);
const VALID_SERVICE_ACTIONS = new Set(['start', 'stop', 'restart']);

const SERVICE_COMMANDS = {
  systemd: {
    start:   name => `sudo systemctl start ${name}`,
    stop:    name => `sudo systemctl stop ${name}`,
    restart: name => `sudo systemctl restart ${name}`,
    status:  name => `systemctl is-active ${name}`,
  },
  pm2: {
    start:   name => `pm2 start ${name}`,
    stop:    name => `pm2 stop ${name}`,
    restart: name => `pm2 restart ${name}`,
    status:  () => `pm2 jlist`,
  },
  docker: {
    start:   name => `docker start ${name}`,
    stop:    name => `docker stop ${name}`,
    restart: name => `docker restart ${name}`,
    status:  name => `docker inspect -f '{{.State.Status}}' ${name}`,
  },
};

function buildServiceCommand(type, action, serviceName) {
  if (!SERVICE_NAME_PATTERN.test(serviceName)) return null;
  const template = SERVICE_COMMANDS[type]?.[action];
  if (!template) return null;
  return template(serviceName);
}

function localCommandWithOutput(command) {
  return new Promise((resolve) => {
    const child = spawn('sh', ['-c', command], { env: process.env });
    let settled = false;
    let stdout = '';
    let stderr = '';
    const MAX_OUTPUT = 512 * 1024;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: -1 });
      }
    }, 15000);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT && !settled) {
        settled = true; clearTimeout(timer); child.kill();
        resolve({ stdout: stdout.trim(), stderr: 'Output too large', code: -1 });
      }
    });
    child.stderr.on('data', (data) => {
      if (stderr.length < MAX_OUTPUT) stderr += data.toString();
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code ?? -1 });
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      resolve({ stdout: '', stderr: err.message, code: -1 });
    });
  });
}

function sshServiceCommandWithOutput(config, command) {
  return new Promise((resolve) => {
    const { ipAddress, sshUser, sshPort } = config;
    const sshPassword = config._sshPasswordDecrypted || decryptValue(config.sshPassword);

    if (!VALIDATION.ipAddress.test(ipAddress)) return resolve({ stdout: '', stderr: 'Invalid IP', code: -1 });
    if (!VALIDATION.sshUser.test(sshUser)) return resolve({ stdout: '', stderr: 'Invalid SSH user', code: -1 });
    if (!VALIDATION.sshPort(sshPort)) return resolve({ stdout: '', stderr: 'Invalid SSH port', code: -1 });
    if (typeof sshPassword !== 'string' || sshPassword.length === 0) return resolve({ stdout: '', stderr: 'SSH password missing', code: -1 });

    const sshArgs = [
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=5',
      '-o', 'BatchMode=no',
      '-p', String(sshPort),
      `${sshUser}@${ipAddress}`,
      command,
    ];

    const sshpass = spawn('sshpass', ['-e', 'ssh', ...sshArgs], {
      env: { ...process.env, SSHPASS: sshPassword },
    });

    let settled = false;
    let stdout = '';
    let stderr = '';
    const MAX_OUTPUT = 512 * 1024;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        sshpass.kill();
        resolve({ stdout: stdout.trim(), stderr: 'SSH timeout', code: -1 });
      }
    }, 15000);

    sshpass.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT && !settled) {
        settled = true; clearTimeout(timer); sshpass.kill();
        resolve({ stdout: stdout.trim(), stderr: 'Output too large', code: -1 });
      }
    });
    sshpass.stderr.on('data', (data) => {
      if (stderr.length < MAX_OUTPUT) stderr += data.toString();
    });

    sshpass.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code ?? -1 });
    });

    sshpass.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sshpass.kill();
      resolve({ stdout: '', stderr: err.code === 'ENOENT' ? 'sshpass not installed' : 'SSH connection failed', code: -1 });
    });
  });
}

function parseServiceStatus(type, serviceName, result) {
  if (result.code === -1 && (result.stderr.includes('timeout') || result.stderr.includes('connection') || result.stderr.includes('SSH'))) {
    return 'unknown';
  }

  if (type === 'systemd') {
    const out = result.stdout.toLowerCase().trim();
    if (out === 'active') return 'running';
    if (out === 'inactive' || out === 'dead') return 'stopped';
    if (out === 'failed') return 'error';
    // is-active returns non-zero for inactive/failed, that's normal
    if (result.code !== 0 && !out) return 'unknown';
    return out === 'activating' ? 'running' : 'stopped';
  }

  if (type === 'pm2') {
    try {
      const processes = JSON.parse(result.stdout);
      const proc = processes.find(p => p.name === serviceName);
      if (!proc) return 'stopped';
      const status = proc.pm2_env?.status || '';
      if (status === 'online') return 'running';
      if (status === 'stopped' || status === 'errored') return status === 'errored' ? 'error' : 'stopped';
      return 'stopped';
    } catch {
      return 'unknown';
    }
  }

  if (type === 'docker') {
    const out = result.stdout.toLowerCase().trim();
    if (out === 'running') return 'running';
    if (out === 'exited' || out === 'created' || out === 'dead') return 'stopped';
    if (out === 'restarting') return 'running';
    if (out === 'paused') return 'stopped';
    if (result.code !== 0) return 'unknown';
    return 'stopped';
  }

  return 'unknown';
}

function readServicesFromConfig() {
  const cfg = readSiteConfig();
  const services = cfg?.services;
  if (!Array.isArray(services)) return [];
  return services.filter(s => {
    if (!s || typeof s.id !== 'string' || !s.id.length) return false;
    if (typeof s.name !== 'string' || !s.name.length) return false;
    if (!VALID_SERVICE_TYPES.has(s.type)) {
      console.warn(`[Service] Skipping service '${sanitizeLogParam(s.id)}': invalid type '${sanitizeLogParam(s.type)}'`);
      return false;
    }
    if (!SERVICE_NAME_PATTERN.test(s.service)) {
      console.warn(`[Service] Skipping service '${sanitizeLogParam(s.id)}': invalid service name '${sanitizeLogParam(s.service)}'`);
      return false;
    }
    if (s.host !== 'local' && (!s.host || typeof s.host.credentialsFrom !== 'string' || !isValidDeviceId(s.host.credentialsFrom))) {
      console.warn(`[Service] Skipping service '${sanitizeLogParam(s.id)}': invalid host config`);
      return false;
    }
    return true;
  });
}

async function executeServiceCommand(serviceConfig, action) {
  const command = buildServiceCommand(serviceConfig.type, action, serviceConfig.service);
  if (!command) return { stdout: '', stderr: 'Invalid command', code: -1 };

  if (serviceConfig.host === 'local') {
    return localCommandWithOutput(command);
  }

  // Remote via SSH
  const credId = serviceConfig.host.credentialsFrom;
  const creds = readControlDeviceCredentials(credId);
  const controlDevices = readControlDevicesFromConfig();
  const controlDevice = controlDevices.find(d => d.id === credId);

  if (!controlDevice || !creds.sshUser || !creds.sshPassword) {
    return { stdout: '', stderr: 'SSH credentials not configured', code: -1 };
  }

  const sshConfig = {
    ipAddress: controlDevice.ip,
    sshUser: creds.sshUser,
    sshPassword: creds.sshPassword,
    sshPort: creds.sshPort || 22,
  };

  return sshServiceCommandWithOutput(sshConfig, command);
}

// Rate limiting for service actions
const serviceActionLimits = new Map();
const SERVICE_ACTION_LIMIT_WINDOW = 60000;
const SERVICE_ACTION_LIMIT_MAX = 10;

function checkServiceActionRateLimit(ip) {
  const now = Date.now();
  const data = serviceActionLimits.get(ip);
  if (!data || now - data.windowStart > SERVICE_ACTION_LIMIT_WINDOW) {
    serviceActionLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (data.count >= SERVICE_ACTION_LIMIT_MAX) return false;
  data.count++;
  return true;
}

const serviceStatusLimits = new Map();
const SERVICE_STATUS_LIMIT_WINDOW = 60000;
const SERVICE_STATUS_LIMIT_MAX = 120;

function checkServiceStatusRateLimit(ip) {
  const now = Date.now();
  const data = serviceStatusLimits.get(ip);
  if (!data || now - data.windowStart > SERVICE_STATUS_LIMIT_WINDOW) {
    serviceStatusLimits.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (data.count >= SERVICE_STATUS_LIMIT_MAX) return false;
  data.count++;
  return true;
}

function logServiceAction(serviceId, action, ip, success, details = '') {
  const timestamp = new Date().toISOString();
  console.log(`[SERVICE-AUDIT] ${timestamp} | ${sanitizeLogParam(serviceId)} | ${sanitizeLogParam(action)} | IP: ${sanitizeLogParam(ip)} | Success: ${success} | ${sanitizeLogParam(details)}`);
}

// ═══════════════════════════════════════════════════════════════════
// WOL-Zeitplan (Schedule) – Automatisches Wake/Shutdown per Cron
// ═══════════════════════════════════════════════════════════════════

// Tages-Mapping: Kurzname → Cron-Wochentag (0 = Sonntag)
const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

// Aktive Cron-Jobs (werden bei Re-Init gestoppt)
let schedulerJobs = [];
let _lastScheduleHash = '';

// Führt eine Scheduler-Aktion (wake/shutdown) für ein Gerät aus
async function executeScheduledAction(device, action) {
  const creds = readControlDeviceCredentials(device.id);

  if (action === 'wake') {
    if (!creds.macAddress) {
      console.log(`[Scheduler] Wake für ${device.name} übersprungen – keine MAC-Adresse konfiguriert`);
      return;
    }
    try {
      await sendWakeOnLan(creds.macAddress);
      console.log(`[Scheduler] Wake-on-LAN für ${device.name} gesendet (MAC: ${creds.macAddress})`);
    } catch (err) {
      console.error(`[Scheduler] Wake für ${device.name} fehlgeschlagen:`, err.message);
    }
    return;
  }

  if (action === 'shutdown') {
    const command = getDeviceCommand(device.type, 'shutdown');
    if (!command) {
      console.log(`[Scheduler] Shutdown für ${device.name} übersprungen – kein Befehl für Gerätetyp ${device.type}`);
      return;
    }
    if (!device.ip || !creds.sshUser || !creds.sshPassword) {
      console.log(`[Scheduler] Shutdown für ${device.name} übersprungen – unvollständige SSH-Zugangsdaten`);
      return;
    }
    const sshConfig = {
      ipAddress: device.ip,
      sshUser: creds.sshUser,
      sshPassword: creds.sshPassword,
      sshPort: creds.sshPort || 22,
    };
    try {
      await sshCommand(sshConfig, command);
      console.log(`[Scheduler] Shutdown für ${device.name} gesendet (IP: ${device.ip})`);
    } catch (err) {
      console.error(`[Scheduler] Shutdown für ${device.name} fehlgeschlagen:`, err.message);
    }
    return;
  }
}

// Erstellt Cron-Pattern aus Tagen und Uhrzeit
function buildCronPattern(days, time) {
  if (typeof time !== 'string' || !time.includes(':')) return null;
  if (!Array.isArray(days)) return null;
  const [hour, minute] = time.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const cronDays = days
    .map(d => typeof d === 'string' ? DAY_MAP[d.toLowerCase()] : undefined)
    .filter(d => d !== undefined)
    .join(',');
  if (!cronDays) return null;
  return `${minute} ${hour} * * ${cronDays}`;
}

// Berechnet den nächsten Ausführungszeitpunkt für einen Zeitplan
function getNextExecution(days, time) {
  if (typeof time !== 'string' || !time.includes(':')) return null;
  if (!Array.isArray(days)) return null;
  const [hour, minute] = time.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const now = new Date();
  const cronDays = days
    .map(d => typeof d === 'string' ? DAY_MAP[d.toLowerCase()] : undefined)
    .filter(d => d !== undefined);

  if (cronDays.length === 0) return null;

  // Prüfe die nächsten 8 Tage (maximal eine Woche + 1)
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);

    const dayOfWeek = candidate.getDay();
    if (!cronDays.includes(dayOfWeek)) continue;

    // Wenn heute aber Zeitpunkt schon vorbei → nächsten Tag prüfen
    if (candidate > now) {
      return candidate.toISOString();
    }
  }
  return null;
}

// Baut einen Hash-String aus den Schedule-Konfigurationen (erkennt Änderungen)
function buildScheduleHash(configDevices) {
  const parts = [];
  for (const device of configDevices) {
    if (!device.schedule) continue;
    for (const action of ['wake', 'shutdown']) {
      const s = device.schedule[action];
      if (!s || !s.enabled) continue;
      parts.push(`${device.id}:${action}:${s.time}:${(s.days || []).join(',')}`);
    }
  }
  return parts.join('|');
}

// Initialisiert alle Scheduler-Jobs aus der Config (nur bei Änderung)
function initScheduler() {
  const configDevices = readControlDevicesFromConfig();
  const newHash = buildScheduleHash(configDevices);

  // Nichts tun wenn sich die Config nicht geändert hat
  if (newHash === _lastScheduleHash) return;
  _lastScheduleHash = newHash;

  // Alte Jobs stoppen
  for (const job of schedulerJobs) {
    job.stop();
  }
  schedulerJobs = [];

  let jobCount = 0;

  for (const device of configDevices) {
    if (!device.schedule) continue;

    for (const action of ['wake', 'shutdown']) {
      const scheduleEntry = device.schedule[action];
      if (!scheduleEntry || !scheduleEntry.enabled) continue;
      if (!Array.isArray(scheduleEntry.days) || !scheduleEntry.time) continue;

      const pattern = buildCronPattern(scheduleEntry.days, scheduleEntry.time);
      if (!pattern) continue;

      try {
        const job = cron.schedule(pattern, () => {
          console.log(`[Scheduler] ${action} für ${device.name} wird ausgeführt (${scheduleEntry.time})`);
          executeScheduledAction(device, action);
        });
        schedulerJobs.push(job);
        jobCount++;
        console.log(`[Scheduler] Job erstellt: ${device.name} → ${action} um ${scheduleEntry.time} (${scheduleEntry.days.join(',')})`);
      } catch (err) {
        console.error(`[Scheduler] Fehler beim Erstellen des Jobs für ${device.name}/${action}:`, err.message);
      }
    }
  }

  if (jobCount > 0) {
    console.log(`[Scheduler] ${jobCount} Zeitplan-Job(s) aktiv`);
  } else {
    console.log('[Scheduler] Keine Zeitpläne konfiguriert');
  }
}

function migrateWindowsPCToControlDevices() {
  // Only migrate if ControlDevices.json does not exist yet
  if (fs.existsSync(CONTROL_DEVICES_FILE)) return;

  const data = {};
  if (fs.existsSync(WINDOWS_PC_FILE)) {
    try {
      const old = JSON.parse(fs.readFileSync(WINDOWS_PC_FILE, 'utf-8'));
      if (old.macAddress || old.sshUser || old.sshPassword) {
        data.windowspc = {
          macAddress: old.macAddress || '',
          sshUser: old.sshUser || '',
          sshPassword: old.sshPassword || '',
          sshPort: old.sshPort || 22,
        };
        console.log('[MIGRATION] Migrated WindowsPC.json → ControlDevices.json');
      }
    } catch { /* ignore */ }
  }
  saveControlDevicesData(data);
}

app.get('/api/bootstrap', (req, res) => {
  const state = readState();
  res.json({
    theme: state.theme,
    versions: state.versions,
  });
});

app.post('/api/login', (req, res) => {
  const { username, password, deviceName = 'Unknown device', deviceToken } = req.body || {};
  const clientIp = getClientIp(req);

  // Rate-Limiting Check
  const lockStatus = isLocked(clientIp);
  if (lockStatus.locked) {
    const remainingMin = Math.ceil(lockStatus.remainingMs / 60000);
    return res.status(429).json({
      success: false,
      locked: true,
      remainingMs: lockStatus.remainingMs,
      message: `Too many failed attempts. Please wait ${remainingMin} min.`,
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

  // Compare device tokens: hash the input and compare against stored hashes
  // Also support legacy plaintext tokens (UUID format) for migration
  const hashedDeviceToken = deviceToken ? hashDeviceToken(deviceToken) : null;
  let isWhitelisted = false;
  let needsTokenMigration = false;
  if (deviceToken) {
    // Check hashed tokens first
    const isHash = t => /^[a-f0-9]{64}$/.test(t);
    isWhitelisted = state.deviceTokens.some(t =>
      isHash(t) ? timingSafeEqual(t, hashedDeviceToken) : timingSafeEqual(t, deviceToken)
    );
    // Check if any matched as plaintext (needs migration)
    if (isWhitelisted) {
      needsTokenMigration = state.deviceTokens.some(t => !isHash(t) && timingSafeEqual(t, deviceToken));
    }
    // Also check file-based tokens (already hashed by readLoginTokens)
    if (!isWhitelisted) {
      isWhitelisted = fileTokenList.some(t => timingSafeEqual(t, hashedDeviceToken));
    }
  }

  // Use timing-safe comparison for credentials
  const storedPassword = state.credentials.password;
  let passwordValid = false;

  if (typeof password === 'string' && password) {
    if (isHashedPassword(storedPassword)) {
      passwordValid = verifyPassword(password, storedPassword);
    } else {
      passwordValid = timingSafeEqual(password, storedPassword || '');
    }
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
        message: `Too many failed attempts. Locked for ${lockoutMin} min.`,
      });
    }
    return res.status(401).json({
      success: false,
      attemptsLeft: result.attemptsLeft,
      message: `Invalid credentials. ${result.attemptsLeft} attempts remaining.`,
    });
  }

  // Auto-migrate password hash to stronger iterations on successful login
  if (passwordValid && needsRehash(storedPassword)) {
    const newHash = hashPassword(password);
    state.credentials.password = newHash;
    saveState(state);
    writeCredentialsFile({ username: state.credentials.username, password: newHash });
    _defaultPwCache = { hash: null, result: false };
    console.log('[Security] Password hash migrated to stronger iterations');
  }

  // Erfolgreicher Login - Reset
  resetAttempts(clientIp);
  const token = randomUUID();
  const loginAt = Date.now();
  const expiresAt = loginAt + SESSION_EXPIRY_MS;
  const matchedFileToken = hashedDeviceToken ? fileTokenEntries.find((t) => timingSafeEqual(t.token, hashedDeviceToken)) : null;
  const effectiveDeviceName = matchedFileToken?.name || deviceName || 'Unknown device';
  const previousSession = runtime.activeSession;
  runtime.activeSession = { token, deviceName: effectiveDeviceName, loginAt, expiresAt };

  // Register device token for auto-login on future visits
  let returnedDeviceToken = deviceToken || null;
  if (!returnedDeviceToken) {
    // No device token provided — generate one
    returnedDeviceToken = randomUUID();
  }
  if (!isWhitelisted) {
    // Token not yet in whitelist — store as SHA-256 hash
    state.deviceTokens.push(hashDeviceToken(returnedDeviceToken));
    // Limit stored device tokens to prevent unbounded growth
    if (state.deviceTokens.length > 20) {
      state.deviceTokens = state.deviceTokens.slice(-20);
    }
    saveState(state);
  } else if (needsTokenMigration) {
    // Migrate plaintext tokens to hashed format
    state.deviceTokens = state.deviceTokens.map(t =>
      /^[a-f0-9]{64}$/.test(t) ? t : hashDeviceToken(t)
    );
    saveState(state);
  }

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
    deviceToken: returnedDeviceToken,
    state: maskStateForClient(state),
  });
});

app.post('/api/logout', authRequired, (req, res) => {
  runtime.activeSession = null;
  for (const [, ws] of runtime.sockets) {
    try { ws.close(4000, 'Logged out'); } catch { /* already closed */ }
  }
  runtime.sockets = new Map();
  res.json({ ok: true });
});

app.get('/api/state', authRequired, (req, res) => {
  const state = readState();
  res.json(maskStateForClient(state));
});

app.post('/api/theme', authRequired, async (req, res) => {
  const { theme } = req.body || {};
  if (!['dark', 'light'].includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
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
    return res.status(400).json({ error: 'Missing values' });
  }
  // #12 Hex-Color validation
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: 'Invalid color format (expected #RRGGBB)' });
  }

  await withStateLock(() => {
    const state = readState();
    const collection = group === 'switch' ? state.switchPorts : state.routerPorts;
    const port = collection.find((p) => p.id === id);
    if (!port) {
      return res.status(404).json({ error: 'Port not found' });
    }
    port.color = color;
    saveState(state);
    res.json({ ok: true, switchPorts: state.switchPorts, routerPorts: state.routerPorts, versions: state.versions });
  });
});

app.post('/api/ports/update', authRequired, async (req, res) => {
  const { group, id, label, status } = req.body || {};
  if (!group || !id) {
    return res.status(400).json({ error: 'Missing values' });
  }
  if (!['switch', 'router'].includes(group)) {
    return res.status(400).json({ error: 'Invalid group' });
  }

  await withStateLock(() => {
    const state = readState();
    const collection = group === 'switch' ? state.switchPorts : state.routerPorts;
    const port = collection.find((p) => p.id === id);
    if (!port) {
      return res.status(404).json({ error: 'Port not found' });
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
      addVersion(state, `Port changed: ${port.label}`, {
        switchPorts: clonePorts(state.switchPorts),
        routerPorts: clonePorts(state.routerPorts),
      });
    }
    saveState(state);
    res.json({ ok: true, switchPorts: state.switchPorts, routerPorts: state.routerPorts, versions: state.versions });
  });
});

app.post('/api/settings/credentials', authRequired, async (req, res) => {
  const { username, password, currentPassword } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password must be strings' });
  }
  if (username.length > 64 || password.length > 256) {
    return res.status(400).json({ error: 'Username or password too long' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Require current password for verification
  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({ error: 'Current password is required' });
  }

  const clientIp = getClientIp(req);

  // Verify current password and update credentials inside state lock to prevent TOCTOU race
  const result = await withStateLock(() => {
    const state = readState();
    const fileCredentials = readCredentialsFile();
    if (fileCredentials) {
      state.credentials = { ...state.credentials, ...fileCredentials };
    }
    const storedPw = state.credentials.password;
    let currentPwValid = false;
    if (isHashedPassword(storedPw)) {
      currentPwValid = verifyPassword(currentPassword, storedPw);
    } else {
      currentPwValid = timingSafeEqual(currentPassword, storedPw || '');
    }
    if (!currentPwValid) {
      return { error: true };
    }

    const prevUsername = state.credentials.username;
    state.credentials.username = username;
    state.credentials.password = hashPassword(password);
    // Revoke all device tokens so old auto-login sessions are invalidated
    state.deviceTokens = [];
    saveState(state);
    writeCredentialsFile({
      username,
      password: state.credentials.password,
    });
    runtime.activeSession = null;
    return { error: false, oldUsername: prevUsername };
  });

  if (result.error) {
    return res.status(403).json({ error: 'Current password is incorrect' });
  }

  res.json({ ok: true, username, sessionInvalidated: true });

  // Send notification email (fire-and-forget, after response)
  sendCredentialsChangedEmail(result.oldUsername, username, clientIp)
    .catch(err => console.error('[Notification] Unexpected credentials-mail error:', err.message));
});

app.post('/api/speedport', authRequired, async (req, res) => {
  const { wifiName, wifiPassword, serialNumber, configuration, remoteUrl, devicePassword, modemId } = req.body || {};
  // #13 Längen-Limit für alle Speedport-Felder
  const MAX_FIELD_LEN = 256;
  const fields = { wifiName, wifiPassword, serialNumber, configuration, remoteUrl, devicePassword, modemId };
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string' && val.length > MAX_FIELD_LEN) {
      return res.status(400).json({ error: `Field ${key} too long (max ${MAX_FIELD_LEN} chars)` });
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
      addSpeedportVersion(state, 'Speedport changed', {
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
  const { model, hostname, ipAddress, vpnIp, macAddress, sshUser, sshPassword, piholeUrl, piholeRemoteUrl } = req.body || {};
  // #13 Längen-Limit für alle Raspberry-Felder
  const MAX_FIELD_LEN = 256;
  const fields = { model, hostname, ipAddress, vpnIp, macAddress, sshUser, piholeUrl, piholeRemoteUrl };
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string' && val.length > MAX_FIELD_LEN) {
      return res.status(400).json({ error: `Field ${key} too long (max ${MAX_FIELD_LEN} chars)` });
    }
  }
  // Validate sshPassword separately (max 128 chars, same as control devices)
  if (sshPassword !== undefined && typeof sshPassword === 'string' && sshPassword.length > 128) {
    return res.status(400).json({ error: 'Field sshPassword too long (max 128 chars)' });
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
    // Handle sshPassword: encrypt for storage, preserve existing if not sent
    if (sshPassword !== undefined) {
      next.sshPassword = sshPassword ? encryptValue(sshPassword) : '';
    } else {
      // Preserve existing encrypted password if not provided in this request
      next.sshPassword = (state.raspberryInfo || {}).sshPassword || '';
    }
    const prev = state.raspberryInfo || {};
    const changed = Object.keys(next).some((key) => {
      if (key === 'sshPassword') return false; // compare password separately
      return `${prev[key] ?? ''}` !== `${next[key] ?? ''}`;
    });
    const passwordChanged = sshPassword !== undefined &&
      decryptValue(prev.sshPassword || '') !== (sshPassword || '');
    state.raspberryInfo = next;
    if (changed || passwordChanged) {
      addRaspberryVersion(state, 'Raspberry changed', {
        raspberryInfo: { ...state.raspberryInfo },
      });
    }
    saveState(state);
    // Return decrypted sshPassword to client so UI stays in sync
    const clientInfo = { ...state.raspberryInfo };
    clientInfo.sshPassword = decryptValue(clientInfo.sshPassword);
    res.json({
      ok: true,
      raspberryInfo: clientInfo,
      raspberryVersions: state.raspberryVersions,
    });
  });
});

// ── Generic Info Cards (configurable) ──

app.get('/api/info-card/:cardId', authRequired, async (req, res) => {
  const { cardId } = req.params;
  if (!isValidDeviceId(cardId)) {
    return res.status(400).json({ error: 'Invalid card ID' });
  }
  const cardDef = getInfoCardDefinition(cardId);
  if (!cardDef) {
    return res.status(404).json({ error: 'Card not found in config' });
  }

  const result = await withStateLock(() => {
    const allData = readInfoCardsData();
    const cardData = allData[cardId] || {};

    // Decrypt password fields
    const pwKeys = getPasswordFieldKeys(cardDef);
    const decrypted = { ...cardData };
    for (const key of pwKeys) {
      if (decrypted[key]) decrypted[key] = decryptValue(decrypted[key]);
    }

    // For table cards, return rows data
    if (cardDef.type === 'table' && Array.isArray(cardDef.rows)) {
      if (!decrypted.rows) decrypted.rows = {};
    }

    return decrypted;
  });

  res.json(result);
});

app.post('/api/info-card/:cardId', authRequired, async (req, res) => {
  const { cardId } = req.params;
  if (!isValidDeviceId(cardId)) {
    return res.status(400).json({ error: 'Invalid card ID' });
  }
  const cardDef = getInfoCardDefinition(cardId);
  if (!cardDef) {
    return res.status(404).json({ error: 'Card not found in config' });
  }

  const body = req.body || {};
  const MAX_FIELD_LEN = 512;
  const pwKeys = getPasswordFieldKeys(cardDef);

  const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

  if (cardDef.type === 'info') {
    // Validate: only allow keys defined in config fields
    const allowedKeys = (cardDef.fields || []).map(f => f.key).filter(k => !DANGEROUS_KEYS.includes(k));
    const dataToSave = {};

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const val = String(body[key]);
        if (val.length > MAX_FIELD_LEN) {
          return res.status(400).json({ error: `Field ${key} too long (max ${MAX_FIELD_LEN})` });
        }
        if (pwKeys.includes(key)) {
          dataToSave[key] = val ? encryptValue(val) : '';
        } else {
          dataToSave[key] = val;
        }
      }
    }

    await withStateLock(() => {
      const allData = readInfoCardsData();
      allData[cardId] = dataToSave;
      saveInfoCardsData(allData);
    });

    // Return decrypted for client
    const clientData = { ...dataToSave };
    for (const key of pwKeys) {
      if (clientData[key]) clientData[key] = decryptValue(clientData[key]);
    }
    res.json({ ok: true, data: clientData });

  } else if (cardDef.type === 'table') {
    // Validate: only allow row IDs defined in config
    const allowedRowIds = (cardDef.rows || []).map(r => r.id);
    const rows = body.rows || {};
    const sanitizedRows = {};

    for (const rowId of allowedRowIds) {
      if (rows[rowId]) {
        const row = rows[rowId];
        sanitizedRows[rowId] = {
          status: typeof row.status === 'string' ? row.status.slice(0, MAX_FIELD_LEN) : '',
          color: (typeof row.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(row.color)) ? row.color : '#000000',
        };
      }
    }

    await withStateLock(() => {
      const allData = readInfoCardsData();
      allData[cardId] = { rows: sanitizedRows };
      saveInfoCardsData(allData);
    });

    res.json({ ok: true, data: { rows: sanitizedRows } });

  } else {
    return res.status(400).json({ error: 'Unknown card type' });
  }
});

app.get('/api/versions', authRequired, (req, res) => {
  const state = readState();
  res.json({ versions: state.versions });
});

// Maximum allowed speedtest size (50 MB) to prevent DoS
const MAX_SPEEDTEST_SIZE_MB = 50;

// Concurrency limiter for CPU-intensive speedtest endpoints
let activeSpeedtests = 0;
const MAX_CONCURRENT_SPEEDTESTS = 2;

function speedtestConcurrencyGuard(req, res, next) {
  if (activeSpeedtests >= MAX_CONCURRENT_SPEEDTESTS) {
    return res.status(429).json({ error: 'Too many concurrent speedtests' });
  }
  activeSpeedtests++;
  let released = false;
  function release() {
    if (!released) { released = true; activeSpeedtests--; }
  }
  res.on('finish', release);
  res.on('close', release);
  next();
}

app.get('/api/speedtest/download', authRequired, speedtestConcurrencyGuard, (req, res) => {
  // Cap size to prevent memory exhaustion DoS
  const sizeMB = Math.min(Math.max(parseInt(req.query.size) || 1, 1), MAX_SPEEDTEST_SIZE_MB);
  const sizeBytes = sizeMB * 1024 * 1024;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', sizeBytes);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Stream random data in chunks to avoid memory exhaustion
  const chunkSize = 64 * 1024; // 64 KB
  let sent = 0;
  function sendChunk() {
    while (sent < sizeBytes) {
      const remaining = sizeBytes - sent;
      const size = Math.min(chunkSize, remaining);
      const chunk = crypto.randomBytes(size);
      sent += size;
      if (!res.write(chunk)) {
        res.once('drain', sendChunk);
        return;
      }
    }
    res.end();
  }
  sendChunk();
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
    return res.status(400).json({ error: 'Invalid target IP address' });
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

app.get('/api/speedtest/local-download-proxy', authRequired, speedtestConcurrencyGuard, async (req, res) => {
  // Cap size to prevent DoS
  const sizeMB = Math.min(Math.max(parseInt(req.query.size, 10) || 1, 1), MAX_SPEEDTEST_SIZE_MB);

  if (!usePiSpeedtest()) {
    const sizeBytes = sizeMB * 1024 * 1024;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', sizeBytes);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Pi-Status', 'disabled');

    const chunkSize = 64 * 1024;
    let sent = 0;
    function sendChunk() {
      while (sent < sizeBytes) {
        const remaining = sizeBytes - sent;
        const size = Math.min(chunkSize, remaining);
        const chunk = crypto.randomBytes(size);
        sent += size;
        if (!res.write(chunk)) {
          res.once('drain', sendChunk);
          return;
        }
      }
      res.end();
    }
    sendChunk();
    return;
  }

  const http = require('http');
  const state = readState();
  const { host, port } = getPiSpeedtestTarget(state);

  // SSRF protection - validate target IP
  if (!isAllowedProxyTarget(host)) {
    return res.status(400).json({ error: 'Invalid target IP address' });
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
        error: 'Pi speedtest server error',
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
    if (!res.headersSent) sendPiUnavailable(res, host, port, e?.message || 'error');
    else res.destroy();
  });

  piRequest.on('timeout', () => {
    piRequest.destroy();
    if (!res.headersSent) sendPiUnavailable(res, host, port, 'timeout');
    else res.destroy();
  });

  piRequest.end();
});

app.post('/api/speedtest/local-upload-proxy', authRequired, (req, res) => {
  const maxUploadBytes = MAX_SPEEDTEST_SIZE_MB * 1024 * 1024;

  if (!usePiSpeedtest()) {
    // Consume the raw body stream and count bytes (with size limit)
    let receivedBytes = 0;
    req.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxUploadBytes) {
        req.destroy();
        if (!res.headersSent) res.status(413).json({ error: 'Upload too large' });
      }
    });
    req.on('end', () => {
      if (!res.headersSent) res.json({ ok: true, bytes: receivedBytes, piStatus: 'disabled' });
    });
    req.on('error', () => {
      if (!res.headersSent) res.json({ ok: true, bytes: receivedBytes, piStatus: 'disabled' });
    });
    return;
  }

  const http = require('http');
  const state = readState();
  const { host, port } = getPiSpeedtestTarget(state);

  // SSRF protection - validate target IP
  if (!isAllowedProxyTarget(host)) {
    return res.status(400).json({ error: 'Invalid target IP address' });
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
    if (!res.headersSent) sendPiUnavailable(res, host, port, e?.message || 'error');
    else res.destroy();
  });

  piRequest.on('timeout', () => {
    piRequest.destroy();
    if (!res.headersSent) sendPiUnavailable(res, host, port, 'timeout');
    else res.destroy();
  });

  req.on('aborted', () => {
    piRequest.destroy();
  });

  req.pipe(piRequest);
});

app.post('/api/speedtest/save', authRequired, async (req, res) => {
  const { download, upload, ping, type, timestamp } = req.body || {};

  function safeFloat(v, max = 100000) {
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, max);
  }

  const allowedTypes = ['local', 'internet', 'unknown'];
  const now = Date.now();
  const MIN_TS = 1577836800000; // 2020-01-01

  try {
    const history = await withStateLock(() => {
      const state = readState();

      const testResult = {
        id: randomUUID(),
        download: safeFloat(download),
        upload: safeFloat(upload),
        ping: safeFloat(ping, 60000),
        type: allowedTypes.includes(type) ? type : 'unknown',
        timestamp: (typeof timestamp === 'number' && Number.isFinite(timestamp)
          && timestamp > MIN_TS && timestamp < now + 86400000)
          ? timestamp : now,
      };

      state.speedTestHistory = Array.isArray(state.speedTestHistory) ? state.speedTestHistory : [];
      state.speedTestHistory.unshift(testResult);

      // Keep only last 50 tests
      if (state.speedTestHistory.length > 50) {
        state.speedTestHistory = state.speedTestHistory.slice(0, 50);
      }

      saveState(state);
      return state.speedTestHistory;
    });
    res.json({ ok: true, history });
  } catch {
    res.status(500).json({ error: 'Failed to save speedtest' });
  }
});

app.get('/api/speedtest/history', authRequired, async (req, res) => {
  try {
    const history = await withStateLock(() => {
      const state = readState();
      return state.speedTestHistory || [];
    });
    res.json({ history });
  } catch {
    res.status(500).json({ error: 'Failed to read history' });
  }
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
  if (safeState.raspberryInfo) {
    safeState.raspberryInfo = { ...safeState.raspberryInfo };
    delete safeState.raspberryInfo.sshPassword;
  }
  // Strip sensitive fields from version snapshots
  function stripSnapshotSecrets(versions) {
    if (!Array.isArray(versions)) return versions;
    return versions.map(v => {
      if (!v || !v.snapshot) return v;
      const s = { ...v, snapshot: { ...v.snapshot } };
      if (s.snapshot.speedportInfo) {
        s.snapshot.speedportInfo = { ...s.snapshot.speedportInfo };
        delete s.snapshot.speedportInfo.wifiPassword;
        delete s.snapshot.speedportInfo.devicePassword;
      }
      if (s.snapshot.raspberryInfo) {
        s.snapshot.raspberryInfo = { ...s.snapshot.raspberryInfo };
        delete s.snapshot.raspberryInfo.sshPassword;
      }
      return s;
    });
  }
  if (safeState.speedportVersions) safeState.speedportVersions = stripSnapshotSecrets(safeState.speedportVersions);
  if (safeState.raspberryVersions) safeState.raspberryVersions = stripSnapshotSecrets(safeState.raspberryVersions);
  if (safeState.versions) safeState.versions = stripSnapshotSecrets(safeState.versions);
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
    return res.status(400).json({ error: 'Invalid data' });
  }

  // Validiere wichtige Felder
  if (!data.switchPorts && !data.routerPorts && !data.speedportInfo && !data.raspberryInfo) {
    return res.status(400).json({ error: 'No valid Netzwerk Manager data found' });
  }

  // Sanitize imported string data to prevent XSS
  function sanitizePort(port) {
    return {
      id: typeof port.id === 'string' ? port.id.slice(0, 64) : String(port.id || '').slice(0, 64),
      label: escapeHtml(String(port.label || '')).slice(0, 256),
      status: escapeHtml(String(port.status || '')).slice(0, 64),
      color: /^#[0-9A-Fa-f]{6}$/.test(port.color) ? port.color : '',
    };
  }

  function sanitizeStringFields(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      if (typeof val === 'string') {
        result[key] = escapeHtml(val);
      }
    }
    return result;
  }

  // #14 Array-Größen begrenzen um DoS zu verhindern
  const MAX_PORTS = 64;
  const MAX_VERSIONS = 200;
  const MAX_HISTORY = 50;

  function sanitizeVersions(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_VERSIONS).map(sanitizeVersionEntry).filter(Boolean);
  }

  await withStateLock(() => {
    const currentState = readState();
    const newState = {
      ...defaultState,
      // SECURITY: Never import credentials from external files!
      credentials: currentState.credentials,
      speedportInfo: { ...defaultState.speedportInfo, ...sanitizeStringFields(data.speedportInfo) },
      raspberryInfo: { ...defaultState.raspberryInfo, ...sanitizeStringFields(data.raspberryInfo) },
      // Sanitize port data (capped, whitelisted properties)
      switchPorts: (data.switchPorts || currentState.switchPorts).slice(0, MAX_PORTS).map(sanitizePort),
      routerPorts: (data.routerPorts || currentState.routerPorts).slice(0, MAX_PORTS).map(sanitizePort),
      versions: sanitizeVersions(data.versions),
      speedportVersions: sanitizeVersions(data.speedportVersions),
      raspberryVersions: sanitizeVersions(data.raspberryVersions),
      // SECURITY: Never import device tokens from external files!
      deviceTokens: currentState.deviceTokens,
      speedTestHistory: Array.isArray(data.speedTestHistory) ? data.speedTestHistory.slice(0, MAX_HISTORY).map(sanitizeSpeedTestEntry).filter(Boolean) : [],
    };

    saveState(newState);
    // Note: credentials not written since we keep the existing ones

    res.json({ ok: true, message: 'Data imported successfully (credentials unchanged)' });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Zeitplan-Endpoint
// ═══════════════════════════════════════════════════════════════════

// GET /api/schedules – Gibt die nächsten geplanten Aktionen pro Gerät zurück
app.get('/api/schedules', authRequired, (req, res) => {
  const configDevices = readControlDevicesFromConfig();
  const result = {};

  for (const device of configDevices) {
    if (!device.schedule) continue;

    const entry = {};
    if (device.schedule.wake?.enabled && Array.isArray(device.schedule.wake.days) && device.schedule.wake.time) {
      entry.nextWake = getNextExecution(device.schedule.wake.days, device.schedule.wake.time);
    }
    if (device.schedule.shutdown?.enabled && Array.isArray(device.schedule.shutdown.days) && device.schedule.shutdown.time) {
      entry.nextShutdown = getNextExecution(device.schedule.shutdown.days, device.schedule.shutdown.time);
    }

    if (entry.nextWake || entry.nextShutdown) {
      result[device.id] = entry;
    }
  }

  res.json(result);
});

// ═══════════════════════════════════════════════════════════════════
// Remote Update
// ═══════════════════════════════════════════════════════════════════

let _updateRunning = false;

// Safe spawn-based alternative to exec for git commands
function spawnAsync(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd: __dirname, ...options });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`${cmd} ${args.join(' ')} timed out`));
    }, options.timeout || 15000);
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}: ${stderr}`));
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Allowlist of permitted git subcommands for update
const ALLOWED_GIT_SUBCOMMANDS = new Set(['fetch', 'pull', 'rev-parse', 'reset', 'checkout', 'merge', 'status', 'log', 'stash']);

// GET /api/update/check – prüft ob Updates via git verfügbar sind
app.get('/api/update/check', authRequired, async (req, res) => {
  const cfg = readSiteConfig();
  if (!cfg?.settings?.update?.enabled) {
    return res.status(403).json({ error: 'Update feature disabled' });
  }
  try {
    await spawnAsync('git', ['fetch'], { timeout: 15000 });
    const { stdout: localHash } = await spawnAsync('git', ['rev-parse', 'HEAD'], { timeout: 5000 });
    const { stdout: remoteHash } = await spawnAsync('git', ['rev-parse', '@{u}'], { timeout: 5000 });
    res.json({ upToDate: localHash.trim() === remoteHash.trim() });
  } catch (err) {
    console.error('[Update] Check failed:', err.message);
    res.status(500).json({ error: 'Check failed' });
  }
});

// POST /api/update/run – führt die konfigurierten Update-Befehle aus
app.post('/api/update/run', authRequired, async (req, res) => {
  const cfg = readSiteConfig();
  if (!cfg?.settings?.update?.enabled) {
    return res.status(403).json({ error: 'Update feature disabled' });
  }
  if (_updateRunning) {
    return res.status(409).json({ error: 'Update already in progress' });
  }
  const commands = cfg.settings.update.commands;
  if (!Array.isArray(commands) || commands.length === 0) {
    return res.status(400).json({ error: 'No commands configured' });
  }

  _updateRunning = true;
  const results = [];
  try {
    for (const cmd of commands) {
      if (typeof cmd !== 'string' || !cmd.trim()) continue;
      const parts = cmd.trim().split(/\s+/);
      const executable = parts[0];
      const args = parts.slice(1);
      // Only allow git commands with whitelisted subcommands
      if (executable !== 'git' || !ALLOWED_GIT_SUBCOMMANDS.has(args[0])) {
        results.push({ cmd, ok: false });
        console.error(`[Update] ${cmd} → BLOCKED: not an allowed git command`);
        return res.json({ ok: false, results });
      }
      try {
        await spawnAsync(executable, args, { timeout: 30000 });
        results.push({ cmd, ok: true });
        console.log(`[Update] ${cmd} → OK`);
      } catch (err) {
        results.push({ cmd, ok: false });
        console.error(`[Update] ${cmd} → FAILED:`, err.message);
        return res.json({ ok: false, results });
      }
    }
    res.json({ ok: true, results });

    console.log('[Update] Alle Befehle erfolgreich. Server wird in 3s neu gestartet…');
    setTimeout(() => process.exit(0), 3000);
  } finally {
    _updateRunning = false;
  }
});

// ═══════════════════════════════════════════════════════════════════
// Generic Control Device Endpoints
// ═══════════════════════════════════════════════════════════════════

// GET device config + credentials
app.get('/api/control/:deviceId', authRequired, (req, res) => {
  const deviceId = req.params.deviceId;
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ error: 'Invalid device ID' });
  const configDevices = readControlDevicesFromConfig();
  const device = configDevices.find(d => d.id === deviceId);

  // Allow access to stored credentials even without a config entry
  // (e.g. legacy Windows PC card that is always shown)
  const storedData = readControlDevicesData();
  if (!device && !storedData[deviceId]) {
    // Return empty data for known legacy device IDs (windowspc)
    // so the always-rendered card works even without a config entry
    if (deviceId === 'windowspc') {
      return res.json({
        id: deviceId, name: '', type: '', ip: '', actions: [],
        hostname: '', ipAddress: '', macAddress: '', sshUser: '',
        sshPassword: '', hasPassword: false, sshPort: 22,
      });
    }
    return res.status(404).json({ error: 'Device not found' });
  }

  const creds = readControlDeviceCredentials(deviceId);
  res.json({
    id: device?.id || deviceId,
    name: device?.name || creds.hostname || '',
    type: device?.type || '',
    ip: device?.ip || creds.ipAddress || '',
    actions: device?.actions || [],
    hostname: creds.hostname || '',
    ipAddress: creds.ipAddress || '',
    macAddress: creds.macAddress || '',
    sshUser: creds.sshUser || '',
    sshPassword: creds._sshPasswordDecrypted || '',
    hasPassword: Boolean(creds.sshPassword),
    sshPort: creds.sshPort || 22,
  });
});

// POST save credentials
app.post('/api/control/:deviceId', authRequired, (req, res) => {
  const deviceId = req.params.deviceId;
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ error: 'Invalid device ID' });
  const clientIp = getClientIp(req);
  const configDevices = readControlDevicesFromConfig();
  const device = configDevices.find(d => d.id === deviceId);

  // Allow saving credentials even without a config entry
  // (e.g. legacy Windows PC card that is always shown)
  const storedData = readControlDevicesData();
  if (!device && !storedData[deviceId]) {
    if (deviceId === 'windowspc') {
      // Auto-create entry for known legacy devices
      storedData[deviceId] = { hostname: '', ipAddress: '', macAddress: '', sshUser: '', sshPassword: '', sshPort: 22 };
      saveControlDevicesData(storedData);
    } else {
      return res.status(404).json({ error: 'Device not found' });
    }
  }

  const { hostname, ipAddress, macAddress, sshUser, sshPassword, sshPort } = req.body || {};
  const errors = [];

  // Validate hostname (max 50 chars, alphanumeric + common chars)
  if (hostname !== undefined && hostname !== '' && !validateWindowsPCInput('name', hostname)) {
    errors.push('Invalid hostname (max 50 chars, alphanumeric)');
  }
  // Validate ipAddress
  if (ipAddress !== undefined && ipAddress !== '' && !validateWindowsPCInput('ipAddress', ipAddress)) {
    errors.push('Invalid IP address');
  }
  if (macAddress !== undefined && macAddress !== '' && !validateWindowsPCInput('macAddress', macAddress)) {
    errors.push('Invalid MAC address (format: XX:XX:XX:XX:XX:XX)');
  }
  if (sshUser !== undefined && sshUser !== '' && !validateWindowsPCInput('sshUser', sshUser)) {
    errors.push('Invalid SSH username (alphanumeric only, max 32 chars)');
  }
  if (sshPort !== undefined && !validateWindowsPCInput('sshPort', sshPort)) {
    errors.push('Invalid SSH port (1-65535)');
  }
  if (sshPassword !== undefined && !validateWindowsPCInput('sshPassword', sshPassword)) {
    errors.push('Invalid password (max 128 chars)');
  }

  if (errors.length > 0) {
    logControlAction(deviceId, 'CONFIG_UPDATE', clientIp, false, `Validation failed: ${errors.join(', ')}`);
    return res.status(400).json({ ok: false, errors });
  }

  const creds = readControlDeviceCredentials(deviceId);
  if (hostname !== undefined) creds.hostname = hostname;
  if (ipAddress !== undefined) creds.ipAddress = ipAddress;
  if (macAddress !== undefined && macAddress !== null) creds.macAddress = macAddress.toUpperCase();
  if (sshUser !== undefined) creds.sshUser = sshUser;
  if (sshPassword !== undefined) creds.sshPassword = sshPassword;
  if (sshPort !== undefined) creds.sshPort = parseInt(sshPort, 10) || 22;
  delete creds._sshPasswordDecrypted;

  saveControlDeviceCredentials(deviceId, creds);
  logControlAction(deviceId, 'CONFIG_UPDATE', clientIp, true, 'Credentials updated');

  res.json({
    ok: true,
    hostname: creds.hostname || '',
    ipAddress: creds.ipAddress || '',
    macAddress: creds.macAddress || '',
    sshUser: creds.sshUser || '',
    hasPassword: Boolean(creds.sshPassword),
    sshPort: creds.sshPort || 22,
  });
});

// GET status - ping check
app.get('/api/control/:deviceId/status', authRequired, async (req, res) => {
  const deviceId = req.params.deviceId;
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ online: false, error: 'Invalid device ID' });
  const clientIp = getClientIp(req);

  if (!checkPCStatusRateLimit(clientIp)) {
    return res.status(429).json({ online: false, error: 'Too many requests' });
  }

  const configDevices = readControlDevicesFromConfig();
  const device = configDevices.find(d => d.id === deviceId);
  if (!device) return res.status(404).json({ online: false, error: 'Device not found' });

  const online = await pingHost(device.ip);
  res.json({ online, configured: true });
});

// GET password - reveal decrypted SSH password
app.get('/api/control/:deviceId/password', authRequired, (req, res) => {
  const deviceId = req.params.deviceId;
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ error: 'Invalid device ID' });
  const clientIp = getClientIp(req);

  if (!checkPasswordRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const configDevices = readControlDevicesFromConfig();
  const device = configDevices.find(d => d.id === deviceId);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const creds = readControlDeviceCredentials(deviceId);
  res.json({ password: creds._sshPasswordDecrypted || '' });
});

// POST action - execute wake/restart/shutdown
app.post('/api/control/:deviceId/:action', authRequired, async (req, res) => {
  const { deviceId, action } = req.params;
  if (!isValidDeviceId(deviceId)) return res.status(400).json({ success: false, message: 'Invalid device ID' });
  const clientIp = getClientIp(req);

  if (!checkPCActionRateLimit(clientIp)) {
    logControlAction(deviceId, action.toUpperCase(), clientIp, false, 'Rate limited');
    return res.status(429).json({ success: false, message: 'Too many requests. Please wait.' });
  }

  const configDevices = readControlDevicesFromConfig();
  const device = configDevices.find(d => d.id === deviceId);
  if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
  if (!device.actions.includes(action)) {
    return res.status(400).json({ success: false, message: 'Action not supported' });
  }

  const creds = readControlDeviceCredentials(deviceId);

  // Wake action
  if (action === 'wake') {
    if (!creds.macAddress) {
      logControlAction(deviceId, 'WAKE', clientIp, false, 'No MAC configured');
      return res.status(400).json({ success: false, message: 'No MAC address configured' });
    }
    try {
      await sendWakeOnLan(creds.macAddress);
      logControlAction(deviceId, 'WAKE', clientIp, true, `MAC: ${creds.macAddress}`);
      return res.json({ success: true, message: 'Wake-on-LAN packet sent' });
    } catch {
      logControlAction(deviceId, 'WAKE', clientIp, false, 'Send failed');
      return res.status(500).json({ success: false, message: 'Failed to send Wake-on-LAN packet' });
    }
  }

  // SSH actions (shutdown, restart)
  const command = getDeviceCommand(device.type, action);
  if (!command) {
    return res.status(400).json({ success: false, message: 'Unknown command for device type' });
  }

  if (!device.ip || !creds.sshUser || !creds.sshPassword) {
    logControlAction(deviceId, action.toUpperCase(), clientIp, false, 'Incomplete SSH config');
    return res.status(400).json({ success: false, message: 'Incomplete SSH credentials' });
  }

  const sshConfig = {
    ipAddress: device.ip,
    sshUser: creds.sshUser,
    sshPassword: creds.sshPassword,
    sshPort: creds.sshPort || 22,
  };

  try {
    await sshCommand(sshConfig, command);
    logControlAction(deviceId, action.toUpperCase(), clientIp, true, `Target: ${device.ip}`);
    res.json({ success: true, message: `${action} command sent` });
  } catch {
    logControlAction(deviceId, action.toUpperCase(), clientIp, false, 'SSH failed');
    res.status(500).json({ success: false, message: `${action} failed` });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Service / Container Management – API Endpoints
// ═══════════════════════════════════════════════════════════════════

app.get('/api/services/:serviceId/status', authRequired, async (req, res) => {
  const clientIp = getClientIp(req);
  if (!checkServiceStatusRateLimit(clientIp)) {
    return res.status(429).json({ status: 'unknown' });
  }

  const serviceId = req.params.serviceId;
  if (!isValidDeviceId(serviceId)) {
    return res.status(400).json({ status: 'unknown' });
  }

  const services = readServicesFromConfig();
  const svc = services.find(s => s.id === serviceId);
  if (!svc) {
    return res.status(404).json({ status: 'unknown' });
  }

  try {
    const result = await executeServiceCommand(svc, 'status');
    const status = parseServiceStatus(svc.type, svc.service, result);
    res.json({ status });
  } catch {
    res.json({ status: 'unknown' });
  }
});

app.post('/api/services/:serviceId/:action', authRequired, async (req, res) => {
  const clientIp = getClientIp(req);
  if (!checkServiceActionRateLimit(clientIp)) {
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }

  const { serviceId, action } = req.params;
  if (!isValidDeviceId(serviceId)) {
    return res.status(400).json({ success: false, message: 'Invalid service ID' });
  }
  if (!VALID_SERVICE_ACTIONS.has(action)) {
    return res.status(400).json({ success: false, message: 'Invalid action' });
  }

  const services = readServicesFromConfig();
  const svc = services.find(s => s.id === serviceId);
  if (!svc) {
    logServiceAction(serviceId, action, clientIp, false, 'Service not found');
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  try {
    const result = await executeServiceCommand(svc, action);
    const success = result.code === 0;
    logServiceAction(serviceId, action.toUpperCase(), clientIp, success, `Exit: ${result.code}`);
    if (success) {
      res.json({ success: true, message: `${action} command sent` });
    } else {
      console.error(`[Service] ${sanitizeLogParam(action)} failed for ${sanitizeLogParam(serviceId)}: ${sanitizeLogParam(result.stderr)}`);
      res.status(500).json({ success: false, message: `${action} failed` });
    }
  } catch {
    logServiceAction(serviceId, action.toUpperCase(), clientIp, false, 'Execution error');
    res.status(500).json({ success: false, message: `${action} failed` });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Pi-hole v6 Proxy
// ═══════════════════════════════════════════════════════════════════

const piholeSession = { sid: null, expiresAt: 0 };
let _piholeAuthPromise = null;
const PIHOLE_MAX_BODY = 10 * 1024 * 1024; // 10 MB

function readPiholeConfig() {
  // Primary: read from public/config.js (pihole.url + pihole.password)
  const cfg = readSiteConfig();
  const pihole = cfg?.pihole;
  if (pihole && pihole.url && pihole.password) {
    const url = pihole.url.replace(/\/+$/, '');
    try {
      const parsed = new URL(url);
      if (!isAllowedProxyTarget(parsed.hostname)) return null;
    } catch { return null; }
    return { url, password: pihole.password };
  }

  // Fallback: legacy Data/pihole.json (backwards compatibility)
  const legacyFile = path.join(DATA_DIR, 'pihole.json');
  try {
    if (!fs.existsSync(legacyFile)) return null;
    const raw = JSON.parse(fs.readFileSync(legacyFile, 'utf-8'));
    if (!raw || !raw.url || !raw.password) return null;
    const url = raw.url.replace(/\/+$/, '');
    try {
      const parsed = new URL(url);
      if (!isAllowedProxyTarget(parsed.hostname)) return null;
    } catch { return null; }
    return { url, password: raw.password };
  } catch {
    return null;
  }
}

function piholeHttpModule(urlStr) {
  return urlStr.startsWith('https') ? require('https') : require('http');
}

function piholeDefaultPort(urlStr) {
  return urlStr.startsWith('https') ? 443 : 80;
}

function _doAuthenticate() {
  return new Promise((resolve, reject) => {
    const config = readPiholeConfig();
    if (!config) return reject(new Error('Pi-hole not configured'));

    const url = new URL(config.url);
    const httpMod = piholeHttpModule(config.url);

    const postData = JSON.stringify({ password: config.password });
    const options = {
      hostname: url.hostname,
      port: url.port || piholeDefaultPort(config.url),
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 5000,
    };

    const req = httpMod.request(options, (res) => {
      let body = '';
      let bodySize = 0;
      let aborted = false;
      res.on('data', (chunk) => {
        if (aborted) return;
        bodySize += chunk.length;
        if (bodySize > PIHOLE_MAX_BODY) { aborted = true; res.destroy(); return reject(new Error('Auth response too large')); }
        body += chunk;
      });
      res.on('end', () => {
        if (aborted) return;
        try {
          const data = JSON.parse(body);
          const sid = data?.session?.sid;
          if (typeof sid === 'string' && sid.length > 0 && sid.length <= 256) {
            piholeSession.sid = sid;
            piholeSession.expiresAt = Date.now() + 4 * 60 * 1000;
            resolve(sid);
          } else {
            reject(new Error('Pi-hole auth failed'));
          }
        } catch {
          reject(new Error('Pi-hole auth response invalid'));
        }
      });
    });

    req.on('error', (e) => { console.error('[Pi-hole] Auth error:', e.message); reject(new Error('Pi-hole unreachable')); });
    req.on('timeout', () => { req.destroy(); reject(new Error('Pi-hole timeout')); });
    req.write(postData);
    req.end();
  });
}

function getPiholeSid() {
  if (piholeSession.sid && Date.now() < piholeSession.expiresAt) {
    return Promise.resolve(piholeSession.sid);
  }
  if (!_piholeAuthPromise) {
    _piholeAuthPromise = _doAuthenticate().finally(() => { _piholeAuthPromise = null; });
  }
  return _piholeAuthPromise;
}

function _doApiRequest(apiPath) {
  return new Promise((resolve, reject) => {
    const config = readPiholeConfig();
    if (!config) return reject(new Error('Pi-hole not configured'));

    const url = new URL(config.url);
    const httpMod = piholeHttpModule(config.url);

    const options = {
      hostname: url.hostname,
      port: url.port || piholeDefaultPort(config.url),
      path: apiPath,
      method: 'GET',
      headers: { sid: piholeSession.sid },
      timeout: 10000,
    };

    const req = httpMod.request(options, (res) => {
      let body = '';
      let bodySize = 0;
      let aborted = false;
      res.on('data', (chunk) => {
        if (aborted) return;
        bodySize += chunk.length;
        if (bodySize > PIHOLE_MAX_BODY) { aborted = true; res.destroy(); return reject(new Error('Response too large')); }
        body += chunk;
      });
      res.on('end', () => {
        if (aborted) return;
        if (res.statusCode === 401) {
          const err = new Error('Pi-hole auth expired');
          err.statusCode = 401;
          return reject(err);
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const err = new Error(`Pi-hole returned ${res.statusCode}`);
          err.statusCode = res.statusCode;
          return reject(err);
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid JSON from Pi-hole'));
        }
      });
    });

    req.on('error', (e) => { console.error('[Pi-hole] Request error:', e.message); reject(new Error('Pi-hole service unavailable')); });
    req.on('timeout', () => { req.destroy(); reject(new Error('Pi-hole request timeout')); });
    req.end();
  });
}

async function piholeApiRequest(apiPath, retried) {
  await getPiholeSid();
  const sidUsed = piholeSession.sid;
  try {
    return await _doApiRequest(apiPath);
  } catch (e) {
    if (e && e.statusCode === 401 && !retried) {
      if (piholeSession.sid === sidUsed) {
        piholeSession.sid = null;
        piholeSession.expiresAt = 0;
        _piholeAuthPromise = null;
      }
      await getPiholeSid();
      return _doApiRequest(apiPath);
    }
    throw e;
  }
}

function _doApiPostRequest(apiPath, body) {
  return new Promise((resolve, reject) => {
    const config = readPiholeConfig();
    if (!config) return reject(new Error('Pi-hole not configured'));

    const url = new URL(config.url);
    const httpMod = piholeHttpModule(config.url);
    const postData = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port: url.port || piholeDefaultPort(config.url),
      path: apiPath,
      method: 'POST',
      headers: {
        sid: piholeSession.sid,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 10000,
    };

    const req = httpMod.request(options, (res) => {
      let respBody = '';
      let bodySize = 0;
      let aborted = false;
      res.on('data', (chunk) => {
        if (aborted) return;
        bodySize += chunk.length;
        if (bodySize > PIHOLE_MAX_BODY) { aborted = true; res.destroy(); return reject(new Error('Response too large')); }
        respBody += chunk;
      });
      res.on('end', () => {
        if (aborted) return;
        if (res.statusCode === 401) {
          const err = new Error('Pi-hole auth expired');
          err.statusCode = 401;
          return reject(err);
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const err = new Error(`Pi-hole returned ${res.statusCode}`);
          err.statusCode = res.statusCode;
          return reject(err);
        }
        try {
          resolve(JSON.parse(respBody));
        } catch {
          reject(new Error('Invalid JSON from Pi-hole'));
        }
      });
    });

    req.on('error', (e) => { console.error('[Pi-hole] POST error:', e.message); reject(new Error('Pi-hole service unavailable')); });
    req.on('timeout', () => { req.destroy(); reject(new Error('Pi-hole request timeout')); });
    req.write(postData);
    req.end();
  });
}

let _lastBlockingToggle = 0;

async function piholeApiPost(apiPath, body, retried) {
  await getPiholeSid();
  const sidUsed = piholeSession.sid;
  try {
    return await _doApiPostRequest(apiPath, body);
  } catch (e) {
    if (e && e.statusCode === 401 && !retried) {
      if (piholeSession.sid === sidUsed) {
        piholeSession.sid = null;
        piholeSession.expiresAt = 0;
        _piholeAuthPromise = null;
      }
      await getPiholeSid();
      return _doApiPostRequest(apiPath, body);
    }
    throw e;
  }
}

// Pi-hole proxy endpoints
app.get('/api/pihole/status', authRequired, async (req, res) => {
  const config = readPiholeConfig();
  if (!config) return res.json({ configured: false, reachable: false });
  try {
    await getPiholeSid();
    res.json({ configured: true, reachable: true });
  } catch {
    res.json({ configured: true, reachable: false });
  }
});

app.get('/api/pihole/summary', authRequired, async (req, res) => {
  try {
    const data = await piholeApiRequest('/api/stats/summary');
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] summary:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.get('/api/pihole/query-types', authRequired, async (req, res) => {
  try {
    const data = await piholeApiRequest('/api/stats/query_types');
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] query-types:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.get('/api/pihole/top-domains', authRequired, async (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 25);
  try {
    const data = await piholeApiRequest(`/api/stats/top_domains?blocked=false&count=${count}`);
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] top-domains:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.get('/api/pihole/top-blocked', authRequired, async (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 25);
  try {
    const data = await piholeApiRequest(`/api/stats/top_domains?blocked=true&count=${count}`);
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] top-blocked:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.get('/api/pihole/top-clients', authRequired, async (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 25);
  try {
    const data = await piholeApiRequest(`/api/stats/top_clients?count=${count}`);
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] top-clients:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.get('/api/pihole/history', authRequired, async (req, res) => {
  try {
    const data = await piholeApiRequest('/api/history');
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] history:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.get('/api/pihole/upstreams', authRequired, async (req, res) => {
  try {
    const data = await piholeApiRequest('/api/stats/upstreams');
    res.json(data);
  } catch (e) {
    console.error('[Pi-hole] upstreams:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

function normalizeBlocking(raw) {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    if (raw === 'enabled') return true;
    if (raw === 'disabled') return false;
  }
  return null;
}

app.get('/api/pihole/blocking', authRequired, async (req, res) => {
  try {
    const data = await piholeApiRequest('/api/dns/blocking');
    res.json({ blocking: normalizeBlocking(data.blocking) });
  } catch (e) {
    console.error('[Pi-hole] blocking GET:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

app.post('/api/pihole/blocking', authRequired, async (req, res) => {
  const { blocking } = req.body || {};
  if (typeof blocking !== 'boolean') {
    return res.status(400).json({ error: 'blocking must be a boolean' });
  }
  const now = Date.now();
  if (now - _lastBlockingToggle < 5000) {
    return res.status(429).json({ error: 'Too many requests. Please wait.' });
  }
  _lastBlockingToggle = now;
  try {
    const data = await piholeApiPost('/api/dns/blocking', { blocking });
    res.json({ blocking: normalizeBlocking(data.blocking) });
  } catch (e) {
    console.error('[Pi-hole] blocking POST:', e.message || e);
    res.status(502).json({ error: 'Pi-hole service unavailable' });
  }
});

// ── Uptime API ──

app.get('/api/uptime', authRequired, (req, res) => {
  res.json(buildUptimeResponse());
});

// Reset all uptime data
app.post('/api/uptime/reset', authRequired, async (req, res) => {
  saveUptimeData({ devices: {}, outages: [] });
  flushUptimeToDisk();
  await runUptimePingCycle().catch(() => {});
  broadcastToAll('uptime', buildUptimeResponse());
  res.json({ ok: true });
});

// Reset single device uptime data
app.post('/api/uptime/reset/:deviceId', authRequired, async (req, res) => {
  const id = req.params.deviceId;
  if (!isValidDeviceId(id)) return res.status(400).json({ error: 'Invalid device ID' });
  const data = readUptimeData();
  if (data.devices[id]) {
    delete data.devices[id];
    data.outages = data.outages.filter(o => o.device !== id && o.deviceId !== id);
    saveUptimeData(data);
    flushUptimeToDisk();
  }
  await runUptimePingCycle().catch(() => {});
  broadcastToAll('uptime', buildUptimeResponse());
  res.json({ ok: true });
});

// Reset all outages (keep device uptime data)
app.post('/api/outages/reset', authRequired, (req, res) => {
  const data = readUptimeData();
  data.outages = [];
  saveUptimeData(data);
  flushUptimeToDisk();
  broadcastToAll('uptime', buildUptimeResponse());
  res.json({ ok: true });
});

// ── Ping Monitor API ──

app.get('/api/ping-monitor', authRequired, (req, res) => {
  res.json(buildPingMonitorResponse());
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
    // Validate Origin header to prevent cross-site WebSocket hijacking
    const wsOrigin = req.headers.origin;
    if (!wsOrigin) {
      // Reject connections without Origin header to prevent cross-site WebSocket hijacking
      socket.close(4003, 'Missing origin');
      return;
    }
    const allowedOrigins = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];
    const wsHost = req.headers.host;
    if (wsHost) {
      allowedOrigins.push(`http://${wsHost}`, `https://${wsHost}`);
    }
    if (!allowedOrigins.includes(wsOrigin)) {
      socket.close(4003, 'Invalid origin');
      return;
    }

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

  // Memory cleanup: Remove old entries every 15 minutes
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
    for (const [ip, data] of pcPasswordLimits.entries()) {
      if (data.windowStart < oneHourAgo) {
        pcPasswordLimits.delete(ip);
      }
    }

    // Cleanup notification cooldowns (older than 1 hour)
    for (const [key, ts] of _notificationCooldowns.entries()) {
      if (ts < oneHourAgo) {
        _notificationCooldowns.delete(key);
      }
    }
  }, 900000); // Every 15 minutes

  // Flush monitoring caches to disk every 5 minutes (instead of every cycle)
  setInterval(() => {
    flushUptimeToDisk();
    flushPingMonToDisk();
  }, 5 * 60 * 1000);

  // Zeitplan-Scheduler initialisieren und alle 60s auf Config-Änderungen prüfen
  initScheduler();
  setInterval(() => {
    initScheduler();
  }, 60000);

  // Encrypt inline stats credentials on startup (if plaintext)
  try {
    const cfgPath = path.join(__dirname, 'public', 'config.js');
    if (fs.existsSync(cfgPath)) {
      let cfgSrc = fs.readFileSync(cfgPath, 'utf-8');
      let changed = false;
      const cfg = readSiteConfig();
      const devices = cfg?.uptimeDevices;
      if (Array.isArray(devices)) {
        for (const d of devices) {
          if (d?.stats?.credentials?.sshPassword && !d.stats.credentials.sshPassword.startsWith('enc:')) {
            const plain = d.stats.credentials.sshPassword;
            const encrypted = encryptValue(plain);
            // Context-aware replacement: match sshPassword property assignment
            const escaped = plain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(sshPassword\\s*:\\s*['"])${escaped}(['"])`, 'g');
            cfgSrc = cfgSrc.replace(regex, `$1${encrypted}$2`);
            changed = true;
          }
        }
      }
      if (changed) {
        fs.writeFileSync(cfgPath, cfgSrc, 'utf-8');
        _siteConfigCache = null; // Invalidate config cache
        console.log('[Stats] Inline credentials encrypted in config.js');
      }
    }
  } catch (err) {
    console.error('[Stats] Failed to encrypt inline credentials:', err.message);
  }

  // Uptime monitoring: first ping after 5s, then recursive setTimeout (re-reads interval each cycle)
  if (isUptimeEnabled()) {
    console.log(`Uptime monitoring interval: ${readUptimeIntervalMs() / 1000}s`);
    async function scheduleUptime() {
      try { await runUptimePingCycle(); broadcastToAll('uptime', buildUptimeResponse()); } catch (err) { console.error('[Uptime] Cycle error:', err.message); }
      setTimeout(scheduleUptime, readUptimeIntervalMs());
    }
    setTimeout(scheduleUptime, 5000);
  } else {
    console.log('Uptime monitoring disabled in config');
  }

  // Device stats collection: separate cycle, first after 8s, then recursive setTimeout
  const hasStatsDevices = readUptimeDevicesFromConfig().some(d => d.stats);
  if (isUptimeEnabled() && hasStatsDevices) {
    console.log(`Device stats interval: ${readStatsIntervalMs() / 1000}s`);
    async function scheduleStats() {
      try { await runDeviceStatsCycle(); broadcastToAll('uptime', buildUptimeResponse()); } catch (err) { console.error('[Stats] Cycle error:', err.message); }
      setTimeout(scheduleStats, readStatsIntervalMs());
    }
    setTimeout(scheduleStats, 8000);
  }

  // Ping Monitor: first cycle after 7s, then recursive setTimeout (re-reads interval each cycle)
  if (isPingMonitorEnabled()) {
    console.log(`Ping monitor interval: ${readPingMonitorIntervalMs() / 1000}s`);
    async function schedulePingMonitor() {
      try { await runPingMonitorCycle(); broadcastToAll('pingMonitor', buildPingMonitorResponse()); } catch (err) { console.error('[Ping Monitor] Cycle error:', err.message); }
      setTimeout(schedulePingMonitor, readPingMonitorIntervalMs());
    }
    setTimeout(schedulePingMonitor, 7000);
  } else {
    console.log('Ping monitor disabled in config');
  }
}

// Flush caches to disk on shutdown so no data is lost
function flushAllCaches() {
  flushUptimeToDisk();
  flushPingMonToDisk();
}
process.on('SIGINT', () => { flushAllCaches(); process.exit(0); });
process.on('SIGTERM', () => { flushAllCaches(); process.exit(0); });
process.on('exit', flushAllCaches);

// Server starten
ensureDataFile();
migrateWindowsPCToControlDevices();
startServer();
