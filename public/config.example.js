// ═══════════════════════════════════════════════════════════════════
// Website-Konfiguration (Beispiel)
// ═══════════════════════════════════════════════════════════════════
// Kopiere diese Datei nach config.js und passe die Werte an.
// Alle Werte hier sind Beispiele – ersetze IPs, Links und Namen
// durch deine eigenen.
// ═══════════════════════════════════════════════════════════════════

const siteConfig = {

  // ┌─────────────────────────────────────────────┐
  // │             ALLGEMEIN                       │
  // └─────────────────────────────────────────────┘

  // ── Animationen ──
  // Steuert alle visuellen Animationen der Oberfläche.
  // Mit enabled: false werden sämtliche Animationen deaktiviert.
  animations: {
    enabled: true,              // Master-Schalter für alle Animationen
    heroGradient: true,         // Titel-Farbverlauf-Animation auf der Startseite
    fadeIn: true,               // Einblend-Effekte beim Laden von Elementen
    modalSlide: true,           // Slide-Animation beim Öffnen von Modals/Overlays
    panelFade: true,            // Überblend-Effekt beim Tab-Wechsel in Einstellungen
    themeSwitcher: true,        // Animations-Effekte der Theme-Buttons (Sonne/Mond/System)
  },

  // ── Design Defaults ──
  // Standard-Werte für neue Benutzer. Benutzer können diese über
  // die Einstellungen überschreiben (wird in localStorage gespeichert).
  defaults: {
    theme: 'dark',              // 'dark' | 'light' | 'system'
    buttonStyle: 'default',     // 'default' | 'simple'
    language: 'de',             // 'de' | 'en'
    accentColor: '#00d4ff',     // Akzentfarbe als Hex-Wert
    glow: {
      enabled: true,            // Glow an/aus
      strength: 1,              // Intensität: 0 (aus) bis 2 (stark)
    },
    sessionTimeout: {
      enabled: false,           // Timeout an/aus
      minutes: 5,               // Minuten bis zum automatischen Logout (1–60)
    },
  },

  // ── Einstellungen-Sichtbarkeit ──
  // Bestimmt, welche Bereiche der Einstellungen sichtbar sind.
  settings: {
    showSettingsButton: true,   // Einstellungen-Button komplett anzeigen/verstecken
    tabs: {
      design: true,             // Design-Tab (Theme, Farben, Glow)
      analysen: true,           // Analysen-Tab (Uptime Reset)
      daten: true,              // Daten-Tab (Export/Import, Versionshistorie)
      session: true,            // Session-Tab (Timeout-Einstellungen)
      user: true,               // User-Tab (Benutzername/Passwort ändern, Logout)
      // credits: immer sichtbar (kann nicht deaktiviert werden)
    },
  },

  // ┌─────────────────────────────────────────────┐
  // │             LANDING PAGE                    │
  // └─────────────────────────────────────────────┘

  // ── Buttons ──
  // Navigations-Buttons auf der Landing Page ein-/ausblenden.
  buttons: {
    info: true,                 // Info Center Button
    control: true,              // Control Center Button
    analysen: true,             // Analysen Center Button
  },

  // ── Header Links ──
  // Links erscheinen als Chips unter den Buttons auf der Landing Page.
  headerLinks: [
    { name: 'Github', url: 'https://github.com/leminkozey' },
    { name: 'KanBan', url: 'https://leminkanban.de' },
  ],

  // ── Willkommensnachrichten ──
  // Eigene Begrüßungstexte auf der Landing Page.
  // customOnly: true  → Nur die eigenen Nachrichten anzeigen
  // customOnly: false → Die eingebauten zufälligen Nachrichten verwenden
  greetings: {
    customOnly: false,          // true = nur eigene, false = eingebaute zufällige
    messages: [
      // Eigene Willkommensnachrichten hier eintragen:
      // 'Willkommen im Netzwerk!',
      // 'Hallo Admin!',
      // 'Schön dass du da bist.',
    ],
  },

  // ┌─────────────────────────────────────────────┐
  // │             INFO CENTER                     │
  // └─────────────────────────────────────────────┘

  // ── Cards Sichtbarkeit ──
  // Einzelne Info-Cards ein-/ausblenden.
  cards: {
    switch: true,               // Switch (8 Ports) – Netzwerk-Switch-Dokumentation
    router: true,               // WLAN Router – Router-Port-Dokumentation
    pihole: true,               // PiHole – Pi-hole DNS-Informationen
    speedport: true,            // Speedport – Speedport/Router-Zugangsdaten
    speedtest: true,            // Internet Geschwindigkeit – LAN Speed-Test
    windowsPc: true,            // Windows PC – PC-Steuerung (Control Center)
  },

  // ┌─────────────────────────────────────────────┐
  // │             CONTROL CENTER                  │
  // └─────────────────────────────────────────────┘

  // ── Gerätesteuerung ──
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

  // ┌─────────────────────────────────────────────┐
  // │             ANALYSEN CENTER                 │
  // └─────────────────────────────────────────────┘

  // ── Sektionen ein-/ausblenden ──
  analysen: {
    speedtest: true,            // Internet-Geschwindigkeit (Speed-Test)
    outages: true,              // Ausfälle-Card
    uptime: true,               // Uptime-Monitoring-Cards
  },

  // ── Uptime Monitoring ──
  // Ping-Intervall und Geräte für die Uptime-Überwachung.
  uptimeInterval: 10,           // Intervall in Sekunden (Minimum: 10)
  uptimeDevices: [
    { id: 'router',    name: 'Router',     ip: '192.168.1.1' },
    { id: 'pihole',    name: 'PiHole',     ip: '192.168.1.100' },
    { id: 'windowspc', name: 'Windows PC', ip: '192.168.1.50' },
  ],

  // ── Pi-hole v6 DNS Analytics ──
  // HINWEIS: config.js wird vom Server blockiert (403) und ist nicht
  // öffentlich abrufbar. Der Server liest die Datei nur intern.
  pihole: {
    enabled: true,              // false → DNS Analytics komplett deaktiviert
    url: 'http://192.168.1.100',
    password: 'your-pihole-password',
    blockingToggle: true,       // Blocking-Toggle im Control Center anzeigen
    cards: {
      summary: true,            // 4 Summary-Stat-Cards (Queries, Blocked, %, Blocklist)
      queriesOverTime: true,    // Stacked Bar Chart (Queries über Zeit)
      queryTypes: true,         // Donut: Anfragetypen (A, AAAA, HTTPS, etc.)
      upstreams: true,          // Donut: Upstream-Server
      topDomains: true,         // Top Domains Liste
      topBlocked: true,         // Top Blockierte Domains Liste
      topClients: true,         // Top Clients Liste
    },
  },
  piholeInterval: 60,           // Aktualisierungs-Intervall in Sekunden (Minimum: 30)

  // ── Ping Monitor (Latenz-Messung) ──
  // Misst die Latenz (ms) zu externen Hosts per ICMP-Ping.
  pingMonitor: {
    enabled: true,              // false → Ping Monitor komplett deaktiviert
    interval: 30,               // Ping-Intervall in Sekunden (Minimum: 10)
    hosts: [
      { id: 'google',     name: 'Google DNS',     ip: '8.8.8.8' },
      { id: 'cloudflare', name: 'Cloudflare DNS', ip: '1.1.1.1' },
      // { id: 'quad9',     name: 'Quad9 DNS',      ip: '9.9.9.9' },
      // { id: 'opendns',   name: 'OpenDNS',        ip: '208.67.222.222' },
    ],
  },
};
