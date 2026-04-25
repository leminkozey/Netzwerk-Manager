# Troubleshooting & FAQ

Common things that go wrong, and how to fix them.

## Server won't start

### `Cannot find module 'express'`

You haven't run `npm install` yet, or `node_modules/` is stale.

```bash
rm -rf node_modules package-lock.json
npm install
```

### `EADDRINUSE: address already in use :::5055`

Another process is on port 5055.

```bash
# Linux / macOS
lsof -i :5055
kill <pid>

# Or change the port — set PORT=5060 before starting
PORT=5060 node server.js
```

### `Error: ENOENT: no such file or directory, open 'public/config.js'`

You skipped step 3 of the install:

```bash
cp public/config.example.js public/config.js
```

The server will use safe defaults if `config.js` is missing, but having no file at all sometimes trips a permission error depending on the platform.

## Login problems

### Forgot the admin password

Reset it by deleting `Data/users.json` while the server is **stopped**:

```bash
sudo systemctl stop netzwerk-manager
rm Data/users.json
sudo systemctl start netzwerk-manager
```

The next start will recreate it with the default `admin` / `admin`. Log in and immediately set a new password under Settings → User.

> Don't delete `Data/users.json` while the server is running — it'll write the in-memory state back over your delete.

### Locked out by rate limiting

After 5 failed logins, your IP is blocked for 5 minutes. Subsequent failures escalate. Wait it out, or restart the service to clear the in-memory block list.

### TOTP code keeps being rejected

| Cause | Fix |
|-------|-----|
| Server clock drift | Run `sudo systemctl restart systemd-timesyncd` (Pi) or check `timedatectl status` |
| Replay block | Each code is single-use, blocked for 90s — wait for the next code |
| Wrong account in authenticator app | Check the issuer label matches your hostname |

## Web Terminal

### Terminal button doesn't appear

Check three things:

1. `terminal.enabled: true` in `config.js`
2. TOTP is configured under Settings → User
3. At least one device exists in `controlDevices`

### `sshpass: command not found`

