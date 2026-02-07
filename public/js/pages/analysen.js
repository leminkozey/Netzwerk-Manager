// =================================================================
// Analysen Page – Analytics / Monitoring Dashboard
// =================================================================

import { t } from '../i18n.js';
import { el, showToast } from '../ui.js';
import { icon, iconEl } from '../icons.js';
import * as api from '../api.js';

// =================================================================
// Mock Data
// =================================================================

const MOCK_TRAFFIC_24H = [
  12, 8, 5, 3, 2, 2, 4, 14, 38, 52, 61, 55,
  48, 42, 50, 63, 71, 68, 54, 41, 32, 25, 18, 14,
];

const MOCK_TRAFFIC_TOTAL = { inGB: 14.7, outGB: 3.2 };

const MOCK_LINK_SPEEDS = [
  { device: 'Router',     speed: '1 Gbit/s',  label: '1G',   color: '#22c55e' },
  { device: 'Switch',     speed: '1 Gbit/s',  label: '1G',   color: '#22c55e' },
  { device: 'PiHole',     speed: '100 Mbit/s', label: '100M', color: '#f59e0b' },
  { device: 'Windows PC', speed: '1 Gbit/s',  label: '1G',   color: '#22c55e' },
];

const MOCK_POWER = [
  { device: 'Router',     watts: 12 },
  { device: 'Switch',     watts: 8  },
  { device: 'PiHole',     watts: 5  },
  { device: 'Windows PC', watts: 120 },
];

// =================================================================
// Helpers
// =================================================================

