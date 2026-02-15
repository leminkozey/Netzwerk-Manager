# Netzwerk Manager

Eine Web-Anwendung zur Verwaltung, Dokumentation und Steuerung deines lokalen Netzwerks.

## Features

- **Konfigurierbares Info Center** – Eigene Sektionen, Cards und Felder per Config definieren (Tabellen + Info-Cards mit Passwort-Verschlüsselung, Copy-Buttons und Links)
- **Port-Dokumentation** – Switch- und Router-Ports beschriften (welches Kabel geht wohin)
- **PiHole-Infos** – IP, Hostname und URLs deines Pi-hole speichern
- **Speedport-Infos** – WLAN-Daten und Passwörter dokumentieren
- **Speed-Test** – Download, Upload und Ping im lokalen Netzwerk messen
- **Geräte Info / Uptime Monitoring** – Geräte per Ping überwachen mit Live-Status, optional CPU-Last, RAM und Temperatur per SSH oder lokal
- **Control Center** – Geräte per Wake-on-LAN, SSH-Shutdown und SSH-Restart steuern
- **Service / Container Management** – systemd-Dienste, PM2-Prozesse und Docker-Container starten, stoppen und neu starten (lokal und remote per SSH)
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
- **Web Terminal** – SSH-Befehle direkt im Browser auf konfigurierten Geräten ausführen (TOTP-2FA Pflicht)
- **TOTP 2-Faktor-Authentifizierung** – Einrichtbar in den Einstellungen, Pflicht für das Web Terminal, mit QR-Code-Setup und Replay-Schutz

## Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 18 oder höher)
- Ein Webbrowser
- `sshpass` auf dem Server installiert (nur für Web Terminal und SSH-basierte Features nötig)

## Installation

1. Repository klonen
2. Dependencies installieren:
   ```bash
   npm install
   ```
   Für das Web Terminal werden zusätzlich `otpauth` und `qrcode` benötigt (sind in `package.json` enthalten und werden mit `npm install` automatisch installiert).
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

#### Konfigurierbares Layout (`infoCenter`)

Das Info Center kann vollständig über die Config definiert werden. Du bestimmst welche Sektionen, Cards und Felder angezeigt werden – komplett ohne Code-Änderungen.

Wenn `infoCenter` in der Config vorhanden ist, wird das dynamische Rendering verwendet. Ohne `infoCenter` greift das Legacy-Rendering (die alten fest verdrahteten Cards).

##### Aufbau

`infoCenter` ist ein Array von **Sektionen**. Jede Sektion enthält eine Überschrift, ein Layout und ein Array von Cards:

```js
infoCenter: [
  {
    heading: 'Netzwerkgeräte',    // Sektions-Überschrift
    layout: 'double',             // 'double' = 2 Cards nebeneinander, 'single' = volle Breite
    cards: [ ... ],               // Array von Card-Definitionen
  },
],
```

##### Sektions-Optionen

| Option | Typ | Beschreibung |
|--------|-----|--------------|
| `heading` | `string` | Überschrift der Sektion. |
| `layout` | `string` | `'double'` = Cards paarweise im 2-Spalten-Grid. `'single'` = jede Card volle Breite. |
| `cards` | `array` | Array von Card-Definitionen (siehe unten). |

Bei `layout: 'double'` und ungerader Card-Anzahl wird die letzte Card allein (volle Breite) dargestellt.

##### Card-Typen

Es gibt zwei Card-Typen: **Table** und **Info**.

###### Table Card (`type: 'table'`)

Für tabellarische Daten wie Port-Belegungen. Jede Zeile hat ein Text-Eingabefeld und einen Farb-Picker.

```js
{
  id: 'switch',                   // Eindeutige ID (lowercase, keine Leerzeichen)
  title: 'Switch (8 Ports)',      // Anzeigename
  icon: 'switchColor',            // Icon (eingebaut, URL oder Iconify)
  type: 'table',
  columns: {
    label: 'Port',                // Spaltenname links
    input: 'Belegung',            // Spaltenname Mitte
    inputPlaceholder: 'Nicht belegt',  // Platzhalter wenn leer
    color: 'Farbe',               // Spaltenname rechts
  },
  rows: [
    { id: 'port1', label: 'Port 1' },
    { id: 'port2', label: 'Port 2' },
    // ...
  ],
}
```

