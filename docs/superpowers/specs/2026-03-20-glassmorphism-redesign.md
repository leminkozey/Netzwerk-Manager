# Netzwerk Manager — Glassmorphism Redesign

**Date:** 2026-03-20
**Scope:** CSS-only rewrite (style.css + help.css). No HTML/JS changes.
**Design System:** Identical to Berichtsheft v2 glassmorphism.

## Design Tokens

**Fonts:** Outfit (body, 400-800) + Space Mono (labels, terminal, 400/700)
**Primary gradient:** #7c5ce0 → #5b8def
**Background:** Animated gradient mesh + floating blobs + noise overlay

**Light:** `linear-gradient(145deg, #e4e0f8, #dce4fb, #f0e8f6, #e0ecfa)`
**Dark:** `linear-gradient(145deg, #13111c, #170f28, #0f1525, #151122)`

**Glass surfaces:** backdrop-filter blur(24px), white borders, inner shadows
**Status:** Green (online), Yellow (warning), Red (offline), Purple (accent)

## Key Decisions

1. **Landing Hero:** Glass panel with gradient text, animated blobs behind
2. **Glow slider → Glass intensity:** Controls blur strength + glass opacity
3. **Terminal:** Full glass (semi-transparent bg + blur), text-shadow for readability
4. **Speedtest gauge:** Glass ring, gradient stroke, glow on value
5. **All existing CSS class selectors stay the same** — pure visual swap

## Migration

Replace all CSS custom properties. Map old → new:
- `--bg` → gradient mesh
- `--surface-*` → glass variables
- `--accent` → purple gradient
- `--text-*` → new text hierarchy
- `--glow-strength` → `--glass-intensity` (same slider, different effect)
