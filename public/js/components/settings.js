// ═══════════════════════════════════════════════════════════════════
// Settings Modal Component
// ═══════════════════════════════════════════════════════════════════

import { t, setLanguage, getCurrentLang } from '../i18n.js';
import { state, defaults, STORAGE_KEYS, getConfig } from '../state.js';
import { el, applyTheme, applyGlowStrength, applyAccentColor, applyButtonStyle, showToast } from '../ui.js';
import { iconEl } from '../icons.js';
import * as api from '../api.js';
import { handleLogout } from '../auth.js';

let overlayEl = null;
let activeTab = 'design';
let settingsInitialized = false;

export function initSettings() {
  if (settingsInitialized) return;
  settingsInitialized = true;
  // Listen for open-settings event
  window.addEventListener('open-settings', () => openSettings());
}

function openSettings() {
  // If overlayEl reference exists but was removed from DOM (e.g. by hideAppChrome), reset it
  if (overlayEl && !overlayEl.isConnected) {
    overlayEl = null;
  }
  if (overlayEl) {
    overlayEl.classList.add('active');
    requestAnimationFrame(() => initToggleSliders());
    return;
  }

  overlayEl = el('div', { className: 'overlay', id: 'settingsOverlay' }, [
    el('div', { className: 'settings-modal' }, [
      // Header
      el('div', { className: 'settings-header' }, [
        el('h3', { textContent: t('settings.title'), 'data-i18n': 'settings.title' }),
        el('button', {
          className: 'close-btn',
          'aria-label': 'Close',
          onClick: () => closeSettings(),
        }, [iconEl('close', 18)]),
      ]),
      // Body
      el('div', { className: 'settings-body' }, [
        // Sidebar
        createSidebar(),
        // Content
        el('div', { className: 'settings-content', id: 'settingsContent' }, [
          createDesignPanel(),
          createAnalysenPanel(),
          createControlPanel(),
          createDataPanel(),
          createSessionPanel(),
          createUserPanel(),
          createCreditsPanel(),
        ]),
      ]),
    ]),
  ]);

  overlayEl.addEventListener('click', e => {
    if (e.target === overlayEl) closeSettings();
  });

  document.body.appendChild(overlayEl);
  overlayEl.classList.add('active');
  requestAnimationFrame(() => initToggleSliders());
}

function closeSettings() {
  overlayEl?.classList.remove('active');
}

function createSidebar() {
  const cfg = getConfig();
  const hasControlDevices = cfg?.controlDevices
    && Array.isArray(cfg.controlDevices)
    && cfg.controlDevices.length > 0;

  const tabs = [
    { id: 'design', icon: 'sun', label: t('settings.design') },
    { id: 'analysen', icon: 'analysen', label: t('settings.analysen') },
    ...(hasControlDevices ? [{ id: 'control', icon: 'start', label: t('settings.controlDevices') }] : []),
    { id: 'daten', icon: 'copy', label: t('settings.data') },
    { id: 'session', icon: 'uptime', label: t('settings.session') },
    { id: 'user', icon: 'user', label: t('settings.user') },
    { id: 'credits', icon: 'info', label: t('settings.credits') },
  ];

  return el('nav', { className: 'settings-sidebar' },
    tabs.filter(tab => {
      if (tab.id === 'credits') return true;
      return cfg?.settings?.tabs?.[tab.id] !== false;
    }).map(tab =>
      el('button', {
        className: `settings-tab ${tab.id === activeTab ? 'active' : ''}`,
        'data-tab': tab.id,
        onClick: () => switchTab(tab.id),
      }, [
        el('span', { style: { display: 'flex' } }, [iconEl(tab.icon, 18)]),
        el('span', { textContent: tab.label }),
      ])
    )
  );
}

function switchTab(tabName) {
  activeTab = tabName;
  overlayEl?.querySelectorAll('.settings-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  overlayEl?.querySelectorAll('.settings-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });
  requestAnimationFrame(() => initToggleSliders());
}

