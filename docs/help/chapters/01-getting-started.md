# Getting Started

Network Manager is a self-hosted web application for documenting, monitoring, and remote-controlling devices on your local network. It's designed to run on a Raspberry Pi (or any small Linux box) as a single Node.js service on port 5055.

## What you can do with it

- **Document the network** — port assignments on your switch/router, IPs, passwords, WiFi data, all the things you forget after six months
- **Monitor devices** — live ping, CPU, RAM, temperature via SSH or locally
- **Remote control** — Wake-on-LAN, shutdown, restart, scheduled wake/sleep
- **Service management** — start/stop systemd services, PM2 processes, Docker containers (locally and over SSH)
- **Pi-hole integration** — DNS analytics, blocking toggle, query stats
- **Web Terminal** — TOTP-protected SSH shell in the browser
- **Email alerts** — outage notifications, security events
- **AI Chat** — local Ollama model with full network context as a floating widget

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js 18+ | LTS recommended |
| A web browser | Anything modern |
| `sshpass` | Only for web terminal and SSH features (`apt install sshpass` / `brew install sshpass`) |

## Installation

```bash
# 1. Clone
git clone https://github.com/leminkozey/Netzwerk-Manager.git
cd Netzwerk-Manager

# 2. Install
npm install

# 3. Create config from template
cp public/config.example.js public/config.js

# 4. Start
node server.js
```

Open `http://localhost:5055` in your browser. Default credentials are `admin` / `admin` — change them immediately under Settings → User.

> **Tip:** Always start from `config.example.js`. It contains every available option with comments and sane defaults. Tweak IPs, passwords, and devices to match your setup.

## Updates

When you pull a new version, `config.example.js` may have new options. Compare it against your `config.js` and merge in what you need. Your `config.js` is gitignored and never overwritten.

```bash
git pull
npm install         # only if package.json changed
# diff your config.js against config.example.js, port new options over
sudo systemctl restart netzwerk-manager   # or pm2 restart, etc.
```

## Running on a Raspberry Pi

The project ships with a low-memory start option for Pi-class hardware:

```json
"scripts": {
  "start": "node --max-old-space-size=256 server.js"
}
```

Recommended deploy: `systemd` unit named `netzwerk-manager.service` listening on port 5055. Auto-deploy is typically wired up as a cron job that polls `git fetch` every 2 minutes and restarts the service on new commits.

Example systemd unit (`/etc/systemd/system/netzwerk-manager.service`):

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

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable netzwerk-manager
sudo systemctl start netzwerk-manager
sudo journalctl -u netzwerk-manager -f
```

## Where data lives

| Path | What's there | Backed up? |
|------|--------------|-----------|
| `Data/users.json` | Account credentials (PBKDF2-hashed) | Yes via export |
| `Data/devices.json` | Device configs + encrypted SSH passwords | Yes |
| `Data/InfoCards.json` | Info Center field values | Yes |
| `Data/portHistory.json` | Port scan history | Yes |
| `Data/totp.json` | Encrypted TOTP secrets | Yes |
| `Data/sessions.json` | Active sessions | No (transient) |
| `Data/terminal-audit.json` | Audit log of terminal commands | Yes |
| `public/config.js` | Your runtime config | Manual |

The whole `Data/` folder is gitignored. Use Settings → Data → Export for a JSON snapshot.
