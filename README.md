# Network Manager

A web application for managing, documenting, and controlling your local network.

## Features

- **Configurable Info Center** – Define custom sections, cards, and fields via config (tables + info cards with password encryption, copy buttons, and links)
- **Port Documentation** – Label switch and router ports (which cable goes where)
- **PiHole Info** – Store IP, hostname, and URLs of your Pi-hole
- **Speedport Info** – Document WiFi data and passwords
- **Speed Test** – Measure download, upload, and ping on the local network
- **Device Info / Uptime Monitoring** – Monitor devices via ping with live status, optionally CPU load, RAM, and temperature via SSH or locally
- **Control Center** – Control devices via Wake-on-LAN, SSH shutdown, and SSH restart
- **Service / Container Management** – Start, stop, and restart systemd services, PM2 processes, and Docker containers (locally and remotely via SSH)
- **WOL Schedule** – Automatic startup and shutdown of devices on a configurable schedule (cron-based)
- **Pi-hole DNS Analytics** – Statistics, top domains, and query history directly in the dashboard
- **Pi-hole Blocking Toggle** – Pause and resume DNS blocking with one click
- **Version History** – All changes automatically versioned and traceable
- **Data Export/Import** – Full backup as JSON
- **Multi-Language** – German and English
- **Theming** – Dark, light, and system theme with customizable accent color
- **Custom Welcome Messages** – Configurable greeting texts on the landing page
- **Landing GIF** – Animated image above the title, automatically tinted in the accent color (custom GIFs supported)
- **Landing Page Buttons** – Info, control, and analytics buttons individually show/hide
- **Analytics Sections** – Speedtest, uptime, outages, ping monitor, and Pi-hole individually show/hide
- **Pi-hole On/Off** – DNS analytics completely disableable via config
- **Ping Monitor** – Latency measurement to external hosts (e.g., Google DNS, Cloudflare) with live chart and statistics
- **Remote Update** – Automatic updating directly from the settings (credits tab) with configurable commands
- **Responsive Outages** – Outages card automatically adapts to mobile screens
- **Email Notifications** – Automatic emails on device outages (offline/online) via SMTP
- **Web Terminal** – Execute SSH commands directly in the browser on configured devices (TOTP 2FA required)
- **TOTP Two-Factor Authentication** – Configurable in settings, required for the web terminal, with QR code setup and replay protection

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- A web browser
- `sshpass` installed on the server (only needed for web terminal and SSH-based features)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
   For the web terminal, `otpauth` and `qrcode` are additionally required (included in `package.json` and automatically installed with `npm install`).
3. Create configuration:
   ```bash
   cp public/config.example.js public/config.js
   ```
