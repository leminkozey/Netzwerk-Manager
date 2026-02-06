// ═══════════════════════════════════════════════════════════════════
// Internationalization (i18n)
// ═══════════════════════════════════════════════════════════════════

const i18n = {
  currentLang: localStorage.getItem('lang') || (typeof siteConfig !== 'undefined' ? siteConfig.defaults?.language : null) || 'de',

  translations: {
    de: {
      // General
      'app.title': 'Lokales Netzwerk',
      'app.settings': 'Einstellungen',
      'app.lastVersion': 'Letzte Version',

      // Login
      'login.title': 'Login',
      'login.username': 'Benutzername',
      'login.password': 'Passwort',
      'login.token': 'Login-Token (optional)',
      'login.tokenPlaceholder': 'Token für dieses Gerät',
      'login.button': 'Einloggen',

      // Tables
      'table.port': 'Port',
      'table.assignment': 'Belegung',
      'table.color': 'Farbe',

      // Cards
      'card.switch': 'Switch (8 Ports)',
      'card.router': 'WLAN Router',
      'card.pihole': 'PiHole',
      'card.speedport': 'Speedport Infos',
      'card.speedtest': 'Internet Geschwindigkeit',
      'card.windowspc': 'Windows PC',

      // Raspberry/PiHole
      'pi.model': 'Modell',
      'pi.hostname': 'Hostname',
      'pi.lanIp': 'LAN-IP',
      'pi.vpnIp': 'VPN-IP',
      'pi.mac': 'MAC-Adresse',
      'pi.sshUser': 'SSH-User',
      'pi.piholeUrl': 'Pi-hole Admin URL',
      'pi.piholeVpnUrl': 'Pi-hole VPN URL',

      // Speedport
      'speedport.wifiName': 'WLAN-Name',
      'speedport.wifiPassword': 'WLAN-Passwort (Schlüssel)',
      'speedport.serial': 'Serien-Nummer',
      'speedport.config': 'Konfiguration',
      'speedport.vpnUrl': 'Speedport VPN URL',
      'speedport.devicePassword': 'Gerätepasswort',
      'speedport.modemId': 'Modem-ID',

      // Speedtest
      'speedtest.download': 'Download',
      'speedtest.upload': 'Upload',
      'speedtest.ping': 'Ping',
      'speedtest.ready': 'Bereit',
      'speedtest.start': 'Speed-Test starten',
      'speedtest.starting': 'Speed-Test startet...',
      'speedtest.measuringPing': 'Messe Ping...',
      'speedtest.measuringDownload': 'Messe Download...',
      'speedtest.measuringUpload': 'Messe Upload...',
      'speedtest.complete': 'Test abgeschlossen ✓',

      // Windows PC
      'pc.status.online': 'Online',
      'pc.status.offline': 'Offline',
      'pc.status.checking': 'Prüfe...',
      'pc.wake': 'Wake',
      'pc.shutdown': 'Shutdown',
      'pc.ip': 'IP-Adresse',
      'pc.mac': 'MAC-Adresse',
      'pc.sshUser': 'SSH-User',
      'pc.sshPassword': 'SSH-Passwort',
      'pc.passwordSet': '••••••••••••',
      'pc.passwordNotSet': 'Nicht gesetzt',
      'pc.wakeSuccess': 'Wake-on-LAN Paket gesendet!',
      'pc.shutdownSuccess': 'Shutdown-Befehl gesendet!',
      'pc.connectionError': 'Verbindungsfehler',
      'pc.rateLimited': 'Zu viele Anfragen. Bitte warten.',

      // Settings
      'settings.title': 'Einstellungen',
      'settings.design': 'Design',
      'settings.data': 'Daten',
      'settings.session': 'Session',
      'settings.user': 'User',
      'settings.credits': 'Credits',
      'settings.theme': 'Theme',
      'settings.buttonStyle': 'Button-Stil',
      'settings.glowStrength': 'Glow-Stärke',
      'settings.accentColor': 'Akzentfarbe',
      'settings.language': 'Sprache',
      'settings.versions': 'Versionen',
      'settings.portAssignments': 'Port-Belegungen',
      'settings.exportImport': 'Export / Import',
      'settings.exportDesc': 'Exportiere oder importiere alle Daten (inkl. Credentials).',
      'settings.export': 'Daten exportieren',
      'settings.import': 'Daten importieren',
      'settings.sessionTimeout': 'Session Timeout',
      'settings.sessionDesc': 'Automatisch ausloggen nach Inaktivität.',
      'settings.timeoutEnable': 'Timeout aktivieren',
      'settings.timeoutMinutes': 'Minuten bis Timeout',
      'settings.userPassword': 'Benutzer & Passwort',
      'settings.newUser': 'Neuer Benutzer',
      'settings.newPassword': 'Neues Passwort',
      'settings.save': 'Speichern',
      'settings.logout': 'Ausloggen',
      'settings.on': 'An',
      'settings.off': 'Aus',
      'settings.default': 'Default',
      'settings.simple': 'Simpel',

      // Overlays
      'overlay.sessionEnded': 'Sitzung beendet',
      'overlay.anotherDevice': 'Ein anderes Gerät hat sich angemeldet.',
      'overlay.relogin': 'Erneut einloggen',
      'overlay.sessionExpired': 'Session abgelaufen',
      'overlay.sessionHint': 'Du kannst die Zeit in den Einstellungen anpassen oder deaktivieren.',

      // Messages
      'msg.saved': 'Gespeichert.',
      'msg.error': 'Fehler',
      'msg.success': 'Erfolg',
      'msg.fillCredentials': 'Bitte Benutzer und Passwort ausfüllen.',
      'msg.fillLogin': 'Bitte Nutzer & Passwort eingeben.',
      'msg.loginFailed': 'Login fehlgeschlagen',
      'msg.serverUnreachable': 'Server nicht erreichbar.',
      'msg.lockLifted': 'Sperre aufgehoben. Erneut versuchen.',
      'msg.locked': 'Gesperrt. Noch {time} Min',
      'msg.colorSaveFailed': 'Farbe konnte nicht gespeichert werden',
      'msg.credentialSaveFailed': 'Zugangsdaten konnten nicht gespeichert werden',
      'msg.speedportSaveFailed': 'Speedport konnte nicht gespeichert werden',
      'msg.piholeSaveFailed': 'PiHole konnte nicht gespeichert werden',
      'msg.portSaveFailed': 'Port konnte nicht gespeichert werden',
      'msg.exportFailed': 'Export fehlgeschlagen',
      'msg.exported': 'Daten exportiert',
      'msg.importFailed': 'Import fehlgeschlagen',
      'msg.imported': 'Daten importiert - Seite wird neu geladen',
      'msg.invalidJson': 'Ungueltige JSON-Datei',
      'msg.confirmOverwrite': 'Alle Daten werden ueberschrieben. Fortfahren?',

      // Dynamic
      'table.notAssigned': 'Nicht belegt',
      'version.change': 'Änderung',
      'version.noData': '(keine Daten verfügbar)',
      'version.none': 'Keine Versionen vorhanden',
      'speedtest.localhostNotice': 'Bitte über die LAN-IP öffnen (nicht localhost).',
      'overlay.deviceLoggedAt': '{device} hat sich um {time} eingeloggt.',
      'overlay.unknownDevice': 'anderes Gerät',
      'overlay.unknownDeviceName': 'Unbekanntes Gerät',
      'link.website': 'Zur Website',
      'link.websiteVpn': 'Zur Website (VPN)',
      'credits.stayUpdated': 'Bleibe immer aktuell',
    },

    en: {
      // General
      'app.title': 'Local Network',
      'app.settings': 'Settings',
      'app.lastVersion': 'Last Version',

      // Login
      'login.title': 'Login',
      'login.username': 'Username',
      'login.password': 'Password',
      'login.token': 'Login Token (optional)',
      'login.tokenPlaceholder': 'Token for this device',
      'login.button': 'Log in',

      // Tables
      'table.port': 'Port',
      'table.assignment': 'Assignment',
      'table.color': 'Color',

      // Cards
      'card.switch': 'Switch (8 Ports)',
      'card.router': 'WiFi Router',
      'card.pihole': 'PiHole',
      'card.speedport': 'Speedport Info',
      'card.speedtest': 'Internet Speed',
      'card.windowspc': 'Windows PC',

      // Raspberry/PiHole
      'pi.model': 'Model',
      'pi.hostname': 'Hostname',
      'pi.lanIp': 'LAN IP',
      'pi.vpnIp': 'VPN IP',
      'pi.mac': 'MAC Address',
      'pi.sshUser': 'SSH User',
      'pi.piholeUrl': 'Pi-hole Admin URL',
      'pi.piholeVpnUrl': 'Pi-hole VPN URL',

      // Speedport
      'speedport.wifiName': 'WiFi Name',
      'speedport.wifiPassword': 'WiFi Password (Key)',
      'speedport.serial': 'Serial Number',
      'speedport.config': 'Configuration',
      'speedport.vpnUrl': 'Speedport VPN URL',
      'speedport.devicePassword': 'Device Password',
      'speedport.modemId': 'Modem ID',

      // Speedtest
      'speedtest.download': 'Download',
      'speedtest.upload': 'Upload',
      'speedtest.ping': 'Ping',
      'speedtest.ready': 'Ready',
      'speedtest.start': 'Start Speed Test',
      'speedtest.starting': 'Speed test starting...',
      'speedtest.measuringPing': 'Measuring ping...',
      'speedtest.measuringDownload': 'Measuring download...',
      'speedtest.measuringUpload': 'Measuring upload...',
      'speedtest.complete': 'Test complete ✓',

      // Windows PC
      'pc.status.online': 'Online',
      'pc.status.offline': 'Offline',
      'pc.status.checking': 'Checking...',
      'pc.wake': 'Wake',
      'pc.shutdown': 'Shutdown',
      'pc.ip': 'IP Address',
      'pc.mac': 'MAC Address',
      'pc.sshUser': 'SSH User',
      'pc.sshPassword': 'SSH Password',
      'pc.passwordSet': '••••••••••••',
      'pc.passwordNotSet': 'Not set',
      'pc.wakeSuccess': 'Wake-on-LAN packet sent!',
      'pc.shutdownSuccess': 'Shutdown command sent!',
      'pc.connectionError': 'Connection error',
      'pc.rateLimited': 'Too many requests. Please wait.',

      // Settings
      'settings.title': 'Settings',
      'settings.design': 'Design',
      'settings.data': 'Data',
      'settings.session': 'Session',
      'settings.user': 'User',
      'settings.credits': 'Credits',
      'settings.theme': 'Theme',
      'settings.buttonStyle': 'Button Style',
      'settings.glowStrength': 'Glow Strength',
      'settings.accentColor': 'Accent Color',
      'settings.language': 'Language',
      'settings.versions': 'Versions',
      'settings.portAssignments': 'Port Assignments',
      'settings.exportImport': 'Export / Import',
      'settings.exportDesc': 'Export or import all data (including credentials).',
      'settings.export': 'Export Data',
      'settings.import': 'Import Data',
      'settings.sessionTimeout': 'Session Timeout',
      'settings.sessionDesc': 'Automatically log out after inactivity.',
      'settings.timeoutEnable': 'Enable Timeout',
      'settings.timeoutMinutes': 'Minutes until Timeout',
      'settings.userPassword': 'User & Password',
      'settings.newUser': 'New Username',
      'settings.newPassword': 'New Password',
      'settings.save': 'Save',
      'settings.logout': 'Log out',
      'settings.on': 'On',
      'settings.off': 'Off',
      'settings.default': 'Default',
      'settings.simple': 'Simple',

      // Overlays
      'overlay.sessionEnded': 'Session Ended',
      'overlay.anotherDevice': 'Another device has logged in.',
      'overlay.relogin': 'Log in again',
      'overlay.sessionExpired': 'Session Expired',
      'overlay.sessionHint': 'You can adjust the timeout in settings or disable it.',

      // Messages
      'msg.saved': 'Saved.',
      'msg.error': 'Error',
      'msg.success': 'Success',
      'msg.fillCredentials': 'Please fill in username and password.',
      'msg.fillLogin': 'Please enter username & password.',
      'msg.loginFailed': 'Login failed',
      'msg.serverUnreachable': 'Server not reachable.',
      'msg.lockLifted': 'Lock lifted. Try again.',
      'msg.locked': 'Locked. {time} min remaining',
      'msg.colorSaveFailed': 'Could not save color',
      'msg.credentialSaveFailed': 'Could not save credentials',
      'msg.speedportSaveFailed': 'Could not save Speedport',
      'msg.piholeSaveFailed': 'Could not save PiHole',
      'msg.portSaveFailed': 'Could not save port',
      'msg.exportFailed': 'Export failed',
      'msg.exported': 'Data exported',
      'msg.importFailed': 'Import failed',
      'msg.imported': 'Data imported - page will reload',
      'msg.invalidJson': 'Invalid JSON file',
      'msg.confirmOverwrite': 'All data will be overwritten. Continue?',

      // Dynamic
      'table.notAssigned': 'Not assigned',
      'version.change': 'Change',
      'version.noData': '(no data available)',
      'version.none': 'No versions available',
      'speedtest.localhostNotice': 'Please open via LAN IP (not localhost).',
      'overlay.deviceLoggedAt': '{device} logged in at {time}.',
      'overlay.unknownDevice': 'another device',
      'overlay.unknownDeviceName': 'Unknown device',
      'link.website': 'Go to website',
      'link.websiteVpn': 'Go to website (VPN)',
      'credits.stayUpdated': 'Stay up to date',
    },
  },

  t(key) {
    return this.translations[this.currentLang]?.[key] || this.translations.de[key] || key;
  },

  setLanguage(lang) {
    if (!this.translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    this.updateDOM();
  },

  updateDOM() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    });

    // Update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update title
    document.title = this.t('app.title');

    // Update dynamic content
    this.updateDynamicContent();
  },

  updateDynamicContent() {
    // Update speedtest labels
    const speedLabel = document.getElementById('speedLabel');
    if (speedLabel && (speedLabel.textContent === 'Bereit' || speedLabel.textContent === 'Ready')) {
      speedLabel.textContent = this.t('speedtest.ready');
    }

    // Update PC status
    const pcStatusText = document.getElementById('pcStatusText');
    if (pcStatusText) {
      const text = pcStatusText.textContent;
      if (text === 'Online') pcStatusText.textContent = this.t('pc.status.online');
      else if (text === 'Offline') pcStatusText.textContent = this.t('pc.status.offline');
      else if (text === 'Prüfe...' || text === 'Checking...') pcStatusText.textContent = this.t('pc.status.checking');
    }
  },

  init() {
    document.documentElement.lang = this.currentLang;
    this.updateDOM();
  },
};

