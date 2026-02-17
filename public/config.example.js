// ═══════════════════════════════════════════════════════════════════
// Website Configuration (Example)
// ═══════════════════════════════════════════════════════════════════
// Copy this file to config.js and adjust the values.
// All values here are examples – replace IPs, links, and names
// with your own.
// ═══════════════════════════════════════════════════════════════════

const siteConfig = {

  // ┌─────────────────────────────────────────────┐
  // │             GENERAL                         │
  // └─────────────────────────────────────────────┘

  // ── Animations ──
  // Controls all visual animations of the interface.
  // With enabled: false, all animations are disabled.
  animations: {
    enabled: true,              // Master switch for all animations
    heroGradient: true,         // Title gradient animation on the landing page
    fadeIn: true,               // Fade-in effects when loading elements
    modalSlide: true,           // Slide animation when opening modals/overlays
    panelFade: true,            // Crossfade effect when switching tabs in settings
    themeSwitcher: true,        // Animation effects of theme buttons (sun/moon/system)
    iconAnimations: true,       // Hover animations of icons (analytics, control center, settings, landing)
    numberScroll: true,         // Scroll animations for numbers (analytics center)
    analysen: {                 // Per-section animations in the analytics center
      speedtest: true,          // Speedtest download/upload/ping scroll animations
      uptime: true,             // Uptime cards: bars + percent + timer scroll
      pingMonitor: true,        // Ping monitor: ping scroll + chart reveal
      piholeSummary: true,      // Pi-hole summary cards: number scroll
      queriesOverTime: true,    // Queries bar chart: bars grow upward
      donuts: true,             // Donut charts: segments + legend
      topLists: true,           // Top domains/blocked/clients: bars + numbers
    },
  },

  // ── Design Defaults ──
  // Default values for new users. Users can override these via
  // the settings (stored in localStorage).
  defaults: {
    theme: 'dark',              // 'dark' | 'light' | 'system'
    buttonStyle: 'default',     // 'default' | 'simple'
    language: 'de',             // 'de' | 'en'
    accentColor: '#00d4ff',     // Accent color as hex value
    glow: {
      enabled: true,            // Glow on/off
      strength: 1,              // Intensity: 0 (off) to 2 (strong)
    },
    sessionTimeout: {
      enabled: false,           // Timeout on/off
      minutes: 5,               // Minutes until automatic logout (1–60)
    },
  },

  // ── Settings Visibility ──
  // Determines which areas of the settings are visible.
  settings: {
    showSettingsButton: true,   // Show/hide settings button completely
    tabs: {
      design: true,             // Design tab (theme, colors, glow)
      analysen: true,           // Analytics tab (uptime reset)
      daten: true,              // Data tab (export/import, version history)
      session: true,            // Session tab (timeout settings)
      user: true,               // User tab (change username/password, logout)
      // credits: always visible (cannot be disabled)
    },

    // ── Remote Update ──
    // Allows updating the website directly from the settings
    // (credits tab). Shows the status "Up to date" or "Get up to date".
    // On click, the configured commands are executed sequentially
    // on the server.
    //
    // WARNING: Commands are executed with the server process permissions.
    // Only enter trusted commands!
    // After a successful update, the server restarts automatically
    // (systemd/pm2 restarts the process). No manual restart needed.
    update: {
      enabled: false,           // true = show update function in credits tab
      commands: [               // Commands to execute sequentially
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
  // Animated image above the title. Automatically tinted in the accent color.
  // The image must be prepared: white/bright content on transparent background
  // (used as a CSS mask, see README → "Creating a Custom Landing GIF").
  // Supports GIF, APNG, WebP. false = don't show a GIF.
  landingGif: 'landing-gif.png',    // Path to animated image (relative to /public)
  landingGifSize: 200,              // Size in pixels (width and height)

  // ── Buttons ──
  // Show/hide navigation buttons on the landing page.
  buttons: {
    info: true,                 // Info Center button
    control: true,              // Control Center button
    analysen: true,             // Analytics Center button
  },

  // ── Header Links ──
  // Links appear as chips below the buttons on the landing page.
  headerLinks: [
    { name: 'Github', url: 'https://github.com/leminkozey' },
    { name: 'KanBan', url: 'https://leminkanban.de' },
  ],

  // ── Welcome Messages ──
  // Custom greeting texts on the landing page.
  // customOnly: true  → Only show custom messages
  // customOnly: false → Use built-in random messages
  greetings: {
    customOnly: false,          // true = custom only, false = built-in random
    messages: [
      // Enter custom welcome messages here:
      // 'Welcome to the network!',
      // 'Hello Admin!',
      // 'Good to see you.',
    ],
  },

  // ┌─────────────────────────────────────────────┐
  // │             INFO CENTER                     │
  // └─────────────────────────────────────────────┘

  // ── Card Visibility (Legacy) ──
  // Controls speedtest and Windows PC cards (not part of infoCenter).
  cards: {
    speedtest: true,            // Internet Speed – LAN speed test
    windowsPc: true,            // Windows PC – PC controls (Control Center)
  },

  // ── Info Center Layout (Configurable) ──
  // Defines the complete layout of the Info Center.
  // When present, it replaces the static cards above.
  // Two card types: 'table' (table with columns) and 'info' (form fields).
  //
  // layout: 'double' = 2 cards side by side | 'single' = full width
  // icon: Built-in name (e.g. 'switchColor'), URL, or Iconify format ('logos:raspberry-pi')
  // password: true = field is stored encrypted + eye toggle
  // copy: true/false = show/hide copy button (default: true)
  // linkField: References a field by key – the field value is used as the URL
  infoCenter: [
    {
      heading: 'Network Devices',
      layout: 'double',
      cards: [
        {
          id: 'switch',
          title: 'Switch (8 Ports)',
          icon: 'switchColor',
          type: 'table',
          columns: {
            label: 'Port',
            input: 'Assignment',
            inputPlaceholder: 'Not assigned',
            color: 'Color',
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
          title: 'WiFi Router',
          icon: 'routerColor',
          type: 'table',
          columns: {
            label: 'Port',
            input: 'Assignment',
            inputPlaceholder: 'Not assigned',
            color: 'Color',
          },
          rows: [
            { id: 'dsl', label: 'DSL' },
            { id: 'lan1', label: 'Link/LAN1' },
            { id: 'lan2', label: 'LAN2' },
            { id: 'lan3', label: 'LAN3' },
            { id: 'lan4', label: 'LAN4' },
            { id: 'telefon', label: 'Phone' },
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
            { key: 'model',           label: 'Model',          copy: false },
            { key: 'hostname',        label: 'Hostname' },
            { key: 'ipAddress',       label: 'LAN IP' },
            { key: 'vpnIp',           label: 'VPN IP' },
            { key: 'macAddress',      label: 'MAC Address' },
            { key: 'sshUser',         label: 'SSH User' },
            { key: 'sshPassword',     label: 'SSH Password',   password: true },
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
            { key: 'wifiName',       label: 'WiFi Name' },
            { key: 'wifiPassword',   label: 'WiFi Password',          password: true },
            { key: 'serialNumber',   label: 'Serial Number' },
            { key: 'configuration',  label: 'Configuration' },
            { key: 'remoteUrl',      label: 'VPN URL' },
            { key: 'devicePassword', label: 'Device Password',        password: true },
            { key: 'modemId',        label: 'Modem Installation Code', copy: false },
          ],
          links: [
            { label: 'VPN Access', linkField: 'remoteUrl' },
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
            { key: 'ipAddress',   label: 'IP Address' },
            { key: 'macAddress',  label: 'MAC Address' },
            { key: 'sshUser',     label: 'SSH User' },
            { key: 'sshPassword', label: 'SSH Password', password: true },
          ],
        },
      ],
    },
  ],

  // ┌─────────────────────────────────────────────┐
  // │             CONTROL CENTER                  │
  // └─────────────────────────────────────────────┘

  // ── Device Control ──
  // Devices that can be remotely controlled via the Control Center.
  // Supports Wake-on-LAN, SSH shutdown, and SSH restart.
  //
  // id:      unique key (lowercase, no spaces)
  // name:    display name in the frontend
  // icon:    icon name from icons.js (e.g. 'windowsColor', 'server')
  // type:    'ssh-windows' | 'ssh-linux' – determines SSH commands
  // ip:      IP address of the device
  // actions: array of actions: 'wake', 'restart', 'shutdown'
  // show:    control visibility (default: visible everywhere)
  //          Object: { controlCenter: true/false, terminal: true/false }
  //          Example: show: { controlCenter: false, terminal: true }
  //            → No tile in Control Center, but available in Web Terminal
  //          Backward compatible: show: false hides both.
  //          With show: false / controlCenter: false, the device remains
  //          usable as an SSH source for remote services (credentialsFrom).
  //
  // SSH credentials are configured per device in the settings
  // and stored encrypted on the server.
  //
  // ── Schedule ──
  // Automatic startup (Wake-on-LAN) and shutdown (SSH) at
  // scheduled times. The server must be running for schedules to execute.
  //
  // schedule.wake:     Requires a configured MAC address (in settings)
  // schedule.shutdown: Requires configured SSH credentials (in settings)
  //
  // Options:
  //   enabled: true/false – enable/disable schedule
  //   days:    weekdays as array: 'mon','tue','wed','thu','fri','sat','sun'
  //   time:    time in 24h format, e.g. '07:30' or '18:00'
  //
  // NOTE: Schedules are currently only configurable via this file.
  //       UI editing is planned for a future version.
  controlDevices: [
    {
      id: 'windowspc',
      name: 'Windows PC',
      icon: 'windowsColor',
      type: 'ssh-windows',
      ip: '192.168.1.50',
      actions: ['wake', 'restart', 'shutdown'],

      // Schedule: Automatic startup/shutdown
      // Remove the comments to activate the schedule.
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
    // Another example: Linux server
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
  // Services that can be managed via the Control Center.
  // Supports systemd services, PM2 processes, and Docker containers.
  //
  // id:      unique key (lowercase, no spaces)
  // name:    display name in the frontend
  // icon:    icon name from icons.js (e.g. 'serverColor')
  // type:    'systemd' | 'pm2' | 'docker'
  // service: exact unit/process/container name
  // host:    'local' for local execution, or
  //          { credentialsFrom: '<controlDevice-id>' } for SSH remote execution
  services: [
    // Example: Local systemd service
    // {
    //   id: 'netzwerk-manager',
    //   name: 'Network Manager',
    //   icon: 'serverColor',
    //   type: 'systemd',
    //   service: 'netzwerk-manager',
    //   host: 'local',
    // },
    // Example: PM2 process on remote server
    // {
    //   id: 'lemin-kanban',
    //   name: 'Lemin Kanban',
    //   icon: 'serverColor',
    //   type: 'pm2',
    //   service: 'lemin-kanban',
    //   host: { credentialsFrom: 'piholeControl' },
    // },
    // Example: Docker container on remote server
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
  // │             WEB TERMINAL                    │
  // └─────────────────────────────────────────────┘

  // ── Web Terminal ──
  // Allows executing SSH commands directly in the browser.
  // Requires TOTP 2FA as mandatory security.
  //
  // WARNING: The web terminal allows arbitrary commands on
  // configured devices. Only enable if you know what you're doing!
  terminal: {
    enabled: false,              // Master switch
    totpTimeout: 5,              // Minutes until TOTP is required again
    devices: [],                 // controlDevice IDs (empty = all)
    commandTimeout: 30,          // Seconds per command
    dangerousCommands: [         // Patterns that require extra TOTP
      'rm -rf', 'rm -r', 'mkfs', 'dd if=', 'shutdown', 'reboot',
      'halt', 'poweroff', 'chmod -R 777', 'iptables -F',
      'systemctl stop', 'kill -9', 'pkill', 'wipefs',
    ],
  },

  // ┌─────────────────────────────────────────────┐
  // │             ANALYTICS CENTER                │
  // └─────────────────────────────────────────────┘

  // ── Show/Hide Sections ──
  analysen: {
    speedtest: true,            // Internet speed (speed test)
    outages: true,              // Outages card
    uptime: true,               // Device info / uptime monitoring cards
    pingMonitor: true,          // Ping monitor (latency measurement)
    pihole: true,               // Pi-hole DNS analytics
  },

  // ── Device Info / Uptime Monitoring ──
  // Ping interval and devices for uptime monitoring.
  // Optional: stats property for CPU, RAM, temperature per device.
  //   stats.type: 'local' (local server) or 'ssh-linux' (via SSH)
  //   stats.credentialsFrom: ID of a control device (reuse SSH credentials)
  //   stats.credentials: { sshUser, sshPassword, sshPort } (inline, encrypted on start)
  uptimeInterval: 10,           // Ping interval in seconds (minimum: 10)
  statsInterval: 60,            // Stats interval in seconds (CPU/RAM/temp, minimum: 30)
  uptimeDevices: [
    // Device without stats → shows 24h/7d uptime bars
    { id: 'router',    name: 'Router',     ip: '192.168.1.1' },

    // Device with stats via SSH (credentials from Control Center)
    // {
    //   id: 'pihole', name: 'PiHole', ip: '192.168.1.100',
    //   stats: {
    //     type: 'ssh-linux',
    //     credentialsFrom: 'piholeControl',
    //   },
    // },

    // Device with stats via SSH (own credentials)
    // {
    //   id: 'nas', name: 'NAS', ip: '192.168.1.200',
    //   stats: {
    //     type: 'ssh-linux',
    //     credentials: { sshUser: 'admin', sshPassword: 'password', sshPort: 22 },
    //   },
    // },

    { id: 'pihole',    name: 'PiHole',     ip: '192.168.1.100' },
    { id: 'windowspc', name: 'Windows PC', ip: '192.168.1.50' },

    // Local server (the Pi itself)
    // { id: 'localhost', name: 'Pi Server', ip: '127.0.0.1', stats: { type: 'local' } },
  ],

  // ── Pi-hole v6 DNS Analytics ──
  // NOTE: config.js is blocked by the server (403) and is not
  // publicly accessible. The server reads the file internally only.
  pihole: {
    enabled: true,              // false → DNS analytics completely disabled
    url: 'http://192.168.1.100',
    password: 'your-pihole-password',
    blockingToggle: true,       // Show blocking toggle in Control Center
    cards: {
      summary: true,            // 4 summary stat cards (queries, blocked, %, blocklist)
      queriesOverTime: true,    // Stacked bar chart (queries over time)
      queryTypes: true,         // Donut: query types (A, AAAA, HTTPS, etc.)
      upstreams: true,          // Donut: upstream servers
      topDomains: true,         // Top domains list
      topBlocked: true,         // Top blocked domains list
      topClients: true,         // Top clients list
    },
  },
  piholeInterval: 60,           // Update interval in seconds (minimum: 30)

  // ── Ping Monitor (Latency Measurement) ──
  // Measures latency (ms) to external hosts via ICMP ping.
  pingMonitor: {
    enabled: true,              // false → Ping monitor completely disabled
    interval: 30,               // Ping interval in seconds (minimum: 10)
    hosts: [
      { id: 'google',     name: 'Google DNS',     ip: '8.8.8.8' },
      { id: 'cloudflare', name: 'Cloudflare DNS', ip: '1.1.1.1' },
      // { id: 'quad9',     name: 'Quad9 DNS',      ip: '9.9.9.9' },
      // { id: 'opendns',   name: 'OpenDNS',        ip: '208.67.222.222' },
    ],
  },

  // ┌─────────────────────────────────────────────┐
  // │             EMAIL NOTIFICATIONS             │
  // └─────────────────────────────────────────────┘

  // ── Email Notifications ──
  // Automatically sends emails on device outages, security events,
  // and suspicious activities. Uses SMTP (e.g. Gmail, Outlook).
  //
  // For Gmail: Create an app password at https://myaccount.google.com/apppasswords
  // and enter it as 'pass' (not the regular Gmail password).
  //
  // Each event can be individually enabled or disabled with true/false.
  // This allows e.g. enabling only security emails and disabling uptime emails.
  notifications: {
    enabled: false,                 // true = enable email notifications
    cooldownMinutes: 5,             // Minimum interval between emails per device/event

    // SMTP server configuration
    smtp: {
      host: 'smtp.gmail.com',      // SMTP server (Gmail, Outlook, custom server)
      port: 587,                    // Port (587 = STARTTLS, 465 = SSL)
      secure: false,                // true for port 465 (SSL), false for port 587 (STARTTLS)
      user: 'your.email@gmail.com', // SMTP username
      pass: 'xxxx xxxx xxxx xxxx',  // SMTP password (for Gmail: app password)
    },

    // Sender and recipient
    from: '"Network Manager" <your.email@gmail.com>',
    to: 'recipient@example.com',    // Recipient address

    // ── Which events trigger an email ──
    // Each event can be individually enabled (true) or disabled (false).
    events: {
      // Device monitoring
      offline: true,                // Device offline → email
      online: true,                 // Device back online → email (with downtime)

      // Security events
      credentialsChanged: true,     // Username or password changed
      totpEnabled: true,            // 2FA (TOTP) was enabled
      totpDisabled: true,           // 2FA (TOTP) was disabled
      terminalAccess: true,         // Web terminal was opened (with IP + location)
      newDeviceLogin: true,         // Login from new device without device token (with IP + location)
    },
  },
};
