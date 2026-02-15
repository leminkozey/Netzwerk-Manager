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

// ── Zeitplan-Formatierung ──

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function formatNextExecution(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toDateString();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (date.toDateString() === todayStr) {
    return `${t('schedule.today')} ${time}`;
  }
  if (date.toDateString() === tomorrowStr) {
    return `${t('schedule.tomorrow')} ${time}`;
  }

  const dayKey = WEEKDAY_KEYS[date.getDay()];
  return `${t(`schedule.days.${dayKey}`)} ${time}`;
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

  // Zeitplan-Anzeige (wird dynamisch befüllt)
  const scheduleContainer = el('div', {
    className: 'device-schedule-info',
    style: { display: 'none' },
  });

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
    scheduleContainer,
  ]);

  // Update status UI
  function updateStatus(status) {
    const cls = statusClass(status);
    statusContainer.className = `device-tile-status device-status ${cls}`;
    statusText.textContent = statusLabel(status);
    statusIconSpan.replaceChildren(statusIconNode(status));
  }

  // Zeitplan-Anzeige aktualisieren
  function updateSchedule(data) {
    scheduleContainer.replaceChildren();
    if (!data) { scheduleContainer.style.display = 'none'; return; }

    const rows = [];
    if (data.nextWake) {
      const formatted = formatNextExecution(data.nextWake);
      if (formatted) {
        rows.push(el('div', { className: 'schedule-row' }, [
          iconEl('schedule', 14),
          el('span', { className: 'schedule-label', textContent: t('schedule.nextWake') }),
          el('span', { className: 'schedule-time', textContent: formatted }),
        ]));
      }
    }
    if (data.nextShutdown) {
      const formatted = formatNextExecution(data.nextShutdown);
      if (formatted) {
        rows.push(el('div', { className: 'schedule-row' }, [
          iconEl('schedule', 14),
          el('span', { className: 'schedule-label', textContent: t('schedule.nextShutdown') }),
          el('span', { className: 'schedule-time', textContent: formatted }),
        ]));
      }
    }

    if (rows.length > 0) {
      scheduleContainer.style.display = '';
      rows.forEach(r => scheduleContainer.appendChild(r));
    } else {
      scheduleContainer.style.display = 'none';
    }
  }

  return { tile, updateStatus, updateSchedule, deviceId: device.id };
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

// ── Service Status Helpers ──

function serviceStatusClass(status) {
  if (status === 'running') return 'online';
  if (status === 'stopped') return 'offline';
  if (status === 'error') return 'offline';
  return 'unknown';
}

function serviceStatusLabel(status) {
  if (status === 'running') return t('service.status.running');
  if (status === 'stopped') return t('service.status.stopped');
  if (status === 'error') return t('service.status.error');
  return t('service.status.unknown');
}

function serviceStatusIconNode(status) {
  if (status === 'running') return iconEl('online', 14);
  if (status === 'stopped' || status === 'error') return iconEl('offline', 14);
  return iconEl('unknown', 14);
}

const SERVICE_ACTION_SUCCESS_KEYS = {
  start: 'service.startSuccess',
  stop: 'service.shutdownSuccess',
  restart: 'service.restartSuccess',
};

// Reuse device control button classes + icons for consistent look & animations
const SERVICE_ACTION_CONFIG = {
  start:   { icon: 'wake',     btnClass: 'wake-btn',     label: 'service.start' },
  restart: { icon: 'restart',  btnClass: 'restart-btn',  label: 'service.restart' },
  stop:    { icon: 'shutdown', btnClass: 'shutdown-btn',  label: 'service.shutdown' },
};

// ── Service Tile ──

