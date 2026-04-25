# Analytics Center

## Show/Hide Sections

| Section | Default | Description |
|---------|---------|-------------|
| `speedtest` | `true` | Internet speed (speed test). |
| `outages` | `true` | Outages card. |
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

## Device Info / Uptime Monitoring

Monitors devices via ICMP ping with live status. Optionally CPU load, RAM, and temperature via SSH or locally.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uptimeInterval` | `number` | `10` | Ping interval in seconds (minimum: 10). |
| `statsInterval` | `number` | `60` | Stats interval in seconds (minimum: 30). |
| `uptimeDevices` | `array` | `[]` | List of devices to monitor. |

Each device:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key. |
| `name` | `string` | Display name. |
| `ip` | `string` | IP address. |
| `stats` | `object` | Optional. Enables CPU/RAM/temperature display. |

### Stats Configuration

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `'local'` or `'ssh-linux'`. |
| `credentialsFrom` | `string` | ID of a control device (reuse SSH credentials). |
| `credentials` | `object` | Inline: `{ sshUser, sshPassword, sshPort }`. |

```js
uptimeDevices: [
  // Without stats → classic 24h/7d uptime bars
  { id: 'router', name: 'Router', ip: '192.168.1.1' },

  // Stats via SSH (credentials from Control Center)
  {
    id: 'pihole', name: 'PiHole', ip: '192.168.1.100',
    stats: { type: 'ssh-linux', credentialsFrom: 'piholeControl' },
  },

  // Local server (reads /proc directly)
  { id: 'localhost', name: 'Pi Server', ip: '127.0.0.1', stats: { type: 'local' } },
],
```

### Displayed Stats

| Metric | Source | Display |
|--------|--------|---------|
| **CPU Load** | `/proc/loadavg` + `nproc` | Bar with percentage, color gradient green → yellow → red |
| **RAM** | `/proc/meminfo` | Bar with GB display, color gradient |
| **Temperature** | `/sys/class/thermal/thermal_zone0/temp` | Bar with °C value, color gradient |

- Stats are kept only in RAM (not persisted)
- Offline devices do not show stats
- Devices without `stats` show classic 24h/7d uptime bars

## Pi-hole DNS Analytics

Connects to Pi-hole v6 and shows DNS statistics. The server communicates server-side with the Pi-hole API — credentials are never visible in the frontend.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | `false` → DNS analytics completely disabled. |
| `url` | `string` | — | Pi-hole admin URL. |
| `password` | `string` | — | Pi-hole API password. |
| `blockingToggle` | `boolean` | `true` | Show blocking toggle in Control Center. |
| `piholeInterval` | `number` | `60` | Update interval in seconds (minimum: 30). Set at root level. |

### Blocking Toggle

When `blockingToggle: true`, a Pi-hole tile appears in the Control Center:
- Status badge shows blocking status (Active / Inactive / Offline)
- Pause button (yellow) disables DNS blocking
- Resume button (green) re-enables DNS blocking
- Rapid toggling is limited to max 1x per 5 seconds

### Dashboard Cards

| Card | Default | Description |
|------|---------|-------------|
| `summary` | `true` | 4 summary stat cards (queries, blocked, %, blocklist). |
| `queriesOverTime` | `true` | Stacked bar chart with queries over time. |
| `queryTypes` | `true` | Donut chart of query types. |
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
piholeInterval: 60,
```

## Ping Monitor

Measures latency (ms) to external hosts via ICMP ping. Shows current ping, average, min, max, packet loss, and a combined latency chart.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | `false` → Ping monitor disabled. |
| `interval` | `number` | `30` | Ping interval in seconds (minimum: 10). |
| `hosts` | `array` | `[]` | List of hosts to ping. |

Each host: `id`, `name`, `ip`.

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

## Speed Test

Measures download (Mbit/s), upload (Mbit/s), and ping (ms) on the local network between browser and server.

> The speed test only works over the LAN IP (not via `localhost`).