const els = {
  body: document.body,
  topBar: document.getElementById('topBar'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsOverlay: document.getElementById('settingsOverlay'),
  closeSettings: document.getElementById('closeSettings'),
  settingsTabs: document.querySelectorAll('.settings-tab'),
  settingsPanels: document.querySelectorAll('.settings-panel'),
  themeSwitcher: document.getElementById('themeSwitcher'),
  buttonStyleGroup: document.getElementById('buttonStyleGroup'),
  glowStrength: document.getElementById('glowStrength'),
  accentPicker: document.getElementById('accentPicker'),
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
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
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
  glowStrength: 1,
  accent: '#00d4ff',
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
  glowStrength: 'glowStrength',
  accent: 'accent',
  sessionTimeoutEnabled: 'sessionTimeoutEnabled',
  sessionTimeoutMinutes: 'sessionTimeoutMinutes',
};

// Config-basierte Defaults mit Fallback und Validierung
const configDefaults = typeof siteConfig !== 'undefined' ? siteConfig.defaults : null;

function validateTheme(theme) {
  const validThemes = ['dark', 'light', 'system'];
  return validThemes.includes(theme) ? theme : 'dark';
}

function validateGlowStrength(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 1;
  return Math.min(2, Math.max(0, num));
}

function validateTimeoutMinutes(value) {
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num < 1) return 5;
  return Math.min(60, num);
}

