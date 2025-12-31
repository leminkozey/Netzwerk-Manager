const els = {
  body: document.body,
  topBar: document.getElementById('topBar'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsOverlay: document.getElementById('settingsOverlay'),
  closeSettings: document.getElementById('closeSettings'),
  settingsTabs: document.querySelectorAll('.settings-tab'),
  settingsPanels: document.querySelectorAll('.settings-panel'),
  themeToggleGroup: document.getElementById('themeToggleGroup'),
  buttonStyleGroup: document.getElementById('buttonStyleGroup'),
  versionChip: document.getElementById('versionChip'),
  loginCard: document.getElementById('loginCard'),
  loginBtn: document.getElementById('loginBtn'),
  loginStatus: document.getElementById('loginStatus'),
  userInput: document.getElementById('userInput'),
  passInput: document.getElementById('passInput'),
  tokenInput: document.getElementById('tokenInput'),
  app: document.getElementById('app'),
  switchTableBody: document.querySelector('#switchTable tbody'),
  routerTableBody: document.querySelector('#routerTable tbody'),
  newUser: document.getElementById('newUser'),
  newPass: document.getElementById('newPass'),
  credentialForm: document.getElementById('credentialForm'),
  credentialStatus: document.getElementById('credentialStatus'),
  versionSelect: document.getElementById('versionSelect'),
  versionDetails: document.getElementById('versionDetails'),
  speedportStatus: document.getElementById('speedportStatus'),
  speedportLink: document.getElementById('speedportLink'),
  speedportRemoteLink: document.getElementById('speedportRemoteLink'),
  speedportVersionSelect: document.getElementById('speedportVersionSelect'),
  speedportVersionDetails: document.getElementById('speedportVersionDetails'),
  logoutOverlay: document.getElementById('logoutOverlay'),
  logoutReason: document.getElementById('logoutReason'),
  reloginBtn: document.getElementById('reloginBtn'),
  raspberryStatus: document.getElementById('raspberryStatus'),
  piHoleLink: document.getElementById('piHoleLink'),
  piHoleRemoteLink: document.getElementById('piHoleRemoteLink'),
  raspberryVersionSelect: document.getElementById('raspberryVersionSelect'),
  raspberryVersionDetails: document.getElementById('raspberryVersionDetails'),
  logoutBtn: document.getElementById('logoutBtn'),
  timeoutOverlay: document.getElementById('timeoutOverlay'),
  timeoutSettingsBtn: document.getElementById('timeoutSettingsBtn'),
  timeoutLoginBtn: document.getElementById('timeoutLoginBtn'),
  timeoutToggleGroup: document.getElementById('timeoutToggleGroup'),
  timeoutMinutesRow: document.getElementById('timeoutMinutesRow'),
  timeoutMinutes: document.getElementById('timeoutMinutes'),
};

const speedportInputs = {
  wifiName: document.getElementById('wifiName'),
  wifiPassword: document.getElementById('wifiPass'),
  serialNumber: document.getElementById('serial'),
  configuration: document.getElementById('config'),
  remoteUrl: document.getElementById('speedportRemoteUrl'),
  devicePassword: document.getElementById('devicePass'),
  modemId: document.getElementById('modemId'),
};

const raspberryInputs = {
  model: document.getElementById('piModel'),
  hostname: document.getElementById('piHostname'),
  ipAddress: document.getElementById('piIp'),
  vpnIp: document.getElementById('piVpnIp'),
  macAddress: document.getElementById('piMac'),
  sshUser: document.getElementById('piUser'),
  piholeUrl: document.getElementById('piHoleUrl'),
  piholeRemoteUrl: document.getElementById('piHoleRemoteUrl'),
};

const state = {
  token: null,
  theme: 'dark',
  versions: [],
  switchPorts: [],
  routerPorts: [],
  speedportInfo: {},
  raspberryInfo: {},
  raspberryVersions: [],
  speedportVersions: [],
  live: {
    switchPorts: [],
    routerPorts: [],
    speedportInfo: {},
    raspberryInfo: {},
  },
  viewFromLive: true,
  raspberryViewFromLive: true,
  speedportViewFromLive: true,
  username: '',
  activeVersionId: null,
  followLatest: true,
  raspberryActiveVersionId: null,
  raspberryFollowLatest: true,
  speedportActiveVersionId: null,
  speedportFollowLatest: true,
  socket: null,
  sessionTimeoutEnabled: true,
  sessionTimeoutMinutes: 5,
  sessionTimer: null,
  redirectToSettings: false,
};

const STORAGE_KEYS = {
  deviceToken: 'deviceToken',
  theme: 'theme',
  buttonStyle: 'buttonStyle',
  sessionTimeoutEnabled: 'sessionTimeoutEnabled',
  sessionTimeoutMinutes: 'sessionTimeoutMinutes',
};

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function clonePorts(list = []) {
  return list.map((p) => ({ ...p }));
}

function setLiveState(payload = {}) {
  if (payload.switchPorts) {
    state.live.switchPorts = clonePorts(payload.switchPorts);
  }
  if (payload.routerPorts) {
    state.live.routerPorts = clonePorts(payload.routerPorts);
  }
  if (payload.speedportInfo) {
    state.live.speedportInfo = { ...payload.speedportInfo };
  }
  if (payload.raspberryInfo) {
    state.live.raspberryInfo = { ...payload.raspberryInfo };
  }
}

function syncViewToLive() {
  state.switchPorts = clonePorts(state.live.switchPorts);
  state.routerPorts = clonePorts(state.live.routerPorts);
  state.viewFromLive = true;
  renderTables();
}

function pickTextColor(hex) {
  if (!hex) return '#ffffff';
  const c = hex.replace('#', '');
  const bigint = parseInt(c.length === 3 ? c.repeat(2) : c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f1526' : '#ffffff';
}

function applyTheme(theme, save = false) {
  state.theme = theme;
  document.body.setAttribute('data-theme', theme);
  if (save) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    // Tabellen neu rendern damit Farben stimmen
    if (state.token) renderTables();
  }
  updateThemeToggleUI(theme);
}

function updateThemeToggleUI(theme) {
  if (!els.themeToggleGroup) return;
  els.themeToggleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === theme);
  });
}

