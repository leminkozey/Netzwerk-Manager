# Lokales Netzwerk Manager

Eine Web-Anwendung zur Verwaltung und Dokumentation deines lokalen Netzwerks.

## Was ist das?

Diese Website hilft dir, den Überblick über dein Heimnetzwerk zu behalten:

- **Switch-Ports** und **Router-Ports** dokumentieren (welches Kabel geht wohin)
- **PiHole-Infos** speichern (IP, Hostname, URLs)
- **Speedport-Infos** speichern (WLAN-Daten, Passwörter)
- **Speed-Test** im lokalen Netzwerk durchführen
- **Versionshistorie** aller Änderungen

## Für wen ist das?

Für jeden, der zu Hause ein Netzwerk mit Switch, Router und evtl. Raspberry Pi (PiHole) betreibt und den Überblick behalten möchte.

## Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 18 oder höher)
- Ein Webbrowser

## Installation

1. Repository herunterladen oder klonen
2. Im Projektordner Dependencies installieren:
   ```bash
   npm install
   ```
3. Server starten:
   ```bash
   node server.js
   ```
4. Im Browser öffnen: `http://localhost:5055`

## Konfiguration

### Data/Nutzer

Diese Datei enthält den aktuellen Benutzernamen und das Passwort (jeweils in einer Zeile):

```
admin
admin
```

**Wichtig:** Diese Datei ist nur zum **Einsehen** gedacht. Änderungen am Benutzernamen oder Passwort müssen über die Website selbst vorgenommen werden (Einstellungen → User).

### Data/LoginToken.txt

Mit Login-Tokens können sich Geräte ohne Benutzername/Passwort anmelden. Das ist praktisch für vertrauenswürdige Geräte.

**Format:**
```
# Jede Zeile: token|Geraetename
abc123-uuid-hier|Beispielgerät von Maxmusterman
def456-uuid-hier|iPhone von Maxmusterman
```

Der senkrechte Strich `|` und der Gerätename dahinter sind optional, helfen aber bei der Übersicht.

**Token erstellen:**

**Mac:**
Doppelklick auf `generate-token.command` - es wird ein Token in der Konsole ausgegeben.

**Andere Systeme:**
Im Terminal ausführen:
```bash
node -e "console.log(require('crypto').randomUUID())"
```

Den generierten Token dann in `Data/LoginToken.txt` eintragen mit einem Geräte-Namen.

## Features

### Port-Verwaltung

Dokumentiere welches Gerät an welchem Port hängt. Jeder Port hat:
- **Belegung**: Was ist angeschlossen?
- **Farbe**: Zur visuellen Unterscheidung

### Einstellungen

Über den Zahnrad-Button oben links erreichst du die Einstellungen:

- **Design**: Theme (Dark/Light) und Button-Stil (Default/Simpel) wählen
- **Daten**: Versionshistorie einsehen + Export/Import
- **Session**: Automatisches Ausloggen nach Inaktivität (einstellbar)
- **User**: Benutzername und Passwort ändern, Logout
- **Credits**: Entwickler-Info und Link zum Repository

### Versionshistorie

Jede Änderung an den Ports, PiHole- oder Speedport-Infos wird automatisch versioniert. Du kannst jederzeit ältere Versionen einsehen (Einstellungen → Daten) und nachvollziehen, was wann geändert wurde.

### Daten exportieren / importieren

Du kannst alle Daten als JSON-Datei sichern und wiederherstellen:

**Export:**
1. Einstellungen → Daten
2. "Daten exportieren" klicken
3. JSON-Datei wird heruntergeladen (enthält alle Einstellungen inkl. Zugangsdaten)

**Import:**
1. Einstellungen → Daten
2. "Daten importieren" klicken
3. JSON-Datei auswählen
4. Bestätigen - Seite lädt neu mit importierten Daten

**Hinweis:** Beim Import werden alle bestehenden Daten überschrieben.

### Sicherheit

- **Rate-Limiting**: Nach 5 falschen Login-Versuchen wird die IP gesperrt (5 Min, dann eskalierend)
- **Session-Timeout**: Automatisches Ausloggen nach Inaktivität (einstellbar in Einstellungen → Session)

### Speed-Test

Der integrierte Speed-Test misst:
- **Download-Geschwindigkeit** (Mbit/s)
- **Upload-Geschwindigkeit** (Mbit/s)
- **Ping** (ms)

Der Test läuft im lokalen Netzwerk zwischen deinem Browser und dem Server. Optional kann ein Raspberry Pi als Test-Gegenstelle konfiguriert werden (siehe `PI_SPEEDTEST_SERVER.md`).

**Hinweis:** Der Speed-Test funktioniert nur, wenn du die Website über die LAN-IP öffnest (nicht über `localhost`).

## Credits

Entwickelt von **leminkozey**

GitHub: [https://github.com/leminkozey](https://github.com/leminkozey)

---

Wenn du diese Website weiterentwickelst und veröffentlichst, gib bitte Credits an den ursprünglichen Entwickler.
