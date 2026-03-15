# Landing Page

## Landing GIF

Displays an animated image above the page title. The image is automatically tinted in the current accent color.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `landingGif` | `string \| false` | `'landing-gif.png'` | Path to the animated image (relative to `public/`). `false` = no GIF. |
| `landingGifSize` | `number` | `200` | Width and height in pixels. |

### Creating a Custom Landing GIF

The GIF is used as a CSS mask — bright pixels become the accent color, transparent pixels are hidden. The GIF must be prepared with the included script.

**1. Find a suitable GIF** with bright/white content on a black background. Search on Tenor, GIPHY, or Pinterest for terms like `globe animation black background` or `network animation dark`.

> **Important:** Colorful GIFs or GIFs with a bright/white background do not work. The background must be black, the motif white.

**2. Install Python and Pillow** (one-time):
```bash
pip install Pillow
```

**3. Run the preparation script** from the project folder:
```bash
cd /path/to/Netzwerk-Manager

# Default 200px:
python3 prepare-gif.py ~/Desktop/my-gif.gif

# Custom size (300px):
python3 prepare-gif.py ~/Downloads/animation.gif 300
```

The script converts the GIF to an APNG with transparency and places it in `public/`.

**4. Add to config.js:**
```js
landingGif: 'my-gif-prepared.png',
landingGifSize: 200,
```

### How Does the Tinting Work?

The image is used as a CSS mask. The accent color shows through where the mask is white/bright. When you change the accent color in settings, the GIF color changes automatically.

## Buttons

Show or hide navigation buttons on the landing page.

| Button | Default | Description |
|--------|---------|-------------|
| `info` | `true` | Info Center button. |
| `control` | `true` | Control Center button. |
| `analysen` | `true` | Analytics Center button. |

```js
buttons: {
  info: true,
  control: true,
  analysen: true,
},
```

## Header Links

Links appear as chips below the buttons. Each link automatically shows the favicon of the target website.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name of the link. |
| `url` | `string` | Full URL (must start with `http://` or `https://`). |

```js
headerLinks: [
  { name: 'Github', url: 'https://github.com/your-username' },
  { name: 'KanBan', url: 'https://example.com/kanban' },
],
```

## Welcome Messages

Custom greeting texts displayed randomly on each page load.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customOnly` | `boolean` | `false` | `true` = custom only, `false` = built-in random messages. |
| `messages` | `array` | `[]` | List of custom welcome messages. |

- **`customOnly: false`** — Built-in messages are used, `messages` is ignored.
- **`customOnly: true`** — Only the entered messages are displayed. If empty, falls back to built-in.

```js
greetings: {
  customOnly: true,
  messages: [
    'Welcome to the network!',
    'Hello Admin!',
    'Good to see you.',
  ],
},
```