function applyButtonStyle(style, save = false) {
  document.body.setAttribute('data-button-style', style);
  if (save) {
    localStorage.setItem(STORAGE_KEYS.buttonStyle, style);
  }
  updateButtonStyleUI(style);
}

function updateButtonStyleUI(style) {
  if (!els.buttonStyleGroup) return;
  els.buttonStyleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === style);
  });
}

function loadLocalSettings() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
  const savedButtonStyle = localStorage.getItem(STORAGE_KEYS.buttonStyle) || 'default';
  applyTheme(savedTheme);
  applyButtonStyle(savedButtonStyle);
  loadSessionSettings();
}

function openSettings() {
  els.settingsOverlay.classList.add('active');
}

function closeSettings() {
  els.settingsOverlay.classList.remove('active');
}

function switchSettingsTab(tabName) {
  els.settingsTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  els.settingsPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tabName}`);
  });
}

async function bootstrap() {
  loadLocalSettings();
  try {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) return;
    const data = await res.json();
    updateVersions(data.versions || []);
  } catch (e) {
    console.error(e);
  }
}

function authHeaders() {
  return state.token
    ? {
        Authorization: `Bearer ${state.token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

async function handleLogin() {
  const username = els.userInput.value.trim();
  const password = els.passInput.value;
  const tokenInput = els.tokenInput.value.trim();
  if (tokenInput) {
    setStoredDeviceToken(tokenInput);
  }
  const deviceToken = tokenInput || getStoredDeviceToken();
  if (!deviceToken && (!username || !password)) {
    showLoginStatus('Bitte Nutzer & Passwort eingeben.', true);
    return;
  }
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        deviceName: deriveDeviceName(),
        deviceToken,
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      if (body.locked && body.remainingMs) {
        startLockoutTimer(body.remainingMs);
      } else {
        showLoginStatus(body.message || 'Login fehlgeschlagen', true);
      }
      return;
    }
    state.token = body.token;
    applyPayload(body.state);
    connectSocket();
    els.loginCard.style.display = 'none';
    els.topBar.style.display = 'flex';
    els.app.style.display = 'block';
    startSessionTimer();
    if (state.redirectToSettings) {
      state.redirectToSettings = false;
      openSettings();
      switchSettingsTab('session');
    }
  } catch (e) {
    console.error(e);
    showLoginStatus('Server nicht erreichbar.', true);
  }
}

function startLockoutTimer(remainingMs) {
  clearInterval(startLockoutTimer._interval);
  els.loginBtn.disabled = true;

  function update() {
    const now = Date.now();
    const left = lockoutEnd - now;
    if (left <= 0) {
      clearInterval(startLockoutTimer._interval);
      els.loginBtn.disabled = false;
      showLoginStatus('Sperre aufgehoben. Erneut versuchen.', false);
      return;
    }
    const min = Math.floor(left / 60000);
    const sec = Math.floor((left % 60000) / 1000);
    showLoginStatus(`Gesperrt. Noch ${min}:${sec.toString().padStart(2, '0')} Min`, true);
  }

  const lockoutEnd = Date.now() + remainingMs;
  update();
  startLockoutTimer._interval = setInterval(update, 1000);
}

function connectSocket() {
  try {
    if (state.socket) state.socket.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}?token=${state.token}`);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'forceLogout') {
          handleForceLogout(msg.deviceName, msg.loginAt);
        }
      } catch (err) {
        console.error(err);
      }
    };
    ws.onclose = () => {
      state.socket = null;
    };
    state.socket = ws;
  } catch (e) {
    console.error('WebSocket Fehler', e);
  }
}

async function loginWithDeviceToken(token) {
  if (!token) return { success: false };
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceToken: token, deviceName: deriveDeviceName() }),
  });
  const body = await res.json();
  if (!res.ok || !body.success) return { success: false };
  state.token = body.token;
  applyPayload(body.state);
  connectSocket();
  els.loginCard.style.display = 'none';
  els.topBar.style.display = 'flex';
  els.app.style.display = 'block';
  startSessionTimer();
  if (state.redirectToSettings) {
    state.redirectToSettings = false;
    openSettings();
    switchSettingsTab('session');
  }
  return { success: true };
}

function handleForceLogout(deviceName, timeMs) {
  state.token = null;
  stopSessionTimer();
  if (state.socket) state.socket.close();
  const at = timeMs ? new Date(timeMs) : new Date();
  els.logoutReason.textContent = `ein: ${deviceName || 'anderes Gerät'} hat sich um ${at.toLocaleTimeString()} eingeloggt.`;
  els.logoutOverlay.classList.add('active');
}

function showLoginStatus(text, isError = false) {
  els.loginStatus.hidden = false;
  els.loginStatus.textContent = text;
  els.loginStatus.className = `status ${isError ? 'alert' : 'success'}`;
}

function showToast(text, isError = false) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'} toast-visible`;
  clearTimeout(showToast._timeout);
  showToast._timeout = setTimeout(() => {
    toast.classList.remove('toast-visible');
  }, 3000);
}

