// ═══════════════════════════════════════════════════════════════════
// Info Page – Network details, devices, services, clients
// ═══════════════════════════════════════════════════════════════════

import { t } from '../i18n.js';
import { state, on, getConfig } from '../state.js';
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

  const showCopy = opts.copy !== false;
  const valueChildren = [inputWrapper || input];
  if (showCopy) valueChildren.push(copyBtn(() => input.value));

  const row = el('div', { className: 'service-field' }, [
    el('span', { className: 'service-field-label', textContent: label }),
    el('div', { className: 'service-field-value' }, valueChildren),
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

// ═══════════════════════════════════════════════════════════════════
// Generic Card Builders (for configurable infoCenter)
// ═══════════════════════════════════════════════════════════════════

// ── Generic Table Card (replaces buildPortCard for config-driven tables) ──

function buildGenericTableCard(cardDef) {
  const tbody = el('tbody');
  const cardId = cardDef.id;
  const columns = cardDef.columns || {};

  // Local data store
  let rowData = {};

  const debouncedSave = debounce(async () => {
    try {
      await api.saveInfoCard(cardId, { rows: rowData });
    } catch {
      showToast(t('msg.error'), true);
    }
  }, 600);

  function renderRows() {
    tbody.replaceChildren();
    for (const rowDef of (cardDef.rows || [])) {
      const rd = rowData[rowDef.id] || { status: '', color: '#000000' };

      const statusInput = el('input', {
        type: 'text',
        className: 'inline-input',
        value: rd.status || '',
        placeholder: columns.inputPlaceholder || t('table.notAssigned'),
      });

      statusInput.addEventListener('input', () => {
        if (!rowData[rowDef.id]) rowData[rowDef.id] = { status: '', color: '#000000' };
        rowData[rowDef.id].status = statusInput.value;
        debouncedSave();
      });

      const colorInput = el('input', {
        type: 'color',
        className: 'color-input',
        value: rd.color || '#000000',
      });

      colorInput.addEventListener('input', () => {
        const color = colorInput.value;
        statusInput.style.color = pickTextColor(color);
        statusInput.style.backgroundColor = color;
        statusInput.classList.add('has-color');
        if (!rowData[rowDef.id]) rowData[rowDef.id] = { status: '', color: '#000000' };
        rowData[rowDef.id].color = color;
        debouncedSave();
      });

      if (rd.color && rd.color !== '#000000') {
        statusInput.style.color = pickTextColor(rd.color);
        statusInput.style.backgroundColor = rd.color;
        statusInput.classList.add('has-color');
      }

      tbody.appendChild(el('tr', {}, [
        el('td', { textContent: rowDef.label || rowDef.id }),
        el('td', {}, [statusInput]),
        el('td', {}, [colorInput]),
      ]));
    }
  }

  // Load data from server
  (async () => {
    try {
      const data = await api.getInfoCard(cardId);
      rowData = data.rows || {};
      state.infoCards[cardId] = data;
    } catch { /* ignore */ }
    renderRows();
  })();

  const card = el('section', { className: 'card' }, [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge' }, [iconEl(cardDef.icon || 'info', 24)]),
        el('h3', { textContent: cardDef.title }),
      ]),
    ]),
    el('table', { className: 'table' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { textContent: columns.label || 'Name' }),
        el('th', { textContent: columns.input || 'Value' }),
        el('th', { textContent: columns.color || 'Color' }),
      ])]),
      tbody,
    ]),
  ]);

  return card;
}

// ── Generic Info Card (replaces PiHole/Speedport/WindowsPC builders) ──

function buildGenericInfoCard(cardDef) {
  const cardId = cardDef.id;
  const fieldContainer = el('div', { className: 'service-fields' });

  // Local data store
  let fieldData = {};

  const debouncedSave = debounce(async () => {
    try {
      const result = await api.saveInfoCard(cardId, fieldData);
      if (result.data) fieldData = result.data;
      showToast(t('msg.saved'));
    } catch {
      showToast(t('msg.error'), true);
    }
  }, 800);

  // Track link renderers for updates
  let linksObj = null;

  function renderFields() {
    fieldContainer.replaceChildren();
    for (const f of (cardDef.fields || [])) {
      const value = fieldData[f.key] || '';
      const { row } = buildServiceField(f.label, value, (val) => {
        fieldData[f.key] = val;
        debouncedSave();
        if (linksObj) linksObj.render();
      }, { password: f.password, copy: f.copy });
      fieldContainer.appendChild(row);
    }
  }

  // Build links from config
  if (Array.isArray(cardDef.links) && cardDef.links.length > 0) {
    const linkDefs = cardDef.links.map(linkDef => ({
      label: linkDef.label,
      url: () => fieldData[linkDef.linkField] || '',
    }));
    linksObj = buildCardLinks(linkDefs);
  }

  // Load data from server
  (async () => {
    try {
      const data = await api.getInfoCard(cardId);
      fieldData = data;
      state.infoCards[cardId] = data;
    } catch { /* ignore */ }
    renderFields();
    if (linksObj) linksObj.render();
  })();

  const children = [
    el('div', { className: 'section-title' }, [
      el('div', { className: 'section-header' }, [
        el('span', { className: 'icon-badge' }, [iconEl(cardDef.icon || 'info', 26)]),
        el('h3', { textContent: cardDef.title }),
      ]),
    ]),
    fieldContainer,
  ];
  if (linksObj) children.push(linksObj.container);

  return el('section', { className: 'card service-card' }, children);
}


// ═══════════════════════════════════════════════════════════════════
// Legacy Card Builders (used when config.infoCenter is not set)
// ═══════════════════════════════════════════════════════════════════

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
// Dynamic Renderer (config-driven)
// ═══════════════════════════════════════════════════════════════════

function renderDynamic(page) {
  const cfg = getConfig();
  const sections = cfg.infoCenter;

  for (const section of sections) {
    if (!section.heading || !Array.isArray(section.cards) || section.cards.length === 0) continue;

    page.appendChild(sectionHeading(section.heading));

    const cards = section.cards.filter(c => c.type === 'table' || c.type === 'info');
    if (cards.length === 0) continue;

    if (section.layout === 'single') {
      // Each card gets full width
      for (const cardDef of cards) {
        const cardEl = cardDef.type === 'table'
          ? buildGenericTableCard(cardDef)
          : buildGenericInfoCard(cardDef);
        page.appendChild(cardEl);
      }
    } else {
      // 'double' layout — cards pairwise in grid
      for (let i = 0; i < cards.length; i += 2) {
        const pair = [cards[i]];
        if (i + 1 < cards.length) pair.push(cards[i + 1]);

        const gridChildren = pair.map(cardDef =>
          cardDef.type === 'table'
            ? buildGenericTableCard(cardDef)
            : buildGenericInfoCard(cardDef)
        );

        page.appendChild(el('div', { className: 'grid two equal-height' }, gridChildren));
      }
    }
  }
}


// ═══════════════════════════════════════════════════════════════════
// Legacy Renderer (used when config.infoCenter is not set)
// ═══════════════════════════════════════════════════════════════════

function renderLegacy(page) {
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

  // Check if config has infoCenter defined
  const cfg = getConfig();
  if (cfg?.infoCenter && Array.isArray(cfg.infoCenter) && cfg.infoCenter.length > 0) {
    renderDynamic(page);
  } else {
    renderLegacy(page);
  }

  container.appendChild(page);

  return function cleanup() {
    _unsubs.forEach(fn => fn());
    _unsubs = [];
    if (parentPage) parentPage.style.maxWidth = '';
  };
}
