# Netzwerk Manager

Eine Web-Anwendung zur Verwaltung, Dokumentation und Steuerung deines lokalen Netzwerks.

## Features

- **Port-Dokumentation** – Switch- und Router-Ports beschriften (welches Kabel geht wohin)
- **PiHole-Infos** – IP, Hostname und URLs deines Pi-hole speichern
- **Speedport-Infos** – WLAN-Daten und Passwörter dokumentieren
- **Speed-Test** – Download, Upload und Ping im lokalen Netzwerk messen
- **Uptime Monitoring** – Geräte per Ping überwachen mit Live-Status
- **Control Center** – Geräte per Wake-on-LAN, SSH-Shutdown und SSH-Restart steuern
- **WOL-Zeitplan** – Automatisches Hochfahren und Herunterfahren von Geräten nach konfigurierbarem Zeitplan (Cron-basiert)
- **Pi-hole DNS Analytics** – Statistiken, Top-Domains und Query-Verlauf direkt im Dashboard
- **Pi-hole Blocking Toggle** – DNS-Blocking per Knopfdruck pausieren und fortsetzen
- **Versionshistorie** – Alle Änderungen automatisch versioniert und nachvollziehbar
- **Daten-Export/Import** – Vollständiges Backup als JSON
- **Multi-Language** – Deutsch und Englisch
- **Theming** – Dark, Light und System-Theme mit anpassbarer Akzentfarbe
- **Eigene Willkommensnachrichten** – Begrüßungstexte auf der Landing Page konfigurierbar
- **Landing GIF** – Animiertes Bild über dem Titel, automatisch in der Akzentfarbe eingefärbt (eigene GIFs möglich)
- **Landing Page Buttons** – Info-, Control- und Analysen-Button einzeln ein-/ausblendbar
- **Analysen-Sektionen** – Speedtest, Uptime, Ausfälle, Ping Monitor und Pi-hole einzeln ein-/ausblendbar
- **Pi-hole Ein/Aus** – DNS Analytics komplett per Config deaktivierbar
- **Ping Monitor** – Latenz-Messung zu externen Hosts (z.B. Google DNS, Cloudflare) mit Live-Chart und Statistiken
- **Remote Update** – Automatisches Aktualisieren direkt über die Einstellungen (Credits-Tab) mit konfigurierbaren Befehlen
- **Responsive Outages** – Ausfälle-Card passt sich automatisch an mobile Bildschirme an
- **E-Mail Benachrichtigungen** – Automatische E-Mails bei Geräte-Ausfällen (Offline/Online) via SMTP

## Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 18 oder höher)
- Ein Webbrowser

## Installation

1. Repository klonen
2. Dependencies installieren:
   ```bash
   npm install
   ```
3. Konfiguration erstellen:
   ```bash
   cp public/config.example.js public/config.js
   ```