function applyPayload(payload) {
  if (!payload) return;
  setLiveState({
    switchPorts: payload.switchPorts || [],
    routerPorts: payload.routerPorts || [],
    speedportInfo: payload.speedportInfo || {},
    raspberryInfo: payload.raspberryInfo || {},
  });
  state.switchPorts = clonePorts(state.live.switchPorts);
  state.routerPorts = clonePorts(state.live.routerPorts);
  state.versions = payload.versions || [];
  state.raspberryVersions = payload.raspberryVersions || [];
  state.speedportVersions = payload.speedportVersions || [];
  state.username = payload.username || '';
  state.speedportInfo = { ...state.live.speedportInfo };
  state.raspberryInfo = { ...state.live.raspberryInfo };
  state.viewFromLive = true;
  state.raspberryViewFromLive = true;
  state.raspberryFollowLatest = true;
  state.speedportViewFromLive = true;
  state.speedportFollowLatest = true;
  // Theme nur vom Server übernehmen, wenn kein lokales gespeichert ist
  const localTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (!localTheme && payload.theme) {
    applyTheme(payload.theme);
  }
  renderTables();
  updateVersions(state.versions);
  updateRaspberryVersions(state.raspberryVersions);
  updateSpeedportVersions(state.speedportVersions);
  fillSettings();
  fillSpeedport();
  fillRaspberry();
}

function renderTables() {
  els.switchTableBody.innerHTML = '';
  els.routerTableBody.innerHTML = '';
  state.switchPorts.forEach((port) => {
    const textColor = pickTextColor(port.color);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="background:${port.color};color:${textColor}">${port.label}</td>
      <td>
        <input
          class="inline-input status-input"
          type="text"
          value="${port.status}"
          placeholder="Nicht belegt"
          data-group="switch"
          data-id="${port.id}"
          data-last="${port.status}"
          aria-label="${port.label} Belegung"
        />
      </td>
      <td>
        <input class="color-input" type="color" value="${port.color}" data-group="switch" data-id="${port.id}" aria-label="${port.label} Farbe" />
      </td>
    `;
    els.switchTableBody.appendChild(tr);
  });

  state.routerPorts.forEach((port) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="background:${port.color};color:${pickTextColor(port.color)}">${port.label}</td>
      <td>
        <input
          class="inline-input status-input"
          type="text"
          value="${port.status}"
          placeholder="Nicht belegt"
          data-group="router"
          data-id="${port.id}"
          data-last="${port.status}"
          aria-label="${port.label} Belegung"
        />
      </td>
      <td>
        <input class="color-input" type="color" value="${port.color}" data-group="router" data-id="${port.id}" aria-label="${port.label} Farbe" />
      </td>
    `;
    els.routerTableBody.appendChild(tr);
  });

  document.querySelectorAll('.color-input').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const { group, id } = e.target.dataset;
      const color = e.target.value;
      try {
        const res = await fetch('/api/ports/color', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ group, id, color }),
        });
        if (res.status === 401) return handleForceLogout('Unbekannt', Date.now());
        const body = await res.json();
        if (body.switchPorts) {
          setLiveState(body);
          state.switchPorts = clonePorts(state.live.switchPorts);
          state.routerPorts = clonePorts(state.live.routerPorts);
          state.followLatest = true;
          state.viewFromLive = true;
          updateVersions(body.versions || state.versions);
          renderTables();
        }
      } catch (err) {
        console.error('Fehler beim Ändern der Farbe:', err);
        showToast('Farbe konnte nicht gespeichert werden', true);
      }
    });
  });

  bindStatusInputs();
}

function fillSettings() {
  els.newUser.value = '';
  els.newPass.value = '';
}

function fillSpeedport() {
  const info = state.speedportInfo || {};
  Object.entries(speedportInputs).forEach(([key, input]) => {
    input.value = info[key] || '';
  });
  updateSpeedportLinks();
}

function fillRaspberry() {
  const info = state.raspberryInfo || {};
  Object.entries(raspberryInputs).forEach(([key, input]) => {
    input.value = info[key] || '';
  });
  updatePiholeLinks();
}

function updateLinkButton(button, rawValue, label) {
  if (!button) return;
  const raw = (rawValue || '').trim();
  if (!raw) {
    button.textContent = '--';
    button.removeAttribute('href');
    button.removeAttribute('title');
    return;
  }
  const resolved = normalizeUrl(raw);
  button.textContent = label;
  button.setAttribute('title', resolved);
  button.setAttribute('href', resolved);
}

function normalizeUrl(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return `http://${value}`;
}