| Option | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel für die Datenspeicherung. |
| `title` | `string` | Überschrift der Card. |
| `icon` | `string` | Icon-Name (siehe [Icons](#icons)). |
| `columns` | `object` | Spaltennamen für die Tabelle. |
| `columns.label` | `string` | Name der linken Spalte (Zeilenbeschriftung). |
| `columns.input` | `string` | Name der mittleren Spalte (Texteingabe). |
| `columns.inputPlaceholder` | `string` | Platzhaltertext für leere Eingabefelder. |
| `columns.color` | `string` | Name der rechten Spalte (Farbauswahl). |
| `rows` | `array` | Array von Zeilen mit `id` und `label`. |

###### Info Card (`type: 'info'`)

Für Formular-Felder wie IP-Adressen, Passwörter und URLs. Unterstützt Passwort-Verschlüsselung, Copy-Buttons und klickbare Links.

```js
{
  id: 'pihole',
  title: 'PiHole',
  icon: 'raspberryColor',
  type: 'info',
  fields: [
    { key: 'hostname',    label: 'Hostname' },
    { key: 'ipAddress',   label: 'LAN IP' },
    { key: 'sshPassword', label: 'SSH-Passwort', password: true },
    { key: 'model',       label: 'Modell',       copy: false },
    { key: 'piholeUrl',   label: 'Admin URL' },
  ],
  links: [
    { label: 'Pi-hole Admin', linkField: 'piholeUrl' },
  ],
}
```

**Feld-Optionen:**

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `key` | `string` | — | Interner Schlüssel für die Datenspeicherung. Muss eindeutig innerhalb der Card sein. |
| `label` | `string` | — | Anzeigename des Feldes im UI. |
| `password` | `boolean` | `false` | `true` = Wert wird als Passwort-Feld angezeigt (verdeckt) mit Eye-Toggle. Wird auf dem Server mit AES-256-GCM verschlüsselt gespeichert. |
| `copy` | `boolean` | `true` | `true` = Copy-Button neben dem Feld anzeigen. `false` = kein Copy-Button. Nützlich für Felder die man selten kopieren muss (z.B. Modell, Notizen). |

**Link-Optionen:**

| Option | Typ | Beschreibung |
|--------|-----|--------------|
| `label` | `string` | Button-Text des Links. |
| `linkField` | `string` | Referenziert ein Feld per `key`. Der eingegebene Wert wird als URL für den Link-Button verwendet. Ist das Feld leer, wird der Button ausgegraut. |

##### Datenspeicherung

Card-Daten werden in `Data/InfoCards.json` gespeichert (nicht in `state.json`). Bei der ersten Aktivierung von `infoCenter` werden bestehende Daten aus `state.json` automatisch migriert (Switch-Ports, Router-Ports, PiHole-Info, Speedport-Info).

##### API-Endpunkte

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| `GET` | `/api/info-card/:cardId` | Ja | Daten einer Card laden. Passwort-Felder werden entschlüsselt zurückgegeben. |
| `POST` | `/api/info-card/:cardId` | Ja | Daten einer Card speichern. Passwort-Felder werden verschlüsselt gespeichert. Feld-Keys und Row-IDs werden gegen die Config validiert. |

##### Vollständiges Beispiel

```js
infoCenter: [
  {
    heading: 'Netzwerkgeräte',
    layout: 'double',
    cards: [
      {
        id: 'switch',
        title: 'Switch (8 Ports)',
        icon: 'switchColor',
        type: 'table',
        columns: { label: 'Port', input: 'Belegung', inputPlaceholder: 'Nicht belegt', color: 'Farbe' },
        rows: [
          { id: 'port1', label: 'Port 1' },
          { id: 'port2', label: 'Port 2' },
          { id: 'port3', label: 'Port 3' },
          { id: 'port4', label: 'Port 4' },
        ],
      },
    ],
  },
  {
    heading: 'Services',
    layout: 'double',
    cards: [
      {
        id: 'pihole',
        title: 'PiHole',
        icon: 'raspberryColor',
        type: 'info',
        fields: [
          { key: 'model',       label: 'Modell',       copy: false },
          { key: 'hostname',    label: 'Hostname' },
          { key: 'ipAddress',   label: 'LAN IP' },
          { key: 'sshPassword', label: 'SSH-Passwort', password: true },
          { key: 'piholeUrl',   label: 'Admin URL' },
        ],
        links: [
          { label: 'Pi-hole Admin', linkField: 'piholeUrl' },
        ],
      },
    ],
  },
  {
    heading: 'Clients',
    layout: 'single',
    cards: [
      {
        id: 'windowsPc',
        title: 'Windows PC',
        icon: 'windowsColor',
        type: 'info',
        fields: [
          { key: 'hostname',  label: 'Hostname' },
          { key: 'ipAddress', label: 'IP-Adresse' },
        ],
      },
    ],
  },
],
```

##### Rückwärtskompatibilität

Der `infoCenter`-Block ist **komplett optional**. Ohne `infoCenter` in der Config werden die alten fest verdrahteten Cards (Switch, Router, PiHole, Speedport, Windows PC) unverändert angezeigt. Bestehende Daten werden beim ersten Hinzufügen von `infoCenter` automatisch migriert.

#### Legacy: Cards-Sichtbarkeit (`cards`)

Wenn `infoCenter` **nicht** verwendet wird, können die alten Cards einzeln ein-/ausgeblendet werden:

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

Das Control Center bietet Fernsteuerung von Geräten (Wake-on-LAN, Shutdown, Restart), Service/Container-Management (systemd, PM2, Docker) und Pi-hole DNS-Blocking-Toggle. Alle Funktionen werden über die `config.js` konfiguriert.

### Geräte Info / Uptime Monitoring (`uptimeDevices`, `uptimeInterval`, `statsInterval`)

Überwacht Geräte im Netzwerk per ICMP-Ping und zeigt den Live-Status im Frontend. Optional können CPU-Last, RAM-Auslastung und Temperatur pro Gerät angezeigt werden.

**Ping und Stats laufen in getrennten Zyklen**, damit der Online-Status häufig aktualisiert wird, ohne die Stats-Abfrage (SSH-Verbindungen) unnötig oft auszuführen.

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `uptimeInterval` | `number` | `10` | Ping-Intervall in Sekunden (Online/Offline-Status). Minimum: 10. |
| `statsInterval` | `number` | `60` | Stats-Intervall in Sekunden (CPU/RAM/Temperatur). Minimum: 30. |
| `uptimeDevices` | `array` | `[]` | Liste der zu überwachenden Geräte. |

Jedes Gerät hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel (lowercase, keine Leerzeichen). |
| `name` | `string` | Anzeigename im Frontend. |
| `ip` | `string` | IP-Adresse des Geräts im lokalen Netzwerk. |
| `stats` | `object` | **Optional.** Aktiviert CPU/RAM/Temperatur-Anzeige. Ohne `stats` werden die klassischen 24h/7d Uptime-Balken angezeigt. |

#### Stats-Konfiguration (`stats`)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `type` | `string` | `'local'` für den lokalen Server oder `'ssh-linux'` für SSH-Abfrage. |
| `credentialsFrom` | `string` | ID eines Control-Devices. Die SSH-Zugangsdaten werden daraus wiederverwendet (kein Duplizieren von Passwörtern). |
| `credentials` | `object` | Alternative zu `credentialsFrom`: Inline-Zugangsdaten `{ sshUser, sshPassword, sshPort }`. Passwörter werden beim Serverstart automatisch verschlüsselt. |

**Drei Varianten:**

```js
uptimeDevices: [
  // 1. Ohne Stats → klassische 24h/7d Uptime-Balken
  { id: 'router', name: 'Router', ip: '192.168.1.1' },

  // 2. Stats via SSH (Credentials aus Control Center wiederverwenden)
  {
    id: 'pihole', name: 'PiHole', ip: '192.168.1.100',
    stats: {
      type: 'ssh-linux',
      credentialsFrom: 'piholeControl',
    },
  },

  // 3. Stats via SSH (eigene Inline-Credentials)
  {
    id: 'nas', name: 'NAS', ip: '192.168.1.200',
    stats: {
      type: 'ssh-linux',
      credentials: { sshUser: 'admin', sshPassword: 'password', sshPort: 22 },
    },
  },

  // 4. Lokaler Server (liest /proc direkt, kein SSH nötig)
  { id: 'localhost', name: 'Pi Server', ip: '127.0.0.1', stats: { type: 'local' } },
],
```

#### Angezeigte Stats

| Metrik | Quelle | Anzeige |
|--------|--------|---------|
| **CPU-Last** | `/proc/loadavg` + `nproc` | Balken mit Prozent, fließender Farbverlauf grün → gelb → rot |
| **RAM** | `/proc/meminfo` | Balken mit GB-Anzeige (z.B. "0.4/0.9 GB"), fließender Farbverlauf |
| **Temperatur** | `/sys/class/thermal/thermal_zone0/temp` | Balken mit °C-Wert, fließender Farbverlauf |

Alle drei Metriken zeigen einen **fließenden Farbverlauf** von grün (niedrig) über gelb (mittel) bis rot (hoch) — kein hartes Umschalten, sondern stufenlose Interpolation.

- Stats werden nur im RAM gehalten (flüchtig, nicht persistiert)
- Stats werden in einem **eigenen Zyklus** abgefragt (`statsInterval`, default 60s), getrennt vom Ping-Zyklus (`uptimeInterval`, default 10s)
- Geräte ohne `stats`-Property zeigen weiterhin die klassischen 24h/7d Uptime-Balken
- Offline-Geräte zeigen keine Stats an

### Gerätesteuerung / Control Center (`controlDevices`)

Ermöglicht die Fernsteuerung von Geräten per Wake-on-LAN und SSH. Die SSH-Zugangsdaten (Benutzer, Passwort, Port) und die MAC-Adresse werden pro Gerät in den Einstellungen konfiguriert und verschlüsselt auf dem Server gespeichert.

Jedes Gerät hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel (lowercase, keine Leerzeichen). |
| `name` | `string` | Anzeigename im Frontend. |
| `icon` | `string` | Icon für das Gerät. Unterstützt drei Formate (siehe [Icons](#icons)). |
| `type` | `string` | SSH-Typ: `'ssh-windows'` oder `'ssh-linux'`. Bestimmt welche Befehle für Shutdown/Restart verwendet werden. |
| `ip` | `string` | IP-Adresse des Geräts. |
| `actions` | `array` | Verfügbare Aktionen: `'wake'`, `'restart'`, `'shutdown'`. |
| `show` | `boolean` | **Optional.** `true` (Standard) = Tile im Control Center anzeigen. `false` = Gerät wird im UI versteckt, bleibt aber als SSH-Quelle für Remote-Services (`credentialsFrom`) nutzbar. |

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
  // Nur als SSH-Quelle für Remote-Services – keine Tile im Control Center
  {
    id: 'piholeControl',
    name: 'Pi-hole Server',
    icon: 'raspberryColor',
    type: 'ssh-linux',
    ip: '192.168.1.100',
    actions: ['shutdown'],
    show: false,
  },
],
```

> **Tipp:** Mit `show: false` kannst du ein Gerät als reine SSH-Credential-Quelle verwenden, ohne dass es als Tile im Control Center erscheint. Die SSH-Zugangsdaten werden trotzdem in den Einstellungen konfiguriert und können von Remote-Services über `credentialsFrom` referenziert werden.

#### Icons

Überall wo `icon:` verwendet wird (z.B. in `controlDevices`), werden drei Formate unterstützt:

**1. Eingebaute Icons** – Name aus `icons.js`:
```js
icon: 'windowsColor',
icon: 'raspberryColor',
icon: 'server',
```

**2. Direkte URL** – Beliebiges SVG/PNG per Link:
```js
icon: 'https://svgl.app/library/raspberry_pi.svg',
icon: 'https://cdn.simpleicons.org/pihole',
```

> **Hinweis:** SVGL-URLs (`svgl.app/library/...`) werden automatisch auf die funktionierende CDN-URL umgeleitet – du brauchst nur die kurze URL einzutragen.

**3. Iconify-Format** – `prefix:name` aus dem [Iconify](https://iconify.design/)-Ökosystem:
```js
icon: 'logos:raspberry-pi',
icon: 'devicon:windows11-original',
icon: 'simple-icons:raspberrypi',
```

Alle verfügbaren Iconify-Icons findest du unter [icon-sets.iconify.design](https://icon-sets.iconify.design/).

**Icon-Quellen:**

| Quelle | Beschreibung | Link |
|--------|--------------|------|
| **Iconify** | 200.000+ Icons aus 150+ Sets, per `prefix:name` nutzbar | [iconify.design](https://iconify.design/) · [Suche](https://icon-sets.iconify.design/) |
| **SVGL** | Kuratierte Sammlung bunter Brand-SVGs (Tech-Logos) | [svgl.app](https://svgl.app/) · [GitHub](https://github.com/pheralb/svgl) |
| **Simple Icons** | 3.000+ Marken-Logos als SVG, per CDN mit Farbe | [simpleicons.org](https://simpleicons.org/) · [GitHub](https://github.com/simple-icons/simple-icons) |

> **Tipp:** Für bunte, originalgetreue Logos eignen sich SVGL oder Iconify-Sets wie `logos:` und `devicon:`. Simple Icons liefert einfarbige Logos, die per URL-Parameter eingefärbt werden können (z.B. `https://cdn.simpleicons.org/raspberrypi/red`).

---

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

### Service / Container Management (`services`)

Ermöglicht das Starten, Stoppen und Neu-Starten von Diensten direkt über das Control Center. Unterstützt drei Service-Typen:

| Typ | Tool | Beispiel |
|-----|------|----------|
| `systemd` | `systemctl` | Linux-Systemdienste (nginx, netzwerk-manager, etc.) |
| `pm2` | `pm2` | Node.js-Prozesse die mit PM2 verwaltet werden |
| `docker` | `docker` | Docker-Container |

Services können **lokal** oder **remote per SSH** gesteuert werden.

#### Konfiguration

Jeder Service hat folgende Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `string` | Eindeutiger Schlüssel (lowercase, keine Leerzeichen). |
| `name` | `string` | Anzeigename im Frontend. |
| `icon` | `string` | Icon für den Service (siehe [Icons](#icons)). |
| `type` | `string` | Service-Typ: `'systemd'`, `'pm2'` oder `'docker'`. |
| `service` | `string` | Exakter Name des systemd-Units / PM2-Prozesses / Docker-Containers. |
| `host` | `string \| object` | `'local'` für lokale Ausführung oder `{ credentialsFrom: '<id>' }` für Remote-Ausführung per SSH. |

#### Lokal vs. Remote

**Lokale Services** (`host: 'local'`):
- Befehle werden direkt auf dem Server ausgeführt (kein SSH)
- Voraussetzung: Das entsprechende Tool muss installiert sein (`systemctl`, `pm2` oder `docker`)

**Remote Services** (`host: { credentialsFrom: '<id>' }`):
- Befehle werden per SSH auf einem entfernten Gerät ausgeführt
- `credentialsFrom` referenziert die `id` eines Eintrags in `controlDevices`
- Die SSH-Zugangsdaten (Benutzer, Passwort, Port) und die IP-Adresse werden aus dem referenzierten Control-Device übernommen
- Das Control-Device muss in den Einstellungen konfigurierte SSH-Credentials haben
- Das Tool (`systemctl`, `pm2`, `docker`) muss auf dem Remote-Gerät installiert sein

> **Tipp:** Wenn du das Remote-Gerät nicht als Tile im Control Center sehen willst, setze `show: false` im `controlDevices`-Eintrag. Das Gerät dient dann nur als SSH-Credential-Quelle.

#### Beispiel

```js
services: [
  // Lokaler systemd-Dienst
  {
    id: 'netzwerk-manager',
    name: 'Netzwerk Manager',
    icon: 'serverColor',
    type: 'systemd',
    service: 'netzwerk-manager',
    host: 'local',
  },
  // PM2-Prozess auf Remote-Server (SSH-Daten aus controlDevices)
  {
    id: 'lemin-kanban',
    name: 'Lemin Kanban',
    icon: 'serverColor',
    type: 'pm2',
    service: 'lemin-kanban',
    host: { credentialsFrom: 'piholeControl' },
  },
  // Docker-Container auf Remote-Server
  {
    id: 'pihole-docker',
    name: 'Pi-hole',
    icon: 'piholeDnsColor',
    type: 'docker',
    service: 'pihole',
    host: { credentialsFrom: 'piholeControl' },
  },
],
```

#### Service-Befehle

Je nach `type` werden folgende Befehle ausgeführt:

**systemd:**

| Aktion | Befehl |
|--------|--------|
| Start | `sudo systemctl start <service>` |
| Stop | `sudo systemctl stop <service>` |
| Restart | `sudo systemctl restart <service>` |
| Status | `systemctl is-active <service>` |

**pm2:**

| Aktion | Befehl |
|--------|--------|
| Start | `pm2 start <service>` |
| Stop | `pm2 stop <service>` |
| Restart | `pm2 restart <service>` |
| Status | `pm2 jlist` (JSON-Ausgabe, Prozess wird nach Name gesucht) |

**docker:**

| Aktion | Befehl |
|--------|--------|
| Start | `docker start <service>` |
| Stop | `docker stop <service>` |
| Restart | `docker restart <service>` |
| Status | `docker inspect -f '{{.State.Status}}' <service>` |

#### Frontend

Im Control Center werden Services als Tiles mit drei Buttons angezeigt:

- **Start** (grün) – Service starten
- **Restart** (Akzentfarbe) – Service neu starten
- **Shutdown** (rot) – Service stoppen

Ein Status-Badge zeigt den aktuellen Zustand:
- **Aktiv** (grün) – Service läuft
- **Gestoppt** (rot) – Service ist gestoppt
- **Fehler** (rot) – Service ist in einem Fehlerzustand
- **Unbekannt** (grau) – Status konnte nicht abgefragt werden (z.B. Host offline)

Der Status wird automatisch alle 10 Sekunden aktualisiert. Nach einer Aktion (Start/Stop/Restart) wird der Status nach 1,5 Sekunden erneut abgefragt.

Ein Typ-Badge (`systemd`, `pm2`, `docker`) zeigt den Service-Typ an.

#### Voraussetzungen

| Ort | Voraussetzung |
|-----|---------------|
| Lokal | Das Tool (`systemctl`, `pm2`, `docker`) muss auf dem Server installiert sein. Für systemd-Dienste muss der Server-Prozess `sudo`-Rechte haben (oder passwortloses `sudo` für `systemctl`). |
| Remote | SSH-Zugangsdaten müssen in den Einstellungen für das referenzierte Control-Device konfiguriert sein. Das Tool muss auf dem Remote-Gerät installiert sein. `sshpass` muss auf dem Server installiert sein. |

#### Sicherheit

- **Service-Name Validierung**: Service-Namen werden gegen `/^[a-zA-Z0-9_.-]{1,100}$/` validiert – Shell-Metazeichen sind nicht möglich
- **Command Templates**: Befehle werden aus festen Templates generiert, nicht aus User-Input zusammengebaut
- **Config-Sanitisierung**: `service` und `credentialsFrom` werden aus der öffentlichen Config entfernt
- **Rate Limiting**: Maximal 10 Aktionen pro Minute und 120 Status-Abfragen pro Minute pro IP
- **Auth Required**: Alle Endpoints erfordern Login
- **Audit Logging**: Jede Aktion wird mit `[SERVICE-AUDIT]` geloggt (IP, Service-ID, Aktion, Ergebnis)

#### API-Endpunkte

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| `GET` | `/api/services/:serviceId/status` | Ja | Status eines Services abfragen. Gibt `{ status: 'running'\|'stopped'\|'error'\|'unknown' }` zurück. |
| `POST` | `/api/services/:serviceId/:action` | Ja | Aktion ausführen (`start`, `stop`, `restart`). Gibt `{ success: true/false, message }` zurück. |

#### Rückwärtskompatibilität

Der `services`-Block ist **komplett optional**. Ohne `services` in der Config wird der Platzhalter "Container & Services" im Control Center angezeigt. Bestehende Konfigurationen funktionieren ohne Änderung.

---

### Analysen Center

#### Sektionen ein-/ausblenden (`analysen`)

Einzelne Sektionen auf der Analysen-Seite ein- oder ausblenden.

| Sektion | Default | Beschreibung |
|---------|---------|--------------|
| `speedtest` | `true` | Internet-Geschwindigkeit (Speed-Test). |
| `outages` | `true` | Ausfälle-Card (responsiv auf Mobil). |
| `uptime` | `true` | Geräte Info / Uptime-Monitoring-Cards. |
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

Sendet automatisch E-Mails bei Geräte-Ausfällen, Sicherheits-Events und verdächtigen Aktivitäten. Nutzt SMTP – funktioniert mit Gmail, Outlook oder jedem anderen SMTP-Server. Jedes Event kann einzeln aktiviert oder deaktiviert werden.

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

Jedes Event kann mit `true` aktiviert oder `false` deaktiviert werden. So lassen sich z.B. nur Sicherheits-Mails aktivieren und Uptime-Mails abschalten.

**Geräte-Monitoring:**

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `offline` | `boolean` | `true` | E-Mail wenn ein Gerät offline geht. |
| `online` | `boolean` | `true` | E-Mail wenn ein Gerät wieder online kommt (inkl. Ausfallzeit). |

**Sicherheits-Events:**

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `credentialsChanged` | `boolean` | `true` | E-Mail wenn Benutzername oder Passwort geändert werden (inkl. IP-Adresse). |
| `totpEnabled` | `boolean` | `true` | E-Mail wenn 2FA (TOTP) aktiviert wird (inkl. IP + Standort). |
| `totpDisabled` | `boolean` | `true` | E-Mail wenn 2FA (TOTP) deaktiviert wird (inkl. IP + Standort). |
| `terminalAccess` | `boolean` | `true` | E-Mail bei Terminal-Zugriff (inkl. IP + Standort). |
| `newDeviceLogin` | `boolean` | `true` | E-Mail bei Login von neuem Gerät ohne Device-Token (inkl. IP + Standort). |

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
    // Geräte-Monitoring
    offline: true,                  // Gerät offline → E-Mail
    online: true,                   // Gerät wieder online → E-Mail

    // Sicherheits-Events
    credentialsChanged: true,       // Zugangsdaten geändert
    totpEnabled: true,              // 2FA aktiviert
    totpDisabled: true,             // 2FA deaktiviert
    terminalAccess: true,           // Terminal geöffnet
    newDeviceLogin: true,           // Login von neuem Gerät
  },
},
```

> **IP-Standort:** Für die Sicherheits-Events (`totpEnabled`, `totpDisabled`, `terminalAccess`, `newDeviceLogin`) wird der ungefähre Standort der IP-Adresse über `ip-api.com` ermittelt (kostenlos, kein API-Key, max 45 Requests/Minute). Private/lokale IPs (z.B. `192.168.x.x`, `10.x.x.x`) werden als "Lokales Netzwerk" angezeigt – es wird kein externer API-Call gemacht.

> **Sicherheit:** SMTP-Zugangsdaten (`host`, `port`, `user`, `pass`, `secure`) werden vom Server automatisch aus der öffentlichen `/config.js`-Route entfernt und sind im Frontend nicht sichtbar.

> **Gmail:** Erstelle ein [App-Passwort](https://myaccount.google.com/apppasswords) unter Google-Konto → Sicherheit → App-Passwörter. Das normale Gmail-Passwort funktioniert nicht mit SMTP.

---

### Web Terminal (`terminal`)

Ermöglicht die Ausführung von SSH-Befehlen direkt im Browser auf konfigurierten Geräten. Das Terminal ist durch TOTP-2FA abgesichert – ohne eingerichteten TOTP kann das Terminal nicht genutzt werden.

> **Achtung:** Das Web Terminal erlaubt beliebige SSH-Befehle auf den konfigurierten Geräten. Nur aktivieren, wenn du weißt was du tust! Jeder Befehl wird im Audit-Log protokolliert.

#### Voraussetzungen

| Voraussetzung | Beschreibung |
|---------------|-------------|
| `sshpass` | Muss auf dem Server installiert sein (`apt install sshpass` bzw. `brew install sshpass`) |
| `otpauth` + `qrcode` | npm-Pakete, werden mit `npm install` automatisch installiert |
| TOTP-2FA | Muss in den Einstellungen (User-Tab) eingerichtet sein, bevor das Terminal nutzbar ist |
| SSH-Credentials | Geräte müssen in `controlDevices` konfiguriert und SSH-Zugangsdaten in den Einstellungen hinterlegt sein |

#### Konfiguration

| Option | Typ | Default | Beschreibung |
|--------|-----|---------|--------------|
| `enabled` | `boolean` | `false` | Master-Schalter. Bei `true` erscheint der Terminal-Button auf der Landing Page. |
| `totpTimeout` | `number` | `5` | Minuten bis eine erneute TOTP-Eingabe nötig ist (1–60). |
| `devices` | `array` | `[]` | Liste von `controlDevice`-IDs die im Terminal verfügbar sind. Leer = alle Geräte aus `controlDevices`. |
| `commandTimeout` | `number` | `30` | Timeout pro Befehl in Sekunden. |
| `dangerousCommands` | `array` | `[...]` | Befehlsmuster die eine Extra-TOTP-Bestätigung erfordern. |

```js
terminal: {
  enabled: true,               // Terminal aktivieren
  totpTimeout: 5,              // TOTP-Session: 5 Minuten
  devices: [],                 // Leer = alle controlDevices
  commandTimeout: 30,          // 30s Timeout pro Befehl
  dangerousCommands: [         // Muster die Extra-TOTP brauchen
    'rm -rf', 'rm -r', 'mkfs', 'dd if=', 'shutdown', 'reboot',
    'halt', 'poweroff', 'chmod -R 777', 'iptables -F',
    'systemctl stop', 'kill -9', 'pkill', 'wipefs',
  ],
},
```

#### Geräte einschränken

Standardmäßig (`devices: []`) sind alle Geräte aus `controlDevices` im Terminal verfügbar. Um nur bestimmte Geräte freizugeben:

```js
terminal: {
  enabled: true,
  devices: ['piholeControl', 'nas'],  // Nur diese beiden Geräte
},
```

#### Dangerous Commands

Befehle die eines der `dangerousCommands`-Muster enthalten, lösen eine zusätzliche TOTP-Abfrage aus bevor sie ausgeführt werden. Dies dient als Schutz vor versehentlichen destruktiven Aktionen.

#### Setup-Anleitung

1. **Terminal aktivieren:** In `config.js` setze `terminal.enabled: true`
2. **TOTP einrichten:** Einstellungen → User-Tab → "2FA einrichten"
   - Aktuelles Passwort eingeben
   - QR-Code mit einer Authenticator-App scannen (Google Authenticator, Authy, etc.)
   - 6-stelligen Code zur Bestätigung eingeben
3. **Terminal nutzen:** Landing Page → "Web Terminal" klicken
   - TOTP-Code eingeben → Gerät auswählen → Befehle ausführen
   - Die TOTP-Session läuft nach `totpTimeout` Minuten ab

#### Sicherheitsmaßnahmen

| Maßnahme | Detail |
|----------|--------|
| TOTP Pflicht | Terminal nur mit konfiguriertem + bestätigtem TOTP nutzbar |
| TOTP Rate-Limiting | Max. 5 Versuche/Minute pro IP auf allen TOTP-Endpoints |
| TOTP Replay-Schutz | Jeder Code kann nur einmal verwendet werden (90s Sperre) |
| Secret verschlüsselt | AES-256-GCM via `encryptValue()` in `Data/totp.json` |
| Terminal-Token kurzlebig | Konfigurierbar (Standard 5 Min), nur in Server-Memory |
| IP-Binding | Terminal-Sessions sind an die IP gebunden |
| Dangerous Commands | Konfigurierbare Pattern-Liste, Extra-TOTP bei Match |
| Rate-Limiting | 20 Commands/Minute/IP |
| Audit-Log | Jeder Befehl geloggt (Konsole + `Data/terminal-audit.json`) mit IP, User, Device, Command |
| Max. 3 Sessions | Maximal 3 gleichzeitige Terminal-Sessions pro User |
| Output-Limit | SSH-Ausgabe auf 1 MB begrenzt |

#### API-Endpunkte

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| `GET` | `/api/totp/status` | Ja | TOTP-Status abfragen (`{ configured: true/false }`). |
| `POST` | `/api/totp/setup` | Ja | TOTP einrichten. Body: `{ currentPassword }`. Gibt QR-Code + Secret zurück. |
| `POST` | `/api/totp/verify` | Ja | TOTP-Setup bestätigen. Body: `{ code }`. |
| `POST` | `/api/totp/disable` | Ja | TOTP deaktivieren. Body: `{ currentPassword, code }`. |
| `POST` | `/api/terminal/auth` | Ja | Terminal-Session starten. Body: `{ code }`. Gibt `terminalToken` zurück. |
| `GET` | `/api/terminal/devices` | Ja + Terminal | Verfügbare Geräte auflisten. Header: `X-Terminal-Token`. |
| `POST` | `/api/terminal/execute` | Ja + Terminal | Befehl ausführen. Body: `{ deviceId, command, totpCode? }`. Header: `X-Terminal-Token`. |

#### Rückwärtskompatibilität

Der `terminal`-Block ist **komplett optional**. Ohne `terminal` in der Config (oder mit `enabled: false`) ist das Web Terminal deaktiviert und der Button auf der Landing Page wird nicht angezeigt. Bestehende Konfigurationen funktionieren ohne Änderung.

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
- **Verschlüsselung** – SSH-Passwörter und TOTP-Secrets werden mit AES-256-GCM verschlüsselt gespeichert
- **TOTP 2FA** – Pflicht für Web Terminal, mit Replay-Schutz und Rate-Limiting (5 Versuche/Min)
- **Terminal Audit-Log** – Jeder SSH-Befehl wird mit IP, User, Device und Timestamp protokolliert
- **Terminal IP-Binding** – Terminal-Sessions sind an die IP-Adresse gebunden
- **SSH-Allowlist** – Nur vordefinierte Befehle können per SSH ausgeführt werden (Control Center)
- **Stats-Allowlist** – Nur vordefinierte Read-Only-Befehle für Device Stats erlaubt (`cat /proc/loadavg`, `nproc`, etc.)
- **Service-Name Validierung** – Service-Namen gegen `/^[a-zA-Z0-9_.-]{1,100}$/` validiert, keine Shell-Injection möglich
- **Service-Audit-Logging** – Jede Service-Aktion wird mit IP, Service-ID und Ergebnis geloggt
- **Stdout-Limit** – SSH-Ausgaben für Stats auf 512 KB, Terminal auf 1 MB begrenzt (DoS-Schutz)
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
