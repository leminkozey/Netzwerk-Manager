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
    iconAnimations: true,       // Hover-Animationen der Icons (Analysen, Control Center, Einstellungen, Landing)
    numberScroll: true,         // Scroll-Animationen bei Zahlen (Analysen Center)
    analysen: {                 // Pro-Section Animationen im Analysen Center
      speedtest: true,          // Speedtest Download/Upload/Ping Scroll-Animationen
      uptime: true,             // Uptime-Cards: Balken + Prozent + Timer-Scroll
      pingMonitor: true,        // Ping Monitor: Ping-Scroll + Chart-Reveal
      piholeSummary: true,      // Pi-hole Summary Cards: Zahlen-Scroll
      queriesOverTime: true,    // Queries Bar-Chart: Balken wachsen hoch
      donuts: true,             // Donut-Charts: Segmente + Legende
      topLists: true,           // Top Domains/Blocked/Clients: Balken + Zahlen
    },
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

    // ── Remote Update ──
    // Ermöglicht das Aktualisieren der Website direkt über die Einstellungen
    // (Credits-Tab). Zeigt den Status "Up to date" oder "Get up to date" an.
    // Bei Klick auf "Get up to date" werden die konfigurierten Befehle
    // nacheinander auf dem Server ausgeführt.
    //
    // ACHTUNG: Die Befehle werden mit den Rechten des Server-Prozesses
    // ausgeführt. Nur vertrauenswürdige Befehle eintragen!
    // Nach erfolgreichem Update startet der Server sich automatisch neu
    // (systemd/pm2 startet den Prozess). Kein manueller Restart nötig.
    update: {
      enabled: false,           // true = Update-Funktion im Credits-Tab anzeigen
      commands: [               // Befehle die nacheinander ausgeführt werden
        'git stash',
        'git pull',
        'git stash pop',
      ],
    },
  },

  // ┌─────────────────────────────────────────────┐
  // │             LANDING PAGE                    │
  // └─────────────────────────────────────────────┘

  // ── Landing GIF ──
  // Animiertes Bild über dem Titel. Wird automatisch in der Akzentfarbe eingefärbt.
  // Das Bild muss vorbereitet sein: weißer/heller Inhalt auf transparentem Hintergrund
  // (wird als CSS-Maske genutzt, siehe README → "Eigenes Landing-GIF").
  // Unterstützt GIF, APNG, WebP. false = kein GIF anzeigen.
  landingGif: 'landing-gif.png',    // Pfad zum animierten Bild (relativ zu /public)
  landingGifSize: 200,              // Größe in Pixel (Breite und Höhe)

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

  // ── Cards Sichtbarkeit (Legacy) ──
  // Steuert Speedtest und Windows PC Cards (nicht Teil von infoCenter).
  cards: {
    speedtest: true,            // Internet Geschwindigkeit – LAN Speed-Test
    windowsPc: true,            // Windows PC – PC-Steuerung (Control Center)
  },

  // ── Info Center Layout (Konfigurierbar) ──
  // Definiert das komplette Layout des Info Centers.
  // Wenn vorhanden, ersetzt es die statischen Cards oben.
  // Zwei Kartentypen: 'table' (Tabelle mit Spalten) und 'info' (Formular-Felder).
  //
  // layout: 'double' = 2 Cards nebeneinander | 'single' = volle Breite
  // icon: Eingebauter Name (z.B. 'switchColor'), URL oder Iconify-Format ('logos:raspberry-pi')
  // password: true = Feld wird verschlüsselt gespeichert + Eye-Toggle
  // copy: true/false = Copy-Button anzeigen/verstecken (Standard: true)
  // linkField: Referenziert ein Feld per Key – der Feldwert wird als URL genutzt
  infoCenter: [
    {
      heading: 'Netzwerkgeräte',
      layout: 'double',
      cards: [
        {
          id: 'switch',
          title: 'Switch (8 Ports)',
          icon: 'switchColor',
          type: 'table',
          columns: {
            label: 'Port',
            input: 'Belegung',
            inputPlaceholder: 'Nicht belegt',
            color: 'Farbe',
          },
          rows: [
            { id: 'port1', label: 'Port 1' },
            { id: 'port2', label: 'Port 2' },
            { id: 'port3', label: 'Port 3' },
            { id: 'port4', label: 'Port 4' },
            { id: 'port5', label: 'Port 5' },
            { id: 'port6', label: 'Port 6' },
            { id: 'port7', label: 'Port 7' },
            { id: 'port8', label: 'Port 8' },
          ],
        },
        {
          id: 'router',
          title: 'WLAN Router',
          icon: 'routerColor',
          type: 'table',
          columns: {
            label: 'Port',
            input: 'Belegung',
            inputPlaceholder: 'Nicht belegt',
            color: 'Farbe',
          },
          rows: [
            { id: 'dsl', label: 'DSL' },
            { id: 'lan1', label: 'Link/LAN1' },
            { id: 'lan2', label: 'LAN2' },
            { id: 'lan3', label: 'LAN3' },
            { id: 'lan4', label: 'LAN4' },
            { id: 'telefon', label: 'Telefon' },
          ],
        },
      ],
    },
    {
      heading: 'Services',
      layout: 'double',
      cards: [
        {
          id: 'pihole',
          title: 'PiHole',
          icon: 'raspberryColor',
          type: 'info',
          fields: [
            { key: 'model',           label: 'Modell',        copy: false },
            { key: 'hostname',        label: 'Hostname' },
            { key: 'ipAddress',       label: 'LAN IP' },
            { key: 'vpnIp',           label: 'VPN IP' },
            { key: 'macAddress',      label: 'MAC-Adresse' },
            { key: 'sshUser',         label: 'SSH-Benutzer' },
            { key: 'sshPassword',     label: 'SSH-Passwort',  password: true },
            { key: 'piholeUrl',       label: 'Admin URL' },
            { key: 'piholeRemoteUrl', label: 'VPN Admin URL' },
          ],
          links: [
            { label: 'Pi-hole Admin', linkField: 'piholeUrl' },
            { label: 'VPN Admin',     linkField: 'piholeRemoteUrl' },
          ],
        },
        {
          id: 'speedport',
          title: 'Speedport',
          icon: 'speedportColor',
          type: 'info',
          fields: [
            { key: 'wifiName',       label: 'WLAN Name' },
            { key: 'wifiPassword',   label: 'WLAN Passwort',         password: true },
            { key: 'serialNumber',   label: 'Seriennummer' },
            { key: 'configuration',  label: 'Konfiguration' },
            { key: 'remoteUrl',      label: 'VPN URL' },
            { key: 'devicePassword', label: 'Geräte-Passwort',       password: true },
            { key: 'modemId',        label: 'Modem Installationscode', copy: false },
          ],
          links: [
            { label: 'VPN Zugang', linkField: 'remoteUrl' },
          ],
        },
      ],
    },
    {
      heading: 'Clients',
      layout: 'single',
      cards: [
        {
          id: 'windowsPc',
          title: 'Windows PC',
          icon: 'windowsColor',
          type: 'info',
          fields: [
            { key: 'hostname',    label: 'Hostname' },
            { key: 'ipAddress',   label: 'IP-Adresse' },
            { key: 'macAddress',  label: 'MAC-Adresse' },
            { key: 'sshUser',     label: 'SSH-Benutzer' },
            { key: 'sshPassword', label: 'SSH-Passwort', password: true },
          ],
        },
      ],
    },
  ],

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
  // show:    true/false – Tile im Control Center anzeigen (Standard: true)
  //          Mit show: false wird das Gerät versteckt, bleibt aber als
  //          SSH-Quelle für Remote-Services (credentialsFrom) nutzbar.
  //
  // SSH-Zugangsdaten werden pro Gerät in den Einstellungen konfiguriert
  // und verschlüsselt auf dem Server gespeichert.
  //
  // ── Zeitplan (Schedule) ──
  // Automatisches Hochfahren (Wake-on-LAN) und Herunterfahren (SSH) zu
  // festgelegten Zeiten. Der Server muss laufen, damit Zeitpläne ausgeführt werden.
  //
  // schedule.wake:     Benötigt eine konfigurierte MAC-Adresse (in den Einstellungen)
  // schedule.shutdown: Benötigt konfigurierte SSH-Zugangsdaten (in den Einstellungen)
  //
  // Optionen:
  //   enabled: true/false – Zeitplan aktivieren/deaktivieren
  //   days:    Wochentage als Array: 'mon','tue','wed','thu','fri','sat','sun'
  //   time:    Uhrzeit im 24h-Format, z.B. '07:30' oder '18:00'
  //
  // HINWEIS: Zeitpläne werden aktuell nur über diese Datei konfiguriert.
  //          Eine UI-Bearbeitung ist für eine zukünftige Version geplant.
  controlDevices: [
    {
      id: 'windowspc',
      name: 'Windows PC',
      icon: 'windowsColor',
      type: 'ssh-windows',
      ip: '192.168.1.50',
      actions: ['wake', 'restart', 'shutdown'],

      // Zeitplan: Automatisches Hoch-/Herunterfahren
      // Entferne die Kommentare um den Zeitplan zu aktivieren.
      schedule: {
        wake: {
          enabled: true,
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          time: '07:30',
        },
        shutdown: {
          enabled: true,
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          time: '18:00',
        },
      },
    },
    // Weiteres Beispiel: Linux-Server
    // {
    //   id: 'nas',
    //   name: 'NAS Server',
    //   icon: 'server',
    //   type: 'ssh-linux',
    //   ip: '192.168.1.200',
    //   actions: ['wake', 'shutdown'],
    //   schedule: {
    //     wake: {
    //       enabled: true,
    //       days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    //       time: '08:00',
    //     },
    //     shutdown: {
    //       enabled: true,
    //       days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    //       time: '22:00',
    //     },
    //   },
    // },
  ],

  // ── Service / Container Management ──
  // Services die über das Control Center gesteuert werden können.
  // Unterstützt systemd-Dienste, PM2-Prozesse und Docker-Container.
  //
  // id:      eindeutiger Schlüssel (lowercase, keine Leerzeichen)
  // name:    Anzeigename im Frontend
  // icon:    Icon-Name aus icons.js (z.B. 'serverColor')
  // type:    'systemd' | 'pm2' | 'docker'
  // service: exakter Unit-/Prozess-/Container-Name
  // host:    'local' für lokale Ausführung, oder
  //          { credentialsFrom: '<controlDevice-id>' } für SSH-Remote-Ausführung
  services: [
    // Beispiel: Lokaler systemd-Dienst
    // {
    //   id: 'netzwerk-manager',
    //   name: 'Netzwerk Manager',
    //   icon: 'serverColor',
    //   type: 'systemd',
    //   service: 'netzwerk-manager',
    //   host: 'local',
    // },
    // Beispiel: PM2-Prozess auf Remote-Server
    // {
    //   id: 'lemin-kanban',
    //   name: 'Lemin Kanban',
    //   icon: 'serverColor',
    //   type: 'pm2',
    //   service: 'lemin-kanban',
    //   host: { credentialsFrom: 'piholeControl' },
    // },
    // Beispiel: Docker-Container auf Remote-Server
    // {
    //   id: 'pihole-docker',
    //   name: 'Pi-hole',
    //   icon: 'piholeDnsColor',
    //   type: 'docker',
    //   service: 'pihole',
    //   host: { credentialsFrom: 'piholeControl' },
    // },
  ],

  // ┌─────────────────────────────────────────────┐
  // │             ANALYSEN CENTER                 │
  // └─────────────────────────────────────────────┘

  // ── Sektionen ein-/ausblenden ──
  analysen: {
    speedtest: true,            // Internet-Geschwindigkeit (Speed-Test)
    outages: true,              // Ausfälle-Card
    uptime: true,               // Geräte Info / Uptime-Monitoring-Cards
    pingMonitor: true,          // Ping-Monitor (Latenz-Messung)
    pihole: true,               // Pi-hole DNS Analytics
  },

  // ── Geräte Info / Uptime Monitoring ──
  // Ping-Intervall und Geräte für die Uptime-Überwachung.
  // Optional: stats-Property für CPU, RAM, Temperatur pro Gerät.
  //   stats.type: 'local' (lokaler Server) oder 'ssh-linux' (per SSH)
  //   stats.credentialsFrom: ID eines Control-Devices (SSH-Daten wiederverwenden)
  //   stats.credentials: { sshUser, sshPassword, sshPort } (Inline, wird beim Start verschlüsselt)
  uptimeInterval: 10,           // Ping-Intervall in Sekunden (Minimum: 10)
  statsInterval: 60,            // Stats-Intervall in Sekunden (CPU/RAM/Temp, Minimum: 30)
  uptimeDevices: [
    // Gerät ohne Stats → zeigt 24h/7d Uptime-Balken
    { id: 'router',    name: 'Router',     ip: '192.168.1.1' },

    // Gerät mit Stats via SSH (Credentials aus Control Center)
    // {
    //   id: 'pihole', name: 'PiHole', ip: '192.168.1.100',
    //   stats: {
    //     type: 'ssh-linux',
    //     credentialsFrom: 'piholeControl',
    //   },
    // },

    // Gerät mit Stats via SSH (eigene Credentials)
    // {
    //   id: 'nas', name: 'NAS', ip: '192.168.1.200',
    //   stats: {
    //     type: 'ssh-linux',
    //     credentials: { sshUser: 'admin', sshPassword: 'password', sshPort: 22 },
    //   },
    // },

    { id: 'pihole',    name: 'PiHole',     ip: '192.168.1.100' },
    { id: 'windowspc', name: 'Windows PC', ip: '192.168.1.50' },

    // Lokaler Server (der Pi selbst)
    // { id: 'localhost', name: 'Pi Server', ip: '127.0.0.1', stats: { type: 'local' } },
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

  // ┌─────────────────────────────────────────────┐
  // │             E-MAIL BENACHRICHTIGUNGEN       │
  // └─────────────────────────────────────────────┘

  // ── Benachrichtigungen bei Geräte-Ausfällen ──
  // Sendet automatisch E-Mails wenn ein überwachtes Gerät offline geht
  // oder wieder online kommt. Nutzt SMTP (z.B. Gmail, Outlook).
  //
  // Für Gmail: App-Passwort unter https://myaccount.google.com/apppasswords erstellen
  // und als 'pass' eintragen (nicht das normale Gmail-Passwort).
  notifications: {
    enabled: false,                 // true = E-Mail-Benachrichtigungen aktivieren
    cooldownMinutes: 5,             // Mindestabstand zwischen E-Mails pro Gerät/Event

    // SMTP-Server Konfiguration
    smtp: {
      host: 'smtp.gmail.com',      // SMTP-Server (Gmail, Outlook, eigener Server)
      port: 587,                    // Port (587 = STARTTLS, 465 = SSL)
      secure: false,                // true für Port 465 (SSL), false für Port 587 (STARTTLS)
      user: 'deine.email@gmail.com',// SMTP-Benutzername
      pass: 'xxxx xxxx xxxx xxxx',  // SMTP-Passwort (bei Gmail: App-Passwort)
    },

    // Absender und Empfänger
    from: '"Netzwerk Manager" <deine.email@gmail.com>',
    to: 'empfaenger@example.com',   // Empfänger-Adresse

    // Welche Events eine E-Mail auslösen
    events: {
      offline: true,                // E-Mail wenn Gerät offline geht
      online: true,                 // E-Mail wenn Gerät wieder online kommt
      credentialsChanged: true,     // E-Mail wenn Zugangsdaten geändert werden
    },
  },
};
