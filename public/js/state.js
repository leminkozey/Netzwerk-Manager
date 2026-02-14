// ═══════════════════════════════════════════════════════════════════
// Global State Management
// ═══════════════════════════════════════════════════════════════════

export const state = {
  token: null,
  theme: 'dark',
  glowStrength: 1,
  accent: '#00d4ff',
  buttonStyle: 'default',
  username: '',

  // Port data
  switchPorts: [],
  routerPorts: [],
  versions: [],

  // Device configs
  speedportInfo: {},
  raspberryInfo: {},
  speedportVersions: [],
  raspberryVersions: [],

  // Info Cards (generic configurable cards)
  infoCards: {},

  // Live data (latest from server)
  live: {
    switchPorts: [],
    routerPorts: [],
    speedportInfo: {},
    raspberryInfo: {},
  },

  // View tracking
  viewFromLive: true,
  raspberryViewFromLive: true,
  speedportViewFromLive: true,
  activeVersionId: null,
  followLatest: true,
  raspberryActiveVersionId: null,
  raspberryFollowLatest: true,
  speedportActiveVersionId: null,
  speedportFollowLatest: true,

  // Session
  socket: null,
  sessionTimeoutEnabled: true,
  sessionTimeoutMinutes: 5,
  sessionTimer: null,
  redirectToSettings: false,
};

const STORAGE_KEYS = {
  deviceToken: 'deviceToken',
  theme: 'theme',
  buttonStyle: 'buttonStyle',
  glowStrength: 'glowStrength',
  accent: 'accent',
  sessionTimeoutEnabled: 'sessionTimeoutEnabled',
  sessionTimeoutMinutes: 'sessionTimeoutMinutes',
  lang: 'lang',
};

export { STORAGE_KEYS };

// ── Listeners ──
const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}

export function emit(event, data) {
  listeners.get(event)?.forEach(fn => fn(data));
}

// ── Helpers ──
export function clonePorts(list = []) {
  return list.map(p => ({ ...p }));
}

export function setLiveState(payload = {}) {
  if (payload.switchPorts) state.live.switchPorts = clonePorts(payload.switchPorts);
  if (payload.routerPorts) state.live.routerPorts = clonePorts(payload.routerPorts);
  if (payload.speedportInfo) state.live.speedportInfo = { ...payload.speedportInfo };
  if (payload.raspberryInfo) state.live.raspberryInfo = { ...payload.raspberryInfo };
}

export function syncViewToLive() {
  state.switchPorts = clonePorts(state.live.switchPorts);
  state.routerPorts = clonePorts(state.live.routerPorts);
  state.viewFromLive = true;
}

export function applyPayload(payload) {
  if (!payload) return;

  if (payload.switchPorts) {
    state.switchPorts = clonePorts(payload.switchPorts);
    setLiveState({ switchPorts: payload.switchPorts });
  }
  if (payload.routerPorts) {
    state.routerPorts = clonePorts(payload.routerPorts);
    setLiveState({ routerPorts: payload.routerPorts });
  }
  if (payload.versions) state.versions = payload.versions;
  if (payload.speedportInfo) {
    // Merge instead of replace to preserve any pending local edits
    state.speedportInfo = { ...state.speedportInfo, ...payload.speedportInfo };
    setLiveState({ speedportInfo: payload.speedportInfo });
  }
  if (payload.raspberryInfo) {
    // Merge instead of replace to preserve any pending local edits
    state.raspberryInfo = { ...state.raspberryInfo, ...payload.raspberryInfo };
    setLiveState({ raspberryInfo: payload.raspberryInfo });
  }
  if (payload.speedportVersions) state.speedportVersions = payload.speedportVersions;
  if (payload.raspberryVersions) state.raspberryVersions = payload.raspberryVersions;
  if (payload.username) state.username = payload.username;
  if (payload.defaultPassword !== undefined) state.defaultPassword = payload.defaultPassword;

  emit('stateUpdated', payload);
}

// ── Config Defaults ──
const cfg = typeof siteConfig !== 'undefined' && siteConfig != null ? siteConfig : null;
const cfgDefaults = cfg?.defaults || null;

function validateTheme(t) {
  return ['dark', 'light', 'system'].includes(t) ? t : 'dark';
}

function validateGlow(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 1 : Math.min(2, Math.max(0, n));
}

function validateTimeout(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 1 ? 5 : Math.min(60, n);
}

export const defaults = {
  theme: validateTheme(cfgDefaults?.theme),
  buttonStyle: cfgDefaults?.buttonStyle === 'simple' ? 'simple' : 'default',
  glowStrength: cfgDefaults?.glow?.enabled !== false ? validateGlow(cfgDefaults?.glow?.strength ?? 1) : 0,
  accent: /^#[0-9A-Fa-f]{6}$/.test(cfgDefaults?.accentColor) ? cfgDefaults.accentColor : '#00d4ff',
  language: cfgDefaults?.language === 'en' ? 'en' : 'de',
  sessionTimeoutEnabled: cfgDefaults?.sessionTimeout?.enabled !== false,
  sessionTimeoutMinutes: validateTimeout(cfgDefaults?.sessionTimeout?.minutes ?? 5),
};

export function getConfig() {
  return cfg;
}
