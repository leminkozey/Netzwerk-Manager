#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════
# Landing-GIF vorbereiten
# ═══════════════════════════════════════════════════════════════════
# Wandelt ein Schwarz-Weiß-GIF in ein APNG mit transparentem
# Hintergrund um. Das Ergebnis wird als CSS-Maske genutzt und
# automatisch in der Akzentfarbe eingefärbt.
#
# Voraussetzung: pip install Pillow
#
# Verwendung:
#   python3 prepare-gif.py mein-gif.gif
#   python3 prepare-gif.py mein-gif.gif 300
#
# Ergebnis landet in public/ und kann direkt in config.js eingetragen werden.
# ═══════════════════════════════════════════════════════════════════

from PIL import Image
import sys
import os

if len(sys.argv) < 2:
    print('Verwendung: python3 prepare-gif.py <gif-datei> [größe-in-px]')
    print('Beispiel:   python3 prepare-gif.py mein-gif.gif 200')
    sys.exit(1)

src = sys.argv[1]
size = int(sys.argv[2]) if len(sys.argv) > 2 else 200

name = os.path.splitext(os.path.basename(src))[0]
dst = os.path.join(os.path.dirname(__file__), 'public', f'{name}-prepared.png')

img = Image.open(src)
frames, durations = [], []

print(f'Quelle:  {src}')
print(f'Frames:  {img.n_frames}')
print(f'Größe:   {img.size[0]}x{img.size[1]} → {size}x{size}')
print()

for i in range(img.n_frames):
    img.seek(i)
    frame = img.convert('RGBA')

    # Auf gewünschte Größe skalieren
    ratio = size / max(frame.size)
    frame = frame.resize(
        (int(frame.width * ratio), int(frame.height * ratio)),
        Image.LANCZOS,
    )

    # Schwarz → transparent, Weiß → weiß mit Helligkeits-Alpha
    pixels = frame.load()
    for y in range(frame.height):
        for x in range(frame.width):
            r, g, b, a = pixels[x, y]
            brightness = (r + g + b) / 3
            if brightness < 30:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (255, 255, 255, min(255, int(brightness * 255 / 200)))

    frames.append(frame)
    durations.append(img.info.get('duration', 20))
    if i % 50 == 0:
        print(f'  Frame {i}/{img.n_frames}...')

print(f'  Frame {img.n_frames}/{img.n_frames}...')
print()
print('Speichere...')

frames[0].save(dst, save_all=True, append_images=frames[1:],
               duration=durations, loop=0, disposal=2)

size_kb = os.path.getsize(dst) // 1024
print(f'Fertig: {dst} ({size_kb} KB)')
print()
print('Jetzt in config.js eintragen:')
print(f"  landingGif: '{name}-prepared.png',")
print(f'  landingGifSize: {size},')
