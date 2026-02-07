// ═══════════════════════════════════════════════════════════════════
// Netzwerk Manager v3.0.0 – Main Entry Point
// ═══════════════════════════════════════════════════════════════════

import { state, on } from './state.js';
import { initRouter, registerRoute, setContentElement, setBeforeNavigate, navigate, startRouter } from './router.js';
import { t, initI18n } from './i18n.js';
import { loadLocalSettings, el, applyTheme } from './ui.js';
import { isLoggedIn, handleLogin, tryAutoLogin } from './auth.js';
import { icon } from './icons.js';
import { initSettings } from './components/settings.js';
import { renderLanding } from './pages/landing.js';
import { renderInfo } from './pages/info.js';
import { renderStart } from './pages/start.js';
import { renderAnalysen } from './pages/analysen.js';

// ── Page cleanup tracking ──
let currentCleanup = null;

function wrapPage(renderFn) {
  return (container) => {
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    const result = renderFn(container);
    if (typeof result === 'function') {
      currentCleanup = result;
    }
  };
}

// ── Login Page ──
function renderLogin(container) {
  const card = el('section', { className: 'card login-card' }, [
    el('div', { className: 'section-title' }, [
      el('h3', { textContent: t('login.title'), 'data-i18n': 'login.title' }),
    ]),
    el('div', { className: 'login-grid' }, [
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('login.username'), 'data-i18n': 'login.username' }),
        el('input', { id: 'loginUser', type: 'text', autocomplete: 'username', placeholder: t('login.username') }),
      ]),
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('login.password'), 'data-i18n': 'login.password' }),
        el('input', { id: 'loginPass', type: 'password', autocomplete: 'current-password', placeholder: t('login.password') }),
      ]),
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('login.token'), 'data-i18n': 'login.token' }),
        el('input', { id: 'loginToken', type: 'text', autocomplete: 'off', placeholder: t('login.tokenPlaceholder') }),
      ]),
      el('div', { className: 'actions' }, [
        el('button', {
          className: 'btn',
          id: 'loginBtn',
          textContent: t('login.button'),
          'data-i18n': 'login.button',
          onClick: doLogin,
        }),
      ]),
      el('div', { className: 'status', id: 'loginStatus', style: { display: 'none' } }),
    ]),
  ]);

  // Hero
  const hero = el('div', { className: 'hero' }, [
    el('h1', { textContent: t('app.title'), 'data-i18n': 'app.title' }),
  ]);

  container.appendChild(hero);
  container.appendChild(card);

  // Enter key on password field
  setTimeout(() => {
    const passInput = document.getElementById('loginPass');
    passInput?.addEventListener('keyup', e => {
      if (e.key === 'Enter') doLogin();
    });
    document.getElementById('loginUser')?.focus();
  }, 50);
}

async function doLogin() {
  const username = document.getElementById('loginUser')?.value?.trim() || '';
  const password = document.getElementById('loginPass')?.value || '';
  const tokenInput = document.getElementById('loginToken')?.value?.trim() || '';
  const statusEl = document.getElementById('loginStatus');
  const btn = document.getElementById('loginBtn');

  if (btn) btn.disabled = true;

  const result = await handleLogin(username, password, tokenInput);

  if (btn) btn.disabled = false;

  if (!result.success) {
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.className = 'status alert';
      statusEl.textContent = result.message || t('msg.loginFailed');

      if (result.locked && result.remainingMs) {
        startLockoutCountdown(result.remainingMs, statusEl, btn);
      }
    }
    return;
  }

  // Success - navigate to dashboard
  onLoginSuccess();
}

function startLockoutCountdown(remainingMs, statusEl, btn) {
  if (btn) btn.disabled = true;
  const endTime = Date.now() + remainingMs;

  const interval = setInterval(() => {
    const left = endTime - Date.now();
    if (left <= 0) {
      clearInterval(interval);
      if (btn) btn.disabled = false;
      if (statusEl) {
        statusEl.textContent = t('msg.lockLifted');
        statusEl.className = 'status success';
      }
      return;
    }
    const mins = Math.ceil(left / 60000);
    if (statusEl) {
      statusEl.textContent = t('msg.locked').replace('{time}', String(mins));
    }
  }, 1000);
}

function onLoginSuccess() {
  showAppChrome();
  navigate('/');
}