// ── Design Panel ──
function createDesignPanel() {
  const panel = el('div', { className: 'settings-panel active', id: 'panel-design' }, [
    el('h4', { textContent: t('settings.design'), 'data-i18n': 'settings.design' }),

    // Theme
    createSettingRow(t('settings.theme'), createThemeSwitcher()),

    // Button Style
    createSettingRow(t('settings.buttonStyle'), createToggleGroup('buttonStyle', [
      { value: 'default', label: t('settings.default') },
      { value: 'simple', label: t('settings.simple') },
    ], state.buttonStyle || defaults.buttonStyle, (val) => {
      applyButtonStyle(val, true);
    })),

    // Glow Strength
    createSettingRow(t('settings.glowStrength'), createGlowSlider()),

    // Language
    createSettingRow(t('settings.language'), createToggleGroup('language', [
      { value: 'de', label: 'Deutsch' },
      { value: 'en', label: 'English' },
    ], getCurrentLang(), (val) => {
      setLanguage(val);
    })),

    // Accent Color
    createSettingRow(t('settings.accentColor'), createAccentPicker()),

    // Reset
    el('hr', { className: 'settings-divider' }),
    el('button', {
      className: 'btn secondary',
      textContent: t('settings.resetDefaults'),
      'data-i18n': 'settings.resetDefaults',
      onClick: () => {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        showToast(t('settings.resetDone'));
        setTimeout(() => location.reload(), 600);
      },
    }),
  ]);
  return panel;
}

function createSettingRow(label, control) {
  return el('div', { className: 'setting-row' }, [
    el('label', { textContent: label }),
    control,
  ]);
}

function createThemeSwitcher() {
  const currentTheme = localStorage.getItem(STORAGE_KEYS.theme) || defaults.theme;
  const options = ['dark', 'system', 'light'];
  const position = Math.max(0, options.indexOf(currentTheme));

  const switcher = el('div', { className: 'theme-switcher', 'data-position': String(position) }, [
    el('span', { className: 'theme-slider' }),
    ...options.map((value, i) => {
      const iconName = value === 'dark' ? 'moon' : value === 'light' ? 'sun' : 'monitor';
      return el('button', {
        className: `theme-option ${value === currentTheme ? 'active' : ''}`,
        'data-value': value,
        'aria-label': `${value} mode`,
        onClick: () => {
          applyTheme(value, true);
          switcher.setAttribute('data-position', String(i));
          switcher.querySelectorAll('.theme-option').forEach(b => {
            b.classList.toggle('active', b.dataset.value === value);
          });
        },
      }, [iconEl(iconName, 20)]);
    }),
  ]);
  return switcher;
}

function createToggleGroup(name, options, current, onChange) {
  const currentIdx = options.findIndex(o => o.value === current);
  const group = el('div', { className: 'toggle-group', 'data-position': String(Math.max(0, currentIdx)), 'data-name': name }, [
    el('span', { className: 'toggle-slider' }),
    ...options.map((opt, i) => {
      return el('button', {
        className: `toggle-option ${opt.value === current ? 'active' : ''}`,
        'data-value': opt.value,
        textContent: opt.label,
        onClick: () => {
          group.setAttribute('data-position', String(i));
          group.querySelectorAll('.toggle-option').forEach(b => {
            b.classList.toggle('active', b.dataset.value === opt.value);
          });
          updateToggleSlider(group);
          onChange(opt.value);
        },
      });
    }),
  ]);
  return group;
}

function glowThumbSvg(rayScale) {
  const s = Math.max(0.15, Math.min(1.5, rayScale));
  const c = 12, inner = 5.8, len = 1 + 5.2 * s;
  const angles = [90, 45, 0, 315, 270, 225, 180, 135];
  const d = angles.map(a => {
    const r = a * Math.PI / 180;
    const x1 = (c + inner * Math.cos(r)).toFixed(1);
    const y1 = (c - inner * Math.sin(r)).toFixed(1);
    const x2 = (c + (inner + len) * Math.cos(r)).toFixed(1);
    const y2 = (c - (inner + len) * Math.sin(r)).toFixed(1);
    return `M${x1} ${y1}L${x2} ${y2}`;
  }).join('');
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round'><circle cx='12' cy='12' r='4' fill='none'/><path d='${d}'/></svg>")`;
}