const defaults = {
  theme: validateTheme(configDefaults?.theme),
  buttonStyle: configDefaults?.buttonStyle === 'simple' ? 'simple' : 'default',
  glowStrength: configDefaults?.glow?.enabled !== false ? validateGlowStrength(configDefaults?.glow?.strength ?? 1) : 0,
  accent: /^#[0-9A-Fa-f]{6}$/.test(configDefaults?.accentColor) ? configDefaults.accentColor : '#00d4ff',
  language: configDefaults?.language === 'en' ? 'en' : 'de',
  sessionTimeoutEnabled: configDefaults?.sessionTimeout?.enabled !== false,
  sessionTimeoutMinutes: validateTimeoutMinutes(configDefaults?.sessionTimeout?.minutes ?? 5),
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

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme, save = false) {
  state.theme = theme;
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
  document.body.setAttribute('data-theme', effectiveTheme);
  if (save) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    // Tabellen neu rendern damit Farben stimmen
    if (state.token) renderTables();
  }
  updateThemeSwitcherUI(theme);
}

function updateThemeSwitcherUI(theme) {
  if (!els.themeSwitcher) return;
  const options = ['dark', 'system', 'light'];
  const position = options.indexOf(theme);
  els.themeSwitcher.setAttribute('data-position', position >= 0 ? position : 0);
  els.themeSwitcher.querySelectorAll('.theme-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === theme);
  });
}

// Legacy alias for compatibility
function updateThemeToggleUI(theme) {
  updateThemeSwitcherUI(theme);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 212, b: 255 };
}

function applyGlowStrength(value) {
  const numeric = Number(value);
  const safeValue = Number.isNaN(numeric) ? defaults.glowStrength : numeric;
  state.glowStrength = Math.min(2, Math.max(0, safeValue));
  document.documentElement.style.setProperty('--glow-strength', String(state.glowStrength));
  document.body.style.setProperty('--glow-strength', String(state.glowStrength));
  updateGlowSliderUI(state.glowStrength);
}