let chromeRendered = false;

function hideAppChrome() {
  document.getElementById('settingsFloatBtn')?.remove();
  document.getElementById('settingsOverlay')?.remove();
  chromeRendered = false;
}

function showAppChrome() {
  if (chromeRendered) return;
  chromeRendered = true;

  initSettings();

  // Floating settings button (top-left)
  const btn = el('button', {
    className: 'settings-float-btn',
    id: 'settingsFloatBtn',
    'aria-label': t('app.settings'),
    innerHTML: icon('settings', 20),
    onClick: () => window.dispatchEvent(new CustomEvent('open-settings')),
  });
  document.body.appendChild(btn);
}

// ── Overlays ──
function showForceLogoutOverlay(deviceName, timeMs) {
  const time = timeMs ? new Date(timeMs).toLocaleTimeString() : '';
  const deviceText = deviceName || t('overlay.unknownDeviceName');
  const message = t('overlay.deviceLoggedAt').replace('{device}', deviceText).replace('{time}', time);

  const overlay = el('div', { className: 'overlay active', id: 'logoutOverlay' }, [
    el('div', { className: 'overlay-content' }, [
      el('h3', { textContent: t('overlay.sessionEnded') }),
      el('p', { textContent: message }),
      el('button', {
        className: 'btn',
        textContent: t('overlay.relogin'),
        onClick: () => {
          overlay.remove();
          navigate('/login');
        },
      }),
    ]),
  ]);
  document.body.appendChild(overlay);
}

function showTimeoutOverlay() {
  const overlay = el('div', { className: 'overlay active', id: 'timeoutOverlay' }, [
    el('div', { className: 'overlay-content' }, [
      el('h3', { textContent: t('overlay.sessionExpired') }),
      el('p', { className: 'timeout-hint', textContent: t('overlay.sessionHint') }),
      el('button', {
        className: 'btn',
        textContent: t('login.title'),
        onClick: () => {
          overlay.remove();
          navigate('/login');
        },
      }),
    ]),
  ]);
  document.body.appendChild(overlay);
}

// ── Init ──
async function init() {
  // Load UI settings (theme, glow, accent)
  loadLocalSettings();
  initI18n();
  initRouter();

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') applyTheme('system');
  });

  // Content area
  setContentElement(document.getElementById('appContent'));

  // Auth guard
  setBeforeNavigate((path) => {
    if (path !== '/login' && !isLoggedIn()) {
      navigate('/login');
      return false;
    }
    if (path === '/login' && isLoggedIn()) {
      navigate('/');
      return false;
    }
    return true;
  });

  // Register routes
  registerRoute('/login', renderLogin);
  registerRoute('/', wrapPage(renderLanding));
  registerRoute('/info', wrapPage(renderInfo));
  registerRoute('/start', wrapPage(renderStart));
  registerRoute('/analysen', wrapPage(renderAnalysen));

  // Event listeners
  on('loggedOut', hideAppChrome);
  on('forceLogout', ({ deviceName, timeMs }) => {
    hideAppChrome();
    showForceLogoutOverlay(deviceName, timeMs);
  });
  on('sessionTimeout', () => {
    hideAppChrome();
    showTimeoutOverlay();
  });

  window.addEventListener('session-expired', () => {
    showTimeoutOverlay();
  });

  // Config-based visibility
  applyConfigSettings();

  // Try auto-login
  const autoLoggedIn = await tryAutoLogin();

  if (autoLoggedIn) {
    showAppChrome();
    startRouter();
  } else {
    navigate('/login');
    startRouter();
  }
}

function applyConfigSettings() {
  const cfg = typeof siteConfig !== 'undefined' && siteConfig != null ? siteConfig : null;
  if (!cfg) return;

  // Animation config
  const anim = cfg.animations || {};
  if (!anim.enabled) document.body.setAttribute('data-animations', 'off');
  else {
    if (!anim.heroGradient) document.body.setAttribute('data-animation-hero', 'off');
    if (!anim.fadeIn) document.body.setAttribute('data-animation-fade', 'off');
    if (!anim.modalSlide) document.body.setAttribute('data-animation-modal', 'off');
    if (!anim.panelFade) document.body.setAttribute('data-animation-panel', 'off');
    if (!anim.themeSwitcher) document.body.setAttribute('data-animation-theme', 'off');
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
