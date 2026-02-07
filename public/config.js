// ═══════════════════════════════════════════════════════════════════
// Website-Konfiguration
// ═══════════════════════════════════════════════════════════════════

const siteConfig = {
  // ══════════════════════════════════════════════
  // ANIMATIONEN
  // ══════════════════════════════════════════════
  animations: {
    enabled: true,              // Master-Schalter für alle Animationen

    // Einzelne Animationen
    heroGradient: true,         // Titel-Farbverlauf-Animation
    fadeIn: true,               // Einblend-Effekte
    modalSlide: true,           // Modal-Einblendung
    panelFade: true,            // Settings-Panel-Wechsel
    themeSwitcher: true,        // Theme-Button-Animationen (moon, sun, system)
  },

  // ══════════════════════════════════════════════
  // DESIGN DEFAULTS
  // ══════════════════════════════════════════════
  defaults: {
    theme: 'dark',              // 'dark' | 'light' | 'system'
    buttonStyle: 'default',     // 'default' | 'simple'
    language: 'de',             // 'de' | 'en'
    accentColor: '#00d4ff',     // Hex-Farbe

    // Glow-Effekt
    glow: {
      enabled: true,            // Glow an/aus
      strength: 1,              // Wert 0-2
    },

    // Session Timeout
    sessionTimeout: {
      enabled: false,            // Timeout an/aus
      minutes: 5,               // Minuten bis Timeout
    },
  },

  // ══════════════════════════════════════════════
  // EINSTELLUNGEN-SICHTBARKEIT
  // ══════════════════════════════════════════════
  settings: {
    showSettingsButton: true,   // Einstellungen-Button komplett anzeigen

    // Einzelne Tabs
    tabs: {
      design: true,             // Design-Tab anzeigen
      daten: true,              // Daten-Tab (Export/Import) anzeigen
      session: true,            // Session-Tab anzeigen
      user: true,               // User-Tab anzeigen
      // credits: immer sichtbar (kann nicht deaktiviert werden)
    },
  },

  // ══════════════════════════════════════════════
  // CARDS SICHTBARKEIT
  // ══════════════════════════════════════════════
  // Einzelne Cards ein/ausblenden
  cards: {
    switch: true,               // Switch (8 Ports)
    router: true,               // WLAN Router
    pihole: true,               // PiHole
    speedport: true,            // Speedport Infos
    speedtest: true,            // Internet Geschwindigkeit
    windowsPc: true,            // Windows PC
  },

  // ══════════════════════════════════════════════
  // UPTIME MONITORING
  // ══════════════════════════════════════════════
  // Geräte die per Ping überwacht werden sollen
  // id: eindeutiger Schlüssel (lowercase, keine Leerzeichen)
  // name: Anzeigename
  // ip: IP-Adresse des Geräts
  uptimeDevices: [
    { id: 'router',    name: 'Router',     ip: '192.168.2.1' },
    { id: 'pihole',    name: 'PiHole',     ip: '192.168.2.135' },
    { id: 'windowspc', name: 'Windows PC', ip: '192.168.2.137' },
  ],

  // ══════════════════════════════════════════════
  // HEADER LINKS
  // ══════════════════════════════════════════════
  // Links erscheinen in der Topbar mit Favicon
  // Favicon wird automatisch via Google Favicon Service geholt
  headerLinks: [
    { name: 'Github', url: 'https://github.com/leminkozey' },
    { name: 'KanBan', url: 'https://leminkanban.de'},
  ],
};
