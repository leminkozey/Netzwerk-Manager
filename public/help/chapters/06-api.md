# API Reference

Every mutating route requires a session cookie + `X-CSRF-Token` header. Read-only routes need only the cookie. The localhost notify endpoint is the one CSRF-exempt route.

## Authentication

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/login` | `{ username, password }` | Returns session cookie. |
| `POST` | `/api/logout` | — | Clears the session. |
| `GET` | `/api/session` | — | Current session info, or 401. |

Login token route:

```
GET /?token=<uuid>
```

Sets the session cookie if the UUID matches a line in `Data/LoginToken.txt`.

## TOTP / 2FA

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/totp/status` | — | `{ configured: boolean }` |
| `POST` | `/api/totp/setup` | `{ currentPassword }` | Returns QR code data URL + base32 secret. |
| `POST` | `/api/totp/verify` | `{ code }` | Confirms the setup. |
| `POST` | `/api/totp/disable` | `{ currentPassword, code }` | Both factors required. |

## Web Terminal

| Method | Path | Body / Headers | Description |
|--------|------|----------------|-------------|
| `POST` | `/api/terminal/auth` | `{ code }` | Returns `terminalToken` (memory only). |
| `GET` | `/api/terminal/devices` | `X-Terminal-Token` | Devices available to this terminal session. |
| `POST` | `/api/terminal/execute` | `{ deviceId, command, totpCode? }` + `X-Terminal-Token` | Runs the command. `totpCode` required if it matches `dangerousCommands`. |

WebSocket upgrade for streaming sessions: `wss://host/ws/terminal?token=<terminalToken>`

## Device Control

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/control/wake` | `{ deviceId }` | Wake-on-LAN magic packet. |
| `POST` | `/api/control/restart` | `{ deviceId }` | SSH `reboot` / `shutdown /r /t 0`. |
| `POST` | `/api/control/shutdown` | `{ deviceId }` | SSH `shutdown -h now` / `shutdown /s /t 0`. |
| `POST` | `/api/control/tailscale-start` | `{ deviceId }` | Windows-only. |
| `POST` | `/api/control/tailscale-stop` | `{ deviceId }` | Windows-only. |

## Service / Container Management

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/services/status` | — | Status for all configured services. |
| `POST` | `/api/services/start` | `{ serviceId }` | `systemctl start` / `pm2 start` / `docker start`. |
| `POST` | `/api/services/stop` | `{ serviceId }` | …`stop`. |
| `POST` | `/api/services/restart` | `{ serviceId }` | …`restart`. |

Rate limits: 10 actions/min/IP, 120 status queries/min/IP.

## Info Center

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/info-card/:cardId` | — | Returns card data with passwords decrypted. |
| `POST` | `/api/info-card/:cardId` | `{ ...fields }` | Saves card data, encrypts password fields. |

## Pi-hole

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/pihole/summary` | — | Server-side proxy to Pi-hole stats. |
| `GET` | `/api/pihole/queries-over-time` | — | Stacked-bar data. |
| `GET` | `/api/pihole/top-domains` | — | Most-queried domains. |
| `GET` | `/api/pihole/top-blocked` | — | Most-blocked domains. |
| `GET` | `/api/pihole/top-clients` | — | Most-active clients. |
| `POST` | `/api/pihole/blocking` | `{ enabled }` | Pause/resume DNS blocking. |

The browser never sees the Pi-hole password — all credentials live server-side.

## Analytics / Uptime

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/uptime/devices` | Live ping status + optional CPU/RAM/temp. |
| `GET` | `/api/uptime/history?id=<deviceId>` | 24h / 7d uptime data. |
| `GET` | `/api/outages` | Recent outages. |
| `POST` | `/api/uptime/reset` | Clears uptime data. |

## Speed Test

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/speedtest/download?bytes=<n>` | Streams `n` bytes. |
| `POST` | `/api/speedtest/upload` | Accepts arbitrary bytes, returns size. |
| `GET` | `/api/speedtest/ping` | Server-time round-trip. |

## AI Chat

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/ai/chat` | `{ messages }` | SSE stream from the local AI server. |
| `GET` | `/api/ai/status` | — | Connectivity + model availability check. |

History is capped at 20 messages per conversation, 2000 chars per message.

## Notifications (external)

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `POST` | `/api/notify` | `{ subject, body }` | Localhost-only, CSRF-exempt. |

Bind external scripts to this endpoint to send mail through Network Manager's SMTP config — useful for backup jobs, cron health checks, etc.

```bash
curl -X POST http://127.0.0.1:5055/api/notify \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Backup OK","body":"Snapshot $(date -Iseconds)"}'
```

## Settings / Updates

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/api/settings` | — | Global settings (theme defaults, etc.). |
| `POST` | `/api/settings` | `{ ...fields }` | Update settings. |
| `POST` | `/api/update/run` | — | Runs `settings.update.commands` sequentially. |
| `GET` | `/api/version` | — | Current `package.json` version. |

## Background images

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/background/upload` | multipart/form-data | Adds to `public/backgrounds/`. |
| `GET` | `/api/background/list` | — | Available background images. |
| `DELETE` | `/api/background/:filename` | — | Removes a background image. |

## CSRF

All mutating routes (`POST`, `PUT`, `DELETE`) require:

```
X-CSRF-Token: <token from /api/csrf>
Cookie: nm_session=<session id>
```

Fetch the token once after login:

```js
const { token } = await fetch('/api/csrf').then(r => r.json())
fetch('/api/info-card/pihole', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  body: JSON.stringify({ /* ... */ }),
})
```

The browser app handles this automatically — only matters if you write your own client.
