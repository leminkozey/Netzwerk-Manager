# Security

Network Manager runs on your home network with SSH credentials and DNS controls — security is not optional. Every layer below is enabled by default unless explicitly noted.

## Authentication

| Mechanism | Detail |
|-----------|--------|
| Password hashing | PBKDF2 (no plaintext anywhere on disk) |
| Login rate limit | 5 failed attempts → IP block 5 min, escalating exponentially |
| Session tokens | HTTP-only cookie, rotated on credential change |
| Session timeout | Configurable in Settings → Session (default off, 1–60 min) |
| Login tokens | UUID-based, optional, allow passwordless login from trusted devices |

### Login tokens

Tokens live in `Data/LoginToken.txt`, one per line:

```
abc123-uuid-here|Max's Laptop
def456-uuid-here|Max's iPhone
```

Generate one with:

```bash
node -e "console.log(require('crypto').randomUUID())"
```

On macOS, double-click `generate-token.command` for the same effect.

## Encryption at rest

Everything sensitive is encrypted with **AES-256-GCM** before hitting disk:

| Field | File | Encrypted |
|-------|------|-----------|
| User passwords | `Data/users.json` | PBKDF2 hash (one-way) |
| SSH passwords | `Data/devices.json` | AES-256-GCM |
| TOTP secrets | `Data/totp.json` | AES-256-GCM |
| Info card password fields | `Data/InfoCards.json` | AES-256-GCM |

The encryption key is derived per-installation. Losing the key means losing decryptable data — back up `Data/` after any meaningful change.

## Web Terminal

The terminal is the highest-risk surface in the app. It gets the strictest controls.

| Layer | Detail |
|-------|--------|
| TOTP 2FA required | Cannot be used without configured + confirmed TOTP |
| Replay protection | Each TOTP code is single-use, 90s block window |
| IP binding | Sessions tied to the originating IP — token theft alone isn't enough |
| Token lifetime | Configurable, default 5 min, kept in server memory only |
| Dangerous command list | Patterns like `rm -rf`, `mkfs`, `dd if=`, `shutdown` trigger an extra TOTP prompt |
| Rate limiting | 20 commands/min/IP, 5 TOTP attempts/min/IP |
| Concurrent sessions | Max 3 per user |
| Output cap | 1 MB per command — DoS guard |
| Audit log | `Data/terminal-audit.json` records IP, user, device, command, timestamp |

### Configurable danger patterns

The default list catches the obvious foot-guns:

```js
dangerousCommands: [
  'rm -rf', 'rm -r', 'mkfs', 'dd if=', 'shutdown', 'reboot',
  'halt', 'poweroff', 'chmod -R 777', 'iptables -F',
  'systemctl stop', 'kill -9', 'pkill', 'wipefs',
],
```

Any command whose text matches one of these patterns prompts for a fresh TOTP code before running.

## Service Management

| Layer | Detail |
|-------|--------|
| Service name validation | Regex `^[a-zA-Z0-9_.-]{1,100}$` — no shell metacharacters |
| Command templates | Commands assembled from fixed templates, never from user input |
| Config sanitization | `service` and `credentialsFrom` are stripped from the public config endpoint |
| Rate limiting | 10 actions/min/IP, 120 status queries/min/IP |
| Audit log | Every action tagged `[SERVICE-AUDIT]` in stdout |

If a service name doesn't pass the regex, the request is rejected before anything reaches `systemctl`/`pm2`/`docker`.

## Server-side hardening

| Layer | Detail |
|-------|--------|
| Config sandbox | `config.js` is parsed in an isolated VM context — it cannot access `process`, `require`, `fs`, etc. |
| SSH allowlist (control center) | Only predefined commands (`shutdown`, `reboot`, `wake`) reach the device |
| SSH allowlist (stats) | Only read-only commands (`cat /proc/loadavg`, `nproc`, `cat /sys/class/thermal/thermal_zone0/temp`) allowed |
| Stdout limit (stats) | 512 KB cap per stats query |
| Pi-hole proxy | API calls run server-side, password never reaches the browser |
| Notify endpoint | `POST /api/notify` is localhost-only and CSRF-exempt |
| DNS toggle rate limit | Pi-hole blocking toggle max 1×/5s |

### Public config sanitization

When the browser fetches `/config.js`, the server strips fields that look like credentials:

- `notifications.smtp.*` (host, port, user, pass, secure)
- Service `service` and `credentialsFrom` references
- Pi-hole `password`

Anything starting with the word `password` in `infoCenter.fields` with `password: true` is also kept server-side.

## CSRF and CORS

- All mutating routes require a valid session cookie + matching CSRF token (sent as `X-CSRF-Token` header)
- The localhost notify endpoint is the **only** CSRF-exempt route, and it's bound to `127.0.0.1` so external requests can't reach it
- CORS is locked to same-origin; the API is not designed for cross-origin use

## What you should still do

- Run behind a reverse proxy with TLS (Caddy, nginx). The app speaks plain HTTP by design.
- Don't expose port 5055 to the public internet. Use a Cloudflare Tunnel, Tailscale, or a VPN.
- Rotate the admin password after first install (default is `admin`/`admin`).
- Keep `Data/` backed up — losing the encryption material loses your encrypted secrets too.
