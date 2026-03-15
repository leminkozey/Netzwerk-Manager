# Getting Started

Network Manager is a web application for managing, documenting, and controlling your local network.

## Features

- **Configurable Info Center** – Define custom sections, cards, and fields via config (tables + info cards with password encryption, copy buttons, and links)
- **Port Documentation** – Label switch and router ports (which cable goes where)
- **Speed Test** – Measure download, upload, and ping on the local network
- **Device Info / Uptime Monitoring** – Monitor devices via ping with live status, optionally CPU load, RAM, and temperature via SSH or locally
- **Control Center** – Control devices via Wake-on-LAN, SSH shutdown, and SSH restart
- **Service / Container Management** – Start, stop, and restart systemd services, PM2 processes, and Docker containers (locally and remotely via SSH)
- **WOL Schedule** – Automatic startup and shutdown of devices on a configurable schedule (cron-based)
- **Pi-hole DNS Analytics** – Statistics, top domains, and query history directly in the dashboard
- **Pi-hole Blocking Toggle** – Pause and resume DNS blocking with one click
- **Web Terminal** – Execute SSH commands directly in the browser (TOTP 2FA required)
- **Email Notifications** – Automatic emails on device outages and security events via SMTP
- **Data Export/Import** – Full backup as JSON
- **Multi-Language** – German and English
- **Theming** – Dark, light, and system theme with customizable accent color
- **Ping Monitor** – Latency measurement to external hosts with live chart and statistics
- **Remote Update** – Update directly from the settings with configurable commands

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- A web browser
- `sshpass` installed on the server (only needed for web terminal and SSH-based features)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create configuration:
   ```bash
   cp public/config.example.js public/config.js
   ```
4. Customize `public/config.js` (see the Configuration chapters)
5. Start the server:
   ```bash
   node server.js
   ```
6. Open in browser: `http://localhost:5055`

> **Tip:** Always copy `config.example.js` as a starting point. It contains all available options with detailed comments and sensible example values. Then adjust IPs, passwords, and devices to match your network.

> **Updates:** When pulling new versions, `config.example.js` may change (new features, new options). After an update, compare your `config.js` with the current `config.example.js` and adopt new sections as needed. Your `config.js` will not be overwritten by updates.
