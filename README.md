# Network Manager

Self-hosted dashboard to document, monitor, and remote-control devices on your local network. Designed to run on a Raspberry Pi as a single Node.js service on port 5055.

## Quick install

```bash
git clone https://github.com/leminkozey/Netzwerk-Manager.git
cd Netzwerk-Manager
npm install
cp public/config.example.js public/config.js
node server.js
```

Open `http://localhost:5055` and log in with `admin` / `admin`. Change the password under Settings → User immediately.

## What's inside

Port docs, Wake-on-LAN, SSH-based stats and control, Pi-hole DNS analytics, web terminal with TOTP 2FA, email notifications, AI chat with full network context. The full feature list, configuration reference, API docs, and troubleshooting are in the embedded help book.

## Documentation

The full docs ship with the app:

- Run the server, open `http://localhost:5055/help/`
- Or browse the source: [`public/help/chapters/`](public/help/chapters/)

Topics covered:

| Chapter | What's there |
|---------|--------------|
| Getting Started | Install, Pi deploy, where data lives |
| Configuration | Every option in `config.js` (Animations, Landing, Info Center, Control Center, Analytics, Web Terminal, Notifications, AI Chat) |
| Security | Auth, encryption, terminal hardening, sandboxing |
| User Management | Credentials, login tokens, TOTP, export/import |
| Architecture & Deploy | Stack, flows, systemd, auto-deploy via cron |
| API Reference | Every endpoint with auth + CSRF requirements |
| Troubleshooting & FAQ | Common problems and how to fix them |

## License

ISC. Developed by [leminkozey](https://github.com/leminkozey). If you fork and publish, please credit the original.
