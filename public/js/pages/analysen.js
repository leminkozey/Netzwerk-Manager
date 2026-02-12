// =================================================================
// Analysen Page – Analytics / Monitoring Dashboard
// =================================================================

import { t, getCurrentLang } from '../i18n.js';
import { getConfig } from '../state.js';
import { el, showToast } from '../ui.js';
import { iconEl } from '../icons.js';
import * as api from '../api.js';
import { wsConnected } from '../ws.js';

// =================================================================
// Helpers
// =================================================================

function isLocalhost() {
  const h = location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

const iconColors = {
  speedtest: 'icon-orange',
  speedtestColor: '',
  uptime: 'icon-green',
  traffic: 'icon-cyan',
  linkSpeed: 'icon-yellow',
  outage: 'icon-red',
  power: 'icon-purple',
  piholeDns: 'icon-red',
  piholeDnsColor: '',
  pingMonitor: 'icon-cyan',
  pingMonitorColor: '',
};

function sectionTitle(titleText, iconName, badge) {
  const colorClass = iconName in iconColors ? iconColors[iconName] : 'icon-cyan';
  const children = [
    el('div', { className: 'section-header' }, [
      el('span', { className: `icon-badge ${colorClass}` }, [iconEl(iconName, 22)]),
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

function formatNumber(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  const locale = getCurrentLang() === 'en' ? 'en-US' : 'de-DE';
  return n.toLocaleString(locale);
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
      try {
        const res = await api.speedtestPing();
        if (res.ok || res.status === 204) {
          pings.push(performance.now() - start);
        }
      } catch {
        // Skip failed pings
      }
    }
    if (pings.length === 0) return 0;
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
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const mbps = (buf.byteLength * 8) / ((performance.now() - start) / 1000) / 1e6;
        if (mbps > bestMbps) bestMbps = mbps;
        setGauge(bestMbps);
      } catch { continue; }
    }
    return Math.round(bestMbps * 100) / 100;
  }

  async function measureUpload() {
    noteEl.textContent = t('speedtest.measuringUpload');
    const sizes = [2, 5, 10, 15];
    let bestMbps = 0;
    for (const sizeMB of sizes) {
      const data = new Uint8Array(sizeMB * 1024 * 1024);
      for (let off = 0; off < data.byteLength; off += 65536) {
        crypto.getRandomValues(new Uint8Array(data.buffer, off, Math.min(65536, data.byteLength - off)));
      }
      const start = performance.now();
      try {
        const res = await api.speedtestUpload(data);
        if (!res.ok) continue;
        const mbps = (data.byteLength * 8) / ((performance.now() - start) / 1000) / 1e6;
        if (mbps > bestMbps) bestMbps = mbps;
        setGauge(bestMbps);
      } catch { continue; }
    }
    return Math.round(bestMbps * 100) / 100;
  }

  function setBtnRunning(text) {
    startBtn.replaceChildren(iconEl('speedtest', 18), document.createTextNode(' ' + text));
  }

  function setBtnReady() {
    startBtn.replaceChildren(iconEl('speedtest', 18), document.createTextNode(' ' + t('speedtest.start')));
  }

  startBtn.addEventListener('click', async () => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    setBtnRunning(t('speedtest.starting'));
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
      setGauge(Math.max(dl, ul));
      try {
        await api.saveSpeedtest({ download: dl, upload: ul, ping, type: 'local' });
      } catch {
        showToast(t('msg.error'), true);
      }
      noteEl.textContent = t('speedtest.complete');
    } catch {
      noteEl.textContent = t('speedtest.error');
      showToast(t('speedtest.error'), true);
    } finally {
      running = false;
      startBtn.disabled = false;
      setBtnReady();
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
    // Online: live counting timer
    timerEl.textContent = formatLiveTimer(d.onlineSinceTs);
    timerRefs.push({ el: timerEl, ts: d.onlineSinceTs });
  } else if (d.onlineSinceTs && d.pausedAtTs && !isOnline) {
    // Offline but has paused timer: show frozen value
    const frozenMs = d.pausedAtTs - d.onlineSinceTs;
    timerEl.textContent = formatLiveTimer(Date.now() - frozenMs);
    timerEl.style.opacity = '0.5';
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
// Outages Card (Real Data)
// =================================================================

function buildOutagesCardFromData(outages) {
  if (outages.length === 0) {
    return el('div', { className: 'card', style: { display: 'flex', flexDirection: 'column', minHeight: '0', overflow: 'hidden' } }, [
      sectionTitle(t('analysen.outages'), 'outage'),
      el('div', { textContent: t('analysen.noOutages'), style: { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' } }),
    ]);
  }
  const rows = outages.map(d => {
    const isOngoing = d.ongoing;
    return el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' } }, [
      el('div', { style: { color: isOngoing ? '#ef4444' : 'var(--accent-warm)', flexShrink: '0', display: 'flex', alignItems: 'center' } }, [iconEl('outage', 18)]),
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
  const scrollInner = el('div', {
    style: { position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', overflowY: 'auto', overflowX: 'hidden' },
  }, rows);
  const scrollWrapper = el('div', { style: { position: 'relative', flex: '1', minHeight: '0' } }, [scrollInner]);
  return el('div', { className: 'card', style: { display: 'flex', flexDirection: 'column', minHeight: '0', overflow: 'hidden' } }, [sectionTitle(t('analysen.outages'), 'outage'), scrollWrapper]);
}

// =================================================================
// Outages – Mobile Layout
// =================================================================

const mobileQuery = window.matchMedia('(max-width: 900px)');

function buildOutagesMobileCard(outages) {
  if (outages.length === 0) {
    return el('div', { className: 'card outages-mobile' }, [
      sectionTitle(t('analysen.outages'), 'outage'),
      el('div', {
        textContent: t('analysen.noOutages'),
        style: { padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' },
      }),
    ]);
  }

  const rows = outages.map(d => {
    const isOngoing = d.ongoing;
    return el('div', { className: `outage-m-row${isOngoing ? ' ongoing' : ''}` }, [
      el('div', { className: 'outage-m-left' }, [
        el('div', { className: 'outage-m-icon', style: { color: isOngoing ? '#ef4444' : 'var(--accent-warm)' } }, [iconEl('outage', 16)]),
        el('div', { className: 'outage-m-info' }, [
          el('span', { className: 'outage-m-device', textContent: d.device }),
          el('span', { className: 'outage-m-time', textContent: d.timestamp }),
        ]),
      ]),
      el('span', {
        className: `outage-m-badge${isOngoing ? ' ongoing' : ''}`,
        textContent: isOngoing ? t('analysen.ongoing') : d.duration,
      }),
    ]);
  });

  return el('div', { className: 'card outages-mobile' }, [
    sectionTitle(t('analysen.outages'), 'outage'),
    el('div', { className: 'outage-m-list' }, rows),
  ]);
}

// =================================================================
// Ping Monitor Section
// =================================================================

function buildPingMonitorSection(data) {
  const hostColors = ['#00d4ff', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];
  const frag = document.createDocumentFragment();

  if (!data || !data.hosts || data.hosts.length === 0) {
    frag.appendChild(el('div', {
      className: 'card',
      style: { padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' },
    }, [el('span', { textContent: t('pingMonitor.noData') })]));
    return frag;
  }

  const hosts = data.hosts;

  // ── Compact host stats: one row per host ──
  function hostRow(host, color) {
    const isReachable = host.currentPing !== null;
    const statusColor = isReachable ? '#22c55e' : '#ef4444';
    const pingDisplay = isReachable ? host.currentPing.toFixed(1) : '—';

    function stat(label, value, unit) {
      return el('span', {
        style: { fontSize: '0.68rem', color: 'var(--text-muted)' },
      }, [
        document.createTextNode(label + ' '),
        el('span', {
          textContent: value !== null ? value + (unit || '') : '—',
          style: { fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' },
        }),
      ]);
    }

    return el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' } }, [
      // Color dot
      el('div', { style: { width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: '0' } }),
      // Name + IP
      el('div', { style: { minWidth: '110px' } }, [
        el('span', { textContent: host.name, style: { fontSize: '0.82rem', fontWeight: '600', color: 'var(--text)' } }),
        el('span', { textContent: '  ' + host.ip, style: { fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" } }),
      ]),
      // Current ping
      el('div', { style: { minWidth: '65px', textAlign: 'right' } }, [
        el('span', {
          textContent: pingDisplay,
          style: { fontSize: '1.1rem', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace", color },
        }),
        el('span', { textContent: isReachable ? ' ms' : '', style: { fontSize: '0.68rem', color: 'var(--text-muted)' } }),
      ]),
      // Status dot
      el('div', { style: { width: '6px', height: '6px', borderRadius: '50%', background: statusColor, flexShrink: '0' } }),
      // Inline stats
      el('div', { style: { display: 'flex', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' } }, [
        stat(t('pingMonitor.avg'), host.avg, ''),
        stat(t('pingMonitor.min'), host.min, ''),
        stat(t('pingMonitor.max'), host.max, ''),
        stat(t('pingMonitor.loss'), host.lossPercent !== null ? host.lossPercent : null, '%'),
      ]),
    ]);
  }

  const statsBlock = el('div', {
    style: { borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '4px' },
  }, hosts.map((h, i) => hostRow(h, hostColors[i % hostColors.length])));

  // ── Compact combined chart ──
  const allCharts = hosts.filter(h => h.chart && h.chart.length > 1);
  let chartEl = el('div');

  if (allCharts.length > 0) {
    const ns = 'http://www.w3.org/2000/svg';
    const w = 700, h = 140;
    const padL = 38, padR = 8, padT = 8, padB = 22;
    const cW = w - padL - padR;
    const cH = h - padT - padB;

    let globalMax = 1;
    for (const host of allCharts) {
      for (const p of host.chart) {
        if (p.ms !== null && p.ms > globalMax) globalMax = p.ms;
      }
    }

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'width:100%;height:auto;display:block';

    function toY(ms) { return padT + cH - (ms / globalMax) * cH; }

    // Y-axis grid (2 lines)
    for (let i = 0; i <= 2; i++) {
      const val = (globalMax / 2) * i;
      const y = toY(val);
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', padL); line.setAttribute('x2', w - padR);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
      svg.appendChild(line);

      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', padL - 4); label.setAttribute('y', y + 3);
      label.setAttribute('text-anchor', 'end'); label.setAttribute('fill', 'var(--text-muted)');
      label.setAttribute('font-size', '8');
      label.textContent = Math.round(val) + '';
      svg.appendChild(label);
    }

    // Draw area + line per host
    for (let hi = 0; hi < allCharts.length; hi++) {
      const host = allCharts[hi];
      const color = hostColors[hi % hostColors.length];
      const chart = host.chart;
      let points = '';
      let firstX = null, lastX = null;
      for (let i = 0; i < chart.length; i++) {
        if (chart[i].ms === null) continue;
        const x = padL + (i / (chart.length - 1)) * cW;
        const y = toY(chart[i].ms);
        points += `${x},${y} `;
        if (firstX === null) firstX = x;
        lastX = x;
      }
      if (points && firstX !== null) {
        const area = document.createElementNS(ns, 'polygon');
        area.setAttribute('points', `${points}${lastX},${padT + cH} ${firstX},${padT + cH}`);
        area.setAttribute('fill', color);
        area.setAttribute('opacity', '0.06');
        svg.appendChild(area);

        const polyline = document.createElementNS(ns, 'polyline');
        polyline.setAttribute('points', points.trim());
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', color);
        polyline.setAttribute('stroke-width', '1.8');
        polyline.setAttribute('stroke-linejoin', 'round');
        polyline.setAttribute('opacity', '0.85');
        svg.appendChild(polyline);
      }
    }

    // X-axis time labels
    const refChart = allCharts[0].chart;
    const labelCount = Math.min(5, refChart.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = labelCount <= 1 ? 0 : Math.round((i / (labelCount - 1)) * (refChart.length - 1));
      const ts = refChart[idx]?.ts;
      if (!ts) continue;
      const d = new Date(ts);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', padL + (idx / (refChart.length - 1)) * cW);
      label.setAttribute('y', h - 4);
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', 'var(--text-muted)');
      label.setAttribute('font-size', '8');
      label.textContent = timeStr;
      svg.appendChild(label);
    }

    chartEl = el('div', { style: { overflow: 'hidden' } }, [svg]);
  }

  // ── Single compact card ──
  frag.appendChild(el('div', { className: 'card' }, [
    sectionTitle(t('analysen.pingMonitor'), 'pingMonitorColor'),
    statsBlock,
    chartEl,
  ]));

  return frag;
}

// =================================================================
// Pi-hole Dashboard
// =================================================================

// Decorative SVG icon for summary cards (semi-transparent, right-aligned)
function summaryCardIcon(pathDefs) {
  const ns = 'http://www.w3.org/2000/svg';
  const wrapper = el('div', { className: 'pihole-stat-icon' });
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.style.cssText = 'width:100%;height:100%';
  for (const def of pathDefs) {
    const node = document.createElementNS(ns, def.tag);
    for (const [k, v] of Object.entries(def.attrs || {})) node.setAttribute(k, v);
    svg.appendChild(node);
  }
  wrapper.appendChild(svg);
  return wrapper;
}

function buildPiholeSummaryCards(data) {
  const queries = data?.queries?.total ?? data?.dns_queries_today ?? 0;
  const blocked = data?.queries?.blocked ?? data?.ads_blocked_today ?? 0;
  const percent = data?.queries?.percent_blocked ?? data?.ads_percentage_today ?? 0;
  const blocklist = data?.gravity?.domains_being_blocked ?? data?.domains_being_blocked ?? 0;

  const cards = [
    {
      label: t('pihole.totalQueries'), value: formatNumber(queries),
      cls: 'pihole-stat-card--cyan',
      icon: [
        { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' } },
        { tag: 'path', attrs: { d: 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' } },
      ],
    },
    {
      label: t('pihole.queriesBlocked'), value: formatNumber(blocked),
      cls: 'pihole-stat-card--red',
      icon: [
        { tag: 'path', attrs: { d: 'M12 2L3 7v6c0 5.25 3.82 10.13 9 11 5.18-.87 9-5.75 9-11V7l-9-5z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' } },
        { tag: 'line', attrs: { x1: '8', y1: '12', x2: '16', y2: '12', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' } },
      ],
    },
    {
      label: t('pihole.percentBlocked'), value: (Math.round(percent * 10) / 10) + '%',
      cls: 'pihole-stat-card--orange',
      icon: [
        { tag: 'path', attrs: { d: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' } },
        { tag: 'path', attrs: { d: 'M12 3a9 9 0 0 1 0 18V12z', fill: 'currentColor', opacity: '0.4' } },
      ],
    },
    {
      label: t('pihole.domainsBlocked'), value: formatNumber(blocklist),
      cls: 'pihole-stat-card--green',
      icon: [
        { tag: 'rect', attrs: { x: '3', y: '3', width: '18', height: '18', rx: '2', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' } },
        { tag: 'line', attrs: { x1: '7', y1: '8', x2: '17', y2: '8', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' } },
        { tag: 'line', attrs: { x1: '7', y1: '12', x2: '17', y2: '12', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' } },
        { tag: 'line', attrs: { x1: '7', y1: '16', x2: '13', y2: '16', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' } },
      ],
    },
  ];

  const scrollNums = [];
  const grid = el('div', { className: 'pihole-summary-grid' }, cards.map((c, idx) => {
    const numEl = createScrollNumber(c.value);
    numEl.style.fontSize = '';
    numEl.style.fontWeight = '';
    numEl.style.fontFamily = '';
    numEl.style.color = '';
    numEl.className = 'pihole-stat-value';
    scrollNums.push({ el: numEl, idx });

    return el('div', { className: `pihole-stat-card ${c.cls}` }, [
      el('div', { style: { position: 'relative', zIndex: '1' } }, [
        numEl,
        el('div', { className: 'pihole-stat-label' }, [document.createTextNode(c.label)]),
      ]),
      summaryCardIcon(c.icon),
    ]);
  }));

  const summaryObserver = new IntersectionObserver((obs) => {
    obs.forEach(e => {
      if (e.isIntersecting) {
        scrollNums.forEach(s => s.el._animateIn(s.idx * 0.12));
        summaryObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  requestAnimationFrame(() => {
    if (grid.isConnected) summaryObserver.observe(grid);
    else {
      const mo = new MutationObserver(() => {
        if (grid.isConnected) { summaryObserver.observe(grid); mo.disconnect(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  return grid;
}

function buildQueriesOverTimeChart(data) {
  // Pi-hole v6: data.history is array of { timestamp, total, blocked, cached, forwarded }
  const history = Array.isArray(data?.history) ? data.history : [];
  if (history.length === 0) {
    return el('div', { className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)' } }, [
      el('span', { textContent: t('analysen.noData') }),
    ]);
  }

  const svgW = 700, svgH = 240;
  const padL = 50, padR = 15, padT = 15, padB = 40;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const maxVal = history.reduce((m, h) => Math.max(m, h.total ?? 0), 1);
  const barW = chartW / history.length;
  const barInner = Math.max(barW * 0.7, 1);

  function toY(v) {
    return padT + chartH - (v / maxVal) * chartH;
  }

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.style.cssText = 'width:100%;height:auto;display:block';

  // Y-axis grid lines
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const yVal = (maxVal / ySteps) * i;
    const y = toY(yVal);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', padL); line.setAttribute('x2', svgW - padR);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
    svg.appendChild(line);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', padL - 8); label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end'); label.setAttribute('fill', 'var(--text-muted)');
    label.setAttribute('font-size', '10');
    label.textContent = yVal >= 1000 ? Math.round(yVal / 1000) + 'k' : Math.round(yVal);
    svg.appendChild(label);
  }

  // Stacked bars (animated on scroll)
  const bottom = toY(0);
  const barRects = [];

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const forwarded = h.forwarded ?? 0;
    const cached = h.cached ?? 0;
    const blocked = h.blocked ?? 0;
    const total = h.total ?? (forwarded + cached + blocked);
    if (total === 0) continue;

    const x = padL + i * barW + (barW - barInner) / 2;
    const totalH = bottom - toY(total);

    const makeBar = (fill, targetY, targetH) => {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('width', barInner);
      rect.setAttribute('fill', fill); rect.setAttribute('rx', '0.5');
      // Start collapsed at bottom
      rect.setAttribute('y', bottom);
      rect.setAttribute('height', 0);
      rect.dataset.targetY = targetY;
      rect.dataset.targetH = targetH;
      rect.style.transition = `y 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.012}s, height 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.012}s`;
      svg.appendChild(rect);
      barRects.push(rect);
    };

    // Forwarded (bottom, blue)
    if (forwarded > 0) {
      const fH = (forwarded / total) * totalH;
      makeBar('#3b82f6', bottom - fH, fH);
    }

    // Cached (middle, green)
    if (cached > 0) {
      const fH = (forwarded / total) * totalH;
      const cH = (cached / total) * totalH;
      makeBar('#22c55e', bottom - fH - cH, cH);
    }

    // Blocked (top, red)
    if (blocked > 0) {
      const fH = (forwarded / total) * totalH;
      const cH = (cached / total) * totalH;
      const bH = (blocked / total) * totalH;
      makeBar('#ef4444', bottom - fH - cH - bH, bH);
    }
  }

  // Observe scroll to animate bars growing upward
  const barObserver = new IntersectionObserver((obs) => {
    obs.forEach(e => {
      if (e.isIntersecting) {
        barRects.forEach(r => {
          r.setAttribute('y', r.dataset.targetY);
          r.setAttribute('height', r.dataset.targetH);
        });
        barObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  requestAnimationFrame(() => {
    if (svg.isConnected) barObserver.observe(svg);
    else {
      const mo = new MutationObserver(() => {
        if (svg.isConnected) { barObserver.observe(svg); mo.disconnect(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  // X-axis time labels
  const labelCount = Math.min(12, history.length);
  for (let i = 0; i < labelCount; i++) {
    const idx = labelCount <= 1 ? 0 : Math.round((i / (labelCount - 1)) * (history.length - 1));
    const ts = history[idx]?.timestamp;
    if (!ts) continue;
    const d = new Date(ts * 1000);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', padL + idx * barW + barW / 2);
    label.setAttribute('y', svgH - 8);
    label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', 'var(--text-muted)');
    label.setAttribute('font-size', '9');
    label.textContent = timeStr;
    svg.appendChild(label);
  }

  // Legend
  const legend = el('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', paddingTop: '8px', flexWrap: 'wrap' } }, [
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
      el('div', { style: { width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6' } }),
      el('span', { textContent: t('pihole.forwarded'), style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }),
    ]),
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
      el('div', { style: { width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' } }),
      el('span', { textContent: t('pihole.cached'), style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }),
    ]),
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
      el('div', { style: { width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' } }),
      el('span', { textContent: t('pihole.blocked'), style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }),
    ]),
  ]);

  return el('div', { className: 'card' }, [
    sectionTitle(t('pihole.queriesOverTime'), 'traffic'),
    el('div', { style: { padding: '8px 0', overflow: 'hidden' } }, [svg]),
    legend,
  ]);
}

function buildDonutChart(title, iconName, entries, colors) {
  if (!entries || entries.length === 0) {
    return el('div', { className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)' } }, [
      el('span', { textContent: t('analysen.noData') }),
    ]);
  }

  const total = entries.reduce((s, e) => s + e.value, 0);
  if (total === 0) {
    return el('div', { className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)' } }, [
      el('span', { textContent: t('analysen.noData') }),
    ]);
  }

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.style.cssText = 'width:100%;max-width:180px;height:auto;display:block;margin:0 auto';

  // Use stroke-based circles for scroll animation
  const cx = 100, cy = 100, midR = 65; // radius at middle of ring
  const strokeW = 30; // ring thickness
  const circumference = 2 * Math.PI * midR;
  let offset = 0;

  const circles = [];
  entries.forEach((entry, i) => {
    const fraction = entry.value / total;
    const segLen = fraction * circumference;
    if (segLen < 0.5) { offset += segLen; return; }

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', midR);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', colors[i % colors.length]);
    circle.setAttribute('stroke-width', strokeW);
    circle.setAttribute('opacity', '0.85');
    // dasharray: segment length, then rest of circumference
    circle.setAttribute('stroke-dasharray', `${segLen} ${circumference - segLen}`);
    // dashoffset to position segment; start from top (-90°)
    circle.setAttribute('stroke-dashoffset', `${-offset + circumference * 0.25}`);
    // Initial state: fully hidden (will animate on scroll)
    circle.style.strokeDashoffset = `${circumference + circumference * 0.25}`;
    circle.dataset.targetOffset = `${-offset + circumference * 0.25}`;
    circle.style.transition = `stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.15}s`;

    svg.appendChild(circle);
    circles.push(circle);
    offset += segLen;
  });

  // Observe when SVG enters viewport, then animate segments in
  const observer = new IntersectionObserver((obs) => {
    obs.forEach(e => {
      if (e.isIntersecting) {
        circles.forEach(c => { c.style.strokeDashoffset = c.dataset.targetOffset; });
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  // Schedule observe after element is in DOM
  requestAnimationFrame(() => {
    if (svg.isConnected) observer.observe(svg);
    else {
      const mo = new MutationObserver(() => {
        if (svg.isConnected) { observer.observe(svg); mo.disconnect(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  const legendScrollNums = [];
  const legendItems = entries.slice(0, 8).map((entry, i) => {
    const pctDisplay = (Math.round((entry.value / total) * 1000) / 10) + '%';
    const numEl = createScrollNumber(pctDisplay);
    legendScrollNums.push({ el: numEl, idx: i });

    return el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' } }, [
      el('div', { style: { width: '10px', height: '10px', borderRadius: '3px', background: colors[i % colors.length], flexShrink: '0' } }),
      el('span', {
        textContent: entry.label,
        style: { fontSize: '0.78rem', color: 'var(--text-secondary)', flex: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      }),
      numEl,
    ]);
  });

  const card = el('div', { className: 'card' }, [
    sectionTitle(title, iconName),
    el('div', { style: { padding: '12px 0' } }, [svg]),
    el('div', { style: { padding: '4px 0' } }, legendItems),
  ]);

  // Observe legend scroll numbers (piggyback on donut observer)
  const legendObserver = new IntersectionObserver((obs) => {
    obs.forEach(e => {
      if (e.isIntersecting) {
        legendScrollNums.forEach(s => s.el._animateIn(s.idx * 0.08));
        legendObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  requestAnimationFrame(() => {
    if (card.isConnected) legendObserver.observe(card);
    else {
      const mo = new MutationObserver(() => {
        if (card.isConnected) { legendObserver.observe(card); mo.disconnect(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  return card;
}

function buildQueryTypesDonut(data) {
  const types = data?.types || data?.querytypes || {};
  const entries = Object.entries(types)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const colors = ['#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
  return buildDonutChart(t('pihole.queryTypes'), 'piholeDns', entries, colors);
}

function buildUpstreamsDonut(data) {
  const upstreams = data?.upstreams || [];
  let entries;
  if (Array.isArray(upstreams)) {
    entries = upstreams
      .filter(u => (u.count || u.percentage || 0) > 0)
      .sort((a, b) => (b.count || b.percentage || 0) - (a.count || a.percentage || 0))
      .map(u => ({ label: u.name || u.ip || 'unknown', value: u.count || u.percentage || 0 }));
  } else {
    entries = Object.entries(upstreams)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  return buildDonutChart(t('pihole.upstreamServers'), 'uptime', entries, colors);
}

function extractTopList(data, key) {
  const raw = data?.[key] || [];
  if (Array.isArray(raw)) {
    return raw.map(item => ({
      name: item.domain || item.name || item.client || item.ip || 'unknown',
      count: item.count || item.hits || 0,
    }));
  }
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw).map(([name, count]) => ({ name, count }));
  }
  return [];
}

// Apple-style per-digit scroll counter
function createScrollNumber(value) {
  const formatted = typeof value === 'string' ? value : formatNumber(value);
  const container = el('span', {
    style: {
      display: 'inline-flex', alignItems: 'center',
      fontSize: '0.78rem', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace",
      color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden',
    },
  });

  const digitCols = [];
  for (const char of formatted) {
    if (char >= '0' && char <= '9') {
      const col = el('span', {
        style: {
          display: 'inline-block', height: '1.2em', overflow: 'hidden', position: 'relative',
          width: '0.62em', textAlign: 'center',
        },
      });
      const strip = el('span', {
        style: {
          display: 'block', transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: 'translateY(0)', lineHeight: '1.2em',
        },
      });
      // Build digit strip: 0-9 stacked, target digit scrolls into view
      for (let d = 0; d <= 9; d++) {
        strip.appendChild(el('span', { textContent: String(d), style: { display: 'block', height: '1.2em' } }));
      }
      col.appendChild(strip);
      container.appendChild(col);
      digitCols.push({ strip, target: parseInt(char) });
    } else {
      // Separator (dot, comma, space)
      container.appendChild(el('span', { textContent: char, style: { display: 'inline-block' } }));
    }
  }

  container._animateIn = (delay) => {
    digitCols.forEach((d, i) => {
      d.strip.style.transitionDelay = `${delay + i * 0.06}s`;
      d.strip.style.transform = `translateY(${-d.target * 1.2}em)`;
    });
  };

  return container;
}

function buildTopList(title, iconName, items, color) {
  if (!items || items.length === 0) {
    return el('div', { className: 'card' }, [
      sectionTitle(title, iconName),
      el('div', { textContent: t('analysen.noData'), style: { padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' } }),
    ]);
  }

  const maxCount = items.reduce((m, i) => Math.max(m, i.count), 1);
  const scrollNums = [];
  const barFills = [];

  const rows = items.slice(0, 10).map((item, idx) => {
    const pct = (item.count / maxCount) * 100;
    const numEl = createScrollNumber(item.count);
    scrollNums.push({ el: numEl, idx });

    const barFill = el('div', { style: { height: '100%', width: '0%', borderRadius: '2px', background: color, transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)' } });
    barFills.push({ el: barFill, pct, idx });

    return el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0' } }, [
      el('span', {
        textContent: String(idx + 1),
        style: {
          minWidth: '22px', fontSize: '0.72rem', fontWeight: '700',
          color: 'var(--text-muted)', textAlign: 'right',
        },
      }),
      el('div', { style: { flex: '1', minWidth: '0' } }, [
        el('div', {
          textContent: item.name,
          style: {
            fontSize: '0.82rem', fontWeight: '500', color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          },
        }),
        el('div', { style: { height: '4px', borderRadius: '2px', background: 'var(--border)', marginTop: '4px', overflow: 'hidden' } }, [
          barFill,
        ]),
      ]),
      numEl,
    ]);
  });

  const card = el('div', { className: 'card' }, [
    sectionTitle(title, iconName),
    ...rows,
  ]);

  // Observe scroll to trigger animations
  const listObserver = new IntersectionObserver((obs) => {
    obs.forEach(e => {
      if (e.isIntersecting) {
        scrollNums.forEach(s => s.el._animateIn(s.idx * 0.07));
        barFills.forEach(b => {
          b.el.style.transitionDelay = `${b.idx * 0.07}s`;
          b.el.style.width = b.pct + '%';
        });
        listObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  requestAnimationFrame(() => {
    if (card.isConnected) listObserver.observe(card);
    else {
      const mo = new MutationObserver(() => {
        if (card.isConnected) { listObserver.observe(card); mo.disconnect(); }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  return card;
}

// =================================================================
// Main Render
// =================================================================

export function renderAnalysen(container) {
  let destroyed = false;
  let timerInterval = null;
  let pollInterval = null;
  let piholeInterval = null;
  let pingMonInterval = null;
  const timerRefs = []; // { el, ts } — updated every second

  // Read poll intervals from config
  const cfg = getConfig();
  const pollSec = (cfg?.uptimeInterval && cfg.uptimeInterval >= 10) ? cfg.uptimeInterval : 60;
  const pollMs = pollSec * 1000;
  const piholeSec = (cfg?.piholeInterval && cfg.piholeInterval >= 30) ? cfg.piholeInterval : 60;
  const piholeMs = piholeSec * 1000;

  // Unlock the parent .page max-width so analysen uses the full viewport
  const parentPage = container.closest('.page');
  if (parentPage) parentPage.style.maxWidth = 'none';

  const page = el('div', { className: 'page-wide', style: { maxWidth: 'none' } });

  // Analysen section toggles
  const showSpeedtest = cfg?.analysen?.speedtest !== false;
  const showOutages = cfg?.analysen?.outages !== false;
  const showUptime = cfg?.analysen?.uptime !== false;

  // Two-column top: speedtest left, uptime grid right (responsive via CSS)
  const topRow = el('div', { className: 'analysen-top' });

  // Top row: Speedtest (left) | Outages (right) — side by side
  if (showSpeedtest) topRow.appendChild(buildSpeedtestSection());

  let outagesPlaceholder = null;
  if (showOutages) {
    outagesPlaceholder = el('div', { className: 'card' }, [
      sectionTitle(t('analysen.outages'), 'outage'),
      el('div', { textContent: '...', style: { padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' } }),
    ]);
    topRow.appendChild(outagesPlaceholder);
  }

  // Uptime (third column)
  let uptimeGrid = null;
  if (showUptime) {
    const uptimeCol = el('div');
    uptimeCol.appendChild(el('div', { className: 'section-title', style: { marginBottom: '12px' } }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge icon-green' }, [iconEl('uptime', 22)]),
        el('h3', { textContent: t('analysen.uptime') }),
      ]),
    ]));

    uptimeGrid = el('div', { className: 'analysen-uptime-grid' }, [
      el('div', { className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0' } }, [
        el('span', { textContent: '...' }),
      ]),
    ]);
    uptimeCol.appendChild(uptimeGrid);
    topRow.appendChild(uptimeCol);
  }

  if (topRow.children.length > 0) page.appendChild(topRow);

  // Ping Monitor section (only if enabled in config)
  const pingMonEnabled = cfg?.analysen?.pingMonitor !== false;
  const pingMonContainer = el('div', { style: { marginTop: '16px' } });
  if (pingMonEnabled) page.appendChild(pingMonContainer);

  // Pi-hole section (only if enabled in config)
  const piholeEnabled = cfg?.analysen?.pihole !== false;
  const piholeContainer = el('div', { style: { marginTop: '28px' } });
  if (piholeEnabled) {
    piholeContainer.appendChild(el('div', {
      textContent: t('pihole.loading'),
      style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' },
    }));
    page.appendChild(piholeContainer);
  }

  container.appendChild(page);

  // Outages element ref (may be replaced)
  let currentOutages = outagesPlaceholder || null;
  let lastOutagesData = null;

  // Rebuild outages card when viewport crosses the mobile breakpoint
  const onBreakpointChange = () => {
    if (!currentOutages || !lastOutagesData) return;
    const newOutages = mobileQuery.matches
      ? buildOutagesMobileCard(lastOutagesData)
      : buildOutagesCardFromData(lastOutagesData);
    currentOutages.replaceWith(newOutages);
    currentOutages = newOutages;
  };
  mobileQuery.addEventListener('change', onBreakpointChange);

  // ── Render helpers (shared by fetch + WS push) ──

  function renderUptimeData(data) {
    if (destroyed) return;

    // Clear old timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerRefs.length = 0;

    if (uptimeGrid) {
      if (data && data.devices && data.devices.length > 0) {
        uptimeGrid.replaceChildren();
        for (const d of data.devices) {
          uptimeGrid.appendChild(buildDeviceUptimeCard(d, timerRefs));
        }
      } else {
        uptimeGrid.replaceChildren();
        uptimeGrid.appendChild(el('div', {
          className: 'card', style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0', gridColumn: '1 / -1' },
        }, [el('span', { textContent: t('analysen.noData') })]));
      }
    }

    if (currentOutages && data && data.outages !== undefined) {
      lastOutagesData = data.outages;
      const newOutages = mobileQuery.matches
        ? buildOutagesMobileCard(data.outages)
        : buildOutagesCardFromData(data.outages);
      currentOutages.replaceWith(newOutages);
      currentOutages = newOutages;
    }

    // Start live timer
    if (timerRefs.length > 0) {
      timerInterval = setInterval(() => {
        for (const ref of timerRefs) {
          ref.el.textContent = formatLiveTimer(ref.ts);
        }
      }, 1000);
    }
  }

  function renderPingMonitorData(data) {
    if (destroyed) return;
    pingMonContainer.replaceChildren();
    pingMonContainer.appendChild(buildPingMonitorSection(data));
  }

  function refreshUptime() {
    if (destroyed) return;
    api.getUptime().then(data => renderUptimeData(data)).catch(() => {
      renderUptimeData(null);
    });
  }

  function refreshPingMonitor() {
    if (destroyed) return;
    api.getPingMonitor().then(data => renderPingMonitorData(data)).catch(() => {
      renderPingMonitorData(null);
    });
  }

  function refreshPihole() {
    if (destroyed) return;

    api.getPiholeStatus().then(status => {
      if (destroyed) return;

      if (!status.configured) {
        piholeContainer.replaceChildren();
        piholeContainer.appendChild(el('div', { className: 'card' }, [
          sectionTitle(t('analysen.pihole'), 'piholeDnsColor'),
          el('div', {
            textContent: t('pihole.notConfigured'),
            style: { padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' },
          }),
        ]));
        return;
      }

      if (!status.reachable) {
        piholeContainer.replaceChildren();
        piholeContainer.appendChild(el('div', { className: 'card' }, [
          sectionTitle(t('analysen.pihole'), 'piholeDnsColor'),
          el('div', {
            textContent: t('pihole.unreachable'),
            style: { padding: '24px 0', textAlign: 'center', color: '#ef4444', fontSize: '0.88rem' },
          }),
        ]));
        return;
      }

      // Card toggles — default: all visible
      const cards = cfg?.pihole?.cards || {};
      const show = (key) => cards[key] !== false;

      // Only fetch APIs for enabled sections
      const fetches = [api.getPiholeSummary()]; // always needed for status
      const fetchKeys = ['summary'];

      if (show('queriesOverTime')) { fetches.push(api.getPiholeHistory()); fetchKeys.push('queriesOverTime'); }
      if (show('queryTypes'))      { fetches.push(api.getPiholeQueryTypes()); fetchKeys.push('queryTypes'); }
      if (show('topDomains'))      { fetches.push(api.getPiholeTopDomains(10)); fetchKeys.push('topDomains'); }
      if (show('topBlocked'))      { fetches.push(api.getPiholeTopBlocked(10)); fetchKeys.push('topBlocked'); }
      if (show('topClients'))      { fetches.push(api.getPiholeTopClients(10)); fetchKeys.push('topClients'); }
      if (show('upstreams'))       { fetches.push(api.getPiholeUpstreams()); fetchKeys.push('upstreams'); }

      Promise.all(fetches).then((results) => {
        if (destroyed) return;

        // Map results by key
        const r = {};
        for (let i = 0; i < fetchKeys.length; i++) r[fetchKeys[i]] = results[i];

        piholeContainer.replaceChildren();

        // Section title
        piholeContainer.appendChild(el('div', { className: 'section-title', style: { marginBottom: '16px' } }, [
          el('div', { className: 'section-header' }, [
            el('span', { className: 'icon-badge icon-red' }, [iconEl('piholeDnsColor', 22)]),
            el('h3', { textContent: t('analysen.pihole') }),
          ]),
        ]));

        // Summary cards
        if (show('summary')) {
          piholeContainer.appendChild(buildPiholeSummaryCards(r.summary));
        }

        // Queries over time (full width)
        if (show('queriesOverTime')) {
          piholeContainer.appendChild(buildQueriesOverTimeChart(r.queriesOverTime));
        }

        // Donuts row: query types + upstream servers (2 columns)
        const donuts = [];
        if (show('queryTypes')) donuts.push(buildQueryTypesDonut(r.queryTypes));
        if (show('upstreams')) donuts.push(buildUpstreamsDonut(r.upstreams));
        if (donuts.length > 0) {
          piholeContainer.appendChild(el('div', { className: 'pihole-donuts-row' }, donuts));
        }

        // Top lists: up to 3 columns
        const topCols = [];
        if (show('topDomains')) topCols.push(buildTopList(t('pihole.topDomains'), 'traffic', extractTopList(r.topDomains, 'domains'), 'var(--accent)'));
        if (show('topBlocked')) topCols.push(buildTopList(t('pihole.topBlocked'), 'outage', extractTopList(r.topBlocked, 'domains'), '#ef4444'));
        if (show('topClients')) topCols.push(buildTopList(t('pihole.topClients'), 'power', extractTopList(r.topClients, 'clients'), '#8b5cf6'));
        if (topCols.length > 0) {
          const cls = topCols.length === 3 ? 'grid three equal-height'
                    : topCols.length === 2 ? 'pihole-donuts-row'
                    : '';
          const wrapper = el('div', { className: cls }, topCols);
          piholeContainer.appendChild(wrapper);
        }
      }).catch(() => {
        if (destroyed) return;
        piholeContainer.replaceChildren();
        piholeContainer.appendChild(el('div', { className: 'card' }, [
          sectionTitle(t('analysen.pihole'), 'piholeDnsColor'),
          el('div', {
            textContent: t('pihole.unreachable'),
            style: { padding: '24px 0', textAlign: 'center', color: '#ef4444', fontSize: '0.88rem' },
          }),
        ]));
      });
    }).catch(() => {
      // Status check failed — likely not configured
      if (destroyed) return;
      piholeContainer.replaceChildren();
    });
  }

  // ── Fallback polling management ──

  function startFallbackPolling() {
    stopFallbackPolling();
    pollInterval = setInterval(() => refreshUptime(), pollMs);
    if (pingMonEnabled) pingMonInterval = setInterval(() => refreshPingMonitor(), pollMs);
  }

  function stopFallbackPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    if (pingMonInterval) { clearInterval(pingMonInterval); pingMonInterval = null; }
  }

  // ── WebSocket event handlers ──

  const onWsUptime = (e) => renderUptimeData(e.detail);
  const onWsPingMonitor = (e) => renderPingMonitorData(e.detail);

  const onWsConnected = () => {
    stopFallbackPolling();
  };

  const onWsDisconnected = () => {
    startFallbackPolling();
  };

  window.addEventListener('ws:uptime', onWsUptime);
  if (pingMonEnabled) window.addEventListener('ws:pingMonitor', onWsPingMonitor);
  window.addEventListener('ws:connected', onWsConnected);
  window.addEventListener('ws:disconnected', onWsDisconnected);

  // ── Initial fetch (always, for immediate data) ──

  refreshUptime();
  if (pingMonEnabled) refreshPingMonitor();
  if (piholeEnabled) refreshPihole();

  // Start fallback polling only if WS is not connected
  if (!wsConnected) {
    startFallbackPolling();
  }

  // Pi-hole always polls (no server-side push cycle)
  if (piholeEnabled) piholeInterval = setInterval(() => refreshPihole(), piholeMs);

  // Live-update when uptime is reset from settings
  const onReset = () => refreshUptime();
  window.addEventListener('uptime-reset', onReset);

  // Pause timers and polling when tab is hidden, resume when visible
  const onVisibilityChange = () => {
    if (destroyed) return;
    if (document.hidden) {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      stopFallbackPolling();
      if (piholeInterval) { clearInterval(piholeInterval); piholeInterval = null; }
    } else {
      // Restart live timer if there are refs
      if (timerRefs.length > 0 && !timerInterval) {
        timerInterval = setInterval(() => {
          for (const ref of timerRefs) {
            ref.el.textContent = formatLiveTimer(ref.ts);
          }
        }, 1000);
      }
      // Restart fallback polling if WS not connected
      if (!wsConnected) startFallbackPolling();
      if (piholeEnabled && !piholeInterval) piholeInterval = setInterval(() => refreshPihole(), piholeMs);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return function cleanup() {
    destroyed = true;
    if (timerInterval) clearInterval(timerInterval);
    stopFallbackPolling();
    if (piholeInterval) clearInterval(piholeInterval);
    window.removeEventListener('uptime-reset', onReset);
    window.removeEventListener('ws:uptime', onWsUptime);
    window.removeEventListener('ws:pingMonitor', onWsPingMonitor);
    window.removeEventListener('ws:connected', onWsConnected);
    window.removeEventListener('ws:disconnected', onWsDisconnected);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    mobileQuery.removeEventListener('change', onBreakpointChange);
    // Restore parent .page max-width for other pages
    if (parentPage) parentPage.style.maxWidth = '';
  };
}