4. `public/config.js` anpassen (siehe [Konfiguration](#konfiguration))

> **Empfehlung:** Kopiere immer die `config.example.js` als Ausgangspunkt. Sie enthält alle verfügbaren Optionen mit ausführlichen deutschen Kommentaren und sinnvollen Beispielwerten. Passe anschließend IPs, Passwörter und Geräte an dein Netzwerk an.

> **Hinweis bei Updates:** Beim Pullen neuer Versionen kann sich `config.example.js` ändern (neue Features, neue Optionen). Vergleiche nach einem Update deine `config.js` mit der aktuellen `config.example.js` und übernimm neue Abschnitte bei Bedarf. Deine `config.js` wird durch Updates nicht überschrieben, solange sie in `.gitignore` steht.
5. Server starten:
   ```bash
   node server.js
   ```
6. Im Browser öffnen: `http://localhost:5055`

---

## Konfiguration

Die gesamte Konfiguration erfolgt über `public/config.js`. Diese Datei wird beim ersten Start nicht mitgeliefert – kopiere `config.example.js` als Vorlage.

Falls `config.js` fehlt oder nicht geladen werden kann, werden sichere Standardwerte verwendet.

### Animationen (`animations`)

Steuert alle visuellen Animationen der Oberfläche.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `true` | Master-Schalter. Bei `false` werden alle Animationen deaktiviert. |
| `heroGradient` | `boolean` | `true` | Animierter Farbverlauf im Titel auf der Startseite. |
| `fadeIn` | `boolean` | `true` | Einblend-Effekte beim Laden von Cards und Elementen. |
| `modalSlide` | `boolean` | `true` | Slide-Animation beim Öffnen von Modals und Overlays. |
| `panelFade` | `boolean` | `true` | Überblend-Effekt beim Tab-Wechsel in den Einstellungen. |
| `themeSwitcher` | `boolean` | `true` | Animations-Effekte der Theme-Buttons (Sonne/Mond/System). |
| `iconAnimations` | `boolean` | `true` | Hover-Animationen der Icons auf allen Seiten (Analysen, Control Center, Einstellungen, Landing). Uhrzeiger drehen, Tacho schwingt, Warndreieck pulsiert usw. |
| `numberScroll` | `boolean` | `true` | Scroll-Animationen bei Zahlen im Analysen Center. Bei `false` erscheinen alle Zahlen sofort, aber Balken/Charts/Donuts animieren weiterhin. |

Die Einzel-Optionen wirken nur, wenn `enabled: true` ist.

#### Analysen-Animationen (`animations.analysen`)

Granulare Steuerung der Scroll-/Reveal-Animationen pro Sektion im Analysen Center. Jede Option wirkt nur, wenn `enabled: true` ist. Bei `false` wird die jeweilige Sektion sofort im Endzustand angezeigt (keine Observer, keine Transition).

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `speedtest` | `boolean` | `true` | Speedtest Download/Upload/Ping Scroll-Animationen. |
| `uptime` | `boolean` | `true` | Uptime-Cards: Balken-Animation, Prozent-Scroll und Timer-Scroll. |
| `pingMonitor` | `boolean` | `true` | Ping Monitor: Ping-Scroll-Zahlen und Chart-Reveal von links nach rechts. |
| `piholeSummary` | `boolean` | `true` | Pi-hole Summary Cards: Zahlen-Scroll-Animation. |
| `queriesOverTime` | `boolean` | `true` | Queries Bar-Chart: Balken wachsen von unten nach oben. |
| `donuts` | `boolean` | `true` | Donut-Charts (Query Types + Upstreams): Segmente und Legenden-Zahlen. |
| `topLists` | `boolean` | `true` | Top Domains/Blocked/Clients: Balken und Zahlen-Scroll. |

**Hierarchie:**
- `animations.enabled: false` → alle Animationen aus (auch Analysen + Icon-Hover)
- `animations.iconAnimations: false` → alle Icon-Hover-Animationen aus (Uhrzeiger, Tacho, Warndreieck, Buttons usw.)
- `animations.numberScroll: false` → alle Scroll-Zahlen im Analysen Center sofort sichtbar, aber Balken/Charts/Donuts animieren noch
- `animations.analysen.X: false` → nur diese Sektion ohne Animation

```js
animations: {
  enabled: true,
  heroGradient: true,
  fadeIn: true,
  modalSlide: true,
  panelFade: true,
  themeSwitcher: true,
  iconAnimations: true,
  numberScroll: true,
  analysen: {
    speedtest: true,
    uptime: true,
    pingMonitor: true,
    piholeSummary: true,
    queriesOverTime: true,
    donuts: true,
    topLists: true,
  },
},
```

### Design-Defaults (`defaults`)

Standard-Werte für neue Benutzer. Benutzer können diese Werte jederzeit in den Einstellungen überschreiben – die persönlichen Einstellungen werden im `localStorage` des Browsers gespeichert und haben Vorrang.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `theme` | `string` | `'dark'` | Standard-Theme: `'dark'`, `'light'` oder `'system'`. |
| `buttonStyle` | `string` | `'default'` | Button-Stil: `'default'` (mit Rahmen) oder `'simple'` (flach). |
| `language` | `string` | `'de'` | Sprache: `'de'` (Deutsch) oder `'en'` (Englisch). |
| `accentColor` | `string` | `'#00d4ff'` | Akzentfarbe als Hex-Wert. Wird für Buttons, Links und Highlights verwendet. |

```js
defaults: {
  theme: 'dark',
  buttonStyle: 'default',
  language: 'de',
  accentColor: '#00d4ff',
},
```

#### Glow-Effekt (`defaults.glow`)

Leuchtendes Glühen um aktive Elemente und Buttons.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `true` | Glow-Effekt an/aus. |
| `strength` | `number` | `1` | Intensität von `0` (kein Glow) bis `2` (stark). |

```js
glow: {
  enabled: true,
  strength: 1,
},
```

#### Session Timeout (`defaults.sessionTimeout`)

Automatisches Ausloggen nach Inaktivität.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `false` | Timeout an/aus. |
| `minutes` | `number` | `5` | Minuten bis zum automatischen Logout (1–60). |

```js
sessionTimeout: {
  enabled: false,
  minutes: 5,
},
```

### Einstellungen-Sichtbarkeit (`settings`)

Bestimmt, welche Bereiche der Einstellungen für den Benutzer sichtbar sind.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `showSettingsButton` | `boolean` | `true` | Einstellungen-Button (Zahnrad) komplett anzeigen oder verstecken. |

#### Tabs (`settings.tabs`)

| Tab | Default | Beschreibung |
|-----|---------|--------------|
| `design` | `true` | Theme, Akzentfarbe, Button-Stil, Glow-Einstellungen. |
| `analysen` | `true` | Uptime-Daten und Ausfälle zurücksetzen. |
| `daten` | `true` | Versionshistorie, Daten-Export und -Import. |
| `session` | `true` | Session-Timeout konfigurieren. |
| `user` | `true` | Benutzername und Passwort ändern, Logout. |
| Credits | immer | Entwickler-Info. Kann nicht deaktiviert werden. |

```js
settings: {
  showSettingsButton: true,
  tabs: {
    design: true,
    analysen: true,
    daten: true,
    session: true,
    user: true,
  },
},
```

#### Remote Update (`settings.update`)

Ermöglicht das Aktualisieren der Website direkt über die Einstellungen (Credits-Tab). Zeigt den Status "Up to date" oder "Get up to date" an. Bei Klick werden die konfigurierten Befehle nacheinander auf dem Server ausgeführt.

> **Achtung:** Die Befehle werden mit den Rechten des Server-Prozesses ausgeführt. Nur vertrauenswürdige Befehle eintragen! Nach erfolgreichem Update startet der Server sich automatisch neu (systemd/pm2).

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `false` | Update-Funktion im Credits-Tab anzeigen. |
| `commands` | `array` | `[]` | Befehle die nacheinander ausgeführt werden. |

```js
settings: {
  update: {
    enabled: false,
    commands: [
      'git stash',
      'git pull',
      'git stash pop',
    ],
  },
},
```

### Landing Page

#### Landing GIF (`landingGif`, `landingGifSize`)

Zeigt ein animiertes Bild über dem Seitentitel an. Das Bild wird automatisch in der aktuellen Akzentfarbe eingefärbt – egal ob Dark Mode, Light Mode oder eine eigene Farbe.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `landingGif` | `string \| false` | `'landing-gif.png'` | Pfad zum animierten Bild (relativ zu `public/`). `false` = kein GIF. |
| `landingGifSize` | `number` | `200` | Breite und Höhe in Pixel. |

```js
landingGif: 'landing-gif.png',
landingGifSize: 200,
```

##### Eigenes Landing-GIF erstellen

Das GIF wird auf der Seite nicht direkt angezeigt, sondern als CSS-Maske benutzt.
Das bedeutet: die hellen Pixel im GIF bestimmen, wo die Akzentfarbe sichtbar wird.
Dafür muss das GIF zuerst mit einem Script vorbereitet werden.

**1. Ein passendes GIF finden**

Du brauchst ein animiertes GIF mit **hellem/weißem Inhalt auf schwarzem Hintergrund**.

So findest du eins:
- Suche auf Seiten wie [Tenor](https://tenor.com), [GIPHY](https://giphy.com) oder [Pinterest](https://pinterest.com)
  nach z.B. `globe animation black background`, `network animation dark`, `loading animation black`
- Achte darauf, dass das Motiv **weiß/hell** ist und der **Hintergrund schwarz**
- Das Motiv kann alles sein: ein Globus, ein Netzwerk, ein Logo, Partikel, Text, etc.

Beispiel – so sollte das Original-GIF aussehen:
```
┌──────────────────────┐
│ ██████████████████   │  ← Schwarzer Hintergrund
│ ████░░⬜⬜░░█████   │
│ ██░░⬜⬜⬜⬜░░██   │  ← Weißes Motiv (z.B. Globus)
│ ████░░⬜⬜░░█████   │
│ ██████████████████   │
└──────────────────────┘
```

> **Wichtig:** Bunte GIFs oder GIFs mit hellem/weißem Hintergrund funktionieren **nicht**.
> Der Hintergrund muss schwarz (oder sehr dunkel) sein, das Motiv weiß (oder hell).

**2. Python und Pillow installieren (einmalig)**

Das Vorbereitungs-Script braucht Python 3 und die Bibliothek Pillow:

```bash
pip install Pillow
```

**3. GIF mit dem Script vorbereiten**

Im Projektordner (dort wo auch `server.js` und `package.json` liegen) befindet sich
`prepare-gif.py`. **Wichtig:** Starte das Script aus diesem Ordner heraus, sonst
kann es die fertige Datei nicht in `public/` ablegen.

Das Script macht automatisch folgendes:
- Schwarze Pixel → werden transparent
- Weiße/helle Pixel → bleiben als Maske erhalten
- Das GIF wird auf die gewünschte Größe skaliert
- Das Ergebnis wird als APNG (animiertes PNG mit Transparenz) in `public/` gespeichert

Das GIF kann irgendwo auf deinem Computer liegen (Desktop, Downloads, etc.) –
du gibst einfach den Pfad als Argument mit. Das Script muss aber aus dem
Projektordner heraus gestartet werden, damit die fertige Datei in `public/` landet.

```bash
cd /pfad/zum/Netzwerk-Manager

# GIF vom Desktop vorbereiten (Standard 200px):
python3 prepare-gif.py ~/Desktop/mein-gif.gif

# GIF aus Downloads mit eigener Größe (300px):
python3 prepare-gif.py ~/Downloads/animation.gif 300
```

Am Ende gibt das Script aus, was in `config.js` eingetragen werden muss:
```
Fertig: public/mein-gif-prepared.png (1520 KB)

Jetzt in config.js eintragen:
  landingGif: 'mein-gif-prepared.png',
  landingGifSize: 200,
```

**4. In config.js eintragen**

Das Script legt die fertige Datei automatisch in `public/` ab – also dort wo auch
`index.html`, `style.css` und die anderen Website-Dateien liegen. Du musst die
Datei nicht manuell verschieben.

Öffne `public/config.js` und trage den Dateinamen und die Größe ein:

```js
landingGif: 'mein-gif-prepared.png',
landingGifSize: 200,
```

Fertig – beim nächsten Laden der Seite wird das GIF über dem Titel in der aktuellen Akzentfarbe angezeigt.

> **Tipp:** Das Script funktioniert mit jedem Schwarz-Weiß-GIF – egal welches Motiv.
> Es erkennt automatisch helle und dunkle Pixel. Du kannst jederzeit ein anderes GIF
> vorbereiten und den Pfad in `config.js` ändern.

##### Wie funktioniert die Einfärbung?

Das Bild wird nicht direkt angezeigt, sondern als [CSS-Maske](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image) verwendet:

```
┌────────────────────────┐
│ Hintergrund: Akzent-   │  ← Div mit var(--accent)
│ farbe (z.B. #ff6b9d) │
└────────────────────────┘
          ×
┌────────────────────────┐
│ Maske: Dein APNG       │  ← Weiß = sichtbar
│   ░░░⬜⬜⬜░░░        │     Transparent = versteckt
└────────────────────────┘
          =
┌────────────────────────┐
│ Ergebnis:              │  ← Akzentfarbe nur wo
│   ░░░🟪🟪🟪░░░        │     die Maske weiß ist
└────────────────────────┘
```

Dadurch passt sich die Farbe automatisch an, wenn du die Akzentfarbe in den Einstellungen änderst.

#### Buttons (`buttons`)

Navigations-Buttons auf der Landing Page einzeln ein- oder ausblenden. Die Buttons werden immer zentriert dargestellt, egal wie viele aktiv sind.

| Button | Default | Beschreibung |
|--------|---------|--------------|
| `info` | `true` | Info Center Button. |
| `control` | `true` | Control Center Button. |
| `analysen` | `true` | Analysen Center Button. |

```js
buttons: {
  info: true,
  control: true,
  analysen: true,
},
```

#### Header Links (`headerLinks`)

Links erscheinen als Chips unter den Buttons auf der Landing Page. Jeder Link zeigt automatisch das Favicon der Ziel-Website.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `name` | `string` | Anzeigename des Links. |
| `url` | `string` | Vollständige URL (muss mit `http://` oder `https://` beginnen). |

```js
headerLinks: [
  { name: 'Github', url: 'https://github.com/dein-username' },
  { name: 'KanBan', url: 'https://example.com/kanban' },
],
```

#### Willkommensnachrichten (`greetings`)

Eigene Begrüßungstexte auf der Landing Page. Bei jedem Seitenaufruf wird zufällig eine Nachricht angezeigt.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `customOnly` | `boolean` | `false` | `true` = nur eigene Nachrichten, `false` = eingebaute zufällige Nachrichten. |
| `messages` | `array` | `[]` | Liste eigener Willkommensnachrichten. |

- **`customOnly: false`** – Die eingebauten Nachrichten (z.B. "Was steht heute an?", "Bereit loszulegen?") werden verwendet. `messages` wird ignoriert.
- **`customOnly: true`** – Nur die in `messages` eingetragenen Nachrichten werden angezeigt. Ist `messages` leer, wird auf die eingebauten zurückgegriffen.

```js
greetings: {
  customOnly: true,
  messages: [
    'Willkommen im Netzwerk!',
    'Hallo Admin!',
    'Schön dass du da bist.',
  ],
},
```

### Info Center

#### Cards-Sichtbarkeit (`cards`)

Einzelne Info-Cards im Info Center ein- oder ausblenden.

| Card | Default | Beschreibung |
|------|---------|--------------|
| `switch` | `true` | Netzwerk-Switch mit 8 Ports. |
| `router` | `true` | WLAN-Router mit Port-Dokumentation. |
| `pihole` | `true` | Pi-hole DNS-Server Informationen. |
| `speedport` | `true` | Speedport/Router-Zugangsdaten. |
| `speedtest` | `true` | LAN Speed-Test (Download, Upload, Ping). |
| `windowsPc` | `true` | Windows PC / Control Center Steuerung. |

```js
cards: {
  switch: true,
  router: true,
  pihole: true,
  speedport: true,
  speedtest: true,
  windowsPc: true,
},
```

### Control Center

### Uptime Monitoring (`uptimeDevices`, `uptimeInterval`)

Überwacht Geräte im Netzwerk per ICMP-Ping und zeigt den Live-Status im Frontend.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `uptimeInterval` | `number` | `10` | Ping-Intervall in Sekunden. Minimum: 10. |
| `uptimeDevices` | `array` | `[]` | Liste der zu überwachenden Geräte. |

Jedes Gerät hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel (lowercase, keine Leerzeichen). |
| `name` | `string` | Anzeigename im Frontend. |
| `ip` | `string` | IP-Adresse des Geräts im lokalen Netzwerk. |

```js
uptimeInterval: 10,
uptimeDevices: [
  { id: 'router',    name: 'Router',     ip: '192.168.1.1' },
  { id: 'pihole',    name: 'PiHole',     ip: '192.168.1.100' },
  { id: 'windowspc', name: 'Windows PC', ip: '192.168.1.50' },
],
```

### Gerätesteuerung / Control Center (`controlDevices`)

Ermöglicht die Fernsteuerung von Geräten per Wake-on-LAN und SSH. Die SSH-Zugangsdaten (Benutzer, Passwort, Port) und die MAC-Adresse werden pro Gerät in den Einstellungen konfiguriert und verschlüsselt auf dem Server gespeichert.

Jedes Gerät hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel (lowercase, keine Leerzeichen). |
| `name` | `string` | Anzeigename im Frontend. |
| `icon` | `string` | Icon-Name aus `icons.js` (z.B. `'windowsColor'`, `'server'`). |
| `type` | `string` | SSH-Typ: `'ssh-windows'` oder `'ssh-linux'`. Bestimmt welche Befehle für Shutdown/Restart verwendet werden. |
| `ip` | `string` | IP-Adresse des Geräts. |
| `actions` | `array` | Verfügbare Aktionen: `'wake'`, `'restart'`, `'shutdown'`. |

**SSH-Befehle nach Typ:**

| Typ | Shutdown | Restart |
|-----|----------|---------|
| `ssh-windows` | `shutdown /s /t 0` | `shutdown /r /t 0` |
| `ssh-linux` | `sudo shutdown -h now` | `sudo reboot` |

```js
controlDevices: [
  {
    id: 'windowspc',
    name: 'Windows PC',
    icon: 'windowsColor',
    type: 'ssh-windows',
    ip: '192.168.1.50',
    actions: ['wake', 'restart', 'shutdown'],
  },
  {
    id: 'nas',
    name: 'NAS Server',
    icon: 'server',
    type: 'ssh-linux',
    ip: '192.168.1.200',
    actions: ['wake', 'shutdown'],
  },
],
```

### WOL-Zeitplan (`schedule`)

Automatisches Hochfahren (Wake-on-LAN) und Herunterfahren (SSH-Shutdown) von Geräten zu festgelegten Zeiten. Der Zeitplan wird direkt im `controlDevices`-Eintrag als optionaler `schedule`-Block konfiguriert.

> **Wichtig:** Der Server muss laufen, damit Zeitpläne ausgeführt werden. Die Konfiguration erfolgt ausschließlich über `config.js` – eine UI-Bearbeitung ist für eine zukünftige Version geplant.

#### Aufbau

Der `schedule`-Block wird innerhalb eines `controlDevices`-Eintrags platziert:

```js
controlDevices: [
  {
    id: 'windowspc',
    name: 'Windows PC',
    icon: 'windowsColor',
    type: 'ssh-windows',
    ip: '192.168.1.50',
    actions: ['wake', 'restart', 'shutdown'],
    schedule: {
      wake: {
        enabled: true,
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        time: '07:30',
      },
      shutdown: {
        enabled: true,
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        time: '18:00',
      },
    },
  },
],
```

#### Optionen

Jeder Schedule-Eintrag (`wake` und/oder `shutdown`) hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `enabled` | `boolean` | Zeitplan aktivieren (`true`) oder deaktivieren (`false`). |
| `days` | `array` | Wochentage als Kurzform: `'mon'`, `'tue'`, `'wed'`, `'thu'`, `'fri'`, `'sat'`, `'sun'`. |
| `time` | `string` | Uhrzeit im 24-Stunden-Format, z.B. `'07:30'` oder `'18:00'`. |

#### Voraussetzungen

| Aktion | Voraussetzung |
|--------|--------------|
| `wake` | Eine **MAC-Adresse** muss für das Gerät in den Einstellungen konfiguriert sein. Der Server sendet ein Wake-on-LAN Magic Packet an die Broadcast-Adresse. |
| `shutdown` | **SSH-Zugangsdaten** (Benutzer, Passwort, Port) müssen in den Einstellungen konfiguriert sein. Der Server verbindet sich per SSH und führt den Shutdown-Befehl aus. |

#### Funktionsweise

1. **Server-Start:** Der Server liest die `config.js` und erstellt für jeden aktiven Zeitplan einen Cron-Job (basierend auf [`node-cron`](https://www.npmjs.com/package/node-cron)).
2. **Automatische Ausführung:** Zum konfigurierten Zeitpunkt wird die entsprechende Aktion ausgeführt – Wake-on-LAN Paket senden oder SSH-Shutdown-Befehl.
3. **Config-Reload:** Alle 60 Sekunden prüft der Server ob sich die Schedule-Konfiguration geändert hat. Nur bei tatsächlichen Änderungen werden die Cron-Jobs neu erstellt – kein Server-Neustart nötig.
4. **Logging:** Jede Ausführung wird in der Server-Konsole protokolliert:
   ```
   [Scheduler] wake für Windows PC wird ausgeführt (07:30)
   [Scheduler] Wake-on-LAN für Windows PC gesendet (MAC: AA:BB:CC:DD:EE:FF)
   ```

#### Frontend-Anzeige

Im Control Center wird unter jedem Gerät mit aktivem Zeitplan die nächste geplante Aktion angezeigt:

- **Heute 07:30** – wenn die nächste Ausführung heute ist
- **Morgen 18:00** – wenn die nächste Ausführung morgen ist
- **Mi 07:30** – Wochentag bei weiter entfernten Terminen

Die Anzeige aktualisiert sich automatisch alle 60 Sekunden. Geräte ohne Zeitplan zeigen keine zusätzliche Info.

#### API-Endpoint

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| `GET` | `/api/schedules` | Ja | Gibt die nächsten geplanten Aktionen pro Gerät zurück. |

**Response-Format:**
```json
{
  "windowspc": {
    "nextWake": "2026-02-12T07:30:00.000Z",
    "nextShutdown": "2026-02-11T18:00:00.000Z"
  }
}
```

Geräte ohne Zeitplan erscheinen nicht in der Response.

#### Rückwärtskompatibilität

Der `schedule`-Block ist **komplett optional**. Bestehende Konfigurationen ohne `schedule` funktionieren weiterhin ohne Änderung.

---

### Analysen Center

#### Sektionen ein-/ausblenden (`analysen`)

Einzelne Sektionen auf der Analysen-Seite ein- oder ausblenden.

| Sektion | Default | Beschreibung |
|---------|---------|--------------|
| `speedtest` | `true` | Internet-Geschwindigkeit (Speed-Test). |
| `outages` | `true` | Ausfälle-Card (responsiv auf Mobil). |
| `uptime` | `true` | Uptime-Monitoring-Cards. |
| `pingMonitor` | `true` | Ping-Monitor (Latenz-Messung). |
| `pihole` | `true` | Pi-hole DNS Analytics. |

```js
analysen: {
  speedtest: true,
  outages: true,
  uptime: true,
  pingMonitor: true,
  pihole: true,
},
```

#### Pi-hole (`pihole`)

Verbindet sich mit deinem Pi-hole v6 und zeigt DNS-Statistiken im Analysen Center. Zusätzlich kann das DNS-Blocking direkt im Control Center pausiert und fortgesetzt werden.

Der Server liest `url` und `password` aus der Config und kommuniziert serverseitig mit der Pi-hole API. Die Zugangsdaten sind im Frontend nicht sichtbar (`config.js` wird serverseitig mit 403 blockiert).

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `true` | `false` → DNS Analytics komplett deaktiviert (keine API-Calls, keine Anzeige). |
| `url` | `string` | — | Pi-hole Admin URL (z.B. `'http://192.168.1.100'`). |
| `password` | `string` | — | Pi-hole API Passwort. |
| `blockingToggle` | `boolean` | `true` | Blocking-Toggle im Control Center anzeigen. |
| `piholeInterval` | `number` | `60` | Aktualisierungs-Intervall in Sekunden (Minimum 30). Wird auf Root-Ebene gesetzt. |

#### Blocking Toggle

Wenn `blockingToggle: true` (oder nicht gesetzt), erscheint im Control Center eine Pi-hole Tile:

- **Status-Badge** zeigt den aktuellen Blocking-Status (Aktiv / Inaktiv / Offline)
- **Pause-Button** (gelb) deaktiviert das DNS-Blocking
- **Resume-Button** (grün) aktiviert das DNS-Blocking wieder
- Der Status wird alle 15 Sekunden automatisch aktualisiert
- Bei `blockingToggle: false` wird die Tile komplett ausgeblendet
- Wenn Pi-hole nicht erreichbar ist, wird die Tile mit "Offline"-Status angezeigt (ohne Button)
- Schnelles Umschalten wird serverseitig auf max. 1x pro 5 Sekunden limitiert

#### Dashboard-Cards (`pihole.cards`)

Einzelne Cards im Analysen Center ein- oder ausblenden. Deaktivierte Cards werden nicht gerendert und die zugehörigen API-Calls werden nicht ausgeführt.

| Card | Default | Beschreibung |
|------|---------|--------------|
| `summary` | `true` | 4 Summary-Stat-Cards (Queries, Blocked, %, Blocklist). |
| `queriesOverTime` | `true` | Stacked Bar Chart mit Queries über Zeit. |
| `queryTypes` | `true` | Donut-Diagramm der Anfragetypen (A, AAAA, HTTPS, etc.). |
| `upstreams` | `true` | Donut-Diagramm der Upstream-Server. |
| `topDomains` | `true` | Top aufgerufene Domains. |
| `topBlocked` | `true` | Top blockierte Domains. |
| `topClients` | `true` | Top aktive Clients. |

```js
pihole: {
  enabled: true,
  url: 'http://192.168.1.100',
  password: 'dein-pihole-passwort',
  blockingToggle: true,
  cards: {
    summary: true,
    queriesOverTime: true,
    queryTypes: true,
    upstreams: true,
    topDomains: true,
    topBlocked: true,
    topClients: true,
  },
},

// Auf Root-Ebene:
piholeInterval: 60,
```

#### Ping Monitor (`pingMonitor`)

Misst die Latenz (ms) zu externen Hosts per ICMP-Ping. Im Analysen Center werden pro Host der aktuelle Ping, Durchschnitt, Min, Max und Paketverlust angezeigt, zusammen mit einem kombinierten Latenz-Chart.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `true` | `false` → Ping Monitor komplett deaktiviert. |
| `interval` | `number` | `30` | Ping-Intervall in Sekunden (Minimum: 10). |
| `hosts` | `array` | `[]` | Liste der zu pingenden Hosts. |

Jeder Host hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel (lowercase, keine Leerzeichen). |
| `name` | `string` | Anzeigename im Frontend. |
| `ip` | `string` | IP-Adresse des Hosts. |

```js
pingMonitor: {
  enabled: true,
  interval: 30,
  hosts: [
    { id: 'google',     name: 'Google DNS',     ip: '8.8.8.8' },
    { id: 'cloudflare', name: 'Cloudflare DNS', ip: '1.1.1.1' },
  ],
},
```

### E-Mail Benachrichtigungen (`notifications`)

Sendet automatisch E-Mails wenn ein überwachtes Gerät (aus `uptimeDevices`) offline geht oder wieder online kommt. Nutzt SMTP – funktioniert mit Gmail, Outlook oder jedem anderen SMTP-Server.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `false` | `true` → E-Mail-Benachrichtigungen aktivieren. |
| `cooldownMinutes` | `number` | `5` | Mindestabstand in Minuten zwischen E-Mails pro Gerät und Event-Typ. Verhindert Spam bei instabilen Verbindungen. |
| `from` | `string` | — | Absender-Adresse (z.B. `'"Netzwerk Manager" <email@gmail.com>'`). |
| `to` | `string` | — | Empfänger-Adresse. |

#### SMTP-Konfiguration (`notifications.smtp`)

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `host` | `string` | — | SMTP-Server (z.B. `'smtp.gmail.com'`, `'smtp.office365.com'`). |
| `port` | `number` | `587` | SMTP-Port. `587` für STARTTLS, `465` für SSL. |
| `secure` | `boolean` | `false` | `false` = Verbindung auf Port 587, dann Upgrade auf TLS (STARTTLS). `true` = direkt verschlüsselte Verbindung auf Port 465 (SSL/TLS). Für Gmail mit Port 587 ist `false` richtig – die Verbindung ist trotzdem verschlüsselt. |
| `user` | `string` | — | SMTP-Benutzername (E-Mail-Adresse). |
| `pass` | `string` | — | SMTP-Passwort (bei Gmail: App-Passwort). |

#### Event-Filter (`notifications.events`)

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `offline` | `boolean` | `true` | E-Mail senden wenn ein Gerät offline geht. |
| `online` | `boolean` | `true` | E-Mail senden wenn ein Gerät wieder online kommt (inkl. Ausfallzeit). |
| `credentialsChanged` | `boolean` | `true` | E-Mail senden wenn Benutzername oder Passwort geändert werden (inkl. IP-Adresse des Auslösers). |

```js
notifications: {
  enabled: true,
  cooldownMinutes: 5,
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'deine.email@gmail.com',
    pass: 'xxxx xxxx xxxx xxxx',   // Gmail App-Passwort
  },
  from: '"Netzwerk Manager" <deine.email@gmail.com>',
  to: 'empfaenger@example.com',
  events: {
    offline: true,
    online: true,
    credentialsChanged: true,
  },
},
```

> **Sicherheit:** SMTP-Zugangsdaten (`host`, `port`, `user`, `pass`, `secure`) werden vom Server automatisch aus der öffentlichen `/config.js`-Route entfernt und sind im Frontend nicht sichtbar.

> **Gmail:** Erstelle ein [App-Passwort](https://myaccount.google.com/apppasswords) unter Google-Konto → Sicherheit → App-Passwörter. Das normale Gmail-Passwort funktioniert nicht mit SMTP.

---

## Benutzerverwaltung

### Zugangsdaten (`Data/Nutzer`)

Enthält Benutzername und Passwort (je eine Zeile). Standard: `admin` / `admin`.

Änderungen nur über die Website vornehmen (Einstellungen → User).

### Login-Tokens (`Data/LoginToken.txt`)

Ermöglichen Login ohne Benutzername/Passwort für vertrauenswürdige Geräte.

**Format:**
```
# Jede Zeile: token|Gerätename
abc123-uuid-hier|Laptop von Max
def456-uuid-hier|iPhone von Max
```

**Token generieren:**

Mac: Doppelklick auf `generate-token.command`

Andere Systeme:
```bash
node -e "console.log(require('crypto').randomUUID())"
```

---

## Sicherheit

- **Rate-Limiting** – Nach 5 falschen Login-Versuchen wird die IP gesperrt (5 Min, dann eskalierend)
- **Verschlüsselung** – SSH-Passwörter werden mit AES-256-GCM verschlüsselt gespeichert
- **SSH-Allowlist** – Nur vordefinierte Befehle können per SSH ausgeführt werden
- **Session-Timeout** – Automatisches Ausloggen nach Inaktivität (konfigurierbar)
- **Config-Sandbox** – `config.js` wird serverseitig in einer isolierten VM geparst
- **Pi-hole Proxy** – API-Calls laufen serverseitig, Passwort ist im Frontend nie sichtbar
- **Blocking Rate-Limit** – DNS-Blocking kann max. 1x pro 5 Sekunden umgeschaltet werden

---

## Speed-Test

Misst Download (Mbit/s), Upload (Mbit/s) und Ping (ms) im lokalen Netzwerk zwischen Browser und Server. Optional kann ein Raspberry Pi als Test-Gegenstelle konfiguriert werden (siehe `PI_SPEEDTEST_SERVER.md`).

Der Speed-Test funktioniert nur über die LAN-IP (nicht über `localhost`).

---

## Credits

Entwickelt von **leminkozey**

GitHub: [https://github.com/leminkozey](https://github.com/leminkozey)

---

Wenn du diese Website weiterentwickelst und veröffentlichst, gib bitte Credits an den ursprünglichen Entwickler.
