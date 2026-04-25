# Email Notifications

Automatically sends emails on device outages, security events, and suspicious activities. Uses SMTP — works with Gmail, Outlook, or any other SMTP server.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | `true` → Enable email notifications. |
| `cooldownMinutes` | `number` | `5` | Minimum interval between emails per device/event. |
| `from` | `string` | — | Sender address. |
| `to` | `string` | — | Recipient address. |

## SMTP Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | `string` | — | SMTP server (e.g. `'smtp.gmail.com'`). |
| `port` | `number` | `587` | Port: `587` for STARTTLS, `465` for SSL. |
| `secure` | `boolean` | `false` | `true` for port 465, `false` for port 587. |
| `user` | `string` | — | SMTP username (email address). |
| `pass` | `string` | — | SMTP password (for Gmail: app password). |

> **Gmail:** Create an app password at Google Account → Security → App Passwords. The regular Gmail password does not work with SMTP.

## Event Filter

Each event can be individually enabled (`true`) or disabled (`false`).

### Device Monitoring

| Event | Default | Description |
|-------|---------|-------------|
| `offline` | `true` | Email when a device goes offline. |
| `online` | `true` | Email when a device comes back online (with downtime). |

### Security Events

| Event | Default | Description |
|-------|---------|-------------|
| `credentialsChanged` | `true` | Username or password changed. |
| `totpEnabled` | `true` | 2FA was enabled. |
| `totpDisabled` | `true` | 2FA was disabled. |
| `terminalAccess` | `true` | Web terminal was opened (with IP + location). |
| `newDeviceLogin` | `true` | Login from new device (with IP + location). |

## Example

```js
notifications: {
  enabled: true,
  cooldownMinutes: 5,
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'your.email@gmail.com',
    pass: 'xxxx xxxx xxxx xxxx',
  },
  from: '"Network Manager" <your.email@gmail.com>',
  to: 'recipient@example.com',
  events: {
    offline: true,
    online: true,
    credentialsChanged: true,
    totpEnabled: true,
    totpDisabled: true,
    terminalAccess: true,
    newDeviceLogin: true,
  },
},
```

## IP Location

For security events, the approximate location of the IP address is determined via `ip-api.com` (free, no API key). Private/local IPs (e.g. `192.168.x.x`) are shown as "Local Network" — no external API call is made.

## Security

SMTP credentials (`host`, `port`, `user`, `pass`, `secure`) are automatically removed by the server from the public config route and are not visible in the frontend.
