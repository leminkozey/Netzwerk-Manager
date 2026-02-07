// ═══════════════════════════════════════════════════════════════════
// Website-Konfiguration
// ═══════════════════════════════════════════════════════════════════
// Siehe config.example.js für alle verfügbaren Optionen mit
// Beschreibungen und Beispielwerten.
// ═══════════════════════════════════════════════════════════════════

const siteConfig = {
  animations: {
    enabled: true,
    heroGradient: true,
    fadeIn: true,
    modalSlide: true,
    panelFade: true,
    themeSwitcher: true,
  },

  defaults: {
    theme: 'dark',
    buttonStyle: 'default',
    language: 'de',
    accentColor: '#00d4ff',
    glow: {
      enabled: true,
      strength: 1,
    },
    sessionTimeout: {
      enabled: false,
      minutes: 5,
    },
  },

  settings: {
    showSettingsButton: true,
    tabs: {
      design: true,
      analysen: true,
      daten: true,
      session: true,
      user: true,
    },
  },

  cards: {
    switch: true,
    router: true,
    pihole: true,
    speedport: true,
    speedtest: true,
    windowsPc: true,
  },

  uptimeInterval: 10,
  uptimeDevices: [],
  controlDevices: [],
  headerLinks: [],
};
