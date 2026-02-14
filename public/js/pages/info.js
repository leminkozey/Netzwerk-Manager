// ═══════════════════════════════════════════════════════════════════
// Info Page – Network details, devices, services, clients
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { state, on } from '../state.js';
import { el, showToast, debounce, pickTextColor, copyToClipboard } from '../ui.js';
import { iconEl } from '../icons.js';
import * as api from '../api.js';

// ── Cleanup tracking ─────────────────────────────────────────────
let _unsubs = [];

// ── Helpers ──────────────────────────────────────────────────────

function copyBtn(textFn) {
  return el('button', {
    className: 'copy-btn',
    title: t('ui.copy'),
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      const val = typeof textFn === 'function' ? textFn() : textFn;
      if (val) copyToClipboard(val);
    },
  }, [iconEl('copy', 14)]);
}

function eyeToggle(input) {
  let visible = false;
  const btn = el('button', {
    className: 'eye-btn',
    title: t('ui.show'),
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      visible = !visible;
      input.type = visible ? 'text' : 'password';
      btn.replaceChildren(iconEl(visible ? 'eyeOff' : 'eye', 16));
      btn.title = visible ? t('ui.hide') : t('ui.show');
    },
  }, [iconEl('eye', 16)]);
  return btn;
}

function sectionHeading(text) {
  return el('h2', { className: 'info-section-heading', textContent: text });
}

// ── Service field builder ──

function buildServiceField(label, value, onChange, opts = {}) {
  const isPassword = opts.password || false;

  const input = el('input', {
    type: isPassword ? 'password' : 'text',
    className: isPassword ? 'service-input service-input-pw' : 'service-input',
    value: value || '',
    placeholder: label,
  });

  if (onChange) {
    input.addEventListener('input', () => onChange(input.value));
  }

  let inputWrapper;
  if (isPassword) {
    inputWrapper = el('div', { className: 'service-input-wrap' }, [
      input,
      eyeToggle(input),
    ]);
  }

  const row = el('div', { className: 'service-field' }, [
    el('span', { className: 'service-field-label', textContent: label }),
    el('div', { className: 'service-field-value' }, [
      inputWrapper || input,
      copyBtn(() => input.value),
    ]),
  ]);

  return { row, input };
}

// ── Card link buttons ──

function buildCardLinks(links) {
  const container = el('div', { className: 'card-links' });

  function render() {
    container.replaceChildren();
    for (const link of links) {
      const url = typeof link.url === 'function' ? link.url() : link.url;
      const hasUrl = Boolean(url);
      const btn = el('a', {
        className: hasUrl ? 'card-link-btn' : 'card-link-btn card-link-disabled',
        ...(hasUrl ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {}),
      }, [
        iconEl('externalLink', 14),
        el('span', { textContent: link.label }),
      ]);
      if (!hasUrl) btn.addEventListener('click', (e) => e.preventDefault());
      container.appendChild(btn);
    }
  }

  render();
  return { container, render };
}

// ── Port table builder (Switch / Router) ─────────────────────────

