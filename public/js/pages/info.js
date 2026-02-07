// ═══════════════════════════════════════════════════════════════════
// Info Page – Network details, devices, services, clients
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { state, on } from '../state.js';
import { el, showToast, debounce, pickTextColor, copyToClipboard } from '../ui.js';
import { icon } from '../icons.js';
import * as api from '../api.js';

// ── Helpers ──────────────────────────────────────────────────────

function copyBtn(textFn) {
  return el('button', {
    className: 'copy-btn',
    innerHTML: icon('copy', 14),
    title: 'Kopieren',
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      const val = typeof textFn === 'function' ? textFn() : textFn;
      if (val) copyToClipboard(val);
    },
  });
}

function eyeToggle(input) {
  let visible = false;
  const btn = el('button', {
    className: 'eye-btn',
    innerHTML: icon('eye', 16),
    title: 'Anzeigen',
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      visible = !visible;
      input.type = visible ? 'text' : 'password';
      btn.innerHTML = icon(visible ? 'eyeOff' : 'eye', 16);
      btn.title = visible ? 'Verstecken' : 'Anzeigen';
    },
  });
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

// ── Port table builder (Switch / Router) ─────────────────────────

function buildPortCard(title, colorIconName, ports, group) {
  const tbody = el('tbody');

  function renderRows() {
    tbody.innerHTML = '';
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
        el('span', { className: 'icon-badge', innerHTML: icon(colorIconName, 24) }),
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

  on('stateUpdated', () => renderRows());
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
    { key: 'sshPassword',     label: 'SSH Passwort', password: true },
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
    fieldContainer.innerHTML = '';
    for (const f of fields) {
      const value = state.raspberryInfo[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        state.raspberryInfo[f.key] = val;
        debouncedSave();
      }, { password: f.password });
      fieldContainer.appendChild(row);
    }
  }

  renderFields();
  on('stateUpdated', () => {
    if (!document.activeElement || !fieldContainer.contains(document.activeElement)) renderFields();
  });

  return el('section', { className: 'card service-card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge', innerHTML: icon('raspberryColor', 26) }),
        el('h3', { textContent: t('card.pihole') }),
      ]),
    ]),
    fieldContainer,
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
    fieldContainer.innerHTML = '';
    for (const f of fields) {
      const value = state.speedportInfo[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        state.speedportInfo[f.key] = val;
        debouncedSave();
      }, { password: f.password });
      fieldContainer.appendChild(row);
    }
  }

  renderFields();
  on('stateUpdated', () => {
    if (!document.activeElement || !fieldContainer.contains(document.activeElement)) renderFields();
  });

  return el('section', { className: 'card service-card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge', innerHTML: icon('speedportColor', 26) }),
        el('h3', { textContent: t('card.speedport') }),
      ]),
    ]),
    fieldContainer,
  ]);
}

// ── Windows PC Info card ─────────────────────────────────────────

function buildWindowsPCCard() {
  const fieldContainer = el('div', { className: 'service-fields' });
  let loaded = false;

  const debouncedSave = debounce(async () => {
    try {
      await api.saveWindowsPC(state.windowsPCInfo || {});
      showToast(t('msg.saved'));
    } catch {
      showToast(t('msg.error'), true);
    }
  }, 800);

  function renderInfo(data) {
    fieldContainer.innerHTML = '';
    if (!state.windowsPCInfo) state.windowsPCInfo = {};
    Object.assign(state.windowsPCInfo, data);

    const fields = [
      { key: 'hostname',    label: 'Hostname' },
      { key: 'ipAddress',   label: t('pc.ip') },
      { key: 'macAddress',  label: t('pc.mac') },
      { key: 'sshUser',     label: t('pc.sshUser') },
      { key: 'sshPassword', label: 'SSH Passwort', password: true },
    ];

    for (const f of fields) {
      const value = state.windowsPCInfo[f.key] || data[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        state.windowsPCInfo[f.key] = val;
        debouncedSave();
      }, { password: f.password });
      fieldContainer.appendChild(row);
    }
  }

  (async () => {
    try {
      const data = await api.getWindowsPC();
      loaded = true;
      renderInfo(data);
    } catch {
      renderInfo({});
    }
  })();

  return el('section', { className: 'card service-card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge', innerHTML: icon('windowsColor', 26) }),
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
    if (parentPage) parentPage.style.maxWidth = '';
  };
}