function buildServiceTile(service, isDestroyed) {
  const statusText = el('span', { className: 'status-text', textContent: serviceStatusLabel('unknown') });
  const statusIconSpan = el('span', { className: 'status-icon-wrap' }, [serviceStatusIconNode('unknown')]);

  const statusContainer = el('div', {
    className: 'device-tile-status device-status',
  }, [statusIconSpan, statusText]);

  // Type badge
  const typeBadge = el('span', {
    className: 'service-type-badge',
    textContent: service.type || '',
  });

  const actionButtons = ['start', 'restart', 'stop'].map(action => {
    const cfg = SERVICE_ACTION_CONFIG[action];
    const btn = el('button', {
      className: `action-circle ${cfg.btnClass}`,
      onClick: async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        try {
          const result = await api.serviceAction(service.id, action);
          if (result.success) {
            showToast(t(SERVICE_ACTION_SUCCESS_KEYS[action] || 'msg.success'));
          } else {
            showToast(result.message || t('service.connectionError'), true);
          }
        } catch {
          showToast(t('service.connectionError'), true);
        } finally {
          btn.disabled = false;
        }
        // Re-poll status after action with retry sequence
        for (const delay of [1500, 4000, 8000]) {
          setTimeout(() => {
            if (isDestroyed()) return;
            api.getServiceStatus(service.id).then(data => {
              if (isDestroyed()) return;
              if (data) updateStatus(data.status || 'unknown');
            }).catch(() => {});
          }, delay);
        }
      },
    }, [iconEl(cfg.icon, 32), el('span', { textContent: t(cfg.label) })]);
    return btn;
  });

  const actionsRow = el('div', { className: 'device-tile-actions' }, actionButtons);

  const tileHeader = el('div', {
    className: 'device-tile-header section-title',
    style: { flexWrap: 'wrap', gap: '12px' },
  }, [
    el('div', { className: 'section-header', style: { gap: '10px' } }, [
      el('span', { className: 'icon-badge' }, [iconEl(service.icon || 'serverColor', 22)]),
      el('h3', { textContent: service.name }),
      typeBadge,
    ]),
    statusContainer,
  ]);

  const tile = el('div', { className: 'device-tile card' }, [
    tileHeader,
    actionsRow,
  ]);

  function updateStatus(status) {
    const cls = serviceStatusClass(status);
    statusContainer.className = `device-tile-status device-status ${cls}`;
    statusText.textContent = serviceStatusLabel(status);
    statusIconSpan.replaceChildren(serviceStatusIconNode(status));
  }

  return { tile, updateStatus, serviceId: service.id };
}

// ── Main Render ──

export function renderStart(container) {
  let pollInterval = null;
  let destroyed = false;

  const page = el('div', { className: 'page-wide' });

  // Section: Gerätesteuerung
  page.appendChild(buildSectionTitle(t('section.control')));

  // Build tiles from config (show !== false → default visible)
  const cfg = getConfig();
  const devices = cfg?.controlDevices && Array.isArray(cfg.controlDevices)
    ? cfg.controlDevices.filter(d => d.show !== false)
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
      const { tile, updateStatus, updateSchedule, deviceId } = buildDeviceTile(device);
      tiles.push({ updateStatus, updateSchedule, deviceId });
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

  // ── Services Section ──
  const services = cfg?.services && Array.isArray(cfg.services) ? cfg.services : [];
  const serviceTiles = [];

  page.appendChild(el('div', { style: { marginTop: '32px' } }));
  page.appendChild(buildSectionTitle(t('section.containerServices')));

  if (services.length === 0) {
    page.appendChild(buildPlaceholderSection());
  } else {
    const isDestroyed = () => destroyed;
    for (const service of services) {
      const { tile, updateStatus, serviceId } = buildServiceTile(service, isDestroyed);
      serviceTiles.push({ updateStatus, serviceId });
      page.appendChild(tile);
    }
  }

  container.appendChild(page);

  // ── Status polling (devices) ──
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

  // ── Status polling (services) ──
  let servicePollInterval = null;

  async function pollServiceStatus() {
    if (destroyed || serviceTiles.length === 0) return;

    try {
      const statuses = await api.getAllServiceStatuses();
      if (destroyed) return;
      for (const st of serviceTiles) {
        st.updateStatus(statuses[st.serviceId] || 'unknown');
      }
    } catch {
      if (destroyed) return;
      for (const st of serviceTiles) {
        st.updateStatus('unknown');
      }
    }
  }

  if (serviceTiles.length > 0) {
    pollServiceStatus();
    servicePollInterval = setInterval(pollServiceStatus, 10000);
  }

  // ── Zeitplan-Polling ──
  let scheduleInterval = null;

  async function pollSchedules() {
    if (destroyed || tiles.length === 0) return;
    try {
      const schedules = await api.getSchedules();
      for (const tile of tiles) {
        tile.updateSchedule(schedules[tile.deviceId] || null);
      }
    } catch { /* Zeitplan-Fehler still ignorieren */ }
  }

  pollSchedules();
  scheduleInterval = setInterval(pollSchedules, 60000);

  // Pause polling when tab is hidden, resume when visible
  const onVisibilityChange = () => {
    if (destroyed) return;
    if (document.hidden) {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      if (piholePollInterval) { clearInterval(piholePollInterval); piholePollInterval = null; }
      if (scheduleInterval) { clearInterval(scheduleInterval); scheduleInterval = null; }
      if (servicePollInterval) { clearInterval(servicePollInterval); servicePollInterval = null; }
    } else {
      if (!pollInterval) { pollStatus(); pollInterval = setInterval(pollStatus, 5000); }
      if (!scheduleInterval) { pollSchedules(); scheduleInterval = setInterval(pollSchedules, 60000); }
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
      if (!servicePollInterval && serviceTiles.length > 0) {
        pollServiceStatus();
        servicePollInterval = setInterval(pollServiceStatus, 10000);
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
    if (scheduleInterval) {
      clearInterval(scheduleInterval);
      scheduleInterval = null;
    }
    if (servicePollInterval) {
      clearInterval(servicePollInterval);
      servicePollInterval = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