function updateGlowSliderUI(value) {
  const slider = els.glowStrength;
  if (!slider) return;
  const numeric = Number(value);
  const safeValue = Number.isNaN(numeric) ? defaults.glowStrength : numeric;
  slider.value = String(safeValue);
  const percent = Math.round((safeValue / 2) * 100);
  slider.style.setProperty('--glow-percent', `${percent}%`);
  slider.style.setProperty('--glow-thumb-icon', buildGlowThumbIcon(safeValue));
}

function buildGlowThumbIcon(value) {
  const clamped = Math.min(2, Math.max(0, Number(value)));
  let lines = '';
  if (clamped > 0) {
    const minRay = 1.4;
    const maxRay = 4.6;
    const inner = 6;
    const rayLength = minRay + (maxRay - minRay) * (clamped / 2);
    const outer = inner + rayLength;
    const diagInner = inner * Math.SQRT1_2;
    const diagOuter = outer * Math.SQRT1_2;
    const fmt = (num) => Number(num.toFixed(2));
    const line = (x1, y1, x2, y2) =>
      `<line x1='${fmt(x1)}' y1='${fmt(y1)}' x2='${fmt(x2)}' y2='${fmt(y2)}'/>`;
    lines = [
      line(12, 12 - inner, 12, 12 - outer),
      line(12, 12 + inner, 12, 12 + outer),
      line(12 - inner, 12, 12 - outer, 12),
      line(12 + inner, 12, 12 + outer, 12),
      line(12 - diagInner, 12 - diagInner, 12 - diagOuter, 12 - diagOuter),
      line(12 + diagInner, 12 - diagInner, 12 + diagOuter, 12 - diagOuter),
      line(12 - diagInner, 12 + diagInner, 12 - diagOuter, 12 + diagOuter),
      line(12 + diagInner, 12 + diagInner, 12 + diagOuter, 12 + diagOuter),
    ].join('');
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'><circle cx='12' cy='12' r='4' fill='none'/>${lines}</svg>`;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml,${encoded}")`;
}

function applyAccentColor(hex) {
  state.accent = hex || defaults.accent;
  const rgb = hexToRgb(state.accent);
  const accentVars = {
    '--accent': state.accent,
    '--accent-strong': state.accent,
    '--accent-rgb': `${rgb.r} ${rgb.g} ${rgb.b}`,
  };
  for (const [key, value] of Object.entries(accentVars)) {
    document.documentElement.style.setProperty(key, value);
    document.body.style.setProperty(key, value);
  }
  updateAccentPickerUI(state.accent);
}

function updateAccentPickerUI(accent) {
  if (!els.accentPicker) return;
  els.accentPicker.querySelectorAll('.accent-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.color === accent);
  });
}

function applyButtonStyle(style, save = false) {
  document.body.setAttribute('data-button-style', style);
  if (save) {
    localStorage.setItem(STORAGE_KEYS.buttonStyle, style);
  }
  updateButtonStyleUI(style);
}

function updateToggleSlider(group) {
  if (!group) return;
  const slider = group.querySelector('.toggle-slider');
  if (!slider) return;

  const activeBtn = group.querySelector('.toggle-option.active');
  if (!activeBtn) return;

  // Calculate position and width
  const buttons = Array.from(group.querySelectorAll('.toggle-option'));
  const activeIndex = buttons.indexOf(activeBtn);
  let offsetX = 0;

  for (let i = 0; i < activeIndex; i++) {
    offsetX += buttons[i].offsetWidth + 3; // 3px gap
  }

  slider.style.width = `${activeBtn.offsetWidth}px`;
  slider.style.transform = `translateX(${offsetX}px)`;
}

function updateButtonStyleUI(style) {
  if (!els.buttonStyleGroup) return;
  const options = ['default', 'simple'];
  const position = options.indexOf(style);
  els.buttonStyleGroup.setAttribute('data-position', position >= 0 ? position : 0);
  els.buttonStyleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === style);
  });
  updateToggleSlider(els.buttonStyleGroup);
}

function loadLocalSettings() {
  // Config-Defaults verwenden wenn keine localStorage-Werte vorhanden
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || defaults.theme;
  const savedButtonStyle = localStorage.getItem(STORAGE_KEYS.buttonStyle) || defaults.buttonStyle;
  const savedGlowStrength = localStorage.getItem(STORAGE_KEYS.glowStrength);
  const savedAccent = localStorage.getItem(STORAGE_KEYS.accent) || defaults.accent;

  applyTheme(savedTheme);
  applyButtonStyle(savedButtonStyle);
  applyGlowStrength(savedGlowStrength !== null ? Number(savedGlowStrength) : defaults.glowStrength);
  applyAccentColor(savedAccent);
  loadSessionSettings();

  // Config-basierte Sichtbarkeit und Animationen anwenden
  applyConfigVisibility();
  applyCardsVisibility();
  applyAnimationConfig();
  renderHeaderLinks();
}

function applyConfigVisibility() {
  if (typeof siteConfig === 'undefined') return;

  // Settings-Button nur ausblenden wenn EXPLIZIT auf false gesetzt
  if (siteConfig.settings?.showSettingsButton === false) {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.style.display = 'none';
    }
  }

  // Tabs ein/ausblenden basierend auf Config
  // Credits-Tab kann nicht deaktiviert werden
  // Tabs werden nur versteckt wenn EXPLIZIT auf false gesetzt
  // Nur erlaubte Tab-Namen akzeptieren (Schutz vor Selector-Injection)
  const allowedTabs = ['design', 'daten', 'session', 'user'];
  const tabs = siteConfig.settings?.tabs || {};
  Object.entries(tabs).forEach(([tab, visible]) => {
    if (visible === false && allowedTabs.includes(tab)) {
      // Tab-Button ausblenden
      const tabBtn = document.querySelector(`.settings-tab[data-tab="${tab}"]`);
      if (tabBtn) {
        tabBtn.style.display = 'none';
      }
      // Panel ausblenden
      const panel = document.getElementById(`panel-${tab}`);
      if (panel) {
        panel.style.display = 'none';
      }
    }
  });

  // Falls der erste Tab versteckt ist, aktiviere den nächsten sichtbaren
  const visibleTabs = Array.from(document.querySelectorAll('.settings-tab')).filter(
    (tab) => tab.style.display !== 'none'
  );
  if (visibleTabs.length > 0) {
    const firstVisible = visibleTabs[0];
    if (!firstVisible.classList.contains('active')) {
      // Deaktiviere alle Tabs und Panels
      document.querySelectorAll('.settings-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach((p) => p.classList.remove('active'));
      // Aktiviere den ersten sichtbaren
      firstVisible.classList.add('active');
      const panelId = `panel-${firstVisible.dataset.tab}`;
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');
      }
    }
  }
}

