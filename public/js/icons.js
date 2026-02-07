// ═══════════════════════════════════════════════════════════════════
// SVG Icons – Custom, animated via CSS
// ═══════════════════════════════════════════════════════════════════

export const icons = {
  // ── Navigation & Action (outline, uses currentColor) ──
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>`,

  start: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v4"/>
    <path d="M12 18v4"/>
    <path d="M4.93 4.93l2.83 2.83"/>
    <path d="M16.24 16.24l2.83 2.83"/>
    <path d="M2 12h4"/>
    <path d="M18 12h4"/>
    <path d="M4.93 19.07l2.83-2.83"/>
    <path d="M16.24 7.76l2.83-2.83"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>`,

  analysen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3v18h18"/>
    <path d="M7 16l4-8 4 4 4-6"/>
  </svg>`,

  // ── Colorful Device Icons (filled, multi-color for badges) ──
  switchColor: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="10" rx="2.5" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
    <circle cx="6.5" cy="11" r="1.3" fill="#22c55e"/>
    <circle cx="10" cy="11" r="1.3" fill="#22c55e"/>
    <circle cx="13.5" cy="11" r="1.3" fill="#22c55e"/>
    <circle cx="17" cy="11" r="1.3" fill="#22c55e"/>
    <circle cx="6.5" cy="14" r="0.7" fill="#22c55e" opacity="0.5"/>
    <circle cx="10" cy="14" r="0.7" fill="#22c55e" opacity="0.5"/>
    <circle cx="13.5" cy="14" r="0.7" fill="#22c55e" opacity="0.5"/>
    <circle cx="17" cy="14" r="0.7" fill="#22c55e" opacity="0.5"/>
  </svg>`,

  routerColor: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="12" width="18" height="8" rx="2" fill="#3b82f6"/>
    <circle cx="7" cy="16" r="1.2" fill="#fff" opacity="0.7"/>
    <circle cx="10.5" cy="16" r="1.2" fill="#fff" opacity="0.7"/>
    <path d="M7 12V9" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M17 12V9" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M7 9c0-2.5 5-5 5-5s5 2.5 5 5" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  </svg>`,

  raspberryColor: `<svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="14" r="7" fill="#ef4444"/>
    <circle cx="9.5" cy="12.5" r="2.5" fill="#fff" opacity="0.12"/>
    <path d="M12 3.5c1.8 0 3.5 1.2 4.5 3-1.8 0-3.2-.8-4.5-3z" fill="#22c55e"/>
    <path d="M12 3.5c-1.8 0-3.5 1.2-4.5 3 1.8 0 3.2-.8 4.5-3z" fill="#16a34a"/>
  </svg>`,

  speedportColor: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="10" width="18" height="10" rx="2.5" fill="#3b82f6"/>
    <rect x="7" y="13.5" width="3.5" height="3.5" rx="0.8" fill="#fff" opacity="0.6"/>
    <rect x="13" y="13.5" width="3.5" height="3.5" rx="0.8" fill="#fff" opacity="0.6"/>
    <path d="M8 6.5c2-2.8 6-2.8 8 0" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M6 8.5c3-3.8 9-3.8 12 0" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  windowsColor: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#f25022"/>
    <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#7fba00"/>
    <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#00a4ef"/>
    <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#ffb900"/>
  </svg>`,

  speedtestColor: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M12 20A9 9 0 0 1 3.6 7.8" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 20a9 9 0 0 0 8.4-12.2" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 12l4.5-6" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="2.5" fill="#f59e0b"/>
  </svg>`,

  // ── Original outline versions (for buttons, etc.) ──
  switchDevice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="8" width="20" height="8" rx="2"/>
    <circle cx="7" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="17" cy="12" r="1" fill="currentColor"/>
  </svg>`,

  router: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="12" width="20" height="8" rx="2"/>
    <path d="M7 12V8"/>
    <path d="M17 12V8"/>
    <path d="M7 8c0-2.5 5-5 5-5s5 2.5 5 5"/>
    <circle cx="7" cy="16" r="1" fill="currentColor"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>`,

  raspberry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="14" r="7"/>
    <path d="M12 3c2 0 4 1.5 5 3.5-2 0-3.5-1-5-3.5z"/>
    <path d="M12 3c-2 0-4 1.5-5 3.5 2 0 3.5-1 5-3.5z"/>
    <circle cx="10" cy="13" r="2" opacity="0.5"/>
  </svg>`,

  speedport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="10" width="18" height="10" rx="2"/>
    <path d="M8 6c2-3 6-3 8 0"/>
    <path d="M6 8c3-4 9-4 12 0"/>
    <rect x="7" y="14" width="3" height="3" rx="0.5"/>
    <rect x="13" y="14" width="3" height="3" rx="0.5"/>
  </svg>`,

  speedtest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20A9 9 0 0 1 3.6 7.8"/>
    <path d="M12 20a9 9 0 0 0 8.4-12.2"/>
    <path d="M12 12l5-7"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`,

  windows: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1"/>
    <rect x="13" y="3" width="8" height="8" rx="1"/>
    <rect x="3" y="13" width="8" height="8" rx="1"/>
    <rect x="13" y="13" width="8" height="8" rx="1"/>
  </svg>`,

  // ── Server (for future NAS/server devices) ──
  server: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>`,

  serverColor: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="8" rx="2" fill="#6366f1" stroke="#818cf8" stroke-width="0.5"/>
    <rect x="2" y="14" width="20" height="8" rx="2" fill="#6366f1" stroke="#818cf8" stroke-width="0.5"/>
    <circle cx="6" cy="6" r="1" fill="#22c55e"/>
    <circle cx="6" cy="18" r="1" fill="#22c55e"/>
    <rect x="10" y="5" width="8" height="2" rx="0.5" fill="#fff" opacity="0.2"/>
    <rect x="10" y="17" width="8" height="2" rx="0.5" fill="#fff" opacity="0.2"/>
  </svg>`,

  // ── Actions ──
  wake: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`,

  shutdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    <line x1="12" y1="2" x2="12" y2="12"/>
  </svg>`,

  restart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>`,

  pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>`,

  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="5,3 19,12 5,21"/>
  </svg>`,

  // ── Settings ──
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
  </svg>`,

  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>`,

  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5"/>
    <path d="M12 19l-7-7 7-7"/>
  </svg>`,

  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`,

  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,

  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`,

  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,

  // ── Analysen ──
  uptime: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,

  traffic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v20"/>
    <path d="M8 6l4-4 4 4"/>
    <path d="M8 18l4 4 4-4"/>
    <path d="M3 12h3"/>
    <path d="M18 12h3"/>
  </svg>`,

  linkSpeed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>`,

  outage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>`,

  // ── Pi-hole DNS ──
  piholeDns: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L3 7v6c0 5.25 3.82 10.13 9 11 5.18-.87 9-5.75 9-11V7l-9-5z"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>`,

  piholeDnsColor: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v6c0 5.25 3.82 10.13 9 11 5.18-.87 9-5.75 9-11V7l-9-5z" fill="#ef4444" opacity="0.85"/>
    <path d="M12 2L3 7v6c0 5.25 3.82 10.13 9 11 5.18-.87 9-5.75 9-11V7l-9-5z" stroke="#fca5a5" stroke-width="0.8" fill="none"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // ── Theme ──
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
  </svg>`,

  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>`,

  monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>`,

  // ── Status ──
  online: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`,

  offline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>`,

  unknown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
};

/** @deprecated Use iconEl() instead — this returns HTML strings requiring innerHTML. */
export function icon(name, size = 20) {
  const svg = icons[name] || '';
  return `<span class="icon" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center" aria-hidden="true">${svg}</span>`;
}

export function iconEl(name, size = 20) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.style.cssText = `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center`;
  span.setAttribute('aria-hidden', 'true');
  const svgStr = icons[name] || '';
  if (svgStr) {
    const tpl = document.createElement('template');
    tpl.innerHTML = svgStr;
    span.appendChild(tpl.content);
  }
  return span;
}
