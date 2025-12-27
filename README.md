# Lokales Netzwerk Manager

Eine Web-Anwendung zur Verwaltung und Dokumentation deines lokalen Netzwerks.

## Was ist das?

Diese Website hilft dir, den Ueberblick ueber dein Heimnetzwerk zu behalten:

- **Switch-Ports** und **Router-Ports** dokumentieren (welches Kabel geht wohin)
- **PiHole-Infos** speichern (IP, Hostname, URLs)
- **Speedport-Infos** speichern (WLAN-Daten, Passwoerter)
- **Speed-Test** im lokalen Netzwerk durchfuehren
- **Versionshistorie** aller Aenderungen

## Fuer wen ist das?

Fuer jeden, der zu Hause ein Netzwerk mit Switch, Router und evtl. Raspberry Pi (PiHole) betreibt und den Ueberblick behalten moechte.

## Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 18 oder hoeher)
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
4. Im Browser oeffnen: `http://localhost:5055`

## Konfiguration

### Data/Nutzer

Diese Datei enthaelt den aktuellen Benutzernamen und das Passwort (jeweils in einer Zeile):

```
admin
admin
```

**Wichtig:** Diese Datei ist nur zum **Einsehen** gedacht. Aenderungen am Benutzernamen oder Passwort muessen ueber die Website selbst vorgenommen werden (Abschnitt "Benutzer & Passwort aendern").

### Data/LoginToken.txt

Mit Login-Tokens koennen sich Geraete ohne Benutzername/Passwort anmelden. Das ist praktisch fuer vertrauenswuerdige Geraete.

**Format:**
```
# Jede Zeile: token|Geraetename
abc123-uuid-hier|MacBook von Max
def456-uuid-hier|iPhone von Max
```

**Token erstellen:**

**Mac:**
Doppelklick auf `generate-token.command` - es wird ein Token in der Konsole ausgegeben.

**Andere Systeme:**
Im Terminal ausfuehren:
```bash
node -e "console.log(require('crypto').randomUUID())"
```

Den generierten Token dann in `Data/LoginToken.txt` eintragen mit einem Geraete-Namen.

## Features

### Port-Verwaltung

Dokumentiere welches Geraet an welchem Port haengt. Jeder Port hat:
- **Belegung**: Was ist angeschlossen?
- **Farbe**: Zur visuellen Unterscheidung

### Versionshistorie

Jede Aenderung an den Ports, PiHole- oder Speedport-Infos wird automatisch versioniert. Du kannst jederzeit aeltere Versionen einsehen und nachvollziehen, was wann geaendert wurde.

### Speed-Test

Der integrierte Speed-Test misst:
- **Download-Geschwindigkeit** (Mbit/s)
- **Upload-Geschwindigkeit** (Mbit/s)
- **Ping** (ms)

Der Test laeuft im lokalen Netzwerk zwischen deinem Browser und dem Server. Optional kann ein Raspberry Pi als Test-Gegenstelle konfiguriert werden (siehe `PI_SPEEDTEST_SERVER.md`).

**Hinweis:** Der Speed-Test funktioniert nur, wenn du die Website ueber die LAN-IP oeffnest (nicht ueber `localhost`).

## Credits

Entwickelt von **Manu**

GitHub: [https://github.com/manuguth](https://github.com/manuguth)

---

Wenn du diese Website weiterentwickelst und veroeffentlichst, gib bitte Credits an den urspruenglichen Entwickler.