function applyCardsVisibility() {
  if (typeof siteConfig === 'undefined') return;

  const cards = siteConfig.cards || {};
  const cardMap = {
    switch: 'switchCard',
    router: 'routerCard',
    pihole: 'piholeCard',
    speedport: 'speedportCard',
    speedtest: 'speedtestCard',
    windowsPc: 'windowsPcCard',
  };

  Object.entries(cards).forEach(([key, visible]) => {
    if (visible === false && cardMap[key]) {
      const card = document.getElementById(cardMap[key]);
      if (card) {
        card.style.display = 'none';
      }
    }
  });

  // Wenn beide Switch und Router versteckt sind, verstecke auch das Grid
  if (cards.switch === false && cards.router === false) {
    const networkGrid = document.getElementById('networkGrid');
    if (networkGrid) {
      networkGrid.style.display = 'none';
    }
  }
}

function applyAnimationConfig() {
  if (typeof siteConfig === 'undefined') return;

  const animations = siteConfig.animations || {};

  // Master-Schalter
  if (!animations.enabled) {
    document.body.setAttribute('data-animations', 'off');
    return;
  }

  // Einzelne Animationen
  if (!animations.heroGradient) {
    document.body.setAttribute('data-animation-hero', 'off');
  }
  if (!animations.fadeIn) {
    document.body.setAttribute('data-animation-fade', 'off');
  }
  if (!animations.modalSlide) {
    document.body.setAttribute('data-animation-modal', 'off');
  }
  if (!animations.panelFade) {
    document.body.setAttribute('data-animation-panel', 'off');
  }
  if (!animations.themeSwitcher) {
    document.body.setAttribute('data-animation-theme', 'off');
  }
}

function renderHeaderLinks() {
  if (typeof siteConfig === 'undefined') return;

  const links = siteConfig.headerLinks || [];
  const container = document.getElementById('headerLinks');
  if (!container) return;

  container.innerHTML = '';

  links.forEach(link => {
    if (!link.name || !link.url) return;

    // Security: Only allow http/https URLs to prevent javascript: XSS
    let url;
    try {
      url = new URL(link.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        console.warn('Blocked non-http(s) URL in header links:', link.url);
        return;
      }
    } catch (e) {
      console.warn('Invalid URL in header links:', link.url);
      return;
    }

    const a = document.createElement('a');
    a.href = url.href; // Use parsed URL for safety
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'header-link';

    // Favicon direkt von der Website holen
    const img = document.createElement('img');
    img.src = `${url.origin}/favicon.ico`;
    img.alt = '';
    img.loading = 'lazy';
    // Fallback falls favicon.ico nicht existiert
    img.onerror = () => {
      img.style.display = 'none';
    };

    const span = document.createElement('span');
    span.textContent = link.name;

    a.appendChild(img);
    a.appendChild(span);
    container.appendChild(a);
  });
}

function openSettings() {
  els.settingsOverlay.classList.add('active');

  // Initialize toggle sliders after modal becomes visible
  // Must wait for display:flex to apply before measuring offsetWidth
  requestAnimationFrame(() => {
    updateToggleSlider(els.buttonStyleGroup);
    updateToggleSlider(els.timeoutToggleGroup);
    const languageGroup = document.getElementById('languageGroup');
    if (languageGroup) {
      updateToggleSlider(languageGroup);
    }
  });
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
    showLoginStatus(i18n.t('msg.fillLogin'), true);
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
        showLoginStatus(body.message || i18n.t('msg.loginFailed'), true);
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
    windowsPC.init();
    if (state.redirectToSettings) {
      state.redirectToSettings = false;
      openSettings();
      switchSettingsTab('session');
    }
  } catch (e) {
    console.error(e);
    showLoginStatus(i18n.t('msg.serverUnreachable'), true);
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
      showLoginStatus(i18n.t('msg.lockLifted'), false);
      return;
    }
    const min = Math.floor(left / 60000);
    const sec = Math.floor((left % 60000) / 1000);
    showLoginStatus(i18n.t('msg.locked').replace('{time}', `${min}:${sec.toString().padStart(2, '0')}`), true);
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
  windowsPC.init();
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
  els.logoutReason.textContent = i18n.t('overlay.deviceLoggedAt').replace('{device}', deviceName || i18n.t('overlay.unknownDevice')).replace('{time}', at.toLocaleTimeString());
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

// Helper to create port table row safely (prevents XSS)
function createPortRow(port, group) {
  const textColor = pickTextColor(port.color);
  const tr = document.createElement('tr');

  // Label cell - using textContent for XSS safety
  const labelTd = document.createElement('td');
  labelTd.style.background = port.color;
  labelTd.style.color = textColor;
  labelTd.textContent = port.label; // Safe - auto-escaped
  tr.appendChild(labelTd);

  // Status input cell
  const statusTd = document.createElement('td');
  const statusInput = document.createElement('input');
  statusInput.className = 'inline-input status-input';
  statusInput.type = 'text';
  statusInput.value = port.status; // Safe - setting value property
  statusInput.placeholder = i18n.t('table.notAssigned');
  statusInput.dataset.group = group;
  statusInput.dataset.id = port.id;
  statusInput.dataset.last = port.status;
  statusInput.setAttribute('aria-label', `${port.label} Belegung`);
  statusTd.appendChild(statusInput);
  tr.appendChild(statusTd);

  // Color input cell
  const colorTd = document.createElement('td');
  const colorInput = document.createElement('input');
  colorInput.className = 'color-input';
  colorInput.type = 'color';
  colorInput.value = port.color;
  colorInput.dataset.group = group;
  colorInput.dataset.id = port.id;
  colorInput.setAttribute('aria-label', `${port.label} Farbe`);
  colorTd.appendChild(colorInput);
  tr.appendChild(colorTd);

  return tr;
}

