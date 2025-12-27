# Repository Guidelines

## Project Structure & Module Organization
- `server.js` hosts the Express API, auth flow, WebSocket session enforcement, and state persistence.
- `public/` contains the frontend (`index.html`, `style.css`, `app.js`).
- `Data/` stores runtime data (`state.json`, `Nutzer`, `LoginToken.txt`).
- `pi-speedtest-server.js` is an optional LAN helper for speed tests.
- Local scripts live in the repo root, e.g. `start-lokales-netzwerk.command`, `update-lokales-netzwerk.command`.
Example: UI assets go in `public/`, server writes to `Data/state.json`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm start` runs the server on `PORT` (default `5055`).
- `npm run dev` runs the server with `NODE_ENV=development`.
- `./start-lokales-netzwerk.command` starts locally on macOS and opens Safari.
- `./update-lokales-netzwerk.command` syncs to the Pi and restarts the service.

## Coding Style & Naming Conventions
- JavaScript (CommonJS) with 2-space indentation.
- `camelCase` for variables/functions; `kebab-case` for filenames.
- Keep API routes under `/api/*`; UI logic stays in `public/app.js`.
- No formatter/linter configured; keep diffs small and readable.

## Testing Guidelines
- No automated tests currently.
- Manual checks: login, port edits, Speedport/Raspberry updates, reload to confirm persistence.
- Speedtest proxy: verify with a non-`localhost` client if the Pi helper is used.

## Commit & Pull Request Guidelines
- No established git history here; use short, imperative commits (e.g., `Fix login flow`).
- PRs should include: summary, affected paths, and screenshots for UI changes.

## Security & Configuration Tips
- Do not commit contents of `Data/` (live credentials and tokens).
- Config via env vars:
  - `PORT=5055` to change the HTTP port.
  - `PI_SPEEDTEST_ENABLED=1` to proxy speedtests.
  - `PI_SPEEDTEST_HOST` and `PI_SPEEDTEST_PORT` to target the helper.
