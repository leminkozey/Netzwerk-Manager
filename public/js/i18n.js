// ═══════════════════════════════════════════════════════════════════
// Internationalization (i18n)
// ═══════════════════════════════════════════════════════════════════

import { defaults } from './state.js';

const translations = {
  de: {
    'app.title': 'Lokales Netzwerk',
    'app.settings': 'Einstellungen',
    'app.lastVersion': 'Letzte Version',

    'login.title': 'Login',
    'login.username': 'Benutzername',
    'login.password': 'Passwort',
    'login.token': 'Login-Token (optional)',
    'login.tokenPlaceholder': 'Token für dieses Gerät',
    'login.button': 'Einloggen',

    'table.port': 'Port',
    'table.assignment': 'Belegung',
    'table.color': 'Farbe',
    'table.notAssigned': 'Nicht belegt',

    'card.switch': 'Switch (8 Ports)',
    'card.router': 'WLAN Router',
    'card.pihole': 'PiHole',
    'card.speedport': 'Speedport Infos',
    'card.speedtest': 'Internet Geschwindigkeit',
    'card.windowspc': 'Windows PC',

    'pi.model': 'Modell',
    'pi.hostname': 'Hostname',
    'pi.lanIp': 'LAN-IP',
    'pi.vpnIp': 'VPN-IP',
    'pi.mac': 'MAC-Adresse',
    'pi.sshUser': 'SSH-User',
    'pi.piholeUrl': 'Pi-hole Admin URL',
    'pi.piholeVpnUrl': 'Pi-hole VPN URL',

    'speedport.wifiName': 'WLAN-Name',
    'speedport.wifiPassword': 'WLAN-Passwort (Schlüssel)',
    'speedport.serial': 'Serien-Nummer',
    'speedport.config': 'Konfiguration',
    'speedport.vpnUrl': 'Speedport VPN URL',
    'speedport.devicePassword': 'Gerätepasswort',
    'speedport.modemId': 'Modem-ID',

    'speedtest.download': 'Download',
    'speedtest.upload': 'Upload',
    'speedtest.ping': 'Ping',
    'speedtest.ready': 'Bereit',
    'speedtest.start': 'Speed-Test starten',
    'speedtest.starting': 'Speed-Test startet...',
    'speedtest.measuringPing': 'Messe Ping...',
    'speedtest.measuringDownload': 'Messe Download...',
    'speedtest.measuringUpload': 'Messe Upload...',
    'speedtest.complete': 'Test abgeschlossen',
    'speedtest.localhostNotice': 'Bitte über die LAN-IP öffnen (nicht localhost).',

    'pc.status.online': 'Online',
    'pc.status.offline': 'Offline',
    'pc.status.checking': 'Prüfe...',
    'pc.name': 'Name',
    'pc.wake': 'Wake',
    'pc.shutdown': 'Shutdown',
    'pc.restart': 'Restart',
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

    'settings.title': 'Einstellungen',
    'settings.design': 'Design',
    'settings.analysen': 'Analysen',
    'settings.data': 'Daten',
    'settings.session': 'Session',
    'settings.user': 'User',
    'settings.credits': 'Credits',
    'settings.theme': 'Theme',
    'settings.buttonStyle': 'Button-Stil',
    'settings.glowStrength': 'Glow-Stärke',
    'settings.accentColor': 'Akzentfarbe',
    'settings.resetDefaults': 'Auf Config-Defaults zurücksetzen',
    'settings.resetDone': 'Einstellungen zurückgesetzt',
    'settings.language': 'Sprache',
    'settings.versions': 'Versionen',
    'settings.portAssignments': 'Port-Belegungen',
    'settings.uptimeReset': 'Uptime zurücksetzen',
    'settings.uptimeResetDesc': 'Setzt die Uptime-Daten zurück. Alle oder einzelne Geräte.',
    'settings.uptimeResetAll': 'Alle zurücksetzen',
    'settings.uptimeResetDone': 'Uptime-Daten zurückgesetzt',
    'settings.uptimeNoDevices': 'Keine Geräte gefunden',
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

    'overlay.sessionEnded': 'Sitzung beendet',
    'overlay.anotherDevice': 'Ein anderes Gerät hat sich angemeldet.',
    'overlay.relogin': 'Erneut einloggen',
    'overlay.sessionExpired': 'Session abgelaufen',
    'overlay.sessionHint': 'Du kannst die Zeit in den Einstellungen anpassen oder deaktivieren.',
    'overlay.deviceLoggedAt': '{device} hat sich um {time} eingeloggt.',
    'overlay.unknownDevice': 'anderes Gerät',
    'overlay.unknownDeviceName': 'Unbekanntes Gerät',

    'msg.saved': 'Gespeichert.',
    'msg.error': 'Fehler',
    'msg.success': 'Erfolg',
    'msg.fillCredentials': 'Bitte Benutzer und Passwort ausfüllen.',
    'msg.fillLogin': 'Bitte Nutzer & Passwort eingeben.',
    'msg.loginFailed': 'Login fehlgeschlagen',
    'msg.serverUnreachable': 'Server nicht erreichbar.',
    'msg.defaultPassword': 'Standard-Passwort aktiv! Bitte unter Einstellungen ändern.',
    'msg.lockLifted': 'Sperre aufgehoben. Erneut versuchen.',
    'msg.locked': 'Gesperrt. Noch {time} Min',
    'msg.exported': 'Daten exportiert',
    'msg.imported': 'Daten importiert - Seite wird neu geladen',
    'msg.invalidJson': 'Ungueltige JSON-Datei',
    'msg.confirmOverwrite': 'Alle Daten werden ueberschrieben. Fortfahren?',
    'msg.confirmShutdown': 'PC wirklich herunterfahren?',

    'version.change': 'Änderung',
    'version.noData': '(keine Daten verfügbar)',
    'version.none': 'Keine Versionen vorhanden',

    'link.website': 'Zur Website',
    'link.websiteVpn': 'Zur Website (VPN)',
    'credits.stayUpdated': 'Bleibe immer aktuell',

    // Landing
    'landing.subtitle': 'Womit möchtest du starten?',
    'landing.info': 'Info',
    'landing.infoSub': 'Netzwerk-Details und Konfiguration',
    'landing.start': 'Start',
    'landing.startSub': 'Geräte steuern und verwalten',
    'landing.analysen': 'Analysen',
    'landing.analysenSub': 'Monitoring, Speedtest und Statistiken',

    // Pages
    'page.info': 'Netzwerk Info',
    'page.start': 'Control Center',
    'page.analysen': 'Analysen',
    'section.devices': 'Netzwerkgeräte',
    'section.services': 'Services',
    'section.internet': 'Internet',
    'section.clients': 'Clients',
    'section.control': 'Gerätesteuerung',
    'section.monitoring': 'Monitoring',
    'section.containerServices': 'Container & Services',
    'start.comingSoon': 'Bald verfügbar',
    'speedtest.total': 'Gesamt:',

    // Analysen
    'analysen.speedtest': 'Internet-Geschwindigkeit',
    'analysen.uptime': 'Uptime',
    'analysen.traffic': 'Datenverkehr',
    'analysen.linkspeed': 'Link-Geschwindigkeit',
    'analysen.outages': 'Ausfälle',
    'analysen.power': 'Stromverbrauch',
    'analysen.noData': 'Keine Daten verfügbar',
    'analysen.mockHint': 'Demo-Daten',
    'analysen.onlineSince': 'Online seit',
    'analysen.noOutages': 'Keine Ausfälle aufgezeichnet',
    'analysen.ongoing': 'Andauernd',
  },

  en: {
    'app.title': 'Local Network',
    'app.settings': 'Settings',
    'app.lastVersion': 'Last Version',

    'login.title': 'Login',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.token': 'Login Token (optional)',
    'login.tokenPlaceholder': 'Token for this device',
    'login.button': 'Log in',

    'table.port': 'Port',
    'table.assignment': 'Assignment',
    'table.color': 'Color',
    'table.notAssigned': 'Not assigned',

    'card.switch': 'Switch (8 Ports)',
    'card.router': 'WiFi Router',
    'card.pihole': 'PiHole',
    'card.speedport': 'Speedport Info',
    'card.speedtest': 'Internet Speed',
    'card.windowspc': 'Windows PC',

    'pi.model': 'Model',
    'pi.hostname': 'Hostname',
    'pi.lanIp': 'LAN IP',
    'pi.vpnIp': 'VPN IP',
    'pi.mac': 'MAC Address',
    'pi.sshUser': 'SSH User',
    'pi.piholeUrl': 'Pi-hole Admin URL',
    'pi.piholeVpnUrl': 'Pi-hole VPN URL',

    'speedport.wifiName': 'WiFi Name',
    'speedport.wifiPassword': 'WiFi Password (Key)',
    'speedport.serial': 'Serial Number',
    'speedport.config': 'Configuration',
    'speedport.vpnUrl': 'Speedport VPN URL',
    'speedport.devicePassword': 'Device Password',
    'speedport.modemId': 'Modem ID',

    'speedtest.download': 'Download',
    'speedtest.upload': 'Upload',
    'speedtest.ping': 'Ping',
    'speedtest.ready': 'Ready',
    'speedtest.start': 'Start Speed Test',
    'speedtest.starting': 'Speed test starting...',
    'speedtest.measuringPing': 'Measuring ping...',
    'speedtest.measuringDownload': 'Measuring download...',
    'speedtest.measuringUpload': 'Measuring upload...',
    'speedtest.complete': 'Test complete',
    'speedtest.localhostNotice': 'Please open via LAN IP (not localhost).',

    'pc.status.online': 'Online',
    'pc.status.offline': 'Offline',
    'pc.status.checking': 'Checking...',
    'pc.name': 'Name',
    'pc.wake': 'Wake',
    'pc.shutdown': 'Shutdown',
    'pc.restart': 'Restart',
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

    'settings.title': 'Settings',
    'settings.design': 'Design',
    'settings.analysen': 'Analytics',
    'settings.data': 'Data',
    'settings.session': 'Session',
    'settings.user': 'User',
    'settings.credits': 'Credits',
    'settings.theme': 'Theme',
    'settings.buttonStyle': 'Button Style',
    'settings.glowStrength': 'Glow Strength',
    'settings.accentColor': 'Accent Color',
    'settings.resetDefaults': 'Reset to Config Defaults',
    'settings.resetDone': 'Settings reset',
    'settings.language': 'Language',
    'settings.versions': 'Versions',
    'settings.portAssignments': 'Port Assignments',
    'settings.uptimeReset': 'Reset Uptime',
    'settings.uptimeResetDesc': 'Reset uptime data. All devices or individually.',
    'settings.uptimeResetAll': 'Reset All',
    'settings.uptimeResetDone': 'Uptime data reset',
    'settings.uptimeNoDevices': 'No devices found',
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

    'overlay.sessionEnded': 'Session Ended',
    'overlay.anotherDevice': 'Another device has logged in.',
    'overlay.relogin': 'Log in again',
    'overlay.sessionExpired': 'Session Expired',
    'overlay.sessionHint': 'You can adjust the timeout in settings or disable it.',
    'overlay.deviceLoggedAt': '{device} logged in at {time}.',
    'overlay.unknownDevice': 'another device',
    'overlay.unknownDeviceName': 'Unknown device',

    'msg.saved': 'Saved.',
    'msg.error': 'Error',
    'msg.success': 'Success',
    'msg.fillCredentials': 'Please fill in username and password.',
    'msg.fillLogin': 'Please enter username & password.',
    'msg.loginFailed': 'Login failed',
    'msg.serverUnreachable': 'Server not reachable.',
    'msg.defaultPassword': 'Default password active! Please change it in settings.',
    'msg.lockLifted': 'Lock lifted. Try again.',
    'msg.locked': 'Locked. {time} min remaining',
    'msg.exported': 'Data exported',
    'msg.imported': 'Data imported - page will reload',
    'msg.invalidJson': 'Invalid JSON file',
    'msg.confirmOverwrite': 'All data will be overwritten. Continue?',
    'msg.confirmShutdown': 'Really shut down the PC?',

    'version.change': 'Change',
    'version.noData': '(no data available)',
    'version.none': 'No versions available',

    'link.website': 'Go to website',
    'link.websiteVpn': 'Go to website (VPN)',
    'credits.stayUpdated': 'Stay up to date',

    'landing.subtitle': 'What would you like to do?',
    'landing.info': 'Info',
    'landing.infoSub': 'Network details and configuration',
    'landing.start': 'Start',
    'landing.startSub': 'Control and manage devices',
    'landing.analysen': 'Analytics',
    'landing.analysenSub': 'Monitoring, speedtest and statistics',

    'page.info': 'Network Info',
    'page.start': 'Control Center',
    'page.analysen': 'Analytics',
    'section.devices': 'Network Devices',
    'section.services': 'Services',
    'section.internet': 'Internet',
    'section.clients': 'Clients',
    'section.control': 'Device Control',
    'section.monitoring': 'Monitoring',
    'section.containerServices': 'Container & Services',
    'start.comingSoon': 'Coming soon',
    'speedtest.total': 'Total:',

    'analysen.speedtest': 'Internet Speed',
    'analysen.uptime': 'Uptime',
    'analysen.traffic': 'Data Traffic',
    'analysen.linkspeed': 'Link Speed',
    'analysen.outages': 'Outages',
    'analysen.power': 'Power Usage',
    'analysen.noData': 'No data available',
    'analysen.mockHint': 'Demo data',
    'analysen.onlineSince': 'Online since',
    'analysen.noOutages': 'No outages recorded',
    'analysen.ongoing': 'Ongoing',
  },
};

let currentLang = localStorage.getItem('lang') || defaults.language || 'de';

export function t(key) {
  return translations[currentLang]?.[key] || translations.de[key] || key;
}

export function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  updateDOM();
}

export function getCurrentLang() {
  return currentLang;
}

export function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const tr = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = tr;
    } else {
      el.textContent = tr;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.title = t('app.title');
}

export function initI18n() {
  document.documentElement.lang = currentLang;
}
