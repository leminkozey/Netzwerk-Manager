# Architecture

## Overview

Netzwerk Manager is a self-hosted network monitoring dashboard. It scans ports on local devices via SSH, monitors device health, sends email notifications, provides a web terminal, and includes an AI chat assistant. Runs on a Raspberry Pi as a systemd service.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 5 (single `server.js`) |
| Frontend | Vanilla HTML/CSS/JS (`public/`) |
| Real-time | WebSocket (ws) |
| Database | JSON files in `Data/` |
| SSH | ssh2 (port scanning, device actions, terminal) |
| Auth | PBKDF2 password hashing + session tokens |
| 2FA | TOTP via otpauth + QR codes |
| Email | Nodemailer (iCloud SMTP) |
| Scheduling | node-cron (health checks, port scans) |
| AI | Claude CLI (spawned subprocess) |

## Structure

```
server.js                    # Monolithic backend (all routes, logic, state)
public/
├── index.html               # Single-page app
├── style.css                # All styles
├── config.js                # Runtime config (gitignored, per-machine)
├── config.example.js        # Config template
└── backgrounds/             # User-uploaded background images
Data/                        # Runtime data (gitignored)
├── users.json               # User accounts
├── devices.json             # Device configurations
├── portHistory.json         # Port scan history
├── sessions.json            # Active sessions
└── ...                      # Other state files
pi-speedtest-server.js       # Speed test endpoint (runs on Pi)
prepare-gif.py               # Landing page GIF preparation script
generate-token.command        # macOS script for token generation
```

## Key Flows

### Port Scanning
1. Cron job triggers scan interval per device
2. SSH connection to device → run port scan command
3. Compare results with last known state
4. On change: WebSocket broadcast to all clients + email notification
5. History stored in `Data/portHistory.json`

### Web Terminal
1. User requests terminal access → TOTP verification required
2. 3-minute session created after valid TOTP code
3. SSH connection opened to target device
4. WebSocket bridges browser ↔ SSH stdin/stdout
5. Session auto-expires after timeout

### AI Chat
1. User message sent via API
2. Device data, port status, network info injected as context
3. Claude CLI spawned with prompt
4. Response streamed back to client

### Notifications
1. Events trigger on: device up/down, port open/close, service changes
2. Email sent via Nodemailer (iCloud SMTP)
3. External services can POST to `/api/notify` (localhost-only)

## Deployment

- Runs on Pi as `netzwerk-manager.service` on port 5055
- Auto-deploy: cron polls `git fetch` every 2 minutes, deploys on new commits
- Config (`public/config.js`) is machine-specific and gitignored