function isLocalhost() {
  const h = location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function mockBadge() {
  return el('span', {
    className: 'mock-badge',
    textContent: t('analysen.mockHint'),
    style: {
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: '0.68rem',
      fontWeight: '600',
      color: 'var(--accent-warm)',
      background: 'rgba(255, 107, 74, 0.12)',
      border: '1px solid rgba(255, 107, 74, 0.25)',
      borderRadius: '4px',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      lineHeight: '1.4',
    },
  });
}

const iconColors = {
  speedtest: 'icon-orange',
  speedtestColor: '',
  uptime: 'icon-green',
  traffic: 'icon-cyan',
  linkSpeed: 'icon-yellow',
  outage: 'icon-red',
  power: 'icon-purple',
};

function sectionTitle(titleText, iconName, badge) {
  const colorClass = iconName in iconColors ? iconColors[iconName] : 'icon-cyan';
  const children = [
    el('div', { className: 'section-header' }, [
      el('span', { className: `icon-badge ${colorClass}`, innerHTML: icon(iconName, 22) }),
      el('h3', { textContent: titleText }),
    ]),
  ];
  if (badge) children.push(badge);
  return el('div', { className: 'section-title' }, children);
}

// Live timer: formats ms since timestamp into "Xd Xh Xm Xs"
function formatLiveTimer(sinceTs) {
  const diff = Math.max(0, Date.now() - sinceTs);
  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / 60000) % 60;
  const h = Math.floor(diff / 3600000) % 24;
  const d = Math.floor(diff / 86400000);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

// =================================================================
// Speedtest Section
// =================================================================

function buildSpeedtestSection() {
  const ARC_PATH = 'M 30 170 A 120 120 0 0 1 270 170';
  const ARC_LENGTH = 377;
  const MAX_SPEED = 250;

  let currentSpeed = 0;
  let running = false;

  const bgArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bgArc.setAttribute('d', ARC_PATH);
  bgArc.setAttribute('fill', 'none');
  bgArc.setAttribute('stroke', 'var(--border)');
  bgArc.setAttribute('stroke-width', '16');
  bgArc.setAttribute('stroke-linecap', 'round');

  const progressArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  progressArc.setAttribute('d', ARC_PATH);
  progressArc.setAttribute('fill', 'none');
  progressArc.setAttribute('stroke', 'var(--accent)');
  progressArc.setAttribute('stroke-width', '16');
  progressArc.setAttribute('stroke-linecap', 'round');
  progressArc.setAttribute('stroke-dasharray', String(ARC_LENGTH));
  progressArc.setAttribute('stroke-dashoffset', String(ARC_LENGTH));
  progressArc.id = 'speedArc';
  progressArc.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  progressArc.style.filter = `drop-shadow(0 0 calc(8px * var(--glow-strength)) var(--accent-glow))`;

  const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  valueText.setAttribute('x', '150');
  valueText.setAttribute('y', '140');
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('fill', 'var(--text)');
  valueText.setAttribute('font-size', '42');
  valueText.setAttribute('font-weight', '700');
  valueText.textContent = '0';

  const unitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  unitText.setAttribute('x', '150');
  unitText.setAttribute('y', '162');
  unitText.setAttribute('text-anchor', 'middle');
  unitText.setAttribute('fill', 'var(--text-muted)');
  unitText.setAttribute('font-size', '14');
  unitText.setAttribute('font-weight', '500');
  unitText.textContent = 'Mbps';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 300 190');
  svg.setAttribute('class', 'speedtest-gauge');
  svg.appendChild(bgArc);
  svg.appendChild(progressArc);
  svg.appendChild(valueText);
  svg.appendChild(unitText);

  const gaugeWrapper = el('div', { className: 'speedtest-gauge-wrapper' }, [svg]);
  const noteEl = el('div', { className: 'speedtest-note', textContent: t('speedtest.ready') });

  const dlValue = el('span', { className: 'speedtest-stat-value', textContent: '-' });
  const ulValue = el('span', { className: 'speedtest-stat-value', textContent: '-' });
  const pingValue = el('span', { className: 'speedtest-stat-value', textContent: '-' });

  const statsRow = el('div', { className: 'speedtest-stats' }, [
    el('div', { className: 'speedtest-stat' }, [
      el('span', { className: 'speedtest-stat-label', textContent: t('speedtest.download') }),
      dlValue,
    ]),
    el('div', { className: 'speedtest-stat' }, [
      el('span', { className: 'speedtest-stat-label', textContent: t('speedtest.upload') }),
      ulValue,
    ]),
    el('div', { className: 'speedtest-stat' }, [
      el('span', { className: 'speedtest-stat-label', textContent: t('speedtest.ping') }),
      pingValue,
    ]),
  ]);

  const startBtn = el('button', {
    className: 'btn',
    style: { minWidth: '200px', gap: '10px' },
  }, [iconEl('speedtest', 18), document.createTextNode(' ' + t('speedtest.start'))]);

  const localhostWarn = el('div', {
    className: 'status alert',
    textContent: t('speedtest.localhostNotice'),
    style: { textAlign: 'center', marginBottom: '12px' },
  });

  const isLocal = isLocalhost();
  if (isLocal) startBtn.disabled = true;

  function setGauge(speed) {
    currentSpeed = speed;
    const ratio = Math.min(speed / MAX_SPEED, 1);
    const offset = ARC_LENGTH - (ratio * ARC_LENGTH);
    progressArc.setAttribute('stroke-dashoffset', String(offset));
    valueText.textContent = Math.round(speed);
  }

  async function measurePing() {
    noteEl.textContent = t('speedtest.measuringPing');
    const pings = [];
    for (let i = 0; i < 8; i++) {
      const start = performance.now();
      try { await api.speedtestPing(); } catch {}
      pings.push(performance.now() - start);
    }
    pings.sort((a, b) => a - b);
    const best75 = pings.slice(0, Math.ceil(pings.length * 0.75));
    return Math.round((best75.reduce((s, v) => s + v, 0) / best75.length) * 10) / 10;
  }

  async function measureDownload() {
    noteEl.textContent = t('speedtest.measuringDownload');
    const sizes = [2, 5, 10, 15, 20];
    let bestMbps = 0;
    for (const size of sizes) {
      const start = performance.now();
      try {
        const res = await api.speedtestDownload(size);
        const blob = await res.blob();
        const mbps = (blob.size * 8) / ((performance.now() - start) / 1000) / 1e6;
        if (mbps > bestMbps) bestMbps = mbps;
        setGauge(bestMbps);
      } catch { break; }
    }
    return Math.round(bestMbps * 100) / 100;
  }

  async function measureUpload() {
    noteEl.textContent = t('speedtest.measuringUpload');
    const sizes = [2, 5, 10, 15];
    let bestMbps = 0;
    for (const sizeMB of sizes) {
      const data = new Uint8Array(sizeMB * 1024 * 1024);
      const start = performance.now();
      try {
        await api.speedtestUpload(data);
        const mbps = (data.byteLength * 8) / ((performance.now() - start) / 1000) / 1e6;
        if (mbps > bestMbps) bestMbps = mbps;
        setGauge(bestMbps);
      } catch { break; }
    }
    return Math.round(bestMbps * 100) / 100;
  }

  startBtn.addEventListener('click', async () => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    startBtn.textContent = t('speedtest.starting');
    setGauge(0);
    dlValue.textContent = '-';
    ulValue.textContent = '-';
    pingValue.textContent = '-';
    try {
      const ping = await measurePing();
      pingValue.textContent = ping + ' ms';
      const dl = await measureDownload();
      dlValue.textContent = dl + ' Mbps';
      setGauge(0);
      const ul = await measureUpload();
      ulValue.textContent = ul + ' Mbps';
      setGauge(dl);
      try { await api.saveSpeedtest({ download: dl, upload: ul, ping }); } catch {}
      noteEl.textContent = t('speedtest.complete');
    } catch {
      noteEl.textContent = t('pc.connectionError');
      showToast(t('pc.connectionError'), true);
    } finally {
      running = false;
      startBtn.disabled = false;
      startBtn.textContent = '';
      startBtn.append(iconEl('speedtest', 18), ' ' + t('speedtest.start'));
    }
  });

  return el('div', { className: 'card' }, [
    sectionTitle(t('analysen.speedtest'), 'speedtestColor'),
    el('div', { className: 'speedtest-container' }, [
      ...(isLocal ? [localhostWarn] : []),
      gaugeWrapper,
      noteEl,
      statsRow,
      el('div', { className: 'speedtest-buttons' }, [startBtn]),
    ]),
  ]);
}

