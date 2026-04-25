# Architecture & Deploy

A high-level look at how Network Manager is built, where state lives, and how to ship it onto a Pi.

## Tech stack

| Layer | Tech | Notes |
|-------|------|-------|
| Backend | Node.js + Express 5 | Single `server.js` file (~225 KB) |
| Frontend | Vanilla HTML/CSS/JS | No framework, no build step |
| Real-time | WebSocket (`ws`) | Live port updates, terminal stream |
| Database | JSON files in `Data/` | No SQL, no migrations |
| SSH | `ssh2` | Port scanning, device control, terminal |
| Auth | PBKDF2 + session tokens | Same approach as `/etc/shadow` |
| 2FA | `otpauth` + `qrcode` | Standard TOTP (RFC 6238) |
| Email | Nodemailer | Any SMTP server |
| Scheduling | `node-cron` | Health checks, port scans, WOL schedule |
| AI | Ollama-compatible HTTP API | Server proxies to a local model |

## File layout

```
server.js                    # Backend (routes, logic, state, WS, SSH, cron)
public/
├── index.html               # Single-page app
├── style.css                # All styles
├── config.js                # Runtime config (gitignored)
├── config.example.js        # Config template (committed)
├── help/                    # Embedded help book (this thing)
│   ├── index.html
│   ├── help.css
│   ├── help.js
│   ├── chapters.json
│   └── chapters/
└── backgrounds/             # User-uploaded background images
Data/                        # Runtime state (gitignored)
├── users.json               # Account credentials
├── devices.json             # Device configs + encrypted SSH passwords
├── InfoCards.json           # Info Center field values
├── portHistory.json         # Port scan history
├── totp.json                # Encrypted TOTP secrets
├── sessions.json            # Active sessions
└── terminal-audit.json      # Terminal command log
pi-speedtest-server.js       # Optional: speed-test endpoint for Pi
prepare-gif.py               # Landing GIF preparation script
generate-token.command       # macOS helper: UUID generator
```

## Key flows

### Port scanning

```
cron tick → SSH connect → run scan → diff against last state
        → on change: WS broadcast + email + history append
```

1. `node-cron` triggers per device on the configured interval
2. `ssh2` opens a connection, runs the scan command (`ss -tulpn` or similar)
3. Result is diffed against `Data/portHistory.json`'s last snapshot
4. Any change → broadcast on WS to all open browsers + email if enabled
5. New snapshot appended to history

### Web Terminal

```
landing → /api/terminal/auth (TOTP) → token in memory
       → WS open → ssh2 connection → bridge stdin/stdout
       → audit each command → close on timeout
```

1. User clicks "Web Terminal" → enters TOTP
2. Server validates code, marks it consumed (90s replay block), issues a token bound to the IP
3. Browser opens a WebSocket with the token
4. Server opens an `ssh2` connection to the selected device
5. WS bridges browser ⇄ SSH stdin/stdout
6. Every command is logged to `Data/terminal-audit.json`
7. Session expires after `terminal.totpTimeout` minutes of inactivity

### AI Chat

```
user message → POST /api/ai/chat
            → server appends network context to system prompt
            → server proxies to Ollama /api/chat
            → SSE stream back to browser
```

The browser never reaches the AI server directly — every call goes through Network Manager. This means the AI host can sit on a private LAN without being exposed.

### Notifications

Three trigger sources end up in the same Nodemailer pipeline:

- **Device events** — uptime monitor flips state (offline / online)
- **Security events** — credential change, TOTP enabled/disabled, terminal access, new-device login
- **External services** — `POST /api/notify` from localhost-only callers

External services post to `/api/notify` like this:

```bash
curl -X POST http://127.0.0.1:5055/api/notify \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Backup done","body":"Snapshot 2026-04-24 OK"}'
```

The endpoint is bound to `127.0.0.1` and is CSRF-exempt — it cannot be hit from a browser or off-host.

## Deploy on a Pi

### systemd service

Create `/etc/systemd/system/netzwerk-manager.service`:

```ini
[Unit]
Description=Network Manager
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/srv/netzwerk-manager
ExecStart=/usr/bin/node --max-old-space-size=256 server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now netzwerk-manager
sudo journalctl -u netzwerk-manager -f
```

### Auto-deploy via cron

Pull-based deploys are simpler than webhooks for a home Pi. A 2-minute cron polls git, redeploys on new commits:

```bash
# /srv/netzwerk-manager-webhook/poll-deploy.sh
#!/usr/bin/env bash
set -euo pipefail
cd /srv/netzwerk-manager
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  git reset --hard origin/main
  npm install --production
  sudo systemctl restart netzwerk-manager
  echo "[deploy] $(date -Iseconds) $LOCAL -> $REMOTE"
fi
```

```
*/2 * * * * /srv/netzwerk-manager-webhook/poll-deploy.sh >> /var/log/nm-deploy.log 2>&1
```

### Config on a remote Pi

`public/config.js` is gitignored — it's per-machine. Edit it remotely with `scp`:

```bash
# pull current config
scp piserver@192.168.2.142:/srv/netzwerk-manager/public/config.js ./

# edit locally, push back
scp ./config.js piserver@192.168.2.142:/srv/netzwerk-manager/public/config.js
ssh piserver@192.168.2.142 'sudo systemctl restart netzwerk-manager'
```

## Memory footprint

The default start script caps the V8 heap at 256 MB:

```bash
node --max-old-space-size=256 server.js
```

That's enough for a few dozen monitored devices, hourly Pi-hole stats, and 2-3 active terminal sessions on a Pi 4. Bump it if you have more headroom.

## Public-facing exposure

By default Network Manager listens on `0.0.0.0:5055` over **plain HTTP**. Don't put that on the public internet. Sensible options:

| Approach | Effort | Notes |
|----------|--------|-------|
| LAN-only | Zero | Fine for home use |
| WireGuard / Tailscale | Low | VPN-only access |
| Caddy reverse proxy | Low | Auto-HTTPS via Let's Encrypt |
| Cloudflare Tunnel | Low | No open ports, auth optional |

Whatever route you pick, terminate TLS upstream and let the Node process speak HTTP.
