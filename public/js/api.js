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

// ── Info Cards (generic/configurable) ──

export async function getInfoCard(cardId) {
  const res = await request(`/api/info-card/${encodeURIComponent(cardId)}`);
  if (!res.ok) throw new Error('Failed to get info card');
  return res.json();
}

export async function saveInfoCard(cardId, data) {
  const res = await request(`/api/info-card/${encodeURIComponent(cardId)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Credentials ──

export async function saveCredentials({ currentPassword, username, password }) {
  const res = await request('/api/settings/credentials', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, username, password }),
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
  const res = await request('/api/speedtest/local-upload-proxy', {
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

// ── Control Devices ──

export async function getControlDevice(deviceId) {
  const res = await request(`/api/control/${encodeURIComponent(deviceId)}`);
  if (!res.ok) throw new Error('Failed to get device config');
  return res.json();
}

export async function getControlDevicePassword(deviceId) {
  const res = await request(`/api/control/${encodeURIComponent(deviceId)}/password`);
  if (!res.ok) throw new Error('Failed to get password');
  return res.json();
}

export async function saveControlDevice(deviceId, config) {
  const res = await request(`/api/control/${encodeURIComponent(deviceId)}`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function getControlDeviceStatus(deviceId) {
  const res = await request(`/api/control/${encodeURIComponent(deviceId)}/status`);
  if (!res.ok) return { online: false };
  return res.json();
}

export async function controlDeviceAction(deviceId, action) {
  const res = await request(`/api/control/${encodeURIComponent(deviceId)}/${encodeURIComponent(action)}`, {
    method: 'POST',
  });
  return res.json();
}

// ── Pi-hole ──

export async function getPiholeStatus() {
  const res = await request('/api/pihole/status');
  if (!res.ok) throw new Error('Failed to get Pi-hole status');
  return res.json();
}

export async function getPiholeSummary() {
  const res = await request('/api/pihole/summary');
  if (!res.ok) throw new Error('Failed to get Pi-hole summary');
  return res.json();
}

export async function getPiholeQueryTypes() {
  const res = await request('/api/pihole/query-types');
  if (!res.ok) throw new Error('Failed to get Pi-hole query types');
  return res.json();
}

export async function getPiholeTopDomains(count = 10) {
  const res = await request(`/api/pihole/top-domains?count=${count}`);
  if (!res.ok) throw new Error('Failed to get Pi-hole top domains');
  return res.json();
}

export async function getPiholeTopBlocked(count = 10) {
  const res = await request(`/api/pihole/top-blocked?count=${count}`);
  if (!res.ok) throw new Error('Failed to get Pi-hole top blocked');
  return res.json();
}

export async function getPiholeTopClients(count = 10) {
  const res = await request(`/api/pihole/top-clients?count=${count}`);
  if (!res.ok) throw new Error('Failed to get Pi-hole top clients');
  return res.json();
}

export async function getPiholeHistory() {
  const res = await request('/api/pihole/history');
  if (!res.ok) throw new Error('Failed to get Pi-hole history');
  return res.json();
}

export async function getPiholeUpstreams() {
  const res = await request('/api/pihole/upstreams');
  if (!res.ok) throw new Error('Failed to get Pi-hole upstreams');
  return res.json();
}

export async function getPiholeBlocking() {
  const res = await request('/api/pihole/blocking');
  if (!res.ok) throw new Error('Failed to get Pi-hole blocking status');
  return res.json();
}

export async function setPiholeBlocking(enabled) {
  const res = await request('/api/pihole/blocking', {
    method: 'POST',
    body: JSON.stringify({ blocking: enabled }),
  });
  if (!res.ok) throw new Error('Failed to set Pi-hole blocking');
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

export async function resetAllOutages() {
  const res = await request('/api/outages/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset outages');
  return res.json();
}

// ── Ping Monitor ──

export async function getPingMonitor() {
  const res = await request('/api/ping-monitor');
  if (!res.ok) throw new Error('Failed to get ping monitor');
  return res.json();
}

// ── Zeitpläne ──

export async function getSchedules() {
  const res = await request('/api/schedules');
  if (!res.ok) throw new Error('Failed to get schedules');
  return res.json();
}

export async function checkUpdate() {
  const res = await request('/api/update/check');
  if (!res.ok) throw new Error('Failed to check update');
  return res.json();
}

export async function runUpdate() {
  const res = await request('/api/update/run', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run update');
  return res.json();
}

// ── Services ──

export async function getServiceStatus(serviceId) {
  const res = await request(`/api/services/${encodeURIComponent(serviceId)}/status`);
  if (!res.ok) return { status: 'unknown' };
  return res.json();
}

export async function serviceAction(serviceId, action) {
  const res = await request(`/api/services/${encodeURIComponent(serviceId)}/${encodeURIComponent(action)}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, message: data.message || 'Service action failed' };
  }
  return res.json();
}

// ── Logout ──

export async function logout() {
  const res = await request('/api/logout', { method: 'POST' });
  return res.json();
}