function buildPortCard(title, colorIconName, ports, group) {
  const tbody = el('tbody');

  function renderRows() {
    tbody.replaceChildren();
    const list = group === 'switch' ? state.switchPorts : state.routerPorts;
    for (const port of list) {
      const statusInput = el('input', {
        type: 'text',
        className: 'inline-input',
        value: port.status || '',
        placeholder: t('table.notAssigned'),
      });

      const debouncedSave = debounce(async (val) => {
        try {
          await api.updatePort({ group, id: port.id, status: val });
        } catch {
          showToast(t('msg.error'), true);
        }
      }, 600);

      statusInput.addEventListener('input', () => {
        debouncedSave(statusInput.value);
      });

      const colorInput = el('input', {
        type: 'color',
        className: 'color-input',
        value: port.color || '#00d4ff',
      });

      colorInput.addEventListener('input', async () => {
        const color = colorInput.value;
        statusInput.style.color = pickTextColor(color);
        statusInput.style.backgroundColor = color;
        statusInput.classList.add('has-color');
        try {
          await api.updatePortColor({ group, id: port.id, color });
        } catch {
          showToast(t('msg.error'), true);
        }
      });

      if (port.color) {
        statusInput.style.color = pickTextColor(port.color);
        statusInput.style.backgroundColor = port.color;
        statusInput.classList.add('has-color');
      }

      tbody.appendChild(el('tr', {}, [
        el('td', { textContent: port.label || `Port ${port.id}` }),
        el('td', {}, [statusInput]),
        el('td', {}, [colorInput]),
      ]));
    }
  }

  renderRows();

  const card = el('section', { className: 'card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge' }, [iconEl(colorIconName, 24)]),
        el('h3', { textContent: title }),
      ]),
    ]),
    el('table', { className: 'table' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { textContent: t('table.port') }),
        el('th', { textContent: t('table.assignment') }),
        el('th', { textContent: t('table.color') }),
      ])]),
      tbody,
    ]),
  ]);

  _unsubs.push(on('stateUpdated', () => renderRows()));
  return card;
}

// ── PiHole card ──────────────────────────────────────────────────

function buildPiholeCard() {
  const fields = [
    { key: 'model',           label: t('pi.model') },
    { key: 'hostname',        label: t('pi.hostname') },
    { key: 'ipAddress',       label: t('pi.lanIp') },
    { key: 'vpnIp',           label: t('pi.vpnIp') },
    { key: 'macAddress',      label: t('pi.mac') },
    { key: 'sshUser',         label: t('pi.sshUser') },
    { key: 'sshPassword',     label: t('pi.sshPassword'), password: true },
    { key: 'piholeUrl',       label: t('pi.piholeUrl') },
    { key: 'piholeRemoteUrl', label: t('pi.piholeVpnUrl') },
  ];

  const debouncedSave = debounce(async () => {
    try {
      await api.saveRaspberry(state.raspberryInfo);
      showToast(t('msg.saved'));
    } catch {
      showToast(t('msg.error'), true);
    }
  }, 800);

  const fieldContainer = el('div', { className: 'service-fields' });

  function renderFields() {
    fieldContainer.replaceChildren();
    for (const f of fields) {
      const value = state.raspberryInfo[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        state.raspberryInfo[f.key] = val;
        debouncedSave();
      }, { password: f.password });
      fieldContainer.appendChild(row);
    }
  }

  const piholeLinks = buildCardLinks([
    { label: t('pi.openAdmin'), url: () => state.raspberryInfo.piholeUrl },
    { label: t('pi.openVpn'),   url: () => state.raspberryInfo.piholeRemoteUrl },
  ]);

  renderFields();
  _unsubs.push(on('stateUpdated', () => {
    if (!document.activeElement || !fieldContainer.contains(document.activeElement)) renderFields();
    piholeLinks.render();
  }));

  return el('section', { className: 'card service-card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge' }, [iconEl('raspberryColor', 26)]),
        el('h3', { textContent: t('card.pihole') }),
      ]),
    ]),
    fieldContainer,
    piholeLinks.container,
  ]);
}

// ── Speedport card ───────────────────────────────────────────────

function buildSpeedportCard() {
  const fields = [
    { key: 'wifiName',       label: t('speedport.wifiName') },
    { key: 'wifiPassword',   label: t('speedport.wifiPassword'), password: true },
    { key: 'serialNumber',   label: t('speedport.serial') },
    { key: 'configuration',  label: t('speedport.config') },
    { key: 'remoteUrl',      label: t('speedport.vpnUrl') },
    { key: 'devicePassword', label: t('speedport.devicePassword'), password: true },
    { key: 'modemId',        label: t('speedport.modemId') },
  ];

  const debouncedSave = debounce(async () => {
    try {
      await api.saveSpeedport(state.speedportInfo);
      showToast(t('msg.saved'));
    } catch {
      showToast(t('msg.error'), true);
    }
  }, 800);

  const fieldContainer = el('div', { className: 'service-fields' });

  function renderFields() {
    fieldContainer.replaceChildren();
    for (const f of fields) {
      const value = state.speedportInfo[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        state.speedportInfo[f.key] = val;
        debouncedSave();
      }, { password: f.password });
      fieldContainer.appendChild(row);
    }
  }

  const speedportLinks = buildCardLinks([
    { label: t('speedport.openVpn'), url: () => state.speedportInfo.remoteUrl },
  ]);

  renderFields();
  _unsubs.push(on('stateUpdated', () => {
    if (!document.activeElement || !fieldContainer.contains(document.activeElement)) renderFields();
    speedportLinks.render();
  }));

  return el('section', { className: 'card service-card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge' }, [iconEl('speedportColor', 26)]),
        el('h3', { textContent: t('card.speedport') }),
      ]),
    ]),
    fieldContainer,
    speedportLinks.container,
  ]);
}

