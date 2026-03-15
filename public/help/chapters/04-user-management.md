# User Management

## Credentials

Username and password are stored in `Data/Nutzer` (one per line). Default credentials: `admin` / `admin`.

Changes should only be made via the website: **Settings → User Tab**.

## Login Tokens

Allow login without username/password for trusted devices. Stored in `Data/LoginToken.txt`.

**Format:**
```
# Each line: token|device name
abc123-uuid-here|Max's Laptop
def456-uuid-here|Max's iPhone
```

### Generating a Token

**Mac:** Double-click `generate-token.command`

**Other systems:**
```bash
node -e "console.log(require('crypto').randomUUID())"
```

Add the generated UUID to `Data/LoginToken.txt` with a device name.

## Two-Factor Authentication (TOTP)

TOTP 2FA can be set up in **Settings → User Tab → "Set up 2FA"**. Once enabled, it is required for the Web Terminal.

### Setup

1. Enter current password
2. Scan QR code with an authenticator app (Google Authenticator, Authy, etc.)
3. Enter 6-digit code to confirm

### Disabling

TOTP can be disabled in **Settings → User Tab** by entering the current password and a valid TOTP code.

## Data Export/Import

Full backup of all data as JSON is available in **Settings → Data Tab**.

- **Export** — Downloads all data (info cards, uptime history, settings) as a JSON file
- **Import** — Restores data from a previously exported JSON file

## Version History

All changes are automatically versioned and traceable. View the history in **Settings → Data Tab**.
