# SSH Sudo-Passwort Fix

## Problem
Linux-Geräte im Control Center (type: `ssh-linux`) brauchen `sudo` für Shutdown/Restart.
Der Netzwerk Manager schickt per SSH `sudo shutdown -h now` bzw. `sudo reboot`, aber das
SSH-Passwort wird nicht an `sudo` weitergegeben. Auf Geräten ohne passwordless sudo schlägt
der Befehl fehl ("SSH failed").

## Betroffene Stelle
`server.js` — Zeile ~2093:
```js
'ssh-linux': {
  shutdown: 'sudo shutdown -h now',
  restart: 'sudo reboot',
},
```

Und die `sshCommand()`-Funktion (Zeile ~1830), die `sshpass` + `spawn` nutzt.
Das SSH-Passwort ist dort verfügbar als `sshPassword` / `SSHPASS` env var.

## Gewünschtes Verhalten
Shutdown/Restart soll auf Linux-Geräten funktionieren, auch wenn `sudo` ein Passwort verlangt.
Das SSH-Passwort soll als sudo-Passwort wiederverwendet werden (ist in der Regel identisch).

## Lösungsansatz
1. Befehle auf `sudo -S` ändern (`-S` = liest Passwort von stdin)
2. In `sshCommand()` bei Befehlen mit `sudo -S` das Passwort per `sshpass.stdin.write(password + '\n')` pipen
3. Whitelist (`ALLOWED_SSH_COMMANDS`) entsprechend anpassen

## Workaround (aktuell aktiv auf PiHole)
Auf dem PiHole wurde manuell eine Sudoers-Regel gesetzt:
```
# /etc/sudoers.d/pihole-control
pi ALL=(ALL) NOPASSWD: /sbin/shutdown, /sbin/reboot
```
Das muss man auf jedem neuen Linux-Gerät manuell machen — der Code-Fix würde das überflüssig machen.
