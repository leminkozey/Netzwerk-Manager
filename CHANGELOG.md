# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.1.0] - 2026-03-20 – 2026-03-21

### Added
- Background image history with thumbnail grid, quick-switch, and delete
- Glassmorphism UI overhaul: cards, modals, AI chat, fab, terminal all use glass surfaces

### Changed
- Single dark mode only (removed light mode)
- Neutral dark glass (20,20,25) instead of purple-tinted surfaces
- Solid #0a0a0a default background (removed presets, gradients, blobs)

### Fixed
- White edge on scroll (overflow-x, bg layer extension, blur edges)
- Scroll glitches from noise overlay and orphaned CSS

## [5.0.0] - 2026-03-15

### Added
- AI Chat assistant with Claude CLI integration
- AI context: feeds device data, port status, network info into prompts
- Background image upload with blur slider
- Web Terminal with TOTP-based 3-minute sessions

### Changed
- Complete UI redesign with glassmorphism

## [4.0.0] - 2026-02-15 – 2026-02-22

### Added
- E-Mail notifications for all network events (device up/down, port changes)
- TOTP two-factor authentication for terminal access
- Control Center: manage systemd services (kiwix, offlinehub, lemin-kanban, whoami)
- SSH-based device actions (reboot, shutdown, wake-on-LAN)
- Notify endpoint (`POST /api/notify`) for external service integration

### Fixed
- SSH connection reliability and timeout handling
- CSRF protection for internal endpoints

## [3.0.0] - 2026-02-07 – 2026-02-14

### Added
- Multi-device support (Windows PC, Pi-Hole, Pi-Server)
- Real-time port scanning via SSH
- Device status monitoring with cron-based health checks
- WebSocket live updates for port changes
- Speed test integration

## [2.0.0] - 2026-02-05 – 2026-02-06

### Added
- Authentication system (PBKDF2 password hashing, session tokens)
- Settings panel with theme, versions, user management, credits
- Version display in footer

## [1.0.0] - 2025-12-28

### Added
- Initial port dashboard with device overview
- Login page
- Basic theming (light/dark)

[Unreleased]: https://github.com/leminkozey/Netzwerk-Manager/compare/v5.1.0...HEAD
[5.1.0]: https://github.com/leminkozey/Netzwerk-Manager/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/leminkozey/Netzwerk-Manager/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/leminkozey/Netzwerk-Manager/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/leminkozey/Netzwerk-Manager/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/leminkozey/Netzwerk-Manager/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/leminkozey/Netzwerk-Manager/releases/tag/v1.0.0
