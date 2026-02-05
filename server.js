const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const WebSocket = require('ws');
const dgram = require('dgram');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5055;
const DATA_DIR = path.join(__dirname, 'Data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const USER_FILE = path.join(DATA_DIR, 'Nutzer');
const LOGIN_TOKEN_FILE = path.join(DATA_DIR, 'LoginToken.txt');
const WINDOWS_PC_FILE = path.join(DATA_DIR, 'WindowsPC.json');
const MAX_VERSIONS = 100;

// Rate-Limiting Konstanten
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 Minuten

// Runtime data not persisted
const runtime = {
  activeSession: null,
  loginAttempts: new Map(), // IP -> { count, lockedUntil, lockoutLevel }
  sockets: new Map(), // token -> WebSocket
};

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown';
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
app.use('/api/speedtest/upload', express.raw({ type: '*/*', limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
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
    const initial = { ...defaultState, versions: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    writeCredentialsFile(initial.credentials);
  } else {
    const existing = readState();
    const fileCredentials = readCredentialsFile();
    if (fileCredentials) {
      existing.credentials = { ...existing.credentials, ...fileCredentials };
    }
    saveState(existing);
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

function writeCredentialsFile(credentials) {
  if (!credentials) return;
  const content = `${credentials.username ?? ''}\n${credentials.password ?? ''}\n`;
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
    '# 123456789|MacBook von Manu',
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
  };
}

function usePiSpeedtest() {
  return process.env.PI_SPEEDTEST_ENABLED === '1';
}

function getPiSpeedtestTarget(state) {
  const host = process.env.PI_SPEEDTEST_HOST || state.raspberryInfo?.ipAddress || '192.168.2.124';
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
  if (!runtime.activeSession || runtime.activeSession.token !== token) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
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

// Rate limiting for PC control actions
const pcControlLimits = new Map(); // IP -> { lastAction: timestamp, count: number }
const PC_RATE_LIMIT_WINDOW = 60000; // 1 minute
const PC_RATE_LIMIT_MAX = 10; // Max 10 actions per minute

function checkPCRateLimit(ip) {
  const now = Date.now();
  const data = pcControlLimits.get(ip);

  if (!data || now - data.lastAction > PC_RATE_LIMIT_WINDOW) {
    pcControlLimits.set(ip, { lastAction: now, count: 1 });
    return true;
  }

  if (data.count >= PC_RATE_LIMIT_MAX) {
    return false;
  }

  data.count++;
  data.lastAction = now;
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
  return JSON.parse(fs.readFileSync(WINDOWS_PC_FILE, 'utf-8'));
}

function saveWindowsPCConfig(config) {
  fs.writeFileSync(WINDOWS_PC_FILE, JSON.stringify(config, null, 2));
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

function shutdownWindowsPC(config) {
  return new Promise((resolve, reject) => {
    const { ipAddress, sshUser, sshPassword, sshPort } = config;

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
    // sshpass reads password from environment variable (safer than command line)
    const sshArgs = [
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=5',
      '-o', 'BatchMode=no',
      '-p', String(sshPort),
      `${sshUser}@${ipAddress}`,
      'shutdown /s /t 0'
    ];

    const sshpass = spawn('sshpass', ['-p', sshPassword, 'ssh', ...sshArgs], {
      timeout: 15000,
      env: { ...process.env },
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

  const isWhitelisted = deviceToken && (state.deviceTokens.includes(deviceToken) || fileTokenList.includes(deviceToken));

  if (!isWhitelisted && (username !== state.credentials.username || password !== state.credentials.password)) {
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
  const matchedFileToken = fileTokenEntries.find((t) => t.token === deviceToken);
  const effectiveDeviceName = matchedFileToken?.name || deviceName || 'Unbekanntes Gerät';
  const previousSession = runtime.activeSession;
  runtime.activeSession = { token, deviceName: effectiveDeviceName, loginAt };

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

app.post('/api/theme', authRequired, (req, res) => {
  const { theme } = req.body || {};
  if (!['dark', 'light'].includes(theme)) {
    return res.status(400).json({ error: 'Ungültiges Theme' });
  }
  const state = readState();
  state.theme = theme;
  saveState(state);
  res.json({ ok: true, theme, versions: state.versions });
});

app.post('/api/ports/color', authRequired, (req, res) => {
  const { group, id, color } = req.body || {};
  if (!group || !id || !color) {
    return res.status(400).json({ error: 'Fehlende Werte' });
  }

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

app.post('/api/ports/update', authRequired, (req, res) => {
  const { group, id, label, status } = req.body || {};
  if (!group || !id) {
    return res.status(400).json({ error: 'Fehlende Werte' });
  }
  if (!['switch', 'router'].includes(group)) {
    return res.status(400).json({ error: 'Ungültige Gruppe' });
  }

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
    saveState(state);
  } else {
    saveState(state);
  }
  res.json({ ok: true, switchPorts: state.switchPorts, routerPorts: state.routerPorts, versions: state.versions });
});

app.post('/api/settings/credentials', authRequired, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich' });
  }
  const state = readState();
  state.credentials.username = username;
  state.credentials.password = password;
  saveState(state);
  writeCredentialsFile(state.credentials);
  res.json({ ok: true, username });
});

app.post('/api/speedport', authRequired, (req, res) => {
  const { wifiName, wifiPassword, serialNumber, configuration, remoteUrl, devicePassword, modemId } = req.body || {};
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

app.post('/api/raspberry', authRequired, (req, res) => {
  const { model, hostname, ipAddress, vpnIp, macAddress, sshUser, piholeUrl, piholeRemoteUrl } = req.body || {};
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

app.get('/api/versions', authRequired, (req, res) => {
  const state = readState();
  res.json({ versions: state.versions });
});

app.get('/api/speedtest/download', authRequired, (req, res) => {
  const sizeMB = parseInt(req.query.size) || 1;
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
  const sizeMB = parseInt(req.query.size, 10) || 1;

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

app.post('/api/speedtest/save', authRequired, (req, res) => {
  const { download, upload, ping, type, timestamp } = req.body || {};
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

app.get('/api/speedtest/history', authRequired, (req, res) => {
  const state = readState();
  res.json({ history: state.speedTestHistory || [] });
});

app.get('/api/export', authRequired, (req, res) => {
  const state = readState();
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.5.0',
    data: state,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="netzwerk-manager-backup.json"');
  res.json(exportData);
});

app.post('/api/import', authRequired, (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Ungueltige Daten' });
  }

  // Validiere wichtige Felder
  if (!data.switchPorts && !data.routerPorts && !data.credentials) {
    return res.status(400).json({ error: 'Keine gueltigen Netzwerk-Manager Daten' });
  }

  // Merge mit Default-State um fehlende Felder zu ergaenzen
  const currentState = readState();
  const newState = {
    ...defaultState,
    ...data,
    credentials: { ...defaultState.credentials, ...(data.credentials || {}) },
    speedportInfo: { ...defaultState.speedportInfo, ...(data.speedportInfo || {}) },
    raspberryInfo: { ...defaultState.raspberryInfo, ...(data.raspberryInfo || {}) },
    switchPorts: data.switchPorts || currentState.switchPorts,
    routerPorts: data.routerPorts || currentState.routerPorts,
    versions: Array.isArray(data.versions) ? data.versions : [],
    speedportVersions: Array.isArray(data.speedportVersions) ? data.speedportVersions : [],
    raspberryVersions: Array.isArray(data.raspberryVersions) ? data.raspberryVersions : [],
    deviceTokens: Array.isArray(data.deviceTokens) ? data.deviceTokens : [],
    speedTestHistory: Array.isArray(data.speedTestHistory) ? data.speedTestHistory : [],
  };

  saveState(newState);
  writeCredentialsFile(newState.credentials);

  res.json({ ok: true, message: 'Daten erfolgreich importiert' });
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

// GET status - with rate limiting
app.get('/api/windows-pc/status', authRequired, async (req, res) => {
  const clientIp = getClientIp(req);

  if (!checkPCRateLimit(clientIp)) {
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

  if (!checkPCRateLimit(clientIp)) {
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

  if (!checkPCRateLimit(clientIp)) {
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

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
  });

  const wss = new WebSocket.Server({ server });

  wss.on('connection', (socket, req) => {
    const params = new URLSearchParams(req.url.replace('/?', ''));
    const token = params.get('token');

    socket.isAlive = true;

    if (token) {
      runtime.sockets.set(token, socket);
    }

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('close', () => {
      if (token) {
        runtime.sockets.delete(token);
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
}

// Server starten
ensureDataFile();
startServer();
