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
      enabled: true,            // Timeout an/aus
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
  // HEADER LINKS
  // ══════════════════════════════════════════════
  // Links erscheinen in der Topbar mit Favicon
  // Favicon wird automatisch via Google Favicon Service geholt
  headerLinks: [
    { name: 'Github', url: 'https://github.com' },
    { name: 'KanBan', url: 'https://leminkanban.de'},
  ],
};
