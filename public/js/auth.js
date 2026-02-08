// ═══════════════════════════════════════════════════════════════════
// Authentication & Session Management
// ═══════════════════════════════════════════════════════════════════

import { state, STORAGE_KEYS, applyPayload, emit } from './state.js';
import { t } from './i18n.js';
import * as api from './api.js';
import { showToast } from './ui.js';
import { navigate } from './router.js';
import { connectSocket, closeSocket } from './ws.js';

// ── Device Name ──
export function deriveDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Android/.test(ua)) return 'Android';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Browser';
}

// ── Device Token ──
export function getStoredDeviceToken() {
  return localStorage.getItem(STORAGE_KEYS.deviceToken) || '';
}

export function setStoredDeviceToken(token) {
  if (token) localStorage.setItem(STORAGE_KEYS.deviceToken, token);
}

// ── Login ──
export async function handleLogin(username, password, tokenInput) {
  if (tokenInput) setStoredDeviceToken(tokenInput);
  const deviceToken = tokenInput || getStoredDeviceToken();

  if (!deviceToken && (!username || !password)) {
    return { success: false, message: t('msg.fillLogin') };
  }

  try {
    const body = await api.login({
      username,
      password,
      deviceName: deriveDeviceName(),
      deviceToken,
    });

    if (!body.success) {
      return body;
    }

    state.token = body.token;
    if (body.deviceToken) setStoredDeviceToken(body.deviceToken);
    applyPayload(body.state);
    connectSocket();
    startSessionTimer();
    emit('loggedIn');

    // #20 Warn if default credentials are still active
    if (state.defaultPassword) {
      setTimeout(() => showToast(t('msg.defaultPassword'), true), 500);
    }

    return { success: true };
  } catch {
    return { success: false, message: t('msg.serverUnreachable') };
  }
}

// ── Auto Login with Device Token ──
export async function tryAutoLogin() {
  const deviceToken = getStoredDeviceToken();
  if (!deviceToken) return false;

  try {
    const body = await api.login({
      deviceToken,
      deviceName: deriveDeviceName(),
    });

    if (!body.success) return false;

    state.token = body.token;
    if (body.deviceToken) setStoredDeviceToken(body.deviceToken);
    applyPayload(body.state);
    connectSocket();
    startSessionTimer();
    emit('loggedIn');

    // #20 Warn if default credentials are still active
    if (state.defaultPassword) {
      setTimeout(() => showToast(t('msg.defaultPassword'), true), 500);
    }

    return true;
  } catch {
    return false;
  }
}

// ── Logout ──
export function handleLogout() {
  state.token = null;
  closeSocket();
  stopSessionTimer();
  emit('loggedOut');
  navigate('/login');
}

// ── Force Logout ──
export function handleForceLogout(deviceName, timeMs) {
  state.token = null;
  closeSocket();
  stopSessionTimer();
  emit('forceLogout', { deviceName, timeMs });
}

// ── Session Timeout ──
const debouncedReset = (() => {
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(doResetSessionTimer, 1000);
  };
})();

export function startSessionTimer() {
  stopSessionTimer();
  if (!state.sessionTimeoutEnabled) return;
  state.sessionTimer = setTimeout(() => {
    showTimeoutPopup();
  }, state.sessionTimeoutMinutes * 60 * 1000);

  document.addEventListener('click', debouncedReset);
  document.addEventListener('keydown', debouncedReset);
}

function doResetSessionTimer() {
  if (!state.token || !state.sessionTimeoutEnabled) return;
  stopSessionTimer();
  startSessionTimer();
}

export function stopSessionTimer() {
  clearTimeout(state.sessionTimer);
  state.sessionTimer = null;
  document.removeEventListener('click', debouncedReset);
  document.removeEventListener('keydown', debouncedReset);
}

export function resetSessionTimer() {
  debouncedReset();
}

function showTimeoutPopup() {
  state.token = null;
  closeSocket();
  stopSessionTimer(); // already removes click/keydown listeners
  emit('sessionTimeout');
}

export function isLoggedIn() {
  return !!state.token;
}
