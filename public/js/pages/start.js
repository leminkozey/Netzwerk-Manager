// =================================================================
// Start Page – Control Center (Device Management)
// =================================================================

import { t } from '../i18n.js';
import { el, showToast, showConfirm } from '../ui.js';
import { icon, iconEl } from '../icons.js';
import * as api from '../api.js';

// ── Helpers ──

function statusClass(status) {
  if (status === 'online') return 'online';
  if (status === 'offline') return 'offline';
  return 'unknown';
}

function statusLabel(status) {
  if (status === 'online') return t('pc.status.online');
  if (status === 'offline') return t('pc.status.offline');
  return t('pc.status.checking');
}

function statusIcon(status) {
  if (status === 'online') return icon('online', 14);
  if (status === 'offline') return icon('offline', 14);
  return icon('unknown', 14);
}


// ── Section Title ──

function buildSectionTitle(text) {
  return el('div', { className: 'section-title', style: { marginBottom: '20px' } }, [
    el('h3', { textContent: text }),
  ]);
}

// ── Windows PC Tile ──

function buildWindowsPCTile() {
  let pcStatus = 'unknown';
  let pcConfig = { name: '...', ip: '...', mac: '...' };

  // Status indicator
  const statusText = el('span', { className: 'status-text', textContent: statusLabel('unknown') });
  const statusIconSpan = el('span', { className: 'status-icon-wrap', innerHTML: statusIcon('unknown') });

  const statusContainer = el('div', {
    className: 'device-tile-status pc-status',
  }, [statusIconSpan, statusText]);

  // Device info fields
  const nameValue = el('span', { className: 'pc-info-value', textContent: '...' });
  const ipValue = el('span', { className: 'pc-info-value', textContent: '...' });
  const macValue = el('span', { className: 'pc-info-value', textContent: '...' });

  const infoGrid = el('div', { className: 'pc-info-grid' }, [
    el('div', { className: 'pc-info-item' }, [
      el('span', { className: 'pc-info-label', textContent: t('pc.name') }),
      nameValue,
    ]),
    el('div', { className: 'pc-info-item' }, [
      el('span', { className: 'pc-info-label', textContent: t('pc.ip') }),
      ipValue,
    ]),
    el('div', { className: 'pc-info-item', style: { gridColumn: '1 / -1' } }, [
      el('span', { className: 'pc-info-label', textContent: t('pc.mac') }),
      macValue,
    ]),
  ]);

  // Action buttons
  const wakeBtn = el('button', {
    className: 'action-circle wake-btn pc-wake-btn',
    onClick: async () => {
      try {
        await api.wakeWindowsPC();
        showToast(t('pc.wakeSuccess'));
      } catch {
        showToast(t('pc.connectionError'), true);
      }
    },
  }, [iconEl('wake', 32), el('span', { textContent: t('pc.wake') })]);

  const shutdownBtn = el('button', {
    className: 'action-circle shutdown-btn pc-shutdown-btn',
    onClick: () => {
      showConfirm(
        t('pc.shutdown'),
        t('msg.confirmShutdown'),
        async () => {
          try {
            await api.shutdownWindowsPC();
            showToast(t('pc.shutdownSuccess'));
          } catch {
            showToast(t('pc.connectionError'), true);
          }
        }
      );
    },
  }, [iconEl('shutdown', 32), el('span', { textContent: t('pc.shutdown') })]);

  const actionsRow = el('div', { className: 'device-tile-actions pc-buttons' }, [
    wakeBtn,
    shutdownBtn,
  ]);

  // Header with icon and status
  const tileHeader = el('div', {
    className: 'device-tile-header section-title',
    style: { flexWrap: 'wrap', gap: '12px' },
  }, [
    el('div', { className: 'section-header' }, [
      el('span', { className: 'icon-badge', innerHTML: icon('windowsColor', 22) }),
      el('h3', { textContent: t('card.windowspc') }),
    ]),
    statusContainer,
  ]);

  // Full tile card
  const tile = el('div', { className: 'device-tile card windows-pc-card' }, [
    tileHeader,
    el('div', { className: 'pc-control-grid' }, [
      actionsRow,
      infoGrid,
    ]),
  ]);

  // Update status UI
  function updateStatus(status) {
    pcStatus = status;
    const cls = statusClass(status);
    statusContainer.className = `device-tile-status pc-status ${cls}`;
    statusText.textContent = statusLabel(status);
    statusIconSpan.innerHTML = statusIcon(status);
  }

  // Update config UI
  function updateConfig(config) {
    pcConfig = config;
    nameValue.textContent = config.name || config.hostname || 'Windows PC';
    ipValue.textContent = config.ip || '-';
    macValue.textContent = config.mac || '-';
  }

  return { tile, updateStatus, updateConfig };
}

// ── Placeholder Section ──

function buildPlaceholderSection() {
  return el('div', {
    className: 'card',
    style: {
      border: '2px dashed var(--border)',
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      textAlign: 'center',
      padding: '40px 24px',
    },
  }, [
    el('div', { style: { marginBottom: '12px' } }, [
      el('h3', {
        textContent: t('section.containerServices'),
        style: {
          margin: '0 0 8px',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: 'var(--text-muted)',
        },
      }),
    ]),
    el('p', {
      textContent: t('start.comingSoon'),
      style: {
        margin: '0',
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        opacity: '0.7',
      },
    }),
  ]);
}

// ── Main Render ──

export function renderStart(container) {
  let pollInterval = null;
  let destroyed = false;

  const page = el('div', { className: 'page-wide' });

  // Section: Gerätesteuerung
  page.appendChild(buildSectionTitle(t('section.control')));

  // Windows PC tile
  const { tile, updateStatus, updateConfig } = buildWindowsPCTile();
  page.appendChild(tile);

  // Placeholder section
  page.appendChild(el('div', { style: { marginTop: '32px' } }));
  page.appendChild(buildSectionTitle(t('section.containerServices')));
  page.appendChild(buildPlaceholderSection());

  container.appendChild(page);

  // ── Load config ──
  (async () => {
    try {
      const config = await api.getWindowsPC();
      if (!destroyed) updateConfig(config);
    } catch {
      // Config not available yet
    }
  })();

  // ── Status polling ──
  async function pollStatus() {
    if (destroyed) return;
    try {
      const result = await api.getWindowsPCStatus();
      if (!destroyed) {
        updateStatus(result.online ? 'online' : 'offline');
      }
    } catch {
      if (!destroyed) {
        updateStatus('unknown');
      }
    }
  }

  pollStatus();
  pollInterval = setInterval(pollStatus, 5000);

  // ── Cleanup ──
  return function cleanup() {
    destroyed = true;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}