// ── Windows PC Info card ─────────────────────────────────────────

function buildWindowsPCCard() {
  const fieldContainer = el('div', { className: 'service-fields' });

  const fields = [
    { key: 'hostname',    label: t('pi.hostname') },
    { key: 'ipAddress',   label: t('pc.ip') },
    { key: 'macAddress',  label: t('pc.mac') },
    { key: 'sshUser',     label: t('pc.sshUser') },
    { key: 'sshPassword', label: t('pc.sshPassword'), password: true },
  ];

  const debouncedSave = debounce(async () => {
    try {
      await api.saveControlDevice('windowspc', state.windowsPCInfo || {});
      showToast(t('msg.saved'));
    } catch {
      showToast(t('msg.error'), true);
    }
  }, 800);

  function renderFields() {
    fieldContainer.replaceChildren();
    for (const f of fields) {
      const value = state.windowsPCInfo[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        state.windowsPCInfo[f.key] = val;
        debouncedSave();
      }, { password: f.password });
      fieldContainer.appendChild(row);
    }
  }

  // Load initial data from server
  (async () => {
    try {
      const data = await api.getControlDevice('windowspc');
      if (!state.windowsPCInfo) state.windowsPCInfo = {};
      // Only copy the fields we care about (not id, name, type, actions, etc.)
      for (const f of fields) {
        if (data[f.key] !== undefined && data[f.key] !== '') {
          state.windowsPCInfo[f.key] = data[f.key];
        }
      }
    } catch {
      if (!state.windowsPCInfo) state.windowsPCInfo = {};
    }
    renderFields();
  })();

  // Guard: don't re-render while user is editing fields in this card
  _unsubs.push(on('stateUpdated', () => {
    if (!document.activeElement || !fieldContainer.contains(document.activeElement)) renderFields();
  }));

  return el('section', { className: 'card service-card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge' }, [iconEl('windowsColor', 26)]),
        el('h3', { textContent: t('card.windowspc') }),
      ]),
    ]),
    fieldContainer,
  ]);
}


// ═══════════════════════════════════════════════════════════════════
// Main render
// ═══════════════════════════════════════════════════════════════════

export function renderInfo(container) {
  _unsubs.forEach(fn => fn());
  _unsubs = [];

  const parentPage = container.closest('.page');
  if (parentPage) parentPage.style.maxWidth = 'none';

  const page = el('div', { className: 'page-wide', style: { maxWidth: 'none' } });

  // Netzwerkgeräte
  page.appendChild(sectionHeading(t('section.devices')));
  page.appendChild(el('div', { className: 'grid two equal-height' }, [
    buildPortCard(t('card.switch'), 'switchColor', state.switchPorts, 'switch'),
    buildPortCard(t('card.router'), 'routerColor', state.routerPorts, 'router'),
  ]));

  // Services
  page.appendChild(sectionHeading(t('section.services')));
  page.appendChild(el('div', { className: 'grid two equal-height' }, [
    buildPiholeCard(),
    buildSpeedportCard(),
  ]));

  // Clients
  page.appendChild(sectionHeading(t('section.clients')));
  page.appendChild(buildWindowsPCCard());

  container.appendChild(page);

  return function cleanup() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
    if (parentPage) parentPage.style.maxWidth = '';
  };
}