function updateSpeedportLinks() {
  updateLinkButton(els.speedportLink, speedportInputs.configuration?.value, 'Zur Website');
  updateLinkButton(els.speedportRemoteLink, speedportInputs.remoteUrl?.value, 'Zur Website (VPN)');
}

function updatePiholeLinks() {
  updateLinkButton(els.piHoleLink, raspberryInputs.piholeUrl?.value, 'Zur Website');
  updateLinkButton(els.piHoleRemoteLink, raspberryInputs.piholeRemoteUrl?.value, 'Zur Website (VPN)');
}

function updateVersions(versions) {
  state.versions = versions || [];
  els.versionSelect.innerHTML = '';
  if (!state.versions.length) {
    els.versionSelect.innerHTML = '<option>Keine Versionen vorhanden</option>';
    els.versionDetails.textContent = '';
    els.versionChip.textContent = 'Letzte Version: --';
    return;
  }
  state.versions.forEach((v, idx) => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.label}`;
    if (idx === 0) opt.selected = true;
    els.versionSelect.appendChild(opt);
  });
  const newest = state.versions[0];
  const targetId =
    state.followLatest || !state.activeVersionId || !state.versions.some((v) => v.id === state.activeVersionId)
      ? newest.id
      : state.activeVersionId;
  state.followLatest = targetId === newest.id;
  state.activeVersionId = targetId;
  els.versionSelect.value = targetId;
  els.versionChip.textContent = `Letzte Version: ${newest.label}`;
  applyVersionSnapshot(targetId);
}

function updateRaspberryVersions(versions) {
  if (!els.raspberryVersionSelect) return;
  state.raspberryVersions = versions || [];
  els.raspberryVersionSelect.innerHTML = '';
  if (!state.raspberryVersions.length) {
    els.raspberryVersionSelect.innerHTML = '<option>Keine Versionen vorhanden</option>';
    if (els.raspberryVersionDetails) {
      els.raspberryVersionDetails.textContent = '';
    }
    return;
  }
  state.raspberryVersions.forEach((v, idx) => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.label}`;
    if (idx === 0) opt.selected = true;
    els.raspberryVersionSelect.appendChild(opt);
  });
  const newest = state.raspberryVersions[0];
  const targetId =
    state.raspberryFollowLatest ||
    !state.raspberryActiveVersionId ||
    !state.raspberryVersions.some((v) => v.id === state.raspberryActiveVersionId)
      ? newest.id
      : state.raspberryActiveVersionId;
  state.raspberryFollowLatest = targetId === newest.id;
  state.raspberryActiveVersionId = targetId;
  els.raspberryVersionSelect.value = targetId;
  applyRaspberryVersionSnapshot(targetId);
}

