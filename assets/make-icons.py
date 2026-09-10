"""Build favicon + og:image assets from the white-on-transparent shop logo.

The logo is white with an alpha channel, so it is invisible on a light browser
tab. Every icon here composites it onto the brand wine so it reads everywhere.

Two marks are used: the full circular emblem for large app icons, and just the
"Cozy" script (with thickened strokes) for 16-48px favicons, where the emblem's
hairlines collapse into mush.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = r"C:\Users\Admin\Downloads\Cozy Nails & Spa"
ASSETS = os.path.join(ROOT, "assets")
WINE = (109, 64, 85)
WINE_DEEP = (84, 49, 67)
WINE_DARK = (74, 44, 58)
CREAM = (255, 250, 246)
LAV = (200, 176, 220)

logo = Image.open(os.path.join(ASSETS, "cozy-logo.png")).convert("RGBA")
logo = logo.crop(logo.getbbox())          # trim transparent margin
w, h = logo.size
script = logo.crop((int(w * 0.10), int(h * 0.17), int(w * 0.78), int(h * 0.80)))
script = script.crop(script.getbbox())    # just the "Cozy Nails & Spa" wordmark
print("emblem", logo.size, "| script", script.size)


def tile(mark, size, pad=0.14, radius_ratio=0.0, dilate=0, gradient=True):
    """Square brand-coloured tile with `mark` centred on it."""
    ss = 8
    s = size * ss
    m = mark.copy()
    if dilate:                            # fatten hairlines so they survive downscaling
        m.putalpha(m.split()[3].filter(ImageFilter.MaxFilter(dilate)))

    if gradient:
        bg = Image.new("RGBA", (s, s))
        px = bg.load()
        for y in range(s):
            t = y / (s - 1)
            row = tuple(round(WINE[i] + (WINE_DARK[i] - WINE[i]) * t) for i in range(3)) + (255,)
            for x in range(s):
                px[x, y] = row
    else:
        bg = Image.new("RGBA", (s, s), WINE + (255,))

    r = min(s * (1 - 2 * pad) / m.width, s * (1 - 2 * pad) / m.height)
    m = m.resize((max(1, round(m.width * r)), max(1, round(m.height * r))), Image.LANCZOS)
    bg.paste(m, ((s - m.width) // 2, (s - m.height) // 2), m)

    if radius_ratio:
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius_ratio), fill=255)
        bg = Image.composite(bg, Image.new("RGBA", (s, s), (0, 0, 0, 0)), mask)

    return bg.resize((size, size), Image.LANCZOS)


# ---- favicons: wordmark, square, thickened --------------------------------
tile(script, 32, pad=0.06, dilate=11).save(os.path.join(ASSETS, "favicon-32.png"))
print("wrote favicon-32.png")

ico = tile(script, 256, pad=0.06, dilate=11)
ico.save(os.path.join(ASSETS, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
print("wrote favicon.ico")

# ---- app icons: full emblem, rounded --------------------------------------
for size in (180, 192, 512):
    tile(logo, size, pad=0.14, radius_ratio=0.22).save(os.path.join(ASSETS, f"icon-{size}.png"))
    print(f"wrote icon-{size}.png")

# ---- og:image (1200x630 social thumbnail) ---------------------------------
W, H = 1200, 630
og = Image.new("RGB", (W, H), WINE)
px = og.load()
for y in range(H):
    for x in range(W):
        t = (x / W) * 0.45 + (y / H) * 0.55
        px[x, y] = tuple(round(WINE[i] + (WINE_DEEP[i] - WINE[i]) * t) for i in range(3))

ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(ring)
for r, a in ((300, 26), (410, 18), (520, 12)):
    rd.ellipse([W - 190 - r, -60 - r, W - 190 + r, -60 + r], outline=(255, 255, 255, a), width=2)
og = Image.alpha_composite(og.convert("RGBA"), ring).convert("RGB")

mark = logo.copy()
r = min(430 / mark.width, 330 / mark.height)
mark = mark.resize((round(mark.width * r), round(mark.height * r)), Image.LANCZOS)
og.paste(mark, (95, (H - mark.height) // 2), mark)

try:
    f_big = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 60)
    f_small = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 27)
except OSError:
    f_big = f_small = ImageFont.load_default()

d = ImageDraw.Draw(og)
tx = 95 + mark.width + 70
d.text((tx, H // 2 - 78), "Cozy Nails & Spa", font=f_big, fill=CREAM)
d.text((tx, H // 2 + 12), "Manicure · Pedicure · Head Spa", font=f_small, fill=LAV)
d.text((tx, H // 2 + 54), "Gellak · Acryl · BIAB · Nail art", font=f_small, fill=LAV)
d.line([tx, H // 2 + 114, tx + 190, H // 2 + 114], fill=LAV, width=2)

og.save(os.path.join(ASSETS, "og-image.png"), optimize=True)
print("wrote og-image.png", og.size)