function renderTables() {
  els.switchTableBody.innerHTML = '';
  els.routerTableBody.innerHTML = '';

  // Render switch ports using safe DOM methods
  state.switchPorts.forEach((port) => {
    els.switchTableBody.appendChild(createPortRow(port, 'switch'));
  });

  // Render router ports using safe DOM methods
  state.routerPorts.forEach((port) => {
    els.routerTableBody.appendChild(createPortRow(port, 'router'));
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
        if (res.status === 401) return handleForceLogout(null, Date.now());
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
        showToast(i18n.t('msg.colorSaveFailed'), true);
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
  updateLinkButton(els.speedportLink, speedportInputs.configuration?.value, i18n.t('link.website'));
  updateLinkButton(els.speedportRemoteLink, speedportInputs.remoteUrl?.value, i18n.t('link.websiteVpn'));
}

function updatePiholeLinks() {
  updateLinkButton(els.piHoleLink, raspberryInputs.piholeUrl?.value, i18n.t('link.website'));
  updateLinkButton(els.piHoleRemoteLink, raspberryInputs.piholeRemoteUrl?.value, i18n.t('link.websiteVpn'));
}

function updateVersions(versions) {
  state.versions = versions || [];
  els.versionSelect.innerHTML = '';
  if (!state.versions.length) {
    els.versionSelect.innerHTML = `<option>${i18n.t('version.none')}</option>`;
    els.versionDetails.textContent = '';
    els.versionChip.textContent = `${i18n.t('app.lastVersion')}: --`;
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
  els.versionChip.textContent = `${i18n.t('app.lastVersion')}: ${newest.label}`;
  applyVersionSnapshot(targetId);
}

function updateRaspberryVersions(versions) {
  if (!els.raspberryVersionSelect) return;
  state.raspberryVersions = versions || [];
  els.raspberryVersionSelect.innerHTML = '';
  if (!state.raspberryVersions.length) {
    els.raspberryVersionSelect.innerHTML = `<option>${i18n.t('version.none')}</option>`;
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
    els.speedportVersionSelect.innerHTML = `<option>${i18n.t('version.none')}</option>`;
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
  const suffix = version.snapshot ? '' : ` ${i18n.t('version.noData')}`;
  els.versionDetails.textContent = `${version.summary || i18n.t('version.change')} · ${date.toLocaleString()}${suffix}`;
}

function renderRaspberryVersionDetails(id) {
  if (!els.raspberryVersionDetails) return;
  const version = state.raspberryVersions.find((v) => v.id === id);
  if (!version) {
    els.raspberryVersionDetails.textContent = '';
    return;
  }
  const date = new Date(version.timestamp || Date.now());
  const suffix = version.snapshot ? '' : ` ${i18n.t('version.noData')}`;
  els.raspberryVersionDetails.textContent = `${version.summary || i18n.t('version.change')} · ${date.toLocaleString()}${suffix}`;
}

function renderSpeedportVersionDetails(id) {
  if (!els.speedportVersionDetails) return;
  const version = state.speedportVersions.find((v) => v.id === id);
  if (!version) {
    els.speedportVersionDetails.textContent = '';
    return;
  }
  const date = new Date(version.timestamp || Date.now());
  const suffix = version.snapshot ? '' : ` ${i18n.t('version.noData')}`;
  els.speedportVersionDetails.textContent = `${version.summary || i18n.t('version.change')} · ${date.toLocaleString()}${suffix}`;
}

async function saveCredentials(e) {
  e.preventDefault();
  const username = els.newUser.value.trim();
  const password = els.newPass.value.trim();
  if (!username || !password) {
    els.credentialStatus.textContent = i18n.t('msg.fillCredentials');
    return;
  }
  try {
    const res = await fetch('/api/settings/credentials', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 401) return handleForceLogout(null, Date.now());
    els.newUser.value = '';
    els.newPass.value = '';
    els.credentialStatus.textContent = i18n.t('msg.saved');
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast(i18n.t('msg.credentialSaveFailed'), true);
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
    if (res.status === 401) return handleForceLogout(null, Date.now());
    const body = await res.json();
    setLiveState({ speedportInfo: body.speedportInfo });
    state.speedportInfo = { ...state.live.speedportInfo };
    state.speedportViewFromLive = true;
    state.speedportFollowLatest = true;
    updateSpeedportVersions(body.speedportVersions || state.speedportVersions);
    showSpeedportStatus();
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast(i18n.t('msg.speedportSaveFailed'), true);
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
    if (res.status === 401) return handleForceLogout(null, Date.now());
    const body = await res.json();
    setLiveState({ raspberryInfo: body.raspberryInfo });
    state.raspberryInfo = { ...state.live.raspberryInfo };
    state.raspberryViewFromLive = true;
    state.raspberryFollowLatest = true;
    updateRaspberryVersions(body.raspberryVersions || state.raspberryVersions);
    showRaspberryStatus();
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    showToast(i18n.t('msg.piholeSaveFailed'), true);
  }
}, 350);

function showSpeedportStatus() {
  els.speedportStatus.hidden = false;
  els.speedportStatus.textContent = i18n.t('msg.saved');
  clearTimeout(showSpeedportStatus._timeout);
  showSpeedportStatus._timeout = setTimeout(() => {
    els.speedportStatus.hidden = true;
  }, 1800);
}

function showRaspberryStatus() {
  if (!els.raspberryStatus) return;
  els.raspberryStatus.hidden = false;
  els.raspberryStatus.textContent = i18n.t('msg.saved');
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
  // Config-Defaults verwenden wenn keine localStorage-Werte vorhanden
  state.sessionTimeoutEnabled = savedEnabled !== null ? savedEnabled !== 'false' : defaults.sessionTimeoutEnabled;
  state.sessionTimeoutMinutes = savedMinutes !== null ? parseInt(savedMinutes, 10) : defaults.sessionTimeoutMinutes;
  updateTimeoutUI();
}

function saveSessionSettings() {
  localStorage.setItem(STORAGE_KEYS.sessionTimeoutEnabled, state.sessionTimeoutEnabled);
  localStorage.setItem(STORAGE_KEYS.sessionTimeoutMinutes, state.sessionTimeoutMinutes);
}

function updateTimeoutUI() {
  if (!els.timeoutToggleGroup) return;
  // Options are "off" (position 0) and "on" (position 1)
  els.timeoutToggleGroup.setAttribute('data-position', state.sessionTimeoutEnabled ? 1 : 0);
  els.timeoutToggleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    const isOn = btn.dataset.value === 'on';
    btn.classList.toggle('active', isOn === state.sessionTimeoutEnabled);
  });
  updateToggleSlider(els.timeoutToggleGroup);
  if (els.timeoutMinutesRow) {
    els.timeoutMinutesRow.classList.toggle('hidden', !state.sessionTimeoutEnabled);
  }
  if (els.timeoutMinutes) {
    els.timeoutMinutes.value = state.sessionTimeoutMinutes;
  }
}

// Export/Import
async function handleExport() {
  try {
    const res = await fetch('/api/export', { headers: authHeaders() });
    if (res.status === 401) return handleForceLogout(null, Date.now());
    if (!res.ok) {
      showToast(i18n.t('msg.exportFailed'), true);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netzwerk-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(i18n.t('msg.exported'));
  } catch (e) {
    console.error('Export error:', e);
    showToast(i18n.t('msg.exportFailed'), true);
  }
}

async function handleImport(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const data = json.data || json;

    if (!confirm(i18n.t('msg.confirmOverwrite'))) {
      return;
    }

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ data }),
    });
    if (res.status === 401) return handleForceLogout(null, Date.now());
    const body = await res.json();
    if (!res.ok) {
      showToast(body.error || i18n.t('msg.importFailed'), true);
      return;
    }
    showToast(i18n.t('msg.imported'));
    setTimeout(() => location.reload(), 1500);
  } catch (e) {
    console.error('Import error:', e);
    showToast(i18n.t('msg.invalidJson'), true);
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

  // Theme Switcher (3-way)
  if (els.themeSwitcher) {
    els.themeSwitcher.querySelectorAll('.theme-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.value;
        applyTheme(theme, true);
      });
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') {
      applyTheme('system');
    }
  });

  // Button Style Toggle
  els.buttonStyleGroup.querySelectorAll('.toggle-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.value;
      applyButtonStyle(style, true);
      updateToggleSlider(els.buttonStyleGroup);
    });
  });

  // Glow Strength Slider
  if (els.glowStrength) {
    els.glowStrength.addEventListener('input', (e) => {
      const nextValue = Number(e.target.value);
      applyGlowStrength(nextValue);
    });
    els.glowStrength.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEYS.glowStrength, String(state.glowStrength));
      showToast(i18n.t('msg.saved'));
    });
  }

  // Accent Color Picker
  if (els.accentPicker) {
    els.accentPicker.querySelectorAll('.accent-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        applyAccentColor(color);
        localStorage.setItem(STORAGE_KEYS.accent, color);
        showToast(i18n.t('msg.saved'));
      });
    });
  }

  // Language Switcher
  const languageGroup = document.getElementById('languageGroup');
  if (languageGroup) {
    // Set initial active state and position based on saved language
    const langOptions = ['de', 'en'];
    const initialLangPos = langOptions.indexOf(i18n.currentLang);
    languageGroup.setAttribute('data-position', initialLangPos >= 0 ? initialLangPos : 0);
    languageGroup.querySelectorAll('.toggle-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.value === i18n.currentLang);
    });

    languageGroup.querySelectorAll('.toggle-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.value;
        const position = langOptions.indexOf(lang);
        languageGroup.setAttribute('data-position', position >= 0 ? position : 0);
        i18n.setLanguage(lang);
        languageGroup.querySelectorAll('.toggle-option').forEach((b) => {
          b.classList.toggle('active', b.dataset.value === lang);
        });
        updateToggleSlider(languageGroup);
        showToast(i18n.t('msg.saved'));
      });
    });
  }

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
      updateToggleSlider(els.timeoutToggleGroup);
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

  // Export/Import
  els.exportBtn.addEventListener('click', handleExport);
  els.importFile.addEventListener('change', (e) => {
    handleImport(e.target.files[0]);
    e.target.value = '';
  });
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
    if (res.status === 401) return handleForceLogout(null, Date.now());
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
    showToast(i18n.t('msg.portSaveFailed'), true);
  }
}

