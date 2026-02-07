// ═══════════════════════════════════════════════════════════════════
// API Client – All backend communication
// ═══════════════════════════════════════════════════════════════════

import { state } from './state.js';

function authHeaders() {
  return state.token
    ? { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function authHeadersRaw() {
  return state.token
    ? { Authorization: `Bearer ${state.token}` }
    : {};
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (res.status === 401) {
    // Session expired
    state.token = null;
    window.dispatchEvent(new CustomEvent('session-expired'));
    throw new Error('Unauthenticated');
  }
  return res;
}

// ── Auth ──

export async function bootstrap() {
  const res = await fetch('/api/bootstrap');
  if (!res.ok) return null;
  return res.json();
}

export async function login({ username, password, deviceName, deviceToken }) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, deviceName, deviceToken }),
  });
  return res.json();
}

// ── State ──

export async function getState() {
  const res = await request('/api/state');
  if (!res.ok) throw new Error('Failed to get state');
  return res.json();
}

export async function getVersions() {
  const res = await request('/api/versions');
  if (!res.ok) throw new Error('Failed to get versions');
  return res.json();
}

// ── Ports ──

export async function updatePort({ group, id, status }) {
  const res = await request('/api/ports/update', {
    method: 'POST',
    body: JSON.stringify({ group, id, status }),
  });
  return res.json();
}

export async function updatePortColor({ group, id, color }) {
  const res = await request('/api/ports/color', {
    method: 'POST',
    body: JSON.stringify({ group, id, color }),
  });
  return res.json();
}

// ── Speedport ──

export async function saveSpeedport(info) {
  const res = await request('/api/speedport', {
    method: 'POST',
    body: JSON.stringify(info),
  });
  return res.json();
}

// ── Raspberry / PiHole ──

export async function saveRaspberry(info) {
  const res = await request('/api/raspberry', {
    method: 'POST',
    body: JSON.stringify(info),
  });
  return res.json();
}

// ── Credentials ──

export async function saveCredentials({ username, password }) {
  const res = await request('/api/settings/credentials', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

// ── Export / Import ──

export async function exportData() {
  const res = await request('/api/export');
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function importData(data) {
  const res = await request('/api/import', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return res.json();
}

// ── Speedtest ──

export async function speedtestPing() {
  const res = await request('/api/speedtest/local-ping', { method: 'GET' });
  return res;
}

export async function speedtestDownload(sizeMB) {
  const res = await request(`/api/speedtest/local-download-proxy?size=${sizeMB}`, {
    headers: authHeadersRaw(),
  });
  return res;
}

export async function speedtestUpload(data) {
  const res = await fetch('/api/speedtest/local-upload-proxy', {
    method: 'POST',
    headers: { ...authHeadersRaw(), 'Content-Type': 'application/octet-stream' },
    body: data,
  });
  return res;
}

export async function saveSpeedtest(results) {
  const res = await request('/api/speedtest/save', {
    method: 'POST',
    body: JSON.stringify(results),
  });
  return res.json();
}

export async function getSpeedtestHistory() {
  const res = await request('/api/speedtest/history');
  if (!res.ok) throw new Error('Failed to get history');
  return res.json();
}

// ── Windows PC ──

export async function getWindowsPC() {
  const res = await request('/api/windows-pc');
  if (!res.ok) throw new Error('Failed to get PC config');
  return res.json();
}

export async function getWindowsPCPassword() {
  const res = await request('/api/windows-pc/password');
  if (!res.ok) throw new Error('Failed to get password');
  return res.json();
}

export async function saveWindowsPC(config) {
  const res = await request('/api/windows-pc', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function getWindowsPCStatus() {
  const res = await request('/api/windows-pc/status');
  if (!res.ok) return { online: false };
  return res.json();
}

export async function wakeWindowsPC() {
  const res = await request('/api/windows-pc/wake', { method: 'POST' });
  return res.json();
}

export async function shutdownWindowsPC() {
  const res = await request('/api/windows-pc/shutdown', { method: 'POST' });
  return res.json();
}

// ── Uptime ──

export async function getUptime() {
  const res = await request('/api/uptime');
  if (!res.ok) throw new Error('Failed to get uptime');
  return res.json();
}

export async function resetAllUptime() {
  const res = await request('/api/uptime/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset uptime');
  return res.json();
}

export async function resetDeviceUptime(deviceId) {
  const res = await request(`/api/uptime/reset/${encodeURIComponent(deviceId)}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset device uptime');
  return res.json();
}