function createGlowSlider() {
  const currentGlow = state.glowStrength ?? defaults.glowStrength;
  const slider = el('input', {
    type: 'range',
    className: 'glow-slider',
    min: '0',
    max: '2',
    step: '0.1',
    value: String(currentGlow),
  });

  const updateSlider = () => {
    const val = Number(slider.value);
    const percent = Math.round((val / 2) * 100);
    slider.style.setProperty('--glow-percent', `${percent}%`);
    slider.style.setProperty('--glow-thumb-icon', glowThumbSvg(val / 2));
  };
  updateSlider();

  slider.addEventListener('input', () => {
    applyGlowStrength(Number(slider.value));
    updateSlider();
  });
  slider.addEventListener('change', () => {
    localStorage.setItem(STORAGE_KEYS.glowStrength, slider.value);
  });

  return el('div', { className: 'glow-control' }, [
    el('span', { className: 'glow-icon' }, [iconEl('moon', 18)]),
    slider,
    el('span', { className: 'glow-icon', style: { color: 'var(--accent)' } }, [iconEl('sun', 18)]),
  ]);
}

function createAccentPicker() {
  const colors = ['#00d4ff', '#a855f7', '#22c55e', '#f97316', '#ec4899'];
  const current = state.accent || defaults.accent;

  const picker = el('div', { className: 'accent-picker' },
    colors.map(color =>
      el('button', {
        className: `accent-option ${color === current ? 'active' : ''}`,
        'data-color': color,
        style: { '--swatch': color },
        'aria-label': color,
        onClick: () => {
          applyAccentColor(color);
          localStorage.setItem(STORAGE_KEYS.accent, color);
          picker.querySelectorAll('.accent-option').forEach(b => {
            b.classList.toggle('active', b.dataset.color === color);
          });
        },
      })
    )
  );
  return picker;
}

// ── Analysen Panel ──
function createAnalysenPanel() {
  const uptimeContainer = el('div', { id: 'uptimeResetContainer' });
  loadUptimeResetButtons(uptimeContainer);

  const outagesBtn = el('button', {
    className: 'btn danger',
    textContent: t('settings.outagesResetBtn'),
    onClick: async () => {
      try {
        await api.resetAllOutages();
        showToast(t('settings.outagesResetDone'));
        window.dispatchEvent(new CustomEvent('uptime-reset'));
      } catch { showToast(t('msg.error'), true); }
    },
  });

  return el('div', { className: 'settings-panel', id: 'panel-analysen' }, [
    el('h4', { textContent: t('settings.uptimeReset') }),
    el('p', { className: 'setting-description', textContent: t('settings.uptimeResetDesc') }),
    uptimeContainer,
    el('h4', { textContent: t('settings.outagesReset'), style: { marginTop: '24px' } }),
    el('p', { className: 'setting-description', textContent: t('settings.outagesResetDesc') }),
    outagesBtn,
  ]);
}

async function loadUptimeResetButtons(container) {
  try {
    const data = await api.getUptime();
    const devices = data?.devices || [];

    const btns = [];

    // Reset all button
    btns.push(el('button', {
      className: 'btn danger',
      textContent: t('settings.uptimeResetAll'),
      onClick: async () => {
        try {
          await api.resetAllUptime();
          showToast(t('settings.uptimeResetDone'));
          window.dispatchEvent(new CustomEvent('uptime-reset'));
        } catch { showToast(t('msg.error'), true); }
      },
    }));

    // Individual device buttons
    for (const d of devices) {
      btns.push(el('button', {
        className: 'btn secondary',
        textContent: d.name,
        onClick: async () => {
          try {
            await api.resetDeviceUptime(d.id);
            showToast(t('settings.uptimeResetDone'));
            window.dispatchEvent(new CustomEvent('uptime-reset'));
          } catch { showToast(t('msg.error'), true); }
        },
      }));
    }

    container.appendChild(el('div', {
      style: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    }, btns));
  } catch {
    container.appendChild(el('span', {
      className: 'muted',
      textContent: t('settings.uptimeNoDevices'),
    }));
  }
}

// ── Control Panel ──
function createControlPanel() {
  const cfg = getConfig();
  const devices = cfg?.controlDevices && Array.isArray(cfg.controlDevices)
    ? cfg.controlDevices
    : [];

  const sections = devices.map(device => createControlDeviceSection(device));

  return el('div', { className: 'settings-panel', id: 'panel-control' }, [
    el('h4', { textContent: t('settings.controlDevices') }),
    el('p', { className: 'setting-description', textContent: t('settings.controlDevicesDesc') }),
    ...sections,
  ]);
}

