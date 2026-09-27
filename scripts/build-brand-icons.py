#!/usr/bin/env python3
"""Raster brand icons: white eyes on black, plus the light-tab favicon test."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"

EYE_W = 10
EYE_H = 16
GAP = 6
PAIR_W = EYE_W * 2 + GAP
GLINT = (6.7, 4.3, 1.45)


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def draw_eyes(base, origin, scale, eye, glint, optical_down):
    """Draw the Peek eye pair. origin is the top-left of the square tile."""
    draw = ImageDraw.Draw(base)
    side = scale
    pair = side * 0.52
    eye_w = pair * (EYE_W / PAIR_W)
    eye_h = eye_w * (EYE_H / EYE_W)
    gap = eye_w * (GAP / EYE_W)
    cx = origin[0] + side / 2
    cy = origin[1] + side / 2 + side * optical_down
    left = cx - pair / 2
    top = cy - eye_h / 2
    for i in range(2):
        x = left + i * (eye_w + gap)
        draw.rounded_rectangle((x, top, x + eye_w, top + eye_h), radius=eye_w / 2, fill=eye)
        gx = x + eye_w * (GLINT[0] / EYE_W)
        gy = top + eye_h * (GLINT[1] / EYE_H)
        gr = eye_w * (GLINT[2] / EYE_W)
        draw.ellipse((gx - gr, gy - gr, gx + gr, gy + gr), fill=glint)


def tile(size, *, rounded, eye, glint, bg, optical_down=0.055, safe=1.0):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0) if rounded else bg + (255,))
    draw = ImageDraw.Draw(image)
    if rounded:
        radius = int(size * 0.22)
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=bg + (255,))
    else:
        draw.rectangle((0, 0, size, size), fill=bg + (255,))
    inset = (1 - safe) / 2
    draw_eyes(image, (size * inset, size * inset), size * safe, eye + (255,), glint + (255,), optical_down)
    return image


def eye_layout(side, optical_down=0.055, pair_ratio=0.52):
    pair = side * pair_ratio
    eye_w = pair * (EYE_W / PAIR_W)
    eye_h = eye_w * (EYE_H / EYE_W)
    gap = eye_w * (GAP / EYE_W)
    cy = side / 2 + side * optical_down
    top = cy - eye_h / 2
    left = side / 2 - pair / 2
    return left, top, eye_w, eye_h, gap


def eyes_svg(bg, eye, glint, rx=7):
    left, top, eye_w, eye_h, gap = eye_layout(32)
    rx_eye = eye_w / 2
    def eye_rect(x):
        return f'<rect x="{x:.2f}" y="{top:.2f}" width="{eye_w:.2f}" height="{eye_h:.2f}" rx="{rx_eye:.2f}"/>'
    def glint_at(x):
        gx = x + eye_w * (GLINT[0] / EYE_W)
        gy = top + eye_h * (GLINT[1] / EYE_H)
        gr = eye_w * (GLINT[2] / EYE_W)
        return f'<circle cx="{gx:.2f}" cy="{gy:.2f}" r="{gr:.2f}"/>'
    x2 = left + eye_w + gap
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="{rx}" fill="{bg}"/>
  <g fill="{eye}">
    {eye_rect(left)}
    {eye_rect(x2)}
  </g>
  <g fill="{glint}">
    {glint_at(left)}
    {glint_at(x2)}
  </g>
</svg>
'''


def adaptive_svg():
    left, top, eye_w, eye_h, gap = eye_layout(32)
    rx_eye = eye_w / 2
    x2 = left + eye_w + gap
    def rect(x):
        return f'<rect class="eye" x="{x:.2f}" y="{top:.2f}" width="{eye_w:.2f}" height="{eye_h:.2f}" rx="{rx_eye:.2f}"/>'
    def dot(x):
        gx = x + eye_w * (GLINT[0] / EYE_W)
        gy = top + eye_h * (GLINT[1] / EYE_H)
        gr = eye_w * (GLINT[2] / EYE_W)
        return f'<circle class="glint" cx="{gx:.2f}" cy="{gy:.2f}" r="{gr:.2f}"/>'
    # Light tabs were tested with black eyes on white. The white tile
    # disappears into light chrome, so the favicon stays white eyes on black.
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .bg {{ fill: #0a0a0a; }}
    .eye {{ fill: #ededed; }}
    .glint {{ fill: #0a0a0a; }}
  </style>
  <rect class="bg" width="32" height="32" rx="7"/>
  {rect(left)}
  {rect(x2)}
  {dot(left)}
  {dot(x2)}
</svg>
'''


def pinned_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect x="2.4" y="4.15" width="4.15" height="6.65" rx="2.08"/>
  <rect x="9.45" y="4.15" width="4.15" height="6.65" rx="2.08"/>
</svg>
'''


def og(path, dark=False):
    w, h = 1200, 630
    bg = (10, 10, 10) if dark else (255, 255, 255)
    eye = (237, 237, 237) if dark else (10, 10, 10)
    glint = bg
    ink = (237, 237, 237) if dark else (10, 10, 10)
    muted = (161, 161, 161) if dark else (82, 82, 82)
    image = Image.new("RGB", (w, h), bg)
    pair = 280
    scale = pair / PAIR_W
    eye_w = EYE_W * scale
    eye_h = EYE_H * scale
    gap = GAP * scale
    left = (w - pair) / 2
    top = 148
    draw = ImageDraw.Draw(image)
    for i in range(2):
        x = left + i * (eye_w + gap)
        draw.rounded_rectangle((x, top, x + eye_w, top + eye_h), radius=eye_w / 2, fill=eye)
        gx = x + eye_w * (GLINT[0] / EYE_W)
        gy = top + eye_h * (GLINT[1] / EYE_H)
        gr = eye_w * (GLINT[2] / EYE_W)
        draw.ellipse((gx - gr, gy - gr, gx + gr, gy + gr), fill=glint)
    title = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf", 84)
    tag = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Medium.ttf", 36)
    name = "Nearby"
    line = "All within reach."
    nw = draw.textlength(name, font=title)
    tw = draw.textlength(line, font=tag)
    draw.text(((w - nw) / 2, top + eye_h + 36), name, font=title, fill=ink)
    draw.text(((w - tw) / 2, top + eye_h + 36 + 100), line, font=tag, fill=muted)
    image.save(path, "PNG")


def compare():
    """16 and 32 px tiles, both colour schemes, on light and dark tab chrome."""
    variants = [
        ("white on black", (10, 10, 10), (237, 237, 237), (10, 10, 10)),
        ("black on white", (255, 255, 255), (10, 10, 10), (255, 255, 255)),
    ]
    chromes = [("light tab", (222, 225, 230)), ("dark tab", (32, 33, 36))]
    scale = 8
    pad = 28 * scale
    cell_w = 220 * scale
    cell_h = 120 * scale
    canvas = Image.new("RGB", (cell_w * 2, cell_h * 4 + 20), (245, 245, 245))
    font = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Medium.ttf", 18 * scale)
    small = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Regular.ttf", 14 * scale)
    y = 0
    for label, bg, eye, glint in variants:
        for size in (16, 32):
            row = Image.new("RGB", (cell_w * 2, cell_h), (245, 245, 245))
            icon = tile(size * 8, rounded=True, eye=eye, glint=glint, bg=bg, optical_down=0.055)
            icon = icon.resize((size * scale, size * scale), Image.Resampling.BOX)
            for i, (cname, chrome) in enumerate(chromes):
                panel = Image.new("RGB", (cell_w - 16 * scale, cell_h - 16 * scale), chrome)
                d = ImageDraw.Draw(panel)
                d.text((16 * scale, 12 * scale), f"{label} · {size}px · {cname}", font=small, fill=(20, 20, 20) if i == 0 else (230, 230, 230))
                ix = 24 * scale
                iy = 48 * scale
                panel.paste(icon, (ix, iy), icon)
                row.paste(panel, (8 * scale + i * cell_w, 8 * scale))
            canvas.paste(row, (0, y))
            y += cell_h
    canvas.save("/tmp/favicon-compare.png")


def main():
    compare()
    black = (10, 10, 10)
    white = (237, 237, 237)
    ICONS.mkdir(parents=True, exist_ok=True)
    any_192 = tile(192, rounded=True, eye=white, glint=black, bg=black)
    any_512 = tile(512, rounded=True, eye=white, glint=black, bg=black)
    mask_192 = tile(192, rounded=False, eye=white, glint=black, bg=black, safe=0.72, optical_down=0.04)
    mask_512 = tile(512, rounded=False, eye=white, glint=black, bg=black, safe=0.72, optical_down=0.04)
    apple = tile(180, rounded=False, eye=white, glint=black, bg=black)
    any_192.save(ICONS / "icon-192.png")
    any_512.save(ICONS / "icon-512.png")
    mask_192.save(ICONS / "icon-maskable-192.png")
    mask_512.save(ICONS / "icon-maskable-512.png")
    apple.save(PUBLIC / "apple-touch-icon.png")
    ico_32 = tile(32, rounded=True, eye=white, glint=black, bg=black)
    ico_16 = tile(16, rounded=True, eye=white, glint=black, bg=black)
    ico_32.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32)], append_images=[ico_16])
    (PUBLIC / "icon.svg").write_text(adaptive_svg())
    (PUBLIC / "safari-pinned-tab.svg").write_text(pinned_svg())
    og(PUBLIC / "og.png", dark=False)
    og(PUBLIC / "og-dark.png", dark=True)
    # Sheet of the icon set for review.
    sheet = Image.new("RGB", (1400, 860), (244, 244, 244))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Medium.ttf", 22)
    items = [
        (ico_16.resize((64, 64), Image.Resampling.NEAREST), "16"),
        (ico_32.resize((64, 64), Image.Resampling.NEAREST), "32"),
        (apple.resize((180, 180), Image.Resampling.LANCZOS), "180"),
        (any_192, "192"),
        (mask_512.resize((256, 256), Image.Resampling.LANCZOS), "maskable 512"),
    ]
    x = 40
    for image, label in items:
        sheet.paste(image, (x, 80), image if image.mode == "RGBA" else None)
        draw.text((x, 40), label, font=font, fill=(10, 10, 10))
        x += image.width + 36
    sheet.save("/tmp/icon-sheet.png")
    print("wrote icons")


if __name__ == "__main__":
    main()
