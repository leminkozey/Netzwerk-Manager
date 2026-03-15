# General Configuration

All configuration is done via `public/config.js`. If `config.js` is missing or cannot be loaded, safe default values are used.

## Animations

Controls all visual animations of the interface.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Master switch. When `false`, all animations are disabled. |
| `heroGradient` | `boolean` | `true` | Animated color gradient in the title on the landing page. |
| `fadeIn` | `boolean` | `true` | Fade-in effects when loading cards and elements. |
| `modalSlide` | `boolean` | `true` | Slide animation when opening modals and overlays. |
| `panelFade` | `boolean` | `true` | Crossfade effect when switching tabs in settings. |
| `themeSwitcher` | `boolean` | `true` | Animation effects of the theme buttons (sun/moon/system). |
| `iconAnimations` | `boolean` | `true` | Hover animations of icons on all pages. |
| `numberScroll` | `boolean` | `true` | Scroll animations for numbers in the analytics center. |

Individual options only take effect when `enabled: true`.

### Analytics Animations

Granular control per section in the analytics center. Each option only works when `enabled: true`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `speedtest` | `boolean` | `true` | Speedtest download/upload/ping scroll animations. |
| `uptime` | `boolean` | `true` | Uptime cards: bar animation, percent scroll, and timer scroll. |
| `pingMonitor` | `boolean` | `true` | Ping monitor: ping scroll numbers and chart reveal. |
| `piholeSummary` | `boolean` | `true` | Pi-hole summary cards: number scroll animation. |
| `queriesOverTime` | `boolean` | `true` | Queries bar chart: bars grow from bottom to top. |
| `donuts` | `boolean` | `true` | Donut charts: segments and legend numbers. |
| `topLists` | `boolean` | `true` | Top domains/blocked/clients: bars and number scroll. |

**Hierarchy:**
- `animations.enabled: false` → all animations off
- `animations.iconAnimations: false` → all icon hover animations off
- `animations.numberScroll: false` → all scroll numbers instantly visible, but bars/charts/donuts still animate
- `animations.analysen.X: false` → only that section without animation

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

## Design Defaults

Default values for new users. Users can override these in the settings — personal settings are stored in `localStorage` and take priority.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `string` | `'dark'` | Default theme: `'dark'`, `'light'`, or `'system'`. |
| `buttonStyle` | `string` | `'default'` | Button style: `'default'` (with border) or `'simple'` (flat). |
| `language` | `string` | `'de'` | Language: `'de'` (German) or `'en'` (English). |
| `accentColor` | `string` | `'#00d4ff'` | Accent color as hex value. |
| `borderRadius` | `number` | `1` | Corner rounding: `0` (sharp), `1` (default), `2` (round). |

### Glow Effect

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `glow.enabled` | `boolean` | `true` | Glow effect on/off. |
| `glow.strength` | `number` | `1` | Intensity from `0` (no glow) to `2` (strong). |

### Session Timeout

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sessionTimeout.enabled` | `boolean` | `false` | Timeout on/off. |
| `sessionTimeout.minutes` | `number` | `5` | Minutes until automatic logout (1–60). |

```js
defaults: {
  theme: 'dark',
  buttonStyle: 'default',
  language: 'de',
  accentColor: '#00d4ff',
  borderRadius: 1,
  glow: { enabled: true, strength: 1 },
  sessionTimeout: { enabled: false, minutes: 5 },
},
```

## Settings Visibility

Determines which areas of the settings are visible to the user.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSettingsButton` | `boolean` | `true` | Show or hide the settings button completely. |

### Tabs

| Tab | Default | Description |
|-----|---------|-------------|
| `design` | `true` | Theme, accent color, button style, glow settings. |
| `analysen` | `true` | Reset uptime data and outages. |
| `daten` | `true` | Version history, data export and import. |
| `session` | `true` | Configure session timeout. |
| `user` | `true` | Change username and password, logout. |
| Credits | always | Cannot be disabled. |

### Remote Update

Allows updating the website directly from the settings (credits tab). On click, the configured commands are executed sequentially on the server.

> **Warning:** Commands are executed with the server process permissions. Only enter trusted commands!

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `update.enabled` | `boolean` | `false` | Show update function in credits tab. |
| `update.commands` | `array` | `[]` | Commands to execute sequentially. |

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
  update: {
    enabled: false,
    commands: ['git stash', 'git pull', 'git stash pop'],
  },
},
```