4. Customize `public/config.js` (see [Configuration](#configuration))

> **Recommendation:** Always copy `config.example.js` as a starting point. It contains all available options with detailed English comments and sensible example values. Then adjust IPs, passwords, and devices to match your network.

> **Note on updates:** When pulling new versions, `config.example.js` may change (new features, new options). After an update, compare your `config.js` with the current `config.example.js` and adopt new sections as needed. Your `config.js` will not be overwritten by updates as long as it's in `.gitignore`.
5. Start the server:
   ```bash
   node server.js
   ```
6. Open in browser: `http://localhost:5055`

---

## Configuration

All configuration is done via `public/config.js`. This file is not included on first start – copy `config.example.js` as a template.

If `config.js` is missing or cannot be loaded, safe default values are used.

### Animations (`animations`)

Controls all visual animations of the interface.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Master switch. When `false`, all animations are disabled. |
| `heroGradient` | `boolean` | `true` | Animated color gradient in the title on the landing page. |
| `fadeIn` | `boolean` | `true` | Fade-in effects when loading cards and elements. |
| `modalSlide` | `boolean` | `true` | Slide animation when opening modals and overlays. |
| `panelFade` | `boolean` | `true` | Crossfade effect when switching tabs in settings. |
| `themeSwitcher` | `boolean` | `true` | Animation effects of the theme buttons (sun/moon/system). |
| `iconAnimations` | `boolean` | `true` | Hover animations of icons on all pages (analytics, control center, settings, landing). Clock hands rotate, speedometer swings, warning triangle pulses, etc. |
| `numberScroll` | `boolean` | `true` | Scroll animations for numbers in the analytics center. When `false`, all numbers appear instantly, but bars/charts/donuts still animate. |

Individual options only take effect when `enabled: true`.

#### Analytics Animations (`animations.analysen`)

Granular control of scroll/reveal animations per section in the analytics center. Each option only works when `enabled: true`. When `false`, the respective section is shown immediately in its final state (no observers, no transitions).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `speedtest` | `boolean` | `true` | Speedtest download/upload/ping scroll animations. |
| `uptime` | `boolean` | `true` | Uptime cards: bar animation, percent scroll, and timer scroll. |
| `pingMonitor` | `boolean` | `true` | Ping monitor: ping scroll numbers and chart reveal from left to right. |
| `piholeSummary` | `boolean` | `true` | Pi-hole summary cards: number scroll animation. |
| `queriesOverTime` | `boolean` | `true` | Queries bar chart: bars grow from bottom to top. |
| `donuts` | `boolean` | `true` | Donut charts (query types + upstreams): segments and legend numbers. |
| `topLists` | `boolean` | `true` | Top domains/blocked/clients: bars and number scroll. |

**Hierarchy:**
- `animations.enabled: false` → all animations off (including analytics + icon hover)
- `animations.iconAnimations: false` → all icon hover animations off (clock hands, speedometer, warning triangle, buttons, etc.)
- `animations.numberScroll: false` → all scroll numbers in analytics center instantly visible, but bars/charts/donuts still animate
- `animations.analysen.X: false` → only that section without animation

```js
animations: {
  enabled: true,
  heroGradient: true,
  fadeIn: true,
  modalSlide: true,
  panelFade: true,
  themeSwitcher: true,
  iconAnimations: true,
  numberScroll: true,
  analysen: {
    speedtest: true,
    uptime: true,
    pingMonitor: true,
    piholeSummary: true,
    queriesOverTime: true,
    donuts: true,
    topLists: true,
  },
},
```

### Design Defaults (`defaults`)

Default values for new users. Users can override these values at any time in the settings – personal settings are stored in the browser's `localStorage` and take priority.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `string` | `'dark'` | Default theme: `'dark'`, `'light'`, or `'system'`. |
| `buttonStyle` | `string` | `'default'` | Button style: `'default'` (with border) or `'simple'` (flat). |
| `language` | `string` | `'de'` | Language: `'de'` (German) or `'en'` (English). |
| `accentColor` | `string` | `'#00d4ff'` | Accent color as hex value. Used for buttons, links, and highlights. |

```js
defaults: {
  theme: 'dark',
  buttonStyle: 'default',
  language: 'de',
  accentColor: '#00d4ff',
},
```

#### Glow Effect (`defaults.glow`)

Glowing shine around active elements and buttons.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Glow effect on/off. |
| `strength` | `number` | `1` | Intensity from `0` (no glow) to `2` (strong). |

```js
glow: {
  enabled: true,
  strength: 1,
},
```

#### Session Timeout (`defaults.sessionTimeout`)

Automatic logout after inactivity.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Timeout on/off. |
| `minutes` | `number` | `5` | Minutes until automatic logout (1–60). |

```js
sessionTimeout: {
  enabled: false,
  minutes: 5,
},
```

### Settings Visibility (`settings`)

Determines which areas of the settings are visible to the user.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSettingsButton` | `boolean` | `true` | Show or hide the settings button (gear icon) completely. |

#### Tabs (`settings.tabs`)

| Tab | Default | Description |
|-----|---------|-------------|
| `design` | `true` | Theme, accent color, button style, glow settings. |
| `analysen` | `true` | Reset uptime data and outages. |
| `daten` | `true` | Version history, data export and import. |
| `session` | `true` | Configure session timeout. |
| `user` | `true` | Change username and password, logout. |
| Credits | always | Developer info. Cannot be disabled. |

```js
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
```

#### Remote Update (`settings.update`)

Allows updating the website directly from the settings (credits tab). Shows the status "Up to date" or "Get up to date". On click, the configured commands are executed sequentially on the server.

> **Warning:** Commands are executed with the server process permissions. Only enter trusted commands! After a successful update, the server restarts automatically (systemd/pm2).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Show update function in credits tab. |
| `commands` | `array` | `[]` | Commands to execute sequentially. |

```js
settings: {
  update: {
    enabled: false,
    commands: [
      'git stash',
      'git pull',
      'git stash pop',
    ],
  },
},
```

### Landing Page

#### Landing GIF (`landingGif`, `landingGifSize`)

Displays an animated image above the page title. The image is automatically tinted in the current accent color – regardless of dark mode, light mode, or a custom color.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `landingGif` | `string \| false` | `'landing-gif.png'` | Path to the animated image (relative to `public/`). `false` = no GIF. |
| `landingGifSize` | `number` | `200` | Width and height in pixels. |

```js
landingGif: 'landing-gif.png',
landingGifSize: 200,
```

##### Creating a Custom Landing GIF

The GIF is not displayed directly on the page but used as a CSS mask.
This means: the bright pixels in the GIF determine where the accent color becomes visible.
For this, the GIF must first be prepared with a script.

**1. Find a Suitable GIF**

You need an animated GIF with **bright/white content on a black background**.

How to find one:
- Search on sites like [Tenor](https://tenor.com), [GIPHY](https://giphy.com), or [Pinterest](https://pinterest.com)
  for e.g., `globe animation black background`, `network animation dark`, `loading animation black`
- Make sure the motif is **white/bright** and the **background is black**
- The motif can be anything: a globe, a network, a logo, particles, text, etc.

Example – this is what the original GIF should look like:
```
┌──────────────────────┐
│ ██████████████████   │  ← Black background
│ ████░░⬜⬜░░█████   │
│ ██░░⬜⬜⬜⬜░░██   │  ← White motif (e.g., globe)
│ ████░░⬜⬜░░█████   │
│ ██████████████████   │
└──────────────────────┘
```

> **Important:** Colorful GIFs or GIFs with a bright/white background do **not** work.
> The background must be black (or very dark), the motif white (or bright).

**2. Install Python and Pillow (one-time)**

The preparation script requires Python 3 and the Pillow library:

```bash
pip install Pillow
```

**3. Prepare the GIF with the Script**

In the project folder (where `server.js` and `package.json` are located) you'll find
`prepare-gif.py`. **Important:** Run the script from this folder, otherwise
it cannot place the finished file in `public/`.

The script automatically does the following:
- Black pixels → become transparent
- White/bright pixels → remain as a mask
- The GIF is scaled to the desired size
- The result is saved as APNG (animated PNG with transparency) in `public/`

The GIF can be anywhere on your computer (desktop, downloads, etc.) –
you simply provide the path as an argument. The script must be run from the
project folder so the finished file lands in `public/`.

```bash
cd /path/to/Netzwerk-Manager

# Prepare GIF from desktop (default 200px):
python3 prepare-gif.py ~/Desktop/my-gif.gif

# Prepare GIF from downloads with custom size (300px):
python3 prepare-gif.py ~/Downloads/animation.gif 300
```

At the end, the script outputs what needs to be added to `config.js`:
```
Done: public/my-gif-prepared.png (1520 KB)

Now add to config.js:
  landingGif: 'my-gif-prepared.png',
  landingGifSize: 200,
```

**4. Add to config.js**

The script automatically places the finished file in `public/` – that is, where
`index.html`, `style.css`, and the other website files are located. You don't need to
move the file manually.

Open `public/config.js` and enter the filename and size:

```js
landingGif: 'my-gif-prepared.png',
landingGifSize: 200,
```

Done – on the next page load, the GIF will be displayed above the title in the current accent color.

> **Tip:** The script works with any black-and-white GIF – regardless of the motif.
> It automatically detects bright and dark pixels. You can prepare a different GIF
> at any time and change the path in `config.js`.

##### How Does the Tinting Work?

The image is not displayed directly but used as a [CSS mask](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image):

```
┌────────────────────────┐
│ Background: Accent     │  ← Div with var(--accent)
│ color (e.g., #ff6b9d)  │
└────────────────────────┘
          ×
┌────────────────────────┐
│ Mask: Your APNG        │  ← White = visible
│   ░░░⬜⬜⬜░░░        │     Transparent = hidden
└────────────────────────┘
          =
┌────────────────────────┐
│ Result:                │  ← Accent color only where
│   ░░░🟪🟪🟪░░░        │     the mask is white
└────────────────────────┘
```

This way, the color automatically adapts when you change the accent color in the settings.

#### Buttons (`buttons`)

Show or hide navigation buttons on the landing page individually. Buttons are always displayed centered, regardless of how many are active.

| Button | Default | Description |
|--------|---------|-------------|
| `info` | `true` | Info Center button. |
| `control` | `true` | Control Center button. |
| `analysen` | `true` | Analytics Center button. |

```js
buttons: {
  info: true,
  control: true,
  analysen: true,
},
```

#### Header Links (`headerLinks`)

Links appear as chips below the buttons on the landing page. Each link automatically shows the favicon of the target website.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name of the link. |
| `url` | `string` | Full URL (must start with `http://` or `https://`). |

```js
headerLinks: [
  { name: 'Github', url: 'https://github.com/your-username' },
  { name: 'KanBan', url: 'https://example.com/kanban' },
],
```

#### Welcome Messages (`greetings`)

Custom greeting texts on the landing page. A random message is displayed on each page load.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customOnly` | `boolean` | `false` | `true` = only custom messages, `false` = built-in random messages. |
| `messages` | `array` | `[]` | List of custom welcome messages. |

- **`customOnly: false`** – Built-in messages (e.g., "What's on the agenda today?", "Ready to go?") are used. `messages` is ignored.
- **`customOnly: true`** – Only the messages entered in `messages` are displayed. If `messages` is empty, it falls back to the built-in ones.

```js
greetings: {
  customOnly: true,
  messages: [
    'Welcome to the network!',
    'Hello Admin!',
    'Good to see you.',
  ],
},
```

### Info Center

#### Configurable Layout (`infoCenter`)

The Info Center can be fully defined via the config. You determine which sections, cards, and fields are displayed – completely without code changes.

If `infoCenter` is present in the config, dynamic rendering is used. Without `infoCenter`, legacy rendering applies (the old hardwired cards).

##### Structure

`infoCenter` is an array of **sections**. Each section contains a heading, a layout, and an array of cards:

```js
infoCenter: [
  {
    heading: 'Network Devices',       // Section heading
    layout: 'double',                 // 'double' = 2 cards side by side, 'single' = full width
    cards: [ ... ],                   // Array of card definitions
  },
],
```

##### Section Options

| Option | Type | Description |
|--------|------|-------------|
| `heading` | `string` | Section heading. |
| `layout` | `string` | `'double'` = cards paired in a 2-column grid. `'single'` = each card full width. |
| `cards` | `array` | Array of card definitions (see below). |

With `layout: 'double'` and an odd number of cards, the last card is displayed alone (full width).

##### Card Types

There are two card types: **Table** and **Info**.

###### Table Card (`type: 'table'`)

For tabular data like port assignments. Each row has a text input field and a color picker.

```js
{
  id: 'switch',                   // Unique ID (lowercase, no spaces)
  title: 'Switch (8 Ports)',      // Display name
  icon: 'switchColor',            // Icon (built-in, URL, or Iconify)
  type: 'table',
  columns: {
    label: 'Port',                // Left column name
    input: 'Assignment',          // Middle column name
    inputPlaceholder: 'Not assigned',  // Placeholder when empty
    color: 'Color',               // Right column name
  },
  rows: [
    { id: 'port1', label: 'Port 1' },
    { id: 'port2', label: 'Port 2' },
    // ...
  ],
}
```

| Option | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique key for data storage. |
| `title` | `string` | Card heading. |
| `icon` | `string` | Icon name (see [Icons](#icons)). |
| `columns` | `object` | Column names for the table. |
| `columns.label` | `string` | Left column name (row label). |
| `columns.input` | `string` | Middle column name (text input). |
| `columns.inputPlaceholder` | `string` | Placeholder text for empty input fields. |
| `columns.color` | `string` | Right column name (color picker). |
| `rows` | `array` | Array of rows with `id` and `label`. |

###### Info Card (`type: 'info'`)

For form fields like IP addresses, passwords, and URLs. Supports password encryption, copy buttons, and clickable links.

```js
{
  id: 'pihole',
  title: 'PiHole',
  icon: 'raspberryColor',
  type: 'info',
  fields: [
    { key: 'hostname',    label: 'Hostname' },
    { key: 'ipAddress',   label: 'LAN IP' },
    { key: 'sshPassword', label: 'SSH Password', password: true },
    { key: 'model',       label: 'Model',        copy: false },
    { key: 'piholeUrl',   label: 'Admin URL' },
  ],
  links: [
    { label: 'Pi-hole Admin', linkField: 'piholeUrl' },
  ],
}
```

**Field Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | — | Internal key for data storage. Must be unique within the card. |
| `label` | `string` | — | Display name of the field in the UI. |
| `password` | `boolean` | `false` | `true` = value is displayed as a password field (hidden) with eye toggle. Stored encrypted on the server with AES-256-GCM. |
| `copy` | `boolean` | `true` | `true` = show copy button next to the field. `false` = no copy button. Useful for fields you rarely need to copy (e.g., model, notes). |

**Link Options:**

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Button text of the link. |
| `linkField` | `string` | References a field by `key`. The entered value is used as the URL for the link button. If the field is empty, the button is grayed out. |

##### Data Storage

Card data is stored in `Data/InfoCards.json` (not in `state.json`). On first activation of `infoCenter`, existing data from `state.json` is automatically migrated (switch ports, router ports, PiHole info, Speedport info).

##### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/info-card/:cardId` | Yes | Load card data. Password fields are returned decrypted. |
| `POST` | `/api/info-card/:cardId` | Yes | Save card data. Password fields are stored encrypted. Field keys and row IDs are validated against the config. |

##### Full Example

```js
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
        columns: { label: 'Port', input: 'Assignment', inputPlaceholder: 'Not assigned', color: 'Color' },
        rows: [
          { id: 'port1', label: 'Port 1' },
          { id: 'port2', label: 'Port 2' },
          { id: 'port3', label: 'Port 3' },
          { id: 'port4', label: 'Port 4' },
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
          { key: 'model',       label: 'Model',        copy: false },
          { key: 'hostname',    label: 'Hostname' },
          { key: 'ipAddress',   label: 'LAN IP' },
          { key: 'sshPassword', label: 'SSH Password',  password: true },
          { key: 'piholeUrl',   label: 'Admin URL' },
        ],
        links: [
          { label: 'Pi-hole Admin', linkField: 'piholeUrl' },
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
          { key: 'hostname',  label: 'Hostname' },
          { key: 'ipAddress', label: 'IP Address' },
        ],
      },
    ],
  },
],
```

##### Backward Compatibility

The `infoCenter` block is **completely optional**. Without `infoCenter` in the config, the old hardwired cards (switch, router, PiHole, Speedport, Windows PC) are displayed unchanged. Existing data is automatically migrated when first adding `infoCenter`.

#### Legacy: Card Visibility (`cards`)

If `infoCenter` is **not** used, the old cards can be shown/hidden individually:

| Card | Default | Description |
|------|---------|-------------|
| `switch` | `true` | Network switch with 8 ports. |
| `router` | `true` | WiFi router with port documentation. |
| `pihole` | `true` | Pi-hole DNS server information. |
| `speedport` | `true` | Speedport/router credentials. |
| `speedtest` | `true` | LAN speed test (download, upload, ping). |
| `windowsPc` | `true` | Windows PC / Control Center controls. |

```js
cards: {
  switch: true,
  router: true,
  pihole: true,
  speedport: true,
  speedtest: true,
  windowsPc: true,
},
```

### Control Center

The Control Center provides remote control of devices (Wake-on-LAN, shutdown, restart), service/container management (systemd, PM2, Docker), and Pi-hole DNS blocking toggle. All functions are configured via `config.js`.

### Device Info / Uptime Monitoring (`uptimeDevices`, `uptimeInterval`, `statsInterval`)

Monitors devices on the network via ICMP ping and shows live status in the frontend. Optionally, CPU load, RAM usage, and temperature can be displayed per device.

**Ping and stats run in separate cycles**, so the online status is updated frequently without triggering the stats query (SSH connections) unnecessarily often.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uptimeInterval` | `number` | `10` | Ping interval in seconds (online/offline status). Minimum: 10. |
| `statsInterval` | `number` | `60` | Stats interval in seconds (CPU/RAM/temperature). Minimum: 30. |
| `uptimeDevices` | `array` | `[]` | List of devices to monitor. |

Each device has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key (lowercase, no spaces). |
| `name` | `string` | Display name in the frontend. |
| `ip` | `string` | IP address of the device on the local network. |
| `stats` | `object` | **Optional.** Enables CPU/RAM/temperature display. Without `stats`, the classic 24h/7d uptime bars are shown. |

#### Stats Configuration (`stats`)

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `'local'` for the local server or `'ssh-linux'` for SSH query. |
| `credentialsFrom` | `string` | ID of a control device. The SSH credentials are reused from it (no duplicating passwords). |
| `credentials` | `object` | Alternative to `credentialsFrom`: inline credentials `{ sshUser, sshPassword, sshPort }`. Passwords are automatically encrypted on server start. |

**Three variants:**

```js
uptimeDevices: [
  // 1. Without stats → classic 24h/7d uptime bars
  { id: 'router', name: 'Router', ip: '192.168.1.1' },

  // 2. Stats via SSH (reuse credentials from Control Center)
  {
    id: 'pihole', name: 'PiHole', ip: '192.168.1.100',
    stats: {
      type: 'ssh-linux',
      credentialsFrom: 'piholeControl',
    },
  },

  // 3. Stats via SSH (own inline credentials)
  {
    id: 'nas', name: 'NAS', ip: '192.168.1.200',
    stats: {
      type: 'ssh-linux',
      credentials: { sshUser: 'admin', sshPassword: 'password', sshPort: 22 },
    },
  },

  // 4. Local server (reads /proc directly, no SSH needed)
  { id: 'localhost', name: 'Pi Server', ip: '127.0.0.1', stats: { type: 'local' } },
],
```

#### Displayed Stats

| Metric | Source | Display |
|--------|--------|---------|
| **CPU Load** | `/proc/loadavg` + `nproc` | Bar with percentage, smooth color gradient green → yellow → red |
| **RAM** | `/proc/meminfo` | Bar with GB display (e.g., "0.4/0.9 GB"), smooth color gradient |
| **Temperature** | `/sys/class/thermal/thermal_zone0/temp` | Bar with °C value, smooth color gradient |

All three metrics show a **smooth color gradient** from green (low) through yellow (medium) to red (high) — no hard switching, but continuous interpolation.

- Stats are kept only in RAM (volatile, not persisted)
- Stats are queried in a **separate cycle** (`statsInterval`, default 60s), separate from the ping cycle (`uptimeInterval`, default 10s)
- Devices without the `stats` property continue to show the classic 24h/7d uptime bars
- Offline devices do not show stats

### Device Control / Control Center (`controlDevices`)

Enables remote control of devices via Wake-on-LAN and SSH. The SSH credentials (user, password, port) and MAC address are configured per device in the settings and stored encrypted on the server.

Each device has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key (lowercase, no spaces). |
| `name` | `string` | Display name in the frontend. |
| `icon` | `string` | Icon for the device. Supports three formats (see [Icons](#icons)). |
| `type` | `string` | SSH type: `'ssh-windows'` or `'ssh-linux'`. Determines which commands are used for shutdown/restart. |
| `ip` | `string` | IP address of the device. |
| `actions` | `array` | Available actions: `'wake'`, `'restart'`, `'shutdown'`. |
| `show` | `boolean \| object` | **Optional.** Controls visibility in the Control Center and Web Terminal (see [Visibility](#visibility-show)). |

**SSH commands by type:**

| Type | Shutdown | Restart |
|------|----------|---------|
| `ssh-windows` | `shutdown /s /t 0` | `shutdown /r /t 0` |
| `ssh-linux` | `sudo shutdown -h now` | `sudo reboot` |

```js
controlDevices: [
  {
    id: 'windowspc',
    name: 'Windows PC',
    icon: 'windowsColor',
    type: 'ssh-windows',
    ip: '192.168.1.50',
    actions: ['wake', 'restart', 'shutdown'],
  },
  {
    id: 'nas',
    name: 'NAS Server',
    icon: 'server',
    type: 'ssh-linux',
    ip: '192.168.1.200',
    actions: ['wake', 'shutdown'],
  },
  // Only as SSH source for remote services – no tile in Control Center
  {
    id: 'piholeControl',
    name: 'Pi-hole Server',
    icon: 'raspberryColor',
    type: 'ssh-linux',
    ip: '192.168.1.100',
    actions: ['shutdown'],
    show: false,
  },
  // Only available in Web Terminal, not in Control Center
  {
    id: 'piserver',
    name: 'Pi Server',
    icon: 'server',
    type: 'ssh-linux',
    ip: '192.168.1.100',
    actions: [],
    show: { controlCenter: false, terminal: true },
  },
],
```

#### Visibility (`show`)

The `show` property controls where a device is displayed: in the Control Center (as a tile) and/or in the Web Terminal (as a target device). By default, a device is visible everywhere.

**Formats:**

| Value | Control Center | Web Terminal | Description |
|-------|:-:|:-:|-------------|
| `show` not set | Yes | Yes | Default — visible everywhere. |
| `show: true` | Yes | Yes | Explicitly visible everywhere (identical to default). |
| `show: false` | No | No | Hidden everywhere. Useful as a pure SSH credential source for remote services (`credentialsFrom`). |
| `show: { controlCenter: true, terminal: false }` | Yes | No | Only as a tile in the Control Center. |
| `show: { controlCenter: false, terminal: true }` | No | Yes | Only in the Web Terminal. No tile in the Control Center. |

Missing keys in the object are interpreted as `true`: `show: { controlCenter: false }` equals `show: { controlCenter: false, terminal: true }`.

```js
// Visible everywhere (default)
{ id: 'windowspc', show: true, ... }

// Hidden everywhere, only usable as SSH source
{ id: 'piholeControl', show: false, ... }

// Only in Web Terminal, no tile in Control Center
{ id: 'piserver', show: { controlCenter: false, terminal: true }, ... }

// Only as tile, not in terminal
{ id: 'nas', show: { controlCenter: true, terminal: false }, ... }
```

> **Backward compatible:** Existing configurations with `show: true` / `show: false` continue to work without changes.

#### Icons

Everywhere `icon:` is used (e.g., in `controlDevices`), three formats are supported:

**1. Built-in Icons** – Name from `icons.js`:
```js
icon: 'windowsColor',
icon: 'raspberryColor',
icon: 'server',
```

**2. Direct URL** – Any SVG/PNG via link:
```js
icon: 'https://svgl.app/library/raspberry_pi.svg',
icon: 'https://cdn.simpleicons.org/pihole',
```

> **Note:** SVGL URLs (`svgl.app/library/...`) are automatically redirected to the working CDN URL – you only need to enter the short URL.

**3. Iconify Format** – `prefix:name` from the [Iconify](https://iconify.design/) ecosystem:
```js
icon: 'logos:raspberry-pi',
icon: 'devicon:windows11-original',
icon: 'simple-icons:raspberrypi',
```

All available Iconify icons can be found at [icon-sets.iconify.design](https://icon-sets.iconify.design/).

**Icon Sources:**

| Source | Description | Link |
|--------|-------------|------|
| **Iconify** | 200,000+ icons from 150+ sets, usable via `prefix:name` | [iconify.design](https://iconify.design/) · [Search](https://icon-sets.iconify.design/) |
| **SVGL** | Curated collection of colorful brand SVGs (tech logos) | [svgl.app](https://svgl.app/) · [GitHub](https://github.com/pheralb/svgl) |
| **Simple Icons** | 3,000+ brand logos as SVG, colorable via CDN | [simpleicons.org](https://simpleicons.org/) · [GitHub](https://github.com/simple-icons/simple-icons) |

> **Tip:** For colorful, true-to-original logos, SVGL or Iconify sets like `logos:` and `devicon:` work well. Simple Icons provides monochrome logos that can be tinted via URL parameter (e.g., `https://cdn.simpleicons.org/raspberrypi/red`).

---

### WOL Schedule (`schedule`)

Automatic startup (Wake-on-LAN) and shutdown (SSH) of devices at scheduled times. The schedule is configured directly in the `controlDevices` entry as an optional `schedule` block.

> **Important:** The server must be running for schedules to execute. Configuration is done exclusively via `config.js` – UI editing is planned for a future version.

#### Structure

The `schedule` block is placed within a `controlDevices` entry:

```js
controlDevices: [
  {
    id: 'windowspc',
    name: 'Windows PC',
    icon: 'windowsColor',
    type: 'ssh-windows',
    ip: '192.168.1.50',
    actions: ['wake', 'restart', 'shutdown'],
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
],
```

#### Options

Each schedule entry (`wake` and/or `shutdown`) has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | `boolean` | Enable (`true`) or disable (`false`) the schedule. |
| `days` | `array` | Weekdays as abbreviations: `'mon'`, `'tue'`, `'wed'`, `'thu'`, `'fri'`, `'sat'`, `'sun'`. |
| `time` | `string` | Time in 24-hour format, e.g., `'07:30'` or `'18:00'`. |

#### Prerequisites

| Action | Prerequisite |
|--------|-------------|
| `wake` | A **MAC address** must be configured for the device in the settings. The server sends a Wake-on-LAN magic packet to the broadcast address. |
| `shutdown` | **SSH credentials** (user, password, port) must be configured in the settings. The server connects via SSH and executes the shutdown command. |

#### How It Works

1. **Server start:** The server reads `config.js` and creates a cron job for each active schedule (based on [`node-cron`](https://www.npmjs.com/package/node-cron)).
2. **Automatic execution:** At the configured time, the corresponding action is executed – sending a Wake-on-LAN packet or SSH shutdown command.
3. **Config reload:** Every 60 seconds, the server checks if the schedule configuration has changed. Cron jobs are only recreated when actual changes occur – no server restart needed.
4. **Logging:** Each execution is logged in the server console:
   ```
   [Scheduler] wake for Windows PC executing (07:30)
   [Scheduler] Wake-on-LAN sent for Windows PC (MAC: AA:BB:CC:DD:EE:FF)
   ```

#### Frontend Display

In the Control Center, the next scheduled action is shown under each device with an active schedule:

- **Today 07:30** – when the next execution is today
- **Tomorrow 18:00** – when the next execution is tomorrow
- **Wed 07:30** – weekday for more distant dates

The display updates automatically every 60 seconds. Devices without a schedule show no additional info.

#### API Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/schedules` | Yes | Returns the next scheduled actions per device. |

**Response format:**
```json
{
  "windowspc": {
    "nextWake": "2026-02-12T07:30:00.000Z",
    "nextShutdown": "2026-02-11T18:00:00.000Z"
  }
}
```

Devices without a schedule do not appear in the response.

#### Backward Compatibility

The `schedule` block is **completely optional**. Existing configurations without `schedule` continue to work without changes.

---

### Service / Container Management (`services`)

Allows starting, stopping, and restarting services directly from the Control Center. Supports three service types:

| Type | Tool | Example |
|------|------|---------|
| `systemd` | `systemctl` | Linux system services (nginx, network-manager, etc.) |
| `pm2` | `pm2` | Node.js processes managed with PM2 |
| `docker` | `docker` | Docker containers |

Services can be managed **locally** or **remotely via SSH**.

#### Configuration

Each service has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key (lowercase, no spaces). |
| `name` | `string` | Display name in the frontend. |
| `icon` | `string` | Icon for the service (see [Icons](#icons)). |
| `type` | `string` | Service type: `'systemd'`, `'pm2'`, or `'docker'`. |
| `service` | `string` | Exact name of the systemd unit / PM2 process / Docker container. |
| `host` | `string \| object` | `'local'` for local execution or `{ credentialsFrom: '<id>' }` for remote execution via SSH. |

#### Local vs. Remote

**Local services** (`host: 'local'`):
- Commands are executed directly on the server (no SSH)
- Prerequisite: The corresponding tool must be installed (`systemctl`, `pm2`, or `docker`)

**Remote services** (`host: { credentialsFrom: '<id>' }`):
- Commands are executed via SSH on a remote device
- `credentialsFrom` references the `id` of an entry in `controlDevices`
- SSH credentials (user, password, port) and IP address are taken from the referenced control device
- The control device must have SSH credentials configured in settings
- The tool (`systemctl`, `pm2`, `docker`) must be installed on the remote device

> **Tip:** If you don't want to see the remote device as a tile in the Control Center, set `show: false` or `show: { controlCenter: false }` in the `controlDevices` entry. The device then only serves as an SSH credential source (see [Visibility](#visibility-show)).

#### Example

```js
services: [
  // Local systemd service
  {
    id: 'netzwerk-manager',
    name: 'Network Manager',
    icon: 'serverColor',
    type: 'systemd',
    service: 'netzwerk-manager',
    host: 'local',
  },
  // PM2 process on remote server (SSH credentials from controlDevices)
  {
    id: 'lemin-kanban',
    name: 'Lemin Kanban',
    icon: 'serverColor',
    type: 'pm2',
    service: 'lemin-kanban',
    host: { credentialsFrom: 'piholeControl' },
  },
  // Docker container on remote server
  {
    id: 'pihole-docker',
    name: 'Pi-hole',
    icon: 'piholeDnsColor',
    type: 'docker',
    service: 'pihole',
    host: { credentialsFrom: 'piholeControl' },
  },
],
```

#### Service Commands

Depending on `type`, the following commands are executed:

**systemd:**

| Action | Command |
|--------|---------|
| Start | `sudo systemctl start <service>` |
| Stop | `sudo systemctl stop <service>` |
| Restart | `sudo systemctl restart <service>` |
| Status | `systemctl is-active <service>` |

**pm2:**

| Action | Command |
|--------|---------|
| Start | `pm2 start <service>` |
| Stop | `pm2 stop <service>` |
| Restart | `pm2 restart <service>` |
| Status | `pm2 jlist` (JSON output, process is searched by name) |

**docker:**

| Action | Command |
|--------|---------|
| Start | `docker start <service>` |
| Stop | `docker stop <service>` |
| Restart | `docker restart <service>` |
| Status | `docker inspect -f '{{.State.Status}}' <service>` |

#### Frontend

In the Control Center, services are displayed as tiles with three buttons:

- **Start** (green) – Start service
- **Restart** (accent color) – Restart service
- **Shutdown** (red) – Stop service

A status badge shows the current state:
- **Active** (green) – Service is running
- **Stopped** (red) – Service is stopped
- **Error** (red) – Service is in an error state
- **Unknown** (gray) – Status could not be queried (e.g., host offline)

The status is automatically updated every 10 seconds. After an action (start/stop/restart), the status is re-queried after 1.5 seconds.

A type badge (`systemd`, `pm2`, `docker`) shows the service type.

#### Prerequisites

| Location | Prerequisite |
|----------|-------------|
| Local | The tool (`systemctl`, `pm2`, `docker`) must be installed on the server. For systemd services, the server process must have `sudo` permissions (or passwordless `sudo` for `systemctl`). |
| Remote | SSH credentials must be configured in the settings for the referenced control device. The tool must be installed on the remote device. `sshpass` must be installed on the server. |

#### Security

- **Service name validation**: Service names are validated against `/^[a-zA-Z0-9_.-]{1,100}$/` – shell meta-characters are not possible
- **Command templates**: Commands are generated from fixed templates, not assembled from user input
- **Config sanitization**: `service` and `credentialsFrom` are removed from the public config
- **Rate limiting**: Maximum 10 actions per minute and 120 status queries per minute per IP
- **Auth required**: All endpoints require login
- **Audit logging**: Every action is logged with `[SERVICE-AUDIT]` (IP, service ID, action, result)

#### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/services/:serviceId/status` | Yes | Query service status. Returns `{ status: 'running'\|'stopped'\|'error'\|'unknown' }`. |
| `POST` | `/api/services/:serviceId/:action` | Yes | Execute action (`start`, `stop`, `restart`). Returns `{ success: true/false, message }`. |

#### Backward Compatibility

The `services` block is **completely optional**. Without `services` in the config, the placeholder "Containers & Services" is shown in the Control Center. Existing configurations work without changes.

---

### Analytics Center

#### Show/Hide Sections (`analysen`)

Show or hide individual sections on the analytics page.

| Section | Default | Description |
|---------|---------|-------------|
| `speedtest` | `true` | Internet speed (speed test). |
| `outages` | `true` | Outages card (responsive on mobile). |
| `uptime` | `true` | Device info / uptime monitoring cards. |
| `pingMonitor` | `true` | Ping monitor (latency measurement). |
| `pihole` | `true` | Pi-hole DNS analytics. |

```js
analysen: {
  speedtest: true,
  outages: true,
  uptime: true,
  pingMonitor: true,
  pihole: true,
},
```

#### Pi-hole (`pihole`)

Connects to your Pi-hole v6 and shows DNS statistics in the analytics center. Additionally, DNS blocking can be paused and resumed directly in the Control Center.

The server reads `url` and `password` from the config and communicates server-side with the Pi-hole API. The credentials are not visible in the frontend (`config.js` is blocked server-side with 403).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | `false` → DNS analytics completely disabled (no API calls, no display). |
| `url` | `string` | — | Pi-hole admin URL (e.g., `'http://192.168.1.100'`). |
| `password` | `string` | — | Pi-hole API password. |
| `blockingToggle` | `boolean` | `true` | Show blocking toggle in the Control Center. |
| `piholeInterval` | `number` | `60` | Update interval in seconds (minimum 30). Set at root level. |

#### Blocking Toggle

When `blockingToggle: true` (or not set), a Pi-hole tile appears in the Control Center:

- **Status badge** shows the current blocking status (Active / Inactive / Offline)
- **Pause button** (yellow) disables DNS blocking
- **Resume button** (green) re-enables DNS blocking
- The status is automatically updated every 15 seconds
- With `blockingToggle: false`, the tile is completely hidden
- If Pi-hole is unreachable, the tile shows "Offline" status (without button)
- Rapid toggling is server-side limited to max 1x per 5 seconds

#### Dashboard Cards (`pihole.cards`)

Show or hide individual cards in the analytics center. Disabled cards are not rendered and the associated API calls are not executed.

| Card | Default | Description |
|------|---------|-------------|
| `summary` | `true` | 4 summary stat cards (queries, blocked, %, blocklist). |
| `queriesOverTime` | `true` | Stacked bar chart with queries over time. |
| `queryTypes` | `true` | Donut chart of query types (A, AAAA, HTTPS, etc.). |
| `upstreams` | `true` | Donut chart of upstream servers. |
| `topDomains` | `true` | Top queried domains. |
| `topBlocked` | `true` | Top blocked domains. |
| `topClients` | `true` | Top active clients. |

```js
pihole: {
  enabled: true,
  url: 'http://192.168.1.100',
  password: 'your-pihole-password',
  blockingToggle: true,
  cards: {
    summary: true,
    queriesOverTime: true,
    queryTypes: true,
    upstreams: true,
    topDomains: true,
    topBlocked: true,
    topClients: true,
  },
},

// At root level:
piholeInterval: 60,
```

#### Ping Monitor (`pingMonitor`)

Measures latency (ms) to external hosts via ICMP ping. In the analytics center, the current ping, average, min, max, and packet loss are displayed per host, along with a combined latency chart.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | `false` → Ping monitor completely disabled. |
| `interval` | `number` | `30` | Ping interval in seconds (minimum: 10). |
| `hosts` | `array` | `[]` | List of hosts to ping. |

Each host has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key (lowercase, no spaces). |
| `name` | `string` | Display name in the frontend. |
| `ip` | `string` | IP address of the host. |

```js
pingMonitor: {
  enabled: true,
  interval: 30,
  hosts: [
    { id: 'google',     name: 'Google DNS',     ip: '8.8.8.8' },
    { id: 'cloudflare', name: 'Cloudflare DNS', ip: '1.1.1.1' },
  ],
},
```

### Email Notifications (`notifications`)

Automatically sends emails on device outages, security events, and suspicious activities. Uses SMTP – works with Gmail, Outlook, or any other SMTP server. Each event can be individually enabled or disabled.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | `true` → Enable email notifications. |
| `cooldownMinutes` | `number` | `5` | Minimum interval in minutes between emails per device and event type. Prevents spam with unstable connections. |
| `from` | `string` | — | Sender address (e.g., `'"Network Manager" <email@gmail.com>'`). |
| `to` | `string` | — | Recipient address. |

#### SMTP Configuration (`notifications.smtp`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | — | SMTP server (e.g., `'smtp.gmail.com'`, `'smtp.office365.com'`). |
| `port` | `number` | `587` | SMTP port. `587` for STARTTLS, `465` for SSL. |
| `secure` | `boolean` | `false` | `false` = connect on port 587, then upgrade to TLS (STARTTLS). `true` = direct encrypted connection on port 465 (SSL/TLS). For Gmail with port 587, `false` is correct – the connection is still encrypted. |
| `user` | `string` | — | SMTP username (email address). |
| `pass` | `string` | — | SMTP password (for Gmail: app password). |

#### Event Filter (`notifications.events`)

Each event can be enabled with `true` or disabled with `false`. This allows, for example, enabling only security emails and disabling uptime emails.

**Device monitoring:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `offline` | `boolean` | `true` | Email when a device goes offline. |
| `online` | `boolean` | `true` | Email when a device comes back online (including downtime). |

**Security events:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `credentialsChanged` | `boolean` | `true` | Email when username or password is changed (including IP address). |
| `totpEnabled` | `boolean` | `true` | Email when 2FA (TOTP) is enabled (including IP + location). |
| `totpDisabled` | `boolean` | `true` | Email when 2FA (TOTP) is disabled (including IP + location). |
| `terminalAccess` | `boolean` | `true` | Email on terminal access (including IP + location). |
| `newDeviceLogin` | `boolean` | `true` | Email on login from new device without device token (including IP + location). |

```js
notifications: {
  enabled: true,
  cooldownMinutes: 5,
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'your.email@gmail.com',
    pass: 'xxxx xxxx xxxx xxxx',   // Gmail app password
  },
  from: '"Network Manager" <your.email@gmail.com>',
  to: 'recipient@example.com',
  events: {
    // Device monitoring
    offline: true,                  // Device offline → email
    online: true,                   // Device back online → email

    // Security events
    credentialsChanged: true,       // Credentials changed
    totpEnabled: true,              // 2FA enabled
    totpDisabled: true,             // 2FA disabled
    terminalAccess: true,           // Terminal opened
    newDeviceLogin: true,           // Login from new device
  },
},
```

> **IP location:** For security events (`totpEnabled`, `totpDisabled`, `terminalAccess`, `newDeviceLogin`), the approximate location of the IP address is determined via `ip-api.com` (free, no API key, max 45 requests/minute). Private/local IPs (e.g., `192.168.x.x`, `10.x.x.x`) are shown as "Local Network" – no external API call is made.

> **Security:** SMTP credentials (`host`, `port`, `user`, `pass`, `secure`) are automatically removed by the server from the public `/config.js` route and are not visible in the frontend.

> **Gmail:** Create an [app password](https://myaccount.google.com/apppasswords) under Google Account → Security → App Passwords. The regular Gmail password does not work with SMTP.

---

### Web Terminal (`terminal`)

Allows executing SSH commands directly in the browser on configured devices. The terminal is secured by TOTP 2FA – without a configured TOTP, the terminal cannot be used.

> **Warning:** The web terminal allows arbitrary SSH commands on configured devices. Only enable if you know what you're doing! Every command is logged in the audit log.

#### Prerequisites

| Prerequisite | Description |
|-------------|-------------|
| `sshpass` | Must be installed on the server (`apt install sshpass` or `brew install sshpass`) |
| `otpauth` + `qrcode` | npm packages, automatically installed with `npm install` |
| TOTP 2FA | Must be set up in settings (user tab) before the terminal is usable |
| SSH credentials | Devices must be configured in `controlDevices` and SSH credentials stored in settings |

#### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Master switch. When `true`, the terminal button appears on the landing page. |
| `totpTimeout` | `number` | `5` | Minutes until a new TOTP entry is required (1–60). |
| `devices` | `array` | `[]` | List of `controlDevice` IDs available in the terminal. Empty = all devices from `controlDevices`. |
| `commandTimeout` | `number` | `30` | Timeout per command in seconds. |
| `dangerousCommands` | `array` | `[...]` | Command patterns that require extra TOTP confirmation. |

```js
terminal: {
  enabled: true,               // Enable terminal
  totpTimeout: 5,              // TOTP session: 5 minutes
  devices: [],                 // Empty = all controlDevices
  commandTimeout: 30,          // 30s timeout per command
  dangerousCommands: [         // Patterns that require extra TOTP
    'rm -rf', 'rm -r', 'mkfs', 'dd if=', 'shutdown', 'reboot',
    'halt', 'poweroff', 'chmod -R 777', 'iptables -F',
    'systemctl stop', 'kill -9', 'pkill', 'wipefs',
  ],
},
```

#### Restricting Devices

By default (`devices: []`), all devices from `controlDevices` are available in the terminal. To only allow specific devices:

```js
terminal: {
  enabled: true,
  devices: ['piholeControl', 'nas'],  // Only these two devices
},
```

#### Dangerous Commands

Commands that contain one of the `dangerousCommands` patterns trigger an additional TOTP prompt before execution. This serves as protection against accidental destructive actions.

#### Setup Guide

1. **Enable terminal:** In `config.js`, set `terminal.enabled: true`
2. **Set up TOTP:** Settings → User Tab → "Set up 2FA"
   - Enter current password
   - Scan QR code with an authenticator app (Google Authenticator, Authy, etc.)
   - Enter 6-digit code to confirm
3. **Use terminal:** Landing Page → Click "Web Terminal"
   - Enter TOTP code → Select device → Execute commands
   - The TOTP session expires after `totpTimeout` minutes

#### Security Measures

| Measure | Detail |
|---------|--------|
| TOTP required | Terminal only usable with configured + confirmed TOTP |
| TOTP rate limiting | Max 5 attempts/minute per IP on all TOTP endpoints |
| TOTP replay protection | Each code can only be used once (90s block) |
| Secret encrypted | AES-256-GCM via `encryptValue()` in `Data/totp.json` |
| Short-lived terminal token | Configurable (default 5 min), only in server memory |
| IP binding | Terminal sessions are bound to the IP |
| Dangerous commands | Configurable pattern list, extra TOTP on match |
| Rate limiting | 20 commands/minute/IP |
| Audit log | Every command logged (console + `Data/terminal-audit.json`) with IP, user, device, command |
| Max 3 sessions | Maximum 3 concurrent terminal sessions per user |
| Output limit | SSH output limited to 1 MB |

#### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/totp/status` | Yes | Query TOTP status (`{ configured: true/false }`). |
| `POST` | `/api/totp/setup` | Yes | Set up TOTP. Body: `{ currentPassword }`. Returns QR code + secret. |
| `POST` | `/api/totp/verify` | Yes | Confirm TOTP setup. Body: `{ code }`. |
| `POST` | `/api/totp/disable` | Yes | Disable TOTP. Body: `{ currentPassword, code }`. |
| `POST` | `/api/terminal/auth` | Yes | Start terminal session. Body: `{ code }`. Returns `terminalToken`. |
| `GET` | `/api/terminal/devices` | Yes + Terminal | List available devices. Header: `X-Terminal-Token`. |
| `POST` | `/api/terminal/execute` | Yes + Terminal | Execute command. Body: `{ deviceId, command, totpCode? }`. Header: `X-Terminal-Token`. |

#### Backward Compatibility

The `terminal` block is **completely optional**. Without `terminal` in the config (or with `enabled: false`), the web terminal is disabled and the button on the landing page is not shown. Existing configurations work without changes.

---

## User Management

### Credentials (`Data/Nutzer`)

Contains username and password (one per line). Default: `admin` / `admin`.

Changes should only be made via the website (Settings → User).

### Login Tokens (`Data/LoginToken.txt`)

Allow login without username/password for trusted devices.

**Format:**
```
# Each line: token|device name
abc123-uuid-here|Max's Laptop
def456-uuid-here|Max's iPhone
```

**Generate token:**

Mac: Double-click `generate-token.command`

Other systems:
```bash
node -e "console.log(require('crypto').randomUUID())"
```

---

## Security

- **Rate limiting** – After 5 failed login attempts, the IP is blocked (5 min, then escalating)
- **Encryption** – SSH passwords and TOTP secrets are stored encrypted with AES-256-GCM
- **TOTP 2FA** – Required for web terminal, with replay protection and rate limiting (5 attempts/min)
- **Terminal audit log** – Every SSH command is logged with IP, user, device, and timestamp
- **Terminal IP binding** – Terminal sessions are bound to the IP address
- **SSH allowlist** – Only predefined commands can be executed via SSH (Control Center)
- **Stats allowlist** – Only predefined read-only commands for device stats allowed (`cat /proc/loadavg`, `nproc`, etc.)
- **Service name validation** – Service names validated against `/^[a-zA-Z0-9_.-]{1,100}$/`, no shell injection possible
- **Service audit logging** – Every service action is logged with IP, service ID, and result
- **Stdout limit** – SSH output for stats limited to 512 KB, terminal to 1 MB (DoS protection)
- **Session timeout** – Automatic logout after inactivity (configurable)
- **Config sandbox** – `config.js` is parsed server-side in an isolated VM
- **Pi-hole proxy** – API calls run server-side, password is never visible in the frontend
- **Blocking rate limit** – DNS blocking can be toggled max 1x per 5 seconds

---

## Speed Test

Measures download (Mbit/s), upload (Mbit/s), and ping (ms) on the local network between browser and server. Optionally, a Raspberry Pi can be configured as a test endpoint (see `PI_SPEEDTEST_SERVER.md`).

The speed test only works over the LAN IP (not via `localhost`).

---

## Credits

Developed by **leminkozey**

GitHub: [https://github.com/leminkozey](https://github.com/leminkozey)

---

If you further develop and publish this website, please give credit to the original developer.
