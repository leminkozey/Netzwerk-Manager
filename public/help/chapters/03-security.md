# Security

Network Manager implements multiple layers of security to protect your network infrastructure.

## Authentication

- **Rate limiting** — After 5 failed login attempts, the IP is blocked (5 min, then escalating)
- **Session timeout** — Automatic logout after inactivity (configurable)
- **Login tokens** — Allow login without credentials for trusted devices

## Encryption

- **SSH passwords** — Stored encrypted with AES-256-GCM
- **TOTP secrets** — Stored encrypted with AES-256-GCM
- **Info card passwords** — Fields marked with `password: true` are encrypted server-side

## Web Terminal Security

- **TOTP 2FA required** — Terminal only usable with configured + confirmed TOTP
- **TOTP replay protection** — Each code can only be used once (90s block)
- **IP binding** — Terminal sessions are bound to the originating IP
- **Short-lived tokens** — Configurable timeout (default 5 min), only in server memory
- **Dangerous command protection** — Configurable patterns trigger extra TOTP confirmation
- **Rate limiting** — 20 commands/minute/IP, 5 TOTP attempts/minute/IP
- **Audit log** — Every command logged with IP, user, device, command, and timestamp
- **Max 3 sessions** — Maximum 3 concurrent terminal sessions per user
- **Output limit** — SSH output limited to 1 MB

## Service Management Security

- **Service name validation** — Names validated against `/^[a-zA-Z0-9_.-]{1,100}$/` — no shell injection possible
- **Command templates** — Commands generated from fixed templates, not assembled from user input
- **Config sanitization** — `service` and `credentialsFrom` are removed from the public config
- **Rate limiting** — Maximum 10 actions/minute and 120 status queries/minute per IP
- **Audit logging** — Every action logged with `[SERVICE-AUDIT]`

## Server Security

- **Config sandbox** — `config.js` is parsed server-side in an isolated VM
- **Pi-hole proxy** — API calls run server-side, password is never visible in the frontend
- **SSH allowlist** — Only predefined commands for Control Center actions
- **Stats allowlist** — Only predefined read-only commands for device stats
- **Stdout limit** — SSH output for stats limited to 512 KB (DoS protection)
- **Blocking rate limit** — DNS blocking toggle max 1x per 5 seconds
