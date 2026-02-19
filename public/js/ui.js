// ═══════════════════════════════════════════════════════════════════
// UI Utilities – Theme, Glow, Toast, Helpers
// ═══════════════════════════════════════════════════════════════════

import { state, defaults, STORAGE_KEYS } from './state.js';
import { t } from './i18n.js';

// ── Debounce ──
export function debounce(fn, wait) {
  let t;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}

// ── Color Helpers ──
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 212, b: 255 };
}

export function pickTextColor(hex) {
  if (!hex) return '#ffffff';
  const c = hex.replace('#', '');
  // Expand 3-char hex correctly: "F0A" → "FF00AA"
  const full = c.length === 3
    ? c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
    : c;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0f1526' : '#ffffff';
}

// ── Theme ──
export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme, save = false) {
  state.theme = theme;
  const effective = theme === 'system' ? getSystemTheme() : theme;
  document.body.setAttribute('data-theme', effective);
  if (save) localStorage.setItem(STORAGE_KEYS.theme, theme);
}

// ── Glow ──
export function applyGlowStrength(value) {
  const n = Number(value);
  const safe = Number.isNaN(n) ? defaults.glowStrength : Math.min(2, Math.max(0, n));
  state.glowStrength = safe;
  document.documentElement.style.setProperty('--glow-strength', String(safe));
  document.body.style.setProperty('--glow-strength', String(safe));
}

// ── Border Radius ──
export function applyBorderRadius(value) {
  const n = Number(value);
  const safe = Number.isNaN(n) ? defaults.borderRadius : Math.min(2, Math.max(0, n));
  state.borderRadius = safe;
  document.documentElement.style.setProperty('--radius-scale', String(safe));
  document.body.style.setProperty('--radius-scale', String(safe));
}

// ── Accent Color ──
function darkenHex(hex, amount = 0.15) {
  const rgb = hexToRgb(hex);
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function applyAccentColor(hex) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : defaults.accent;
  state.accent = safe;
  const rgb = hexToRgb(state.accent);
  const vars = {
    '--accent': state.accent,
    '--accent-strong': darkenHex(state.accent, 0.15),
    '--accent-rgb': `${rgb.r} ${rgb.g} ${rgb.b}`,
  };
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
    document.body.style.setProperty(key, value);
  }
}

// ── Button Style ──
export function applyButtonStyle(style, save = false) {
  state.buttonStyle = style;
  document.body.setAttribute('data-button-style', style);
  if (save) localStorage.setItem(STORAGE_KEYS.buttonStyle, style);
}

// ── Toast Notifications ──
let toastTimer = null;
export function showToast(text, isError = false) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  toastTimer = setTimeout(() => toast.classList.remove('toast-visible'), 3000);
}

// ── Element Creation Helpers ──
export function el(tag, attrs = {}, children = []) {
  const elem = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') elem.className = value;
    else if (key === 'textContent') elem.textContent = value;
    else if (key === 'style' && typeof value === 'object') {
      for (const [p, v] of Object.entries(value)) {
        if (p.startsWith('--')) elem.style.setProperty(p, v);
        else elem.style[p] = v;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      elem.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key.startsWith('on') && typeof value === 'string') {
      // Block string-valued on* attributes to prevent inline event handler injection
      continue;
    } else {
      elem.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      elem.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      elem.appendChild(child);
    }
  }
  return elem;
}

// ── Confirm Modal ──
export function showConfirm(title, message, onConfirm, onCancel) {
  const overlay = el('div', { className: 'overlay active confirm-overlay' }, [
    el('div', { className: 'overlay-content confirm-content' }, [
      el('h3', { textContent: title }),
      el('p', { textContent: message }),
      el('div', { className: 'confirm-buttons' }, [
        el('button', {
          className: 'btn secondary',
          textContent: t('ui.cancel'),
          onClick: () => {
            overlay.remove();
            onCancel?.();
          },
        }),
        el('button', {
          className: 'btn danger',
          textContent: t('ui.confirm'),
          onClick: () => {
            overlay.remove();
            onConfirm?.();
          },
        }),
      ]),
    ]),
  ]);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.remove();
      onCancel?.();
    }
  });
}

// ── Copy to Clipboard ──
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast(t('ui.copied'));
  } catch {
    showToast(t('ui.copyFailed'), true);
  }
}

// ── Load All Local Settings ──
export function loadLocalSettings() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || defaults.theme;
  const savedButtonStyle = localStorage.getItem(STORAGE_KEYS.buttonStyle) || defaults.buttonStyle;
  const savedGlow = localStorage.getItem(STORAGE_KEYS.glowStrength);
  const savedAccent = localStorage.getItem(STORAGE_KEYS.accent) || defaults.accent;
  const savedRadius = localStorage.getItem(STORAGE_KEYS.borderRadius);

  applyTheme(savedTheme);
  applyButtonStyle(savedButtonStyle);
  applyGlowStrength(savedGlow !== null ? Number(savedGlow) : defaults.glowStrength);
  applyBorderRadius(savedRadius !== null ? Number(savedRadius) : defaults.borderRadius);
  applyAccentColor(savedAccent);

  // Session settings
  const savedTimeoutEnabled = localStorage.getItem(STORAGE_KEYS.sessionTimeoutEnabled);
  const savedTimeoutMinutes = localStorage.getItem(STORAGE_KEYS.sessionTimeoutMinutes);
  state.sessionTimeoutEnabled = savedTimeoutEnabled !== null ? savedTimeoutEnabled !== 'false' : defaults.sessionTimeoutEnabled;
  state.sessionTimeoutMinutes = savedTimeoutMinutes !== null ? parseInt(savedTimeoutMinutes, 10) : defaults.sessionTimeoutMinutes;
}

// ── Normalize URL ──
export function normalizeUrl(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}
