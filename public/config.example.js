// ═══════════════════════════════════════════════════════════════════
// Website-Konfiguration (Beispiel)
// ═══════════════════════════════════════════════════════════════════
// Kopiere diese Datei nach config.js und passe die Werte an.
// Alle Werte hier sind Beispiele – ersetze IPs, Links und Namen
// durch deine eigenen.
// ═══════════════════════════════════════════════════════════════════

const siteConfig = {
  // ══════════════════════════════════════════════
  // ANIMATIONEN
  // ══════════════════════════════════════════════
  // Steuert alle visuellen Animationen der Oberfläche.
  // Mit enabled: false werden sämtliche Animationen deaktiviert.
  animations: {
    enabled: true,              // Master-Schalter für alle Animationen

    // Einzelne Animationen (nur wirksam wenn enabled: true)
    heroGradient: true,         // Titel-Farbverlauf-Animation auf der Startseite
    fadeIn: true,               // Einblend-Effekte beim Laden von Elementen
    modalSlide: true,           // Slide-Animation beim Öffnen von Modals/Overlays
    panelFade: true,            // Überblend-Effekt beim Tab-Wechsel in Einstellungen
    themeSwitcher: true,        // Animations-Effekte der Theme-Buttons (Sonne/Mond/System)
  },

  // ══════════════════════════════════════════════
  // DESIGN DEFAULTS
  // ══════════════════════════════════════════════
  // Standard-Werte für neue Benutzer. Benutzer können diese über
  // die Einstellungen überschreiben (wird in localStorage gespeichert).
  defaults: {
    theme: 'dark',              // 'dark' | 'light' | 'system'
    buttonStyle: 'default',     // 'default' | 'simple'
    language: 'de',             // 'de' | 'en'
    accentColor: '#00d4ff',     // Akzentfarbe als Hex-Wert

    // Glow-Effekt (leuchtendes Glühen um aktive Elemente)
    glow: {
      enabled: true,            // Glow an/aus
      strength: 1,              // Intensität: 0 (aus) bis 2 (stark)
    },

    // Session Timeout (automatisches Ausloggen bei Inaktivität)
    sessionTimeout: {
      enabled: false,           // Timeout an/aus
      minutes: 5,               // Minuten bis zum automatischen Logout (1–60)
    },
  },

  // ══════════════════════════════════════════════
  // EINSTELLUNGEN-SICHTBARKEIT
  // ══════════════════════════════════════════════
  // Bestimmt, welche Bereiche der Einstellungen sichtbar sind.
  settings: {
    showSettingsButton: true,   // Einstellungen-Button komplett anzeigen/verstecken

    // Einzelne Tabs ein-/ausblenden
    tabs: {
      design: true,             // Design-Tab (Theme, Farben, Glow)
      analysen: true,           // Analysen-Tab (Uptime Reset)
      daten: true,              // Daten-Tab (Export/Import, Versionshistorie)
      session: true,            // Session-Tab (Timeout-Einstellungen)
      user: true,               // User-Tab (Benutzername/Passwort ändern, Logout)
      // credits: immer sichtbar (kann nicht deaktiviert werden)
    },
  },

  // ══════════════════════════════════════════════
  // CARDS SICHTBARKEIT
  // ══════════════════════════════════════════════
  // Einzelne Info-Cards auf der Startseite ein-/ausblenden.
  cards: {
    switch: true,               // Switch (8 Ports) – Netzwerk-Switch-Dokumentation
    router: true,               // WLAN Router – Router-Port-Dokumentation
    pihole: true,               // PiHole – Pi-hole DNS-Informationen
    speedport: true,            // Speedport – Speedport/Router-Zugangsdaten
    speedtest: true,            // Internet Geschwindigkeit – LAN Speed-Test
    windowsPc: true,            // Windows PC – PC-Steuerung (Control Center)
  },

  // ══════════════════════════════════════════════
  // UPTIME MONITORING
  // ══════════════════════════════════════════════
  // Ping-Intervall in Sekunden. Der Server pingt alle Geräte in
  // diesem Intervall und das Frontend aktualisiert die Anzeige.
  // Minimum: 10 Sekunden
  // ══════════════════════════════════════════════
  // PI-HOLE v6 DNS ANALYTICS
  // ══════════════════════════════════════════════
  // URL und Passwort deines Pi-hole v6.
  // HINWEIS: config.js wird vom Server blockiert (403) und ist nicht
  // öffentlich abrufbar. Der Server liest die Datei nur intern.
  pihole: {
    url: 'http://192.168.1.100',           // Pi-hole Admin URL
    password: 'your-pihole-password',       // Pi-hole API Passwort

    // Einzelne Dashboard-Cards ein-/ausblenden.
    // Deaktivierte Cards werden nicht gerendert und die zugehörigen
    // API-Calls werden nicht ausgeführt (spart Bandbreite).
    // Standard: alle true (wenn cards-Objekt fehlt)
    cards: {
      summary: true,          // 4 Summary-Stat-Cards (Queries, Blocked, %, Blocklist)
      queriesOverTime: true,  // Stacked Bar Chart (Queries über Zeit)
      queryTypes: true,       // Donut: Anfragetypen (A, AAAA, HTTPS, etc.)
      upstreams: true,        // Donut: Upstream-Server
      topDomains: true,       // Top Domains Liste
      topBlocked: true,       // Top Blockierte Domains Liste
      topClients: true,       // Top Clients Liste
    },
  },

  // Aktualisierungs-Intervall für Pi-hole (Sekunden, Minimum 30, Standard 60):
  piholeInterval: 60,

  uptimeInterval: 10,

  // Geräte die per Ping überwacht werden sollen
  // id:   eindeutiger Schlüssel (lowercase, keine Leerzeichen)
  // name: Anzeigename im Frontend
  // ip:   IP-Adresse des Geräts im lokalen Netzwerk
  uptimeDevices: [
    { id: 'router',    name: 'Router',     ip: '192.168.1.1' },
    { id: 'pihole',    name: 'PiHole',     ip: '192.168.1.100' },
    { id: 'windowspc', name: 'Windows PC', ip: '192.168.1.50' },
  ],

  // ══════════════════════════════════════════════
  // GERÄTESTEUERUNG (Control Center)
  // ══════════════════════════════════════════════
  // Geräte die über das Control Center ferngesteuert werden können.
  // Unterstützt Wake-on-LAN, SSH-Shutdown und SSH-Restart.
  //
  // id:      eindeutiger Schlüssel (lowercase, keine Leerzeichen)
  // name:    Anzeigename im Frontend
  // icon:    Icon-Name aus icons.js (z.B. 'windowsColor', 'server')
  // type:    'ssh-windows' | 'ssh-linux' – bestimmt die SSH-Befehle
  // ip:      IP-Adresse des Geräts
  // actions: Array von Aktionen: 'wake', 'restart', 'shutdown'
  //
  // SSH-Zugangsdaten werden pro Gerät in den Einstellungen konfiguriert
  // und verschlüsselt auf dem Server gespeichert.
  controlDevices: [
    {
      id: 'windowspc',
      name: 'Windows PC',
      icon: 'windowsColor',
      type: 'ssh-windows',
      ip: '192.168.1.50',
      actions: ['wake', 'restart', 'shutdown'],
    },
    // Weiteres Beispiel: Linux-Server
    // {
    //   id: 'nas',
    //   name: 'NAS Server',
    //   icon: 'server',
    //   type: 'ssh-linux',
    //   ip: '192.168.1.200',
    //   actions: ['wake', 'shutdown'],
    // },
  ],

  // ══════════════════════════════════════════════
  // HEADER LINKS
  // ══════════════════════════════════════════════
  // Links erscheinen oben rechts in der Topbar mit automatischem Favicon.
  // name: Anzeigename des Links
  // url:  Vollständige URL (muss mit http:// oder https:// beginnen)
  headerLinks: [
    { name: 'Github', url: 'https://github.com/leminkozey' },
    { name: 'KanBan', url: 'https://leminkanban.de' },
  ],
};