Install it on the **server** (not the device you're SSHing to):

```bash
# Debian / Ubuntu / Pi OS
sudo apt install sshpass

# macOS (via Homebrew)
brew install hudochenkov/sshpass/sshpass
```

### `Permission denied (publickey,password)`

The SSH credentials in Settings → Devices don't match. Test manually:

```bash
ssh user@device-ip
```

If that fails too, the issue is on the device side (sshd config, password expired, etc.), not Network Manager.

### Commands hang and time out

Default `terminal.commandTimeout` is 30s. Long-running commands like `apt upgrade` will hit this. Either bump the timeout in `config.js`, or wrap the command:

```bash
nohup apt upgrade -y > /tmp/upgrade.log 2>&1 &
```

## Pi-hole integration

### "Pi-hole offline" but the admin UI works

Likely Pi-hole v5 — the integration targets v6's `/api/auth` flow. Upgrade Pi-hole, or disable the integration with `pihole.enabled: false`.

### Authentication errors

| Cause | Fix |
|-------|-----|
| Wrong URL | Use the bare admin URL, e.g. `http://192.168.1.100`, not `http://192.168.1.100/admin` |
| Wrong password | Pi-hole password = the one you set during install, not your SSH password |
| HTTPS with self-signed cert | The proxy doesn't bypass cert errors — use HTTP on the LAN, or fix the cert |

### Stats are stale

Default `piholeInterval` is 60s. Lower it (minimum 30s) if you want fresher numbers, but the Pi-hole API rate-limits aggressive polling.

## Email Notifications

### Mails never arrive

Walk through the checklist:

1. `notifications.enabled: true`?
2. SMTP credentials correct? Test from the server with `swaks` or a Python one-liner
3. The relevant `events.X: true`?
4. `cooldownMinutes` not eating your test emails? It's per-device + per-event-type
5. Check the server logs — Nodemailer errors are loud

### Gmail rejects the connection

You're using your normal Gmail password. Doesn't work.

1. Enable 2FA on your Google account
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an app password named "Network Manager"
4. Paste the 16-character app password into `notifications.smtp.pass`

### `Greeting never received`

Wrong port + secure combination.

| Port | `secure` | Mode |
|------|----------|------|
| 587 | `false` | STARTTLS — most providers |
| 465 | `true` | Direct SSL/TLS |
| 25 | `false` | Plain, almost never works |

## AI Chat

### Status is red

The server can't reach the AI host. Check:

```bash
curl http://<ollamaHost>:<ollamaPort>/api/tags
```

If that fails from the Pi, fix routing/firewall first. The browser doesn't talk to the AI — only the server does.

### Status is yellow

Connectivity works but the model name doesn't exist on the AI server. Run `ollama list` on the AI host and check the exact name. `qwen2.5:7b` is not the same as `qwen2.5-7b`.

### Responses are slow

7B models on a CPU-only Pi are not going to be fast. Move the AI server to a machine with a GPU, or pick a smaller model.

## Wake-on-LAN

### `wake` doesn't power on the device

Magic-packet WOL needs both ends configured:

| Where | What |
|-------|------|
| BIOS / UEFI | "Wake on LAN" / "Power on by PCIe" enabled |
| OS network adapter | "Wake on Magic Packet" enabled (Windows) or `ethtool -s ethX wol g` (Linux) |
| Router | WOL packets allowed on the LAN (default yes, sometimes blocked on guest VLANs) |
| Network Manager | MAC address configured in Settings → Devices |

Try sending the magic packet manually with `wakeonlan` to isolate where it breaks.

## Speed Test

### "Speed Test only works over LAN"

The speed test compares browser ⇄ server bandwidth. Over `localhost` everything is in-process, so the result is meaningless. Open the dashboard via the LAN IP (`http://192.168.x.x:5055`) and try again.

### Speed numbers don't match my ISP

The local speed test measures **LAN** speed, not internet. A gigabit LAN with a 50/10 internet line will still report ~940 Mbit/s — that's working as designed.

## Performance / Memory

### Server keeps OOM-killing on the Pi

The default heap cap is 256 MB:

```json
"start": "node --max-old-space-size=256 server.js"
```

If you have many devices, frequent port scans, and active terminal sessions, you may hit it. Bump it:

```bash
node --max-old-space-size=512 server.js
```

### Frontend feels sluggish

Disable animations in Settings → Design, or set `animations.enabled: false` in `config.js`. Saves a noticeable amount on low-end Pi displays.

## Updates

### `git pull` clobbered my config

It can't — `public/config.js` is gitignored. If you're seeing new defaults, you accidentally committed `config.js` at some point. Move it to `config.local.js`, restore the gitignore behavior, and you're good.

### Auto-deploy isn't picking up new commits

Check the cron log:

```bash
tail -f /var/log/nm-deploy.log
```

Common issues:

- Working tree dirty — local changes block `git pull`. Stash them or revert
- `npm install` failing — check Node version
- systemd restart failing — `sudo journalctl -u netzwerk-manager -n 50`

## Help Book

### Help book shows the wrong content after an update

Hard-refresh the page (Cmd+Shift+R / Ctrl+Shift+F5). The `help.js` and CSS get cached aggressively.

### Update the embedded help book to the latest release

```bash
bash public/help/update             # latest
bash public/help/update v2.4.0      # pin a version
```

Your `chapters/` and `chapters.json` are never touched. Code files (`index.html`, `help.css`, `help.js`, `logo.svg`, `update`) are snapshotted to `public/help/.help-book-backup/` before being overwritten.

## Where to file bugs

[github.com/leminkozey/Netzwerk-Manager/issues](https://github.com/leminkozey/Netzwerk-Manager/issues)

Include:

- Network Manager version (Settings → Credits)
- Node.js version (`node -v`)
- The relevant snippet from `journalctl -u netzwerk-manager -n 100`
- Your `config.js` with credentials redacted
