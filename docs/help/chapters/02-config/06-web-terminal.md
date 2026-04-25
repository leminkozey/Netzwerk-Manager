# Web Terminal

Execute SSH commands directly in the browser on configured devices. The terminal is secured by TOTP 2FA — without a configured TOTP, the terminal cannot be used.

> **Warning:** The web terminal allows arbitrary SSH commands on configured devices. Only enable if you know what you're doing!

## Prerequisites

| Prerequisite | Description |
|-------------|-------------|
| `sshpass` | Must be installed on the server (`apt install sshpass`) |
| TOTP 2FA | Must be set up in settings before the terminal is usable |
| SSH credentials | Devices must be configured in `controlDevices` with SSH credentials |

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Master switch. When `true`, the terminal button appears. |
| `totpTimeout` | `number` | `5` | Minutes until a new TOTP entry is required (1–60). |
| `devices` | `array` | `[]` | List of `controlDevice` IDs. Empty = all devices. |
| `commandTimeout` | `number` | `30` | Timeout per command in seconds. |
| `dangerousCommands` | `array` | `[...]` | Patterns that require extra TOTP confirmation. |

```js
terminal: {
  enabled: true,
  totpTimeout: 5,
  devices: [],
  commandTimeout: 30,
  dangerousCommands: [
    'rm -rf', 'rm -r', 'mkfs', 'dd if=', 'shutdown', 'reboot',
    'halt', 'poweroff', 'chmod -R 777', 'iptables -F',
    'systemctl stop', 'kill -9', 'pkill', 'wipefs',
  ],
},
```

## Restricting Devices

By default, all devices from `controlDevices` are available. To only allow specific devices:

```js
terminal: {
  enabled: true,
  devices: ['piholeControl', 'nas'],
},
```

## Dangerous Commands

Commands matching a `dangerousCommands` pattern trigger an additional TOTP prompt before execution. This protects against accidental destructive actions.

## Setup Guide

1. **Enable terminal:** In `config.js`, set `terminal.enabled: true`
2. **Set up TOTP:** Settings → User Tab → "Set up 2FA"
   - Enter current password
   - Scan QR code with an authenticator app (Google Authenticator, Authy, etc.)
   - Enter 6-digit code to confirm
3. **Use terminal:** Landing Page → Click "Web Terminal"
   - Enter TOTP code → Select device → Execute commands
   - The TOTP session expires after `totpTimeout` minutes

## Security Measures

| Measure | Detail |
|---------|--------|
| TOTP required | Terminal only usable with configured + confirmed TOTP |
| TOTP rate limiting | Max 5 attempts/minute per IP |
| TOTP replay protection | Each code can only be used once (90s block) |
| Secret encrypted | AES-256-GCM in `Data/totp.json` |
| Short-lived token | Configurable (default 5 min), only in server memory |
| IP binding | Terminal sessions are bound to the IP |
| Dangerous commands | Extra TOTP on pattern match |
| Rate limiting | 20 commands/minute/IP |
| Audit log | Every command logged with IP, user, device, command |
| Max 3 sessions | Maximum 3 concurrent terminal sessions per user |
| Output limit | SSH output limited to 1 MB |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/totp/status` | Query TOTP status. |
| `POST` | `/api/totp/setup` | Set up TOTP (requires `currentPassword`). |
| `POST` | `/api/totp/verify` | Confirm TOTP setup (requires `code`). |
| `POST` | `/api/totp/disable` | Disable TOTP (requires `currentPassword` + `code`). |
| `POST` | `/api/terminal/auth` | Start terminal session (requires `code`). |
| `GET` | `/api/terminal/devices` | List available devices (requires terminal token). |
| `POST` | `/api/terminal/execute` | Execute command (requires terminal token). |