function updateSpeedportVersions(versions) {
  if (!els.speedportVersionSelect) return;
  state.speedportVersions = versions || [];
  els.speedportVersionSelect.innerHTML = '';
  if (!state.speedportVersions.length) {
    els.speedportVersionSelect.innerHTML = '<option>Keine Versionen vorhanden</option>';
    if (els.speedportVersionDetails) {
      els.speedportVersionDetails.textContent = '';
    }
    return;
  }
  state.speedportVersions.forEach((v, idx) => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.label}`;
    if (idx === 0) opt.selected = true;
    els.speedportVersionSelect.appendChild(opt);
  });
  const newest = state.speedportVersions[0];
  const targetId =
    state.speedportFollowLatest ||
    !state.speedportActiveVersionId ||
    !state.speedportVersions.some((v) => v.id === state.speedportActiveVersionId)
      ? newest.id
      : state.speedportActiveVersionId;
  state.speedportFollowLatest = targetId === newest.id;
  state.speedportActiveVersionId = targetId;
  els.speedportVersionSelect.value = targetId;
  applySpeedportVersionSnapshot(targetId);
}

function renderVersionDetails(id) {
  const version = state.versions.find((v) => v.id === id);
  if (!version) {
    els.versionDetails.textContent = '';
    return;
  }
  const date = new Date(version.timestamp || Date.now());
  const suffix = version.snapshot ? '' : ' (keine Daten verfügbar)';
  els.versionDetails.textContent = `${version.summary || 'Änderung'} · ${date.toLocaleString()}${suffix}`;
}

function renderRaspberryVersionDetails(id) {
  if (!els.raspberryVersionDetails) return;
  const version = state.raspberryVersions.find((v) => v.id === id);
  if (!version) {
    els.raspberryVersionDetails.textContent = '';
    return;
  }
  const date = new Date(version.timestamp || Date.now());
  const suffix = version.snapshot ? '' : ' (keine Daten verfügbar)';
  els.raspberryVersionDetails.textContent = `${version.summary || 'Änderung'} · ${date.toLocaleString()}${suffix}`;
}

function renderSpeedportVersionDetails(id) {
  if (!els.speedportVersionDetails) return;
  const version = state.speedportVersions.find((v) => v.id === id);
  if (!version) {
    els.speedportVersionDetails.textContent = '';
    return;
  }
  const date = new Date(version.timestamp || Date.now());
  const suffix = version.snapshot ? '' : ' (keine Daten verfügbar)';
  els.speedportVersionDetails.textContent = `${version.summary || 'Änderung'} · ${date.toLocaleString()}${suffix}`;
}

async function saveCredentials(e) {
  e.preventDefault();
  const username = els.newUser.value.trim();
  const password = els.newPass.value.trim();
  if (!username || !password) {
    els.credentialStatus.textContent = 'Bitte Benutzer und Passwort ausfüllen.';
    return;
  }
  try {
    const res = await fetch('/api/settings/credentials', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 401) return handleForceLogout('Unbekannt', Date.now());
    els.newUser.value = '';
    els.newPass.value = '';
    els.credentialStatus.textContent = 'Gespeichert.';
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast('Zugangsdaten konnten nicht gespeichert werden', true);
  }
}

const debouncedSpeedportSave = debounce(async () => {
  if (!state.token) return;
  const payload = {};
  Object.entries(speedportInputs).forEach(([key, input]) => {
    payload[key] = input.value;
  });
  try {
    const res = await fetch('/api/speedport', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 401) return handleForceLogout('Unbekannt', Date.now());
    const body = await res.json();
    setLiveState({ speedportInfo: body.speedportInfo });
    state.speedportInfo = { ...state.live.speedportInfo };
    state.speedportViewFromLive = true;
    state.speedportFollowLatest = true;
    updateSpeedportVersions(body.speedportVersions || state.speedportVersions);
    showSpeedportStatus();
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast('Speedport konnte nicht gespeichert werden', true);
  }
}, 350);

const debouncedRaspberrySave = debounce(async () => {
  if (!state.token) return;
  const payload = {};
  Object.entries(raspberryInputs).forEach(([key, input]) => {
    payload[key] = input.value;
  });
  try {
    const res = await fetch('/api/raspberry', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 401) return handleForceLogout('Unbekannt', Date.now());
    const body = await res.json();
    setLiveState({ raspberryInfo: body.raspberryInfo });
    state.raspberryInfo = { ...state.live.raspberryInfo };
    state.raspberryViewFromLive = true;
    state.raspberryFollowLatest = true;
    updateRaspberryVersions(body.raspberryVersions || state.raspberryVersions);
    showRaspberryStatus();
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast('PiHole konnte nicht gespeichert werden', true);
  }
}, 350);

function showSpeedportStatus() {
  els.speedportStatus.hidden = false;
  els.speedportStatus.textContent = 'Gespeichert.';
  clearTimeout(showSpeedportStatus._timeout);
  showSpeedportStatus._timeout = setTimeout(() => {
    els.speedportStatus.hidden = true;
  }, 1800);
}

function showRaspberryStatus() {
  if (!els.raspberryStatus) return;
  els.raspberryStatus.hidden = false;
  els.raspberryStatus.textContent = 'Gespeichert.';
  clearTimeout(showRaspberryStatus._timeout);
  showRaspberryStatus._timeout = setTimeout(() => {
    els.raspberryStatus.hidden = true;
  }, 1800);
}

async function relogin() {
  els.logoutOverlay.classList.remove('active');
  const token = getStoredDeviceToken();
  const result = await loginWithDeviceToken(token);
  if (result.success) return;
  els.app.style.display = 'none';
  els.loginCard.style.display = 'block';
  els.passInput.value = '';
}

function handleLogout() {
  state.token = null;
  stopSessionTimer();
  if (state.socket) {
    state.socket.close();
    state.socket = null;
  }
  closeSettings();
  els.app.style.display = 'none';
  els.topBar.style.display = 'none';
  els.loginCard.style.display = 'block';
  els.userInput.value = '';
  els.passInput.value = '';
  els.loginStatus.hidden = true;
}

// Session Timeout
function startSessionTimer() {
  stopSessionTimer();
  if (!state.sessionTimeoutEnabled || !state.token) return;
  const ms = state.sessionTimeoutMinutes * 60 * 1000;
  state.sessionTimer = setTimeout(() => {
    showTimeoutPopup();
  }, ms);
}

function stopSessionTimer() {
  if (state.sessionTimer) {
    clearTimeout(state.sessionTimer);
    state.sessionTimer = null;
  }
}

const resetSessionTimer = debounce(() => {
  if (state.sessionTimeoutEnabled && state.token) {
    startSessionTimer();
  }
}, 1000);

function showTimeoutPopup() {
  state.token = null;
  stopSessionTimer();
  if (state.socket) {
    state.socket.close();
    state.socket = null;
  }
  els.app.style.display = 'none';
  els.topBar.style.display = 'none';
  els.timeoutOverlay.classList.add('active');
}

function handleTimeoutSettings() {
  els.timeoutOverlay.classList.remove('active');
  state.redirectToSettings = true;
  els.loginCard.style.display = 'block';
  els.userInput.value = '';
  els.passInput.value = '';
  els.loginStatus.hidden = true;
}

function handleTimeoutLogin() {
  els.timeoutOverlay.classList.remove('active');
  state.redirectToSettings = false;
  els.loginCard.style.display = 'block';
  els.userInput.value = '';
  els.passInput.value = '';
  els.loginStatus.hidden = true;
}

function loadSessionSettings() {
  const savedEnabled = localStorage.getItem(STORAGE_KEYS.sessionTimeoutEnabled);
  const savedMinutes = localStorage.getItem(STORAGE_KEYS.sessionTimeoutMinutes);
  state.sessionTimeoutEnabled = savedEnabled !== 'false';
  state.sessionTimeoutMinutes = parseInt(savedMinutes, 10) || 5;
  updateTimeoutUI();
}

function saveSessionSettings() {
  localStorage.setItem(STORAGE_KEYS.sessionTimeoutEnabled, state.sessionTimeoutEnabled);
  localStorage.setItem(STORAGE_KEYS.sessionTimeoutMinutes, state.sessionTimeoutMinutes);
}

function updateTimeoutUI() {
  if (!els.timeoutToggleGroup) return;
  els.timeoutToggleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    const isOn = btn.dataset.value === 'on';
    btn.classList.toggle('active', isOn === state.sessionTimeoutEnabled);
  });
  if (els.timeoutMinutesRow) {
    els.timeoutMinutesRow.classList.toggle('hidden', !state.sessionTimeoutEnabled);
  }
  if (els.timeoutMinutes) {
    els.timeoutMinutes.value = state.sessionTimeoutMinutes;
  }
}

function bindEvents() {
  els.loginBtn.addEventListener('click', handleLogin);
  els.passInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleLogin());

  // Settings Modal
  els.settingsBtn.addEventListener('click', openSettings);
  els.closeSettings.addEventListener('click', closeSettings);
  els.settingsOverlay.addEventListener('click', (e) => {
    if (e.target === els.settingsOverlay) closeSettings();
  });

  // Settings Tabs
  els.settingsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchSettingsTab(tab.dataset.tab);
    });
  });

  // Theme Toggle
  els.themeToggleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.value;
      applyTheme(theme, true);
    });
  });

  // Button Style Toggle
  els.buttonStyleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.value;
      applyButtonStyle(style, true);
    });
  });

  els.credentialForm.addEventListener('submit', saveCredentials);
  Object.values(speedportInputs).forEach((input) => {
    input.addEventListener('input', () => {
      updateSpeedportLinks();
      debouncedSpeedportSave();
    });
  });
  Object.values(raspberryInputs).forEach((input) => {
    input.addEventListener('input', () => {
      updatePiholeLinks();
      debouncedRaspberrySave();
    });
  });
  els.versionSelect.addEventListener('change', (e) => applyVersionSnapshot(e.target.value, true));
  if (els.raspberryVersionSelect) {
    els.raspberryVersionSelect.addEventListener('change', (e) =>
      applyRaspberryVersionSnapshot(e.target.value, true)
    );
  }
  if (els.speedportVersionSelect) {
    els.speedportVersionSelect.addEventListener('change', (e) =>
      applySpeedportVersionSnapshot(e.target.value, true)
    );
  }
  els.reloginBtn.addEventListener('click', relogin);
  els.logoutBtn.addEventListener('click', handleLogout);

  // Session Timeout Popup
  els.timeoutSettingsBtn.addEventListener('click', handleTimeoutSettings);
  els.timeoutLoginBtn.addEventListener('click', handleTimeoutLogin);

  // Session Timeout Settings
  els.timeoutToggleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sessionTimeoutEnabled = btn.dataset.value === 'on';
      saveSessionSettings();
      updateTimeoutUI();
      if (state.sessionTimeoutEnabled && state.token) {
        startSessionTimer();
      } else {
        stopSessionTimer();
      }
    });
  });

  els.timeoutMinutes.addEventListener('change', () => {
    let val = parseInt(els.timeoutMinutes.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 60) val = 60;
    els.timeoutMinutes.value = val;
    state.sessionTimeoutMinutes = val;
    saveSessionSettings();
    if (state.sessionTimeoutEnabled && state.token) {
      startSessionTimer();
    }
  });

  // Reset timer on user activity
  document.addEventListener('click', resetSessionTimer);
  document.addEventListener('keydown', resetSessionTimer);
}

bootstrap().then(() => {
  bindEvents();
  tryAutoLogin();
});

function bindStatusInputs() {
  document.querySelectorAll('.status-input').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });
    input.addEventListener('blur', () => {
      submitStatusChange(input);
    });
  });
}

function applyVersionSnapshot(id, manualChange = false) {
  state.activeVersionId = id;
  const newestId = state.versions[0]?.id;
  if (manualChange) {
    state.followLatest = id === newestId;
  }
  const viewingLatest = state.followLatest && id === newestId;
  renderVersionDetails(id);
  const version = state.versions.find((v) => v.id === id);
  if (viewingLatest) {
    if (!state.viewFromLive) {
      syncViewToLive();
    }
    return;
  }
  if (!version || !version.snapshot) return;
  const snapshot = version.snapshot;
  if (Array.isArray(snapshot.switchPorts)) {
    state.switchPorts = snapshot.switchPorts.map((p) => ({ ...p }));
  }
  if (Array.isArray(snapshot.routerPorts)) {
    state.routerPorts = snapshot.routerPorts.map((p) => ({ ...p }));
  }
  state.viewFromLive = false;
  renderTables();
}

function applyRaspberryVersionSnapshot(id, manualChange = false) {
  state.raspberryActiveVersionId = id;
  const newestId = state.raspberryVersions[0]?.id;
  if (manualChange) {
    state.raspberryFollowLatest = id === newestId;
  }
  const viewingLatest = state.raspberryFollowLatest && id === newestId;
  renderRaspberryVersionDetails(id);
  const version = state.raspberryVersions.find((v) => v.id === id);
  if (viewingLatest) {
    if (!state.raspberryViewFromLive) {
      syncRaspberryToLive();
    }
    return;
  }
  if (!version || !version.snapshot) return;
  const snapshot = version.snapshot;
  if (snapshot.raspberryInfo) {
    state.raspberryInfo = { ...state.raspberryInfo, ...snapshot.raspberryInfo };
  }
  state.raspberryViewFromLive = false;
  fillRaspberry();
}

function syncRaspberryToLive() {
  state.raspberryInfo = { ...state.live.raspberryInfo };
  state.raspberryViewFromLive = true;
  fillRaspberry();
}

function applySpeedportVersionSnapshot(id, manualChange = false) {
  state.speedportActiveVersionId = id;
  const newestId = state.speedportVersions[0]?.id;
  if (manualChange) {
    state.speedportFollowLatest = id === newestId;
  }
  const viewingLatest = state.speedportFollowLatest && id === newestId;
  renderSpeedportVersionDetails(id);
  const version = state.speedportVersions.find((v) => v.id === id);
  if (viewingLatest) {
    if (!state.speedportViewFromLive) {
      syncSpeedportToLive();
    }
    return;
  }
  if (!version || !version.snapshot) return;
  const snapshot = version.snapshot;
  if (snapshot.speedportInfo) {
    state.speedportInfo = { ...state.speedportInfo, ...snapshot.speedportInfo };
  }
  state.speedportViewFromLive = false;
  fillSpeedport();
}

function syncSpeedportToLive() {
  state.speedportInfo = { ...state.live.speedportInfo };
  state.speedportViewFromLive = true;
  fillSpeedport();
}

async function submitStatusChange(input) {
  const { group, id } = input.dataset;
  const value = input.value.trim();
  if (!group || !id) return;
  if (value === input.dataset.last) return;
  input.dataset.last = value;
  try {
    const res = await fetch('/api/ports/update', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ group, id, status: value }),
    });
    if (res.status === 401) return handleForceLogout('Unbekannt', Date.now());
    const body = await res.json();
    if (body.switchPorts) {
      setLiveState(body);
      state.switchPorts = clonePorts(state.live.switchPorts);
      state.routerPorts = clonePorts(state.live.routerPorts);
      state.followLatest = true;
      state.viewFromLive = true;
      updateVersions(body.versions || state.versions);
      renderTables();
    }
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast('Port konnte nicht gespeichert werden', true);
  }
}

function deriveDeviceName() {
  try {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      const brands = navigator.userAgentData.brands || [];
      const brand = brands.length ? brands[0].brand : '';
      return `${brand || 'Gerät'} ${navigator.userAgentData.platform}`.trim();
    }
    const ua = navigator.userAgent || '';
    const match = ua.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const parts = match[1]
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) return parts[0];
    }
    return ua.split(' ')[0] || 'Unbekanntes Gerät';
  } catch (e) {
    return 'Unbekanntes Gerät';
  }
}

function getStoredDeviceToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.deviceToken) || '';
  } catch (e) {
    return '';
  }
}

function setStoredDeviceToken(token) {
  try {
    if (!token) {
      localStorage.removeItem(STORAGE_KEYS.deviceToken);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.deviceToken, token);
  } catch (e) {
    console.warn('Konnte Token nicht speichern', e);
  }
}

async function tryAutoLogin() {
  const deviceToken = getStoredDeviceToken();
  if (!deviceToken || state.token) return;
  await loginWithDeviceToken(deviceToken);
}

// Speed Test functionality
const speedTest = {
  isRunning: false,

  isLocalhostHost() {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  },

  ensureNonLocalHost() {
    if (!this.isLocalhostHost()) return true;
    const msg = 'Bitte über die LAN-IP öffnen (nicht localhost).';
    const notice = document.getElementById('speedtestNotice');
    if (notice) notice.textContent = msg;
    return false;
  },

  updateHostNotice() {
    const notice = document.getElementById('speedtestNotice');
    if (!notice) return;
    if (this.isLocalhostHost()) {
      notice.textContent = 'Bitte über die LAN-IP öffnen (nicht localhost).';
      this.disableButton(true);
      return;
    }
    notice.textContent = '';
    this.disableButton(false);
  },

  updateGauge(speed, maxSpeed = 1200) {
    const percentage = Math.min(speed / maxSpeed, 1);
    const arcLength = 377;
    const offset = arcLength - (arcLength * percentage);
    const arc = document.getElementById('speedArc');
    const valueText = document.getElementById('speedValue');

    if (arc) arc.style.strokeDashoffset = offset;
    if (valueText) valueText.textContent = speed.toFixed(1);
  },

  updateLabel(text) {
    const label = document.getElementById('speedLabel');
    if (label) label.textContent = text;
  },

  disableButton(disabled) {
    const btn = document.getElementById('startLocalTest');
    if (btn) btn.disabled = disabled;
  },

  // LOCAL TEST - Tests im lokalen Netzwerk
  async measureLocalPing() {
    const iterations = 8;
    const pings = [];

    // Test zum lokalen Server (schnellste Verbindung)
    const testUrl = window.location.origin + '/api/speedtest/local-ping';

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();
        await fetch(testUrl, {
          method: 'HEAD',
          cache: 'no-cache',
          headers: authHeaders(),
        });
        const end = performance.now();
        const latency = end - start;

        // Nur realistische Werte (0.5-50ms für lokales Netzwerk)
        if (latency >= 0.5 && latency <= 100) {
          pings.push(latency);
        }

        // Kleine Pause zwischen Messungen
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        console.error('Ping measurement error:', e);
      }
    }

    // Sortieren und beste 75% nehmen, dann Durchschnitt
    if (pings.length >= 4) {
      pings.sort((a, b) => a - b);
      const bestCount = Math.ceil(pings.length * 0.75);
      const bestPings = pings.slice(0, bestCount);
      return bestPings.reduce((a, b) => a + b, 0) / bestPings.length;
    }

    return pings.length ? pings.reduce((a, b) => a + b, 0) / pings.length : 0;
  },

  async measureLocalDownload() {
    // Progressives Testen: Start klein, dann größer für genauere Messung
    const testSizes = [2, 5, 10, 15, 20]; // MB
    let bestSpeed = 0;
    let attempts = 0;
    const maxAttempts = testSizes.length;

    for (const sizeMB of testSizes) {
      attempts++;
      try {
        const start = performance.now();
        const response = await fetch(`/api/speedtest/local-download-proxy?size=${sizeMB}`, {
          headers: authHeaders(),
        });

        if (!response.ok) {
          console.warn(`Download test failed for ${sizeMB}MB:`, response.status);
          continue;
        }

        const data = await response.blob();
        const end = performance.now();

        const durationSeconds = (end - start) / 1000;
        const speedMbps = (data.size * 8) / (durationSeconds * 1000000);

        // Aktualisiere nur wenn schneller
        if (speedMbps > bestSpeed) {
          bestSpeed = speedMbps;
          this.updateGauge(speedMbps, 2000);
        }

        // Kurze Pause zwischen Tests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.error(`Download test error (${sizeMB}MB):`, e);
        // Bei Fehler: stoppe weitere Tests
        break;
      }
    }

    return bestSpeed;
  },

  async measureLocalUpload() {
    // Progressives Testen auch für Upload
    const testSizes = [2, 5, 10, 15]; // MB
    let bestSpeed = 0;

    for (const sizeMB of testSizes) {
      const sizeBytes = sizeMB * 1024 * 1024;
      const data = new Uint8Array(sizeBytes);

      try {
        const start = performance.now();
        const response = await fetch('/api/speedtest/local-upload-proxy', {
          method: 'POST',
          headers: state.token
            ? { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/octet-stream' }
            : { 'Content-Type': 'application/octet-stream' },
          body: data,
        });

        if (!response.ok) {
          console.warn(`Upload test failed for ${sizeMB}MB:`, response.status);
          continue;
        }

        const end = performance.now();
        const durationSeconds = (end - start) / 1000;
        const speedMbps = (sizeBytes * 8) / (durationSeconds * 1000000);

        // Aktualisiere nur wenn schneller
        if (speedMbps > bestSpeed) {
          bestSpeed = speedMbps;
          this.updateGauge(speedMbps, 2000);
        }

        // Kurze Pause zwischen Tests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.error(`Upload test error (${sizeMB}MB):`, e);
        // Bei Fehler: stoppe weitere Tests
        break;
      }
    }

    return bestSpeed;
  },

  async runTest() {
    if (this.isRunning) return;
    if (!this.ensureNonLocalHost()) return;
    this.isRunning = true;
    this.disableButton(true);

    const downloadEl = document.getElementById('downloadSpeed');
    const uploadEl = document.getElementById('uploadSpeed');
    const pingEl = document.getElementById('pingSpeed');

    this.updateGauge(0);
    this.updateLabel('Speed-Test startet...');
    const notice = document.getElementById('speedtestNotice');
    if (notice) notice.textContent = '';

    // Ping Test
    this.updateLabel('Messe Ping...');
    const ping = await this.measureLocalPing();
    if (pingEl) pingEl.textContent = `${ping.toFixed(1)} ms`;

    await new Promise(resolve => setTimeout(resolve, 300));

    // Download Test
    this.updateLabel('Messe Download...');
    const download = await this.measureLocalDownload();
    if (downloadEl) downloadEl.textContent = `${download.toFixed(1)} Mbit/s`;

    await new Promise(resolve => setTimeout(resolve, 300));

    // Upload Test
    this.updateLabel('Messe Upload...');
    const upload = await this.measureLocalUpload();
    if (uploadEl) uploadEl.textContent = `${upload.toFixed(1)} Mbit/s`;

    // Show final result
    const finalSpeed = Math.max(download, upload);
    this.updateGauge(finalSpeed, 2000);
    this.updateLabel('Test abgeschlossen ✓');

    this.isRunning = false;
    this.disableButton(false);

    await this.saveResults({ download, upload, ping, type: 'local' });
  },

  async saveResults(results) {
    if (!state.token) return;

    try {
      await fetch('/api/speedtest/save', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          download: results.download,
          upload: results.upload,
          ping: results.ping,
          type: results.type,
          timestamp: Date.now(),
        }),
      });
    } catch (e) {
      console.error('Failed to save speed test results:', e);
    }
  }
};

// Bind speed test button
const startTestBtn = document.getElementById('startLocalTest');

if (startTestBtn) {
  startTestBtn.addEventListener('click', () => speedTest.runTest());
}

speedTest.updateHostNotice();
