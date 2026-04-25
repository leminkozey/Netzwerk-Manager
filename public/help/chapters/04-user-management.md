# User Management

Network Manager has a single-user design — there's one admin account, plus optional login tokens for trusted devices. No multi-user roles, no permissions matrix.

## Credentials

Username and password are stored in `Data/Nutzer`, one entry per line. Default after install: `admin` / `admin`.

> **Change the defaults immediately.** The first thing you should do after install is open Settings → User and change both username and password.

The password is hashed with PBKDF2 — what's on disk is the hash, not the plaintext.

### Changing credentials

Always change them through the UI, not by editing the file:

1. Open Settings (gear icon)
2. Switch to the User tab
3. Enter your current password + new credentials
4. Save

If `notifications.events.credentialsChanged` is enabled, you'll receive an email with the IP that performed the change.

## Login tokens

Tokens let trusted devices log in without typing credentials. Useful for the kitchen tablet that auto-loads the dashboard, or your phone on the home WiFi.

### Format

`Data/LoginToken.txt`, one token per line:

```
# Each line: token|device name
abc123-uuid-here|Max's Laptop
def456-uuid-here|Max's iPhone
```

Lines starting with `#` are ignored. The device name is purely cosmetic — it shows up nowhere except this file.

### Generating a token

**macOS:** Double-click `generate-token.command` in the project root.

**Anywhere:**

```bash
node -e "console.log(require('crypto').randomUUID())"
```

Copy the UUID into `Data/LoginToken.txt` with a `|device name` suffix.

### Using a token

Append `?token=<uuid>` to the URL once. The server sets a cookie and you'll skip the login page on that device until the cookie is cleared.

```
http://nm.local/?token=abc123-uuid-here
```

> **Treat tokens like passwords.** Anyone with the URL has full access. Use them only on devices you control.

## Two-Factor Authentication (TOTP)

TOTP is required for the Web Terminal. It's optional for normal login but recommended.

### Setup

1. Settings → User → "Set up 2FA"
2. Enter your current password
3. Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password, Aegis, etc.)
4. Enter the 6-digit code to confirm

The secret is encrypted with AES-256-GCM and stored in `Data/totp.json`.

### Disabling

Settings → User → "Disable 2FA". You need:

- Your current password
- A valid TOTP code

Both are required — no single-factor disable.

### What TOTP protects

| Action | TOTP required? |
|--------|---------------|
| Normal login | No (unless you enable it) |
| Web Terminal access | Yes — always |
| Dangerous command in terminal | Yes — extra prompt mid-session |
| Disabling TOTP | Yes |

If `notifications.events.totpEnabled` / `totpDisabled` is on, you'll get an email with the IP and approximate location for both actions.

## Data Export & Import

Settings → Data → Export downloads a JSON snapshot of:

- Info Center card data (passwords decrypted in transit, stay encrypted in the file via AES key wrap)
- Uptime history
- Outage log
- User settings (theme, accent, language, etc.)

Import takes the same JSON and restores it. Useful for:

- Migrating to a new Pi
- Backing up before a risky update
- Cloning your config to a second instance

## Version History

Every settings change creates a version entry. Settings → Data → Version History shows the timeline with timestamps and diffs. You can revert to any prior version from the list.

This applies to user-facing settings (theme, accent, sections shown). It does **not** version `config.js` — that's a code-level concern, use git.