function deriveDeviceName() {
  try {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      const brands = navigator.userAgentData.brands || [];
      const brand = brands.length ? brands[0].brand : '';
      return `${brand || i18n.t('overlay.unknownDeviceName')} ${navigator.userAgentData.platform}`.trim();
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
    return ua.split(' ')[0] || i18n.t('overlay.unknownDeviceName');
  } catch (e) {
    return i18n.t('overlay.unknownDeviceName');
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
    const msg = i18n.t('speedtest.localhostNotice');
    const notice = document.getElementById('speedtestNotice');
    if (notice) notice.textContent = msg;
    return false;
  },

  updateHostNotice() {
    const notice = document.getElementById('speedtestNotice');
    if (!notice) return;
    if (this.isLocalhostHost()) {
      notice.textContent = i18n.t('speedtest.localhostNotice');
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
    this.updateLabel(i18n.t('speedtest.starting'));
    const notice = document.getElementById('speedtestNotice');
    if (notice) notice.textContent = '';

    // Ping Test
    this.updateLabel(i18n.t('speedtest.measuringPing'));
    const ping = await this.measureLocalPing();
    if (pingEl) pingEl.textContent = `${ping.toFixed(1)} ms`;

    await new Promise(resolve => setTimeout(resolve, 300));

    // Download Test
    this.updateLabel(i18n.t('speedtest.measuringDownload'));
    const download = await this.measureLocalDownload();
    if (downloadEl) downloadEl.textContent = `${download.toFixed(1)} Mbit/s`;

    await new Promise(resolve => setTimeout(resolve, 300));

    // Upload Test
    this.updateLabel(i18n.t('speedtest.measuringUpload'));
    const upload = await this.measureLocalUpload();
    if (uploadEl) uploadEl.textContent = `${upload.toFixed(1)} Mbit/s`;

    // Show final result
    const finalSpeed = Math.max(download, upload);
    this.updateGauge(finalSpeed, 2000);
    this.updateLabel(i18n.t('speedtest.complete'));

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

// ═══════════════════════════════════════════════════════════════════
// Windows PC Control
// ═══════════════════════════════════════════════════════════════════

const windowsPC = {
  config: null,
  statusInterval: null,
  initialized: false,

  async init() {
    // Prevent multiple initializations
    if (this.initialized) {
      // Just refresh status if already initialized
      this.checkStatus();
      return;
    }
    this.initialized = true;
    await this.loadConfig();
    this.bindEvents();
    this.startStatusCheck();
  },

  async loadConfig() {
    if (!state.token) return;

    try {
      const res = await fetch('/api/windows-pc', { headers: authHeaders() });
      if (res.ok) {
        this.config = await res.json();
        this.updateUI();
      }
    } catch (e) {
      console.error('Failed to load Windows PC config:', e);
    }
  },

  updateUI() {
    if (!this.config) return;

    const ipEl = document.getElementById('pcIpValue');
    const macEl = document.getElementById('pcMacValue');
    const userEl = document.getElementById('pcSshUserValue');
    const passEl = document.getElementById('pcSshPassValue');

    if (ipEl) ipEl.textContent = this.config.ipAddress || '--';
    if (macEl) macEl.textContent = this.config.macAddress || '--';
    if (userEl) userEl.textContent = this.config.sshUser || '--';

    // Password display
    if (passEl) {
      const passText = passEl.querySelector('.password-text');
      if (passText && !this.passwordRevealed) {
        passText.textContent = this.config.hasPassword ? i18n.t('pc.passwordSet') : i18n.t('pc.passwordNotSet');
        passText.classList.remove('revealed');
      }
    }
  },

  bindEvents() {
    const wakeBtn = document.getElementById('pcWakeBtn');
    const shutdownBtn = document.getElementById('pcShutdownBtn');
    const passwordToggle = document.getElementById('pcPasswordToggle');

    if (wakeBtn) {
      wakeBtn.addEventListener('click', () => this.wake());
    }

    if (shutdownBtn) {
      shutdownBtn.addEventListener('click', () => this.shutdown());
    }

    if (passwordToggle) {
      passwordToggle.addEventListener('click', () => this.togglePassword());
    }
  },

  passwordRevealed: false,
  cachedPassword: null,

  async togglePassword() {
    const passEl = document.getElementById('pcSshPassValue');
    const passText = passEl?.querySelector('.password-text');
    const eyeIcon = document.querySelector('#pcPasswordToggle .eye-icon');
    const eyeOffIcon = document.querySelector('#pcPasswordToggle .eye-off-icon');

    if (!passText) return;

    if (this.passwordRevealed) {
      // Hide password
      passText.textContent = this.config.hasPassword ? i18n.t('pc.passwordSet') : i18n.t('pc.passwordNotSet');
      passText.classList.remove('revealed');
      if (eyeIcon) eyeIcon.style.display = '';
      if (eyeOffIcon) eyeOffIcon.style.display = 'none';
      this.passwordRevealed = false;
    } else {
      // Show password - fetch from server if not cached
      if (!this.cachedPassword) {
        try {
          const res = await fetch('/api/windows-pc/password', { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            this.cachedPassword = data.password;
          }
        } catch (e) {
          console.error('Failed to fetch password:', e);
          return;
        }
      }
      passText.textContent = this.cachedPassword || i18n.t('pc.passwordNotSet');
      passText.classList.add('revealed');
      if (eyeIcon) eyeIcon.style.display = 'none';
      if (eyeOffIcon) eyeOffIcon.style.display = '';
      this.passwordRevealed = true;
    }
  },

  startStatusCheck() {
    // Clear any existing interval first
    this.stopStatusCheck();
    this.checkStatus();
    // Check every 5 seconds for more responsive updates
    this.statusInterval = setInterval(() => this.checkStatus(), 5000);
  },

  stopStatusCheck() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  },

  async checkStatus() {
    if (!state.token) return;

    try {
      const res = await fetch('/api/windows-pc/status', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        this.updateStatusUI(data.online);
      }
    } catch (e) {
      this.updateStatusUI(false);
    }
  },

  updateStatusUI(online) {
    const statusEl = document.getElementById('pcStatus');
    const textEl = document.getElementById('pcStatusText');

    if (statusEl) {
      statusEl.classList.remove('online', 'offline');
      statusEl.classList.add(online ? 'online' : 'offline');
    }

    if (textEl) {
      textEl.textContent = online ? i18n.t('pc.status.online') : i18n.t('pc.status.offline');
    }
  },

  async wake() {
    if (!state.token) return;

    const btn = document.getElementById('pcWakeBtn');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch('/api/windows-pc/wake', {
        method: 'POST',
        headers: authHeaders(),
      });

      const data = await res.json();
      showToast(data.success ? i18n.t('pc.wakeSuccess') : data.message, !data.success);
    } catch (e) {
      showToast(i18n.t('pc.connectionError'), true);
    }

    if (btn) btn.disabled = false;
  },

  async shutdown() {
    if (!state.token) return;

    const btn = document.getElementById('pcShutdownBtn');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch('/api/windows-pc/shutdown', {
        method: 'POST',
        headers: authHeaders(),
      });

      const data = await res.json();
      showToast(data.success ? i18n.t('pc.shutdownSuccess') : data.message, !data.success);
    } catch (e) {
      showToast(i18n.t('pc.connectionError'), true);
    }

    if (btn) btn.disabled = false;
  },
};

// Hook into login success - watch for app becoming visible
const appObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      const app = document.getElementById('app');
      if (app && app.style.display !== 'none' && state.token) {
        windowsPC.init();
      }
    }
  });
});

const appEl = document.getElementById('app');
if (appEl) {
  appObserver.observe(appEl, { attributes: true });
}

// Initialize internationalization
i18n.init();