function createControlDeviceSection(device) {
  const header = el('div', { className: 'control-device-header' }, [
    el('span', { className: 'icon-badge' }, [iconEl(device.icon || 'windowsColor', 18)]),
    el('h4', { textContent: device.name }),
    el('span', { className: 'chevron', style: { transform: 'rotate(0deg)' } }, [iconEl('back', 14)]),
  ]);

  const body = el('div', { className: 'control-device-body' });
  let loaded = false;

  header.addEventListener('click', () => {
    const isExpanded = body.classList.contains('expanded');
    if (isExpanded) {
      body.classList.remove('expanded');
      header.classList.remove('expanded');
    } else {
      body.classList.add('expanded');
      header.classList.add('expanded');
      if (!loaded) {
        loaded = true;
        loadControlDeviceForm(device, body);
      }
    }
  });

  return el('div', { className: 'control-device-section' }, [header, body]);
}

async function loadControlDeviceForm(device, container) {
  try {
    const data = await api.getControlDevice(device.id);

    const macInput = el('input', { type: 'text', value: data.macAddress || '', placeholder: 'AA:BB:CC:DD:EE:FF' });
    const userInput = el('input', { type: 'text', value: data.sshUser || '', placeholder: 'admin' });
    const passInput = el('input', { type: 'password', value: '', placeholder: data.hasPassword ? '••••••••' : '' });
    const portInput = el('input', { type: 'number', value: String(data.sshPort || 22), min: '1', max: '65535' });

    const form = el('form', {}, [
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('control.macAddress') }),
        macInput,
      ]),
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('control.sshUser') }),
        userInput,
      ]),
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('control.sshPassword') }),
        passInput,
      ]),
      el('div', { className: 'input-row' }, [
        el('label', { textContent: t('control.sshPort') }),
        portInput,
      ]),
      el('div', { className: 'actions', style: { marginTop: '12px' } }, [
        el('button', { className: 'btn', type: 'submit', textContent: t('settings.save') }),
      ]),
    ]);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        macAddress: macInput.value.trim(),
        sshUser: userInput.value.trim(),
        sshPort: parseInt(portInput.value, 10) || 22,
      };
      if (passInput.value) {
        payload.sshPassword = passInput.value;
      }
      try {
        await api.saveControlDevice(device.id, payload);
        showToast(t('msg.saved'));
        passInput.value = '';
        passInput.placeholder = '••••••••';
      } catch {
        showToast(t('msg.error'), true);
      }
    });

    container.appendChild(form);
  } catch {
    container.appendChild(el('span', { className: 'muted', textContent: t('msg.error') }));
  }
}

// ── Data Panel ──
function createDataPanel() {
  const panel = el('div', { className: 'settings-panel', id: 'panel-daten' }, [
    el('h4', { textContent: t('settings.versions'), 'data-i18n': 'settings.versions' }),
    createVersionSection(t('settings.portAssignments'), 'versionSelect', 'versionDetails'),
    createVersionSection('Speedport', 'speedportVersionSelect', 'speedportVersionDetails'),
    createVersionSection('PiHole / Raspberry', 'raspberryVersionSelect', 'raspberryVersionDetails'),
    el('hr', { className: 'settings-divider' }),
    el('h4', { textContent: t('settings.exportImport'), 'data-i18n': 'settings.exportImport' }),
    el('p', { className: 'setting-description', textContent: t('settings.exportDesc'), 'data-i18n': 'settings.exportDesc' }),
    el('div', { className: 'export-import-buttons' }, [
      el('button', {
        className: 'btn',
        textContent: t('settings.export'),
        'data-i18n': 'settings.export',
        onClick: handleExport,
      }),
      el('label', { className: 'btn secondary import-label' }, [
        el('span', { textContent: t('settings.import'), 'data-i18n': 'settings.import' }),
        (() => {
          const input = el('input', { type: 'file', accept: '.json', style: { display: 'none' } });
          input.addEventListener('change', () => {
            if (input.files?.[0]) handleImport(input.files[0]);
          });
          return input;
        })(),
      ]),
    ]),
  ]);
  return panel;
}

function createVersionSection(label, selectId, detailsId) {
  return el('div', { className: 'version-section' }, [
    el('label', { textContent: label }),
    el('select', { className: 'version-select', id: selectId }),
    el('span', { className: 'muted version-details', id: detailsId }),
  ]);
}

