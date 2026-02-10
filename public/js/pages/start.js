// =================================================================
// Start Page – Control Center (Device Management)
// =================================================================

import { t } from '../i18n.js';
import { getConfig } from '../state.js';
import { el, showToast } from '../ui.js';
import { iconEl } from '../icons.js';
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

function statusIconNode(status) {
  if (status === 'online') return iconEl('online', 14);
  if (status === 'offline') return iconEl('offline', 14);
  return iconEl('unknown', 14);
}

// ── Success message mapping ──

const ACTION_SUCCESS_KEYS = {
  wake: 'control.wakeSuccess',
  shutdown: 'control.shutdownSuccess',
  restart: 'control.restartSuccess',
};

// ── Section Title ──

function buildSectionTitle(text) {
  return el('div', { className: 'section-title', style: { marginBottom: '20px' } }, [
    el('h3', { textContent: text }),
  ]);
}

// ── Generic Device Tile ──

function buildDeviceTile(device) {
  // Status indicator
  const statusText = el('span', { className: 'status-text', textContent: statusLabel('unknown') });
  const statusIconSpan = el('span', { className: 'status-icon-wrap' }, [statusIconNode('unknown')]);

  const statusContainer = el('div', {
    className: 'device-tile-status device-status',
  }, [statusIconSpan, statusText]);

  // Action buttons
  const actionButtons = (device.actions || []).map(action => {
    const btnClass = `action-circle ${action}-btn`;
    return el('button', {
      className: btnClass,
      onClick: async () => {
        try {
          await api.controlDeviceAction(device.id, action);
          showToast(t(ACTION_SUCCESS_KEYS[action] || 'msg.success'));
        } catch {
          showToast(t('control.connectionError'), true);
        }
      },
    }, [iconEl(action, 32), el('span', { textContent: t(`control.${action}`) })]);
  });

  const actionsRow = el('div', { className: 'device-tile-actions' }, actionButtons);

  // Header with icon and status
  const tileHeader = el('div', {
    className: 'device-tile-header section-title',
    style: { flexWrap: 'wrap', gap: '12px' },
  }, [
    el('div', { className: 'section-header' }, [
      el('span', { className: 'icon-badge' }, [iconEl(device.icon || 'windowsColor', 22)]),
      el('h3', { textContent: device.name }),
    ]),
    statusContainer,
  ]);

  // Full tile card
  const tile = el('div', { className: 'device-tile card' }, [
    tileHeader,
    actionsRow,
  ]);

  // Update status UI
  function updateStatus(status) {
    const cls = statusClass(status);
    statusContainer.className = `device-tile-status device-status ${cls}`;
    statusText.textContent = statusLabel(status);
    statusIconSpan.replaceChildren(statusIconNode(status));
  }

  return { tile, updateStatus, deviceId: device.id };
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

  // Build tiles from config
  const cfg = getConfig();
  const devices = cfg?.controlDevices && Array.isArray(cfg.controlDevices)
    ? cfg.controlDevices
    : [];

  const tiles = [];

  if (devices.length === 0) {
    page.appendChild(el('p', {
      className: 'muted',
      textContent: t('control.noDevices'),
      style: { textAlign: 'center', padding: '20px 0' },
    }));
  } else {
    for (const device of devices) {
      const { tile, updateStatus, deviceId } = buildDeviceTile(device);
      tiles.push({ updateStatus, deviceId });
      page.appendChild(tile);
    }
  }

  // ── Pi-hole Blocking Toggle ──
  const piholeTileContainer = el('div');
  page.appendChild(piholeTileContainer);

  // Shared refs for Pi-hole tile (set once tile is built, used by poll)
  let piholeRefs = null;
  let piholePollInterval = null;
  const showBlockingToggle = cfg?.pihole?.blockingToggle !== false;

  showBlockingToggle && api.getPiholeStatus().then(status => {
    if (destroyed || !status.configured) return;

    const isReachable = status.reachable;

    const blockingPromise = isReachable
      ? api.getPiholeBlocking().catch(() => null)
      : Promise.resolve(null);

    return blockingPromise.then(blockingData => {
      if (destroyed) return;

      let currentBlocking = blockingData && typeof blockingData.blocking === 'boolean'
        ? blockingData.blocking : null;

      // Status badge
      const statusCls = !isReachable ? 'offline'
        : currentBlocking === true ? 'online'
        : currentBlocking === false ? 'offline'
        : 'unknown';
      const statusLbl = !isReachable ? t('pc.status.offline')
        : currentBlocking === true ? t('pihole.blockingActive')
        : currentBlocking === false ? t('pihole.blockingInactive')
        : t('pc.status.checking');
      const statusIcon = !isReachable ? 'offline'
        : currentBlocking === true ? 'online'
        : currentBlocking === false ? 'offline'
        : 'unknown';

      const statusText = el('span', { className: 'status-text', textContent: statusLbl });
      const statusIconSpan = el('span', { className: 'status-icon-wrap' }, [iconEl(statusIcon, 14)]);
      const statusContainer = el('div', {
        className: `device-tile-status device-status ${statusCls}`,
      }, [statusIconSpan, statusText]);

      const tileHeader = el('div', {
        className: 'device-tile-header section-title',
        style: { flexWrap: 'wrap', gap: '12px' },
      }, [
        el('div', { className: 'section-header' }, [
          el('span', { className: 'icon-badge icon-red' }, [iconEl('piholeDnsColor', 22)]),
          el('h3', { textContent: t('card.pihole') }),
        ]),
        statusContainer,
      ]);

      // Action button — only if reachable and we have a blocking state
      const actionsRow = el('div', { className: 'device-tile-actions' });
      let actionBtn = null;

      function updateBlockingUI(blocking) {
        const cls = blocking ? 'online' : 'offline';
        statusContainer.className = `device-tile-status device-status ${cls}`;
        statusText.textContent = blocking ? t('pihole.blockingActive') : t('pihole.blockingInactive');
        statusIconSpan.replaceChildren(iconEl(blocking ? 'online' : 'offline', 14));
        if (actionBtn) {
          actionBtn.className = `action-circle ${blocking ? 'pause-btn' : 'resume-btn'}`;
          actionBtn.querySelector('.pihole-btn-icon').replaceChildren(iconEl(blocking ? 'pause' : 'play', 32));
          actionBtn.querySelector('.pihole-btn-label').textContent = blocking ? t('pihole.pause') : t('pihole.resume');
        }
      }

      if (isReachable && currentBlocking !== null) {
        const btnIcon = el('span', { className: 'pihole-btn-icon' });
        const btnLabel = el('span', { className: 'pihole-btn-label' });
        actionBtn = el('button', { className: 'action-circle' }, [btnIcon, btnLabel]);

        updateBlockingUI(currentBlocking);

        actionBtn.addEventListener('click', () => {
          if (actionBtn.disabled) return;
          actionBtn.disabled = true;
          api.setPiholeBlocking(!currentBlocking).then(res => {
            if (typeof res.blocking !== 'boolean') throw new Error('Unexpected response');
            currentBlocking = res.blocking;
            updateBlockingUI(currentBlocking);
          }).catch(() => {
            showToast(t('control.connectionError'), true);
          }).finally(() => {
            actionBtn.disabled = false;
          });
        });

        actionsRow.appendChild(actionBtn);

        // Store refs for periodic polling
        piholeRefs = {
          updateBlockingUI,
          getCurrentBlocking: () => currentBlocking,
          setCurrentBlocking: (v) => { currentBlocking = v; },
        };
      }

      const tile = el('div', { className: 'device-tile card' }, [tileHeader, actionsRow]);
      piholeTileContainer.appendChild(tile);

      // Periodic blocking status refresh (every 15s)
      if (piholeRefs) {
        piholePollInterval = setInterval(() => {
          if (destroyed) return;
          api.getPiholeBlocking().then(data => {
            if (destroyed || !data || typeof data.blocking !== 'boolean') return;
            if (data.blocking !== piholeRefs.getCurrentBlocking()) {
              piholeRefs.setCurrentBlocking(data.blocking);
              piholeRefs.updateBlockingUI(data.blocking);
            }
          }).catch(() => {});
        }, 15000);
      }
    });
  }).catch(err => { console.error('[Pi-hole tile]', err); });

  // Placeholder section
  page.appendChild(el('div', { style: { marginTop: '32px' } }));
  page.appendChild(buildSectionTitle(t('section.containerServices')));
  page.appendChild(buildPlaceholderSection());

  container.appendChild(page);

  // ── Status polling ──
  async function pollStatus() {
    if (destroyed || tiles.length === 0) return;

    const results = await Promise.allSettled(
      tiles.map(tile => api.getControlDeviceStatus(tile.deviceId))
    );

    for (let i = 0; i < tiles.length; i++) {
      if (destroyed) return;
      const result = results[i];
      if (result.status === 'fulfilled') {
        tiles[i].updateStatus(result.value.online ? 'online' : 'offline');
      } else {
        tiles[i].updateStatus('unknown');
      }
    }
  }

  pollStatus();
  pollInterval = setInterval(pollStatus, 5000);

  // Pause polling when tab is hidden, resume when visible
  const onVisibilityChange = () => {
    if (destroyed) return;
    if (document.hidden) {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      if (piholePollInterval) { clearInterval(piholePollInterval); piholePollInterval = null; }
    } else {
      if (!pollInterval) { pollStatus(); pollInterval = setInterval(pollStatus, 5000); }
      if (!piholePollInterval && piholeRefs) {
        piholePollInterval = setInterval(() => {
          if (destroyed) return;
          api.getPiholeBlocking().then(data => {
            if (destroyed || !data || typeof data.blocking !== 'boolean') return;
            if (data.blocking !== piholeRefs.getCurrentBlocking()) {
              piholeRefs.setCurrentBlocking(data.blocking);
              piholeRefs.updateBlockingUI(data.blocking);
            }
          }).catch(() => {});
        }, 15000);
      }
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // ── Cleanup ──
  return function cleanup() {
    destroyed = true;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (piholePollInterval) {
      clearInterval(piholePollInterval);
      piholePollInterval = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