// =================================================================
// Uptime Device Card — one per device, live timer
// =================================================================

function buildDeviceUptimeCard(d, timerRefs) {
  const isOnline = d.online;
  const statusColor = isOnline ? '#22c55e' : '#ef4444';
  const statusText = isOnline ? 'Online' : 'Offline';
  const pct24 = d.uptime24h;
  const pct7d = d.uptime7d;
  const barColor24 = pct24 >= 99 ? '#22c55e' : pct24 >= 95 ? '#f59e0b' : '#ef4444';
  const barColor7d = pct7d >= 99 ? '#22c55e' : pct7d >= 95 ? '#f59e0b' : '#ef4444';

  // Timer element — ticks every second
  const timerEl = el('div', {
    style: {
      fontSize: '1.4rem',
      fontWeight: '700',
      fontFamily: "'JetBrains Mono', monospace",
      color: isOnline ? '#22c55e' : 'var(--text-muted)',
      letterSpacing: '0.02em',
      padding: '8px 0 12px',
      textAlign: 'center',
    },
  });

  if (d.onlineSinceTs && isOnline) {
    timerEl.textContent = formatLiveTimer(d.onlineSinceTs);
    timerRefs.push({ el: timerEl, ts: d.onlineSinceTs });
  } else {
    timerEl.textContent = '—';
  }

  function uptimeBar(label, pct, barColor) {
    return el('div', {
      style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' },
    }, [
      el('span', {
        textContent: label,
        style: {
          minWidth: '28px', fontSize: '0.7rem', fontWeight: '600',
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
        },
      }),
      el('div', {
        style: {
          flex: '1', height: '6px', borderRadius: '3px',
          background: 'var(--border)', overflow: 'hidden',
        },
      }, [
        el('div', {
          style: {
            height: '100%', width: pct + '%', borderRadius: '3px',
            background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
            transition: 'width 0.8s ease',
          },
        }),
      ]),
      el('span', {
        textContent: pct + '%',
        style: {
          minWidth: '42px', textAlign: 'right', fontSize: '0.8rem',
          fontWeight: '700', fontFamily: "'JetBrains Mono', monospace", color: barColor,
        },
      }),
    ]);
  }

  return el('div', { className: 'card', style: { marginBottom: '0' } }, [
    // Header: dot + name + ip | status badge
    el('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' },
    }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        el('div', {
          style: {
            width: '8px', height: '8px', borderRadius: '50%',
            background: statusColor, boxShadow: `0 0 6px ${statusColor}88`, flexShrink: '0',
          },
        }),
        el('span', {
          textContent: d.name,
          style: { fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' },
        }),
      ]),
      el('span', {
        textContent: statusText,
        style: {
          padding: '2px 10px', fontSize: '0.68rem', fontWeight: '700',
          color: statusColor, borderRadius: '20px', textTransform: 'uppercase',
          letterSpacing: '0.04em',
          background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isOnline ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        },
      }),
    ]),
    // IP
    el('div', {
      textContent: d.ip,
      style: {
        fontSize: '0.72rem', color: 'var(--text-muted)',
        fontFamily: "'JetBrains Mono', monospace", marginBottom: '2px', paddingLeft: '16px',
      },
    }),
    // Live timer
    timerEl,
    // Bars
    uptimeBar('24h', pct24, barColor24),
    uptimeBar('7d', pct7d, barColor7d),
  ]);
}

// =================================================================
// Traffic Card (Mock)
// =================================================================