async function handleExport() {
  try {
    const blob = await api.exportData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `netzwerk-manager-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('msg.exported'));
  } catch {
    showToast(t('msg.error'), true);
  }
}

async function handleImport(file) {
  try {
    const text = await file.text();
    let parsed = JSON.parse(text);
    if (parsed.data) parsed = parsed.data;
    if (!confirm(t('msg.confirmOverwrite'))) return;
    await api.importData(parsed);
    showToast(t('msg.imported'));
    setTimeout(() => location.reload(), 1500);
  } catch {
    showToast(t('msg.invalidJson'), true);
  }
}

// ── Session Panel ──
function createSessionPanel() {
  const isEnabled = state.sessionTimeoutEnabled;
  const minutes = state.sessionTimeoutMinutes;

  const minutesInput = el('input', {
    type: 'number',
    className: 'timeout-input',
    id: 'timeoutMinutesInput',
    value: String(minutes),
    min: '1',
    max: '60',
  });

  const minutesRow = el('div', {
    className: `setting-row ${!isEnabled ? 'hidden' : ''}`,
    id: 'timeoutMinutesRow',
  }, [
    el('label', { textContent: t('settings.timeoutMinutes'), 'data-i18n': 'settings.timeoutMinutes' }),
    minutesInput,
  ]);

  minutesInput.addEventListener('change', () => {
    let val = parseInt(minutesInput.value, 10);
    if (isNaN(val) || val < 1) val = 5;
    if (val > 60) val = 60;
    minutesInput.value = String(val);
    state.sessionTimeoutMinutes = val;
    localStorage.setItem(STORAGE_KEYS.sessionTimeoutMinutes, String(val));
  });

  return el('div', { className: 'settings-panel', id: 'panel-session' }, [
    el('h4', { textContent: t('settings.sessionTimeout'), 'data-i18n': 'settings.sessionTimeout' }),
    el('p', { className: 'setting-description', textContent: t('settings.sessionDesc'), 'data-i18n': 'settings.sessionDesc' }),
    createSettingRow(t('settings.timeoutEnable'), createToggleGroup('timeout', [
      { value: 'off', label: t('settings.off') },
      { value: 'on', label: t('settings.on') },
    ], isEnabled ? 'on' : 'off', (val) => {
      const enabled = val === 'on';
      state.sessionTimeoutEnabled = enabled;
      localStorage.setItem(STORAGE_KEYS.sessionTimeoutEnabled, String(enabled));
      minutesRow.classList.toggle('hidden', !enabled);
    })),
    minutesRow,
  ]);
}

// ── User Panel ──
function createUserPanel() {
  const form = el('form', { id: 'credentialForm' }, [
    el('div', { className: 'input-row' }, [
      el('label', { textContent: t('settings.currentPassword'), 'data-i18n': 'settings.currentPassword' }),
      el('input', { type: 'password', id: 'currentPassInput', autocomplete: 'current-password' }),
    ]),
    el('div', { className: 'input-row' }, [
      el('label', { textContent: t('settings.newUser'), 'data-i18n': 'settings.newUser' }),
      el('input', { type: 'text', id: 'newUserInput', autocomplete: 'username' }),
    ]),
    el('div', { className: 'input-row' }, [
      el('label', { textContent: t('settings.newPassword'), 'data-i18n': 'settings.newPassword' }),
      el('input', { type: 'password', id: 'newPassInput', autocomplete: 'new-password' }),
    ]),
    el('div', { className: 'actions' }, [
      el('button', { className: 'btn', type: 'submit', textContent: t('settings.save'), 'data-i18n': 'settings.save' }),
      el('span', { className: 'muted', id: 'credentialStatus' }),
    ]),
  ]);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassInput')?.value;
    const username = document.getElementById('newUserInput')?.value?.trim();
    const password = document.getElementById('newPassInput')?.value;
    if (!currentPassword || !username || !password) {
      showToast(t('msg.fillCredentials'), true);
      return;
    }
    try {
      await api.saveCredentials({ currentPassword, username, password });
      showToast(t('msg.saved'));
      document.getElementById('currentPassInput').value = '';
      document.getElementById('newUserInput').value = '';
      document.getElementById('newPassInput').value = '';
    } catch {
      showToast(t('msg.error'), true);
    }
  });

  return el('div', { className: 'settings-panel', id: 'panel-user' }, [
    el('h4', { textContent: t('settings.userPassword'), 'data-i18n': 'settings.userPassword' }),
    form,
    el('hr', { className: 'settings-divider' }),
    el('button', {
      className: 'btn logout-btn',
      textContent: t('settings.logout'),
      'data-i18n': 'settings.logout',
      onClick: () => {
        closeSettings();
        handleLogout();
      },
    }),
  ]);
}

// ── Credits Panel ──
function createCreditsPanel() {
  const cfg = getConfig();
  const updateEnabled = cfg?.settings?.update?.enabled === true;

  const children = [
    el('img', { className: 'credits-avatar', src: 'https://github.com/leminkozey.png', alt: 'leminkozey' }),
    el('span', { className: 'credits-label', textContent: 'made by' }),
    el('a', { className: 'credits-name', href: 'https://github.com/leminkozey', target: '_blank', rel: 'noopener', textContent: 'leminkozey' }),
    el('span', { className: 'credits-version', textContent: 'v3.5.0' }),
  ];

  if (updateEnabled) {
    const statusEl = el('span', {
      className: 'credits-update checking',
      textContent: t('credits.checking'),
    });
    children.push(statusEl);

    // Check for updates
    api.checkUpdate().then(data => {
      if (data.upToDate) {
        statusEl.textContent = t('credits.upToDate');
        statusEl.className = 'credits-update up-to-date';
      } else {
        statusEl.textContent = t('credits.getUpToDate');
        statusEl.className = 'credits-update needs-update';
        statusEl.style.cursor = 'pointer';
        statusEl.addEventListener('click', async () => {
          if (statusEl.classList.contains('running')) return;
          statusEl.classList.add('running');
          statusEl.textContent = t('credits.updating');
          try {
            const result = await api.runUpdate();
            if (result.ok) {
              statusEl.textContent = t('credits.updateDone');
              statusEl.className = 'credits-update up-to-date';
              setTimeout(() => location.reload(), 2000);
            } else {
              statusEl.textContent = t('credits.updateFailed');
              statusEl.className = 'credits-update needs-update';
            }
          } catch {
            statusEl.textContent = t('credits.updateFailed');
            statusEl.className = 'credits-update needs-update';
          }
        });
      }
    }).catch(() => {
      statusEl.textContent = t('credits.checkFailed');
      statusEl.className = 'credits-update check-failed';
    });
  }

  return el('div', { className: 'settings-panel', id: 'panel-credits' }, [
    el('div', { className: 'credits-content' }, children),
  ]);
}

// ── Toggle Slider Logic ──
function updateToggleSlider(group) {
  if (!group) return;
  const slider = group.querySelector('.toggle-slider');
  const activeBtn = group.querySelector('.toggle-option.active');
  if (!slider || !activeBtn) return;

  const buttons = Array.from(group.querySelectorAll('.toggle-option'));
  const idx = buttons.indexOf(activeBtn);
  let offsetX = 0;
  for (let i = 0; i < idx; i++) {
    offsetX += buttons[i].offsetWidth + 3;
  }
  slider.style.width = `${activeBtn.offsetWidth}px`;
  slider.style.transform = `translateX(${offsetX}px)`;
}

function initToggleSliders() {
  overlayEl?.querySelectorAll('.toggle-group').forEach(g => {
    if (g.offsetParent !== null) updateToggleSlider(g);
  });
}

// ── Version Updates ──
export function updateVersionSelects(versions, speedportVersions, raspberryVersions) {
  fillVersionSelect('versionSelect', 'versionDetails', versions);
  fillVersionSelect('speedportVersionSelect', 'speedportVersionDetails', speedportVersions);
  fillVersionSelect('raspberryVersionSelect', 'raspberryVersionDetails', raspberryVersions);
}

function fillVersionSelect(selectId, detailsId, versions) {
  const select = document.getElementById(selectId);
  const details = document.getElementById(detailsId);
  if (!select) return;

  select.replaceChildren();
  if (!versions?.length) {
    select.appendChild(el('option', { textContent: t('version.none') }));
    if (details) details.textContent = '';
    return;
  }

  versions.forEach(v => {
    select.appendChild(el('option', { value: v.id, textContent: `${v.label} - ${v.summary || t('version.change')}` }));
  });

  if (details && versions[0]) {
    const v = versions[0];
    const date = v.timestamp ? new Date(v.timestamp).toLocaleString() : v.label;
    details.textContent = `${date}${v.snapshot ? '' : ` - ${t('version.noData')}`}`;
  }
}
