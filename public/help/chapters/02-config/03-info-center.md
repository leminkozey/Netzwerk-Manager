# Info Center

The Info Center can be fully defined via the config. You determine which sections, cards, and fields are displayed — completely without code changes.

If `infoCenter` is present in the config, dynamic rendering is used. Without it, the legacy hardwired cards are displayed.

## Structure

`infoCenter` is an array of **sections**. Each section contains a heading, a layout, and an array of cards:

```js
infoCenter: [
  {
    heading: 'Network Devices',
    layout: 'double',
    cards: [ ... ],
  },
],
```

## Section Options

| Option | Type | Description |
|--------|------|-------------|
| `heading` | `string` | Section heading. |
| `layout` | `string` | `'double'` = cards paired in a 2-column grid. `'single'` = each card full width. |
| `cards` | `array` | Array of card definitions. |

With `layout: 'double'` and an odd number of cards, the last card is displayed alone (full width).

## Card Types

There are two card types: **Table** and **Info**.

### Table Card

For tabular data like port assignments. Each row has a text input field and a color picker.

```js
{
  id: 'switch',
  title: 'Switch (8 Ports)',
  icon: 'switchColor',
  type: 'table',
  columns: {
    label: 'Port',
    input: 'Assignment',
    inputPlaceholder: 'Not assigned',
    color: 'Color',
  },
  rows: [
    { id: 'port1', label: 'Port 1' },
    { id: 'port2', label: 'Port 2' },
  ],
}
```

| Option | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique key for data storage. |
| `title` | `string` | Card heading. |
| `icon` | `string` | Icon name (see Icons section below). |
| `columns` | `object` | Column names for the table. |
| `rows` | `array` | Array of rows with `id` and `label`. |

### Info Card

For form fields like IP addresses, passwords, and URLs. Supports password encryption, copy buttons, and clickable links.

```js
{
  id: 'pihole',
  title: 'PiHole',
  icon: 'raspberryColor',
  type: 'info',
  fields: [
    { key: 'hostname',    label: 'Hostname' },
    { key: 'ipAddress',   label: 'LAN IP' },
    { key: 'sshPassword', label: 'SSH Password', password: true },
    { key: 'model',       label: 'Model',        copy: false },
    { key: 'piholeUrl',   label: 'Admin URL' },
  ],
  links: [
    { label: 'Pi-hole Admin', linkField: 'piholeUrl' },
  ],
}
```

**Field Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | — | Internal key for data storage. Must be unique within the card. |
| `label` | `string` | — | Display name of the field. |
| `password` | `boolean` | `false` | `true` = password field with eye toggle. Stored encrypted (AES-256-GCM). |
| `copy` | `boolean` | `true` | `true` = show copy button. `false` = no copy button. |

**Link Options:**

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Button text of the link. |
| `linkField` | `string` | References a field by `key`. The value is used as the URL. |

## Icons

Everywhere `icon:` is used, three formats are supported:

**1. Built-in Icons** — Name from `icons.js`:
```js
icon: 'windowsColor',
icon: 'raspberryColor',
icon: 'server',
```

**2. Direct URL** — Any SVG/PNG via link:
```js
icon: 'https://svgl.app/library/raspberry_pi.svg',
icon: 'https://cdn.simpleicons.org/pihole',
```

**3. Iconify Format** — `prefix:name` from the Iconify ecosystem:
```js
icon: 'logos:raspberry-pi',
icon: 'devicon:windows11-original',
```

| Source | Description |
|--------|-------------|
| **Iconify** | 200,000+ icons from 150+ sets |
| **SVGL** | Curated colorful brand SVGs |
| **Simple Icons** | 3,000+ brand logos as SVG |

## Data Storage

Card data is stored in `Data/InfoCards.json`. On first activation of `infoCenter`, existing data from `state.json` is automatically migrated.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/info-card/:cardId` | Yes | Load card data. Password fields are returned decrypted. |
| `POST` | `/api/info-card/:cardId` | Yes | Save card data. Password fields are stored encrypted. |

## Backward Compatibility

The `infoCenter` block is completely optional. Without it, the old hardwired cards are displayed unchanged. Existing data is automatically migrated when first adding `infoCenter`.

### Legacy Card Visibility

If `infoCenter` is not used, the old cards can be shown/hidden with:

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