function buildTrafficCard() {
  const svgW = 200, svgH = 60;
  const max = Math.max(...MOCK_TRAFFIC_24H);
  const padding = 4;
  const points = MOCK_TRAFFIC_24H.map((v, i) => {
    const x = padding + (i / (MOCK_TRAFFIC_24H.length - 1)) * (svgW - padding * 2);
    const y = svgH - padding - ((v / max) * (svgH - padding * 2));
    return `${x},${y}`;
  }).join(' ');
  const firstX = padding;
  const lastX = svgW - padding;
  const areaPoints = `${firstX},${svgH - padding} ${points} ${lastX},${svgH - padding}`;

  const sparkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sparkSvg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  sparkSvg.style.cssText = 'width:100%;height:60px;display:block';
  const areaFill = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  areaFill.setAttribute('points', areaPoints);
  areaFill.setAttribute('fill', 'var(--accent-glow)');
  sparkSvg.appendChild(areaFill);
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', points);
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', 'var(--accent)');
  polyline.setAttribute('stroke-width', '2');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('stroke-linecap', 'round');
  sparkSvg.appendChild(polyline);

  return el('div', { className: 'card' }, [
    sectionTitle(t('analysen.traffic'), 'traffic', mockBadge()),
    el('div', { style: { padding: '12px 0', overflow: 'hidden' } }, [sparkSvg]),
    el('div', { style: { display: 'flex', justifyContent: 'space-around', paddingTop: '12px', borderTop: '1px solid var(--border)' } }, [
      el('div', { style: { textAlign: 'center' } }, [
        el('div', { textContent: 'IN', style: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' } }),
        el('div', { textContent: MOCK_TRAFFIC_TOTAL.inGB + ' GB', style: { fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" } }),
      ]),
      el('div', { style: { textAlign: 'center' } }, [
        el('div', { textContent: 'OUT', style: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' } }),
        el('div', { textContent: MOCK_TRAFFIC_TOTAL.outGB + ' GB', style: { fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-warm)', fontFamily: "'JetBrains Mono', monospace" } }),
      ]),
    ]),
  ]);
}

// =================================================================
// Link Speed Card (Mock)
// =================================================================

function buildLinkSpeedCard() {
  const badges = MOCK_LINK_SPEEDS.map(d =>
    el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' } }, [
      el('span', { textContent: d.device, style: { fontSize: '0.88rem', fontWeight: '500', color: 'var(--text-secondary)' } }),
      el('span', { textContent: d.label, style: {
        display: 'inline-block', padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700', color: '#fff',
        background: d.color, borderRadius: '20px', fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.03em', boxShadow: `0 2px 8px ${d.color}44`,
      } }),
    ])
  );
  return el('div', { className: 'card' }, [
    sectionTitle(t('analysen.linkspeed'), 'linkSpeed', mockBadge()),
    ...badges,
  ]);
}

// =================================================================
// Outages Card (Real Data)
// =================================================================

function buildOutagesCardFromData(outages) {
  if (outages.length === 0) {
    return el('div', { className: 'card' }, [
      sectionTitle(t('analysen.outages'), 'outage'),
      el('div', { textContent: t('analysen.noOutages'), style: { padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' } }),
    ]);
  }
  const rows = outages.map(d => {
    const isOngoing = d.ongoing;
    return el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' } }, [
      el('div', { innerHTML: icon('outage', 18), style: { color: isOngoing ? '#ef4444' : 'var(--accent-warm)', flexShrink: '0', display: 'flex', alignItems: 'center' } }),
      el('div', { style: { flex: '1', minWidth: '0' } }, [
        el('div', { textContent: d.device, style: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' } }),
        el('div', { textContent: d.timestamp, style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }),
      ]),
      el('span', {
        textContent: isOngoing ? t('analysen.ongoing') : d.duration,
        style: {
          padding: '4px 10px', fontSize: '0.78rem', fontWeight: '600', borderRadius: 'var(--radius-sm)',
          fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
          color: isOngoing ? '#ef4444' : 'var(--accent-warm)',
          background: isOngoing ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,74,0.1)',
          border: `1px solid ${isOngoing ? 'rgba(239,68,68,0.2)' : 'rgba(255,107,74,0.2)'}`,
        },
      }),
    ]);
  });
  return el('div', { className: 'card' }, [sectionTitle(t('analysen.outages'), 'outage'), ...rows]);
}

// =================================================================
// Power Usage Card (Mock)
// =================================================================

function buildPowerCard() {
  const maxWatts = Math.max(...MOCK_POWER.map(d => d.watts));
  const totalWatts = MOCK_POWER.reduce((s, d) => s + d.watts, 0);
  const bars = MOCK_POWER.map(d => {
    const pct = (d.watts / maxWatts) * 100;
    const barColor = d.watts > 50 ? '#ef4444' : d.watts > 10 ? '#f59e0b' : '#22c55e';
    return el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' } }, [
      el('span', { textContent: d.device, style: { minWidth: '100px', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' } }),
      el('div', { style: { flex: '1', height: '10px', borderRadius: '5px', background: 'var(--border)', overflow: 'hidden' } }, [
        el('div', { style: { height: '100%', width: pct + '%', borderRadius: '5px', background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`, transition: 'width 0.8s ease' } }),
      ]),
      el('span', { textContent: d.watts + ' W', style: { minWidth: '56px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' } }),
    ]);
  });
  return el('div', { className: 'card' }, [
    sectionTitle(t('analysen.power'), 'power', mockBadge()),
    ...bars,
    el('div', { style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)', marginTop: '8px' } }, [
      el('span', { textContent: t('speedtest.total'), style: { fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' } }),
      el('span', { textContent: '~' + totalWatts + ' W', style: { fontSize: '1rem', fontWeight: '700', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" } }),
    ]),
  ]);
}

// =================================================================
// Main Render
// =================================================================

export function renderAnalysen(container) {
  let destroyed = false;
  let timerInterval = null;
  const timerRefs = []; // { el, ts } — updated every second

  // Unlock the parent .page max-width so analysen uses the full viewport
  const parentPage = container.closest('.page');
  if (parentPage) parentPage.style.maxWidth = 'none';

  const page = el('div', { className: 'page-wide', style: { maxWidth: 'none' } });

  // Two-column top: speedtest left, uptime grid right (responsive via CSS)
  const topRow = el('div', { className: 'analysen-top' });

  // Speedtest (compact, left column)
  topRow.appendChild(buildSpeedtestSection());

  // Right side: uptime section
  const rightSide = el('div');

  rightSide.appendChild(el('div', { className: 'section-title', style: { marginBottom: '12px' } }, [
    el('div', { className: 'section-header' }, [
      el('span', { className: 'icon-badge icon-green', innerHTML: icon('uptime', 22) }),
      el('h3', { textContent: t('analysen.uptime') }),
    ]),
  ]));

  const uptimeGrid = el('div', { className: 'analysen-uptime-grid' }, [
    el('div', { className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0' } }, [
      el('span', { textContent: '...' }),
    ]),
  ]);
  rightSide.appendChild(uptimeGrid);

  topRow.appendChild(rightSide);
  page.appendChild(topRow);

  // Outages
  const outagesPlaceholder = el('div', { className: 'card', style: { marginTop: '16px' } }, [
    sectionTitle(t('analysen.outages'), 'outage'),
    el('div', { textContent: '...', style: { padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' } }),
  ]);
  page.appendChild(outagesPlaceholder);

  // Other monitoring
  page.appendChild(el('div', { className: 'section-title', style: { marginTop: '28px', marginBottom: '16px' } }, [
    el('h3', { textContent: t('section.monitoring') }),
  ]));
  page.appendChild(el('div', { className: 'grid three equal-height' }, [
    buildTrafficCard(),
    buildLinkSpeedCard(),
    buildPowerCard(),
  ]));

  container.appendChild(page);

  // Fetch uptime data
  api.getUptime().then(data => {
    if (destroyed) return;

    if (data && data.devices && data.devices.length > 0) {
      uptimeGrid.innerHTML = '';
      for (const d of data.devices) {
        uptimeGrid.appendChild(buildDeviceUptimeCard(d, timerRefs));
      }
    } else {
      uptimeGrid.innerHTML = '';
      uptimeGrid.appendChild(el('div', {
        className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0', gridColumn: '1 / -1' },
      }, [el('span', { textContent: t('analysen.noData') })]));
    }

    if (data && data.outages !== undefined) {
      outagesPlaceholder.replaceWith(buildOutagesCardFromData(data.outages));
    }

    // Start live timer
    if (timerRefs.length > 0) {
      timerInterval = setInterval(() => {
        for (const ref of timerRefs) {
          ref.el.textContent = formatLiveTimer(ref.ts);
        }
      }, 1000);
    }
  }).catch(() => {
    uptimeGrid.innerHTML = '';
    uptimeGrid.appendChild(el('div', {
      className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0', gridColumn: '1 / -1' },
    }, [el('span', { textContent: t('analysen.noData') })]));
  });

  return function cleanup() {
    destroyed = true;
    if (timerInterval) clearInterval(timerInterval);
    // Restore parent .page max-width for other pages
    if (parentPage) parentPage.style.maxWidth = '';
  };
}
