# Control Center

The Control Center provides remote control of devices (Wake-on-LAN, shutdown, restart), service/container management, and Pi-hole DNS blocking toggle.

## Device Control

Devices that can be remotely controlled. SSH credentials are configured per device in the settings and stored encrypted on the server.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key (lowercase, no spaces). |
| `name` | `string` | Display name in the frontend. |
| `icon` | `string` | Icon for the device. |
| `type` | `string` | SSH type: `'ssh-windows'` or `'ssh-linux'`. |
| `ip` | `string` | IP address of the device. |
| `actions` | `array` | Available actions: `'wake'`, `'restart'`, `'shutdown'`. |
| `show` | `boolean \| object` | Controls visibility (see below). |

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
],
```

## Visibility (`show`)

Controls where a device is displayed: in the Control Center (as a tile) and/or in the Web Terminal.

| Value | Control Center | Web Terminal | Description |
|-------|:-:|:-:|-------------|
| not set | Yes | Yes | Default — visible everywhere. |
| `show: true` | Yes | Yes | Explicitly visible everywhere. |
| `show: false` | No | No | Hidden everywhere. Useful as SSH credential source. |
| `show: { controlCenter: false, terminal: true }` | No | Yes | Only in Web Terminal. |
| `show: { controlCenter: true, terminal: false }` | Yes | No | Only as tile. |

## WOL Schedule

Automatic startup (Wake-on-LAN) and shutdown (SSH) at scheduled times. Configured directly in the `controlDevices` entry.

> **Important:** The server must be running for schedules to execute.

```js
{
  id: 'windowspc',
  name: 'Windows PC',
  // ...
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
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | `boolean` | Enable or disable the schedule. |
| `days` | `array` | Weekdays: `'mon'`, `'tue'`, `'wed'`, `'thu'`, `'fri'`, `'sat'`, `'sun'`. |
| `time` | `string` | Time in 24-hour format, e.g. `'07:30'`. |

### Prerequisites

| Action | Prerequisite |
|--------|-------------|
| `wake` | MAC address must be configured in settings. |
| `shutdown` | SSH credentials must be configured in settings. |

### Frontend Display

In the Control Center, the next scheduled action is shown under each device:
- **Today 07:30** — next execution is today
- **Tomorrow 18:00** — next execution is tomorrow
- **Wed 07:30** — weekday for more distant dates

## Service / Container Management

Start, stop, and restart services from the Control Center. Supports three types:

| Type | Tool | Example |
|------|------|---------|
| `systemd` | `systemctl` | Linux system services |
| `pm2` | `pm2` | Node.js processes |
| `docker` | `docker` | Docker containers |

### Configuration

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique key. |
| `name` | `string` | Display name. |
| `icon` | `string` | Icon for the service. |
| `type` | `string` | `'systemd'`, `'pm2'`, or `'docker'`. |
| `service` | `string` | Exact unit/process/container name. |
| `host` | `string \| object` | `'local'` or `{ credentialsFrom: '<id>' }` for SSH remote. |

### Local vs. Remote

**Local** (`host: 'local'`): Commands executed directly on the server.

**Remote** (`host: { credentialsFrom: '<id>' }`): Commands executed via SSH. The `credentialsFrom` references a `controlDevices` entry.

> **Tip:** Set `show: false` on the referenced device to hide it from the Control Center while still using its SSH credentials.

```js
services: [
  {
    id: 'netzwerk-manager',
    name: 'Network Manager',
    icon: 'serverColor',
    type: 'systemd',
    service: 'netzwerk-manager',
    host: 'local',
  },
  {
    id: 'lemin-kanban',
    name: 'Lemin Kanban',
    icon: 'serverColor',
    type: 'pm2',
    service: 'lemin-kanban',
    host: { credentialsFrom: 'piholeControl' },
  },
],
```

### Service Commands

**systemd:** `sudo systemctl start|stop|restart <service>`

**pm2:** `pm2 start|stop|restart <service>`

**docker:** `docker start|stop|restart <service>`

### Frontend

Services are displayed as tiles with Start (green), Restart (accent), and Shutdown (red) buttons. A status badge shows the current state (Active, Stopped, Error, Unknown). Status is updated every 10 seconds.
