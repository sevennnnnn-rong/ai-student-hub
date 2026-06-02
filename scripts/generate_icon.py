"""Generate geometric sun icon for 气象台Hub — Ultra quality
Supersample at 4096x4096, then downscale for crisp edges."""
from PIL import Image, ImageDraw
import math, os

# ========== Supersampling ==========
SS = 4096  # draw at this size
FINAL = 512  # output size

cx, cy = SS // 2, SS // 2

BG = '#0D1B2A'
ORANGE = '#F97316'
GOLD = '#FBBF24'
R = int(SS * 215 / 512)  # scale radius proportionally

def make_icon():
    img = Image.new('RGBA', (SS, SS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # === 1. Orange ring ===
    ring_w = int(SS * 14 / 512)
    draw.ellipse([cx - R - ring_w, cy - R - ring_w, cx + R + ring_w, cy + R + ring_w], fill=ORANGE)

    # === 2. Blue inner circle ===
    draw.ellipse([cx - R, cy - R, cx + R, cy + R], fill=BG)

    # === 3. Upper rays — trapezoids ===
    num_rays = 7
    a_start = math.radians(18)
    a_end = math.radians(162)
    a_step = (a_end - a_start) / (num_rays - 1)

    inner_r = int(SS * 28 / 512)
    outer_r = R - int(SS * 6 / 512)

    for i in range(num_rays):
        a = a_start + i * a_step
        hw_in = math.radians(5)
        hw_out = math.radians(9)

        pts = [
            (cx + inner_r * math.cos(a - hw_in), cy - inner_r * math.sin(a - hw_in)),
            (cx + outer_r * math.cos(a - hw_out), cy - outer_r * math.sin(a - hw_out)),
            (cx + outer_r * math.cos(a + hw_out), cy - outer_r * math.sin(a + hw_out)),
            (cx + inner_r * math.cos(a + hw_in), cy - inner_r * math.sin(a + hw_in)),
        ]
        draw.polygon(pts, fill=ORANGE)

    # === 4. Lower chevrons — V-ridges ===
    ridge_data = [
        (cy + int(SS * 155 / 512), int(R * 0.88), int(SS * 48 / 512)),
        (cy + int(SS * 105 / 512), int(R * 0.65), int(SS * 44 / 512)),
        (cy + int(SS * 60 / 512),  int(R * 0.45), int(SS * 40 / 512)),
    ]

    for (base_y, hw, h) in ridge_data:
        draw.polygon([
            (cx - hw, base_y),
            (cx, base_y - h),
            (cx + hw, base_y),
        ], fill=ORANGE)

    # === 5. Clip to circle ===
    mask = Image.new('L', (SS, SS), 0)
    ImageDraw.Draw(mask).ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
    bg = Image.new('RGBA', (SS, SS), (0, 0, 0, 0))
    bg.paste(img, mask=mask)
    return bg


def downscale(src, size):
    return src.resize((size, size), Image.LANCZOS)


print('Drawing at 4096x4096...')
img_ss = make_icon()

# Downscale to 512 for main output
img = downscale(img_ss, FINAL)
print(f'Downscaled to {FINAL}x{FINAL}')

# ========== Save ==========
base = 'D:/Software/ai-student-hub'
img.save(f'{base}/app-icon.png', optimize=True)

pwa = f'{base}/frontend/public/icons'
os.makedirs(pwa, exist_ok=True)
downscale(img_ss, 192).save(f'{pwa}/icon-192.png', optimize=True)
img.save(f'{pwa}/icon-512.png', optimize=True)

mask_icon = Image.new('RGBA', (FINAL, FINAL), (249, 115, 22, 255))
sz = 400
m_icon = downscale(img_ss, sz)
mask_icon.paste(m_icon, ((FINAL - sz) // 2,) * 2, m_icon)
mask_icon.save(f'{pwa}/icon-maskable.png', optimize=True)

pwa2 = f'{base}/frontend-new/public/icons'
os.makedirs(pwa2, exist_ok=True)
downscale(img_ss, 192).save(f'{pwa2}/icon-192.png', optimize=True)
img.save(f'{pwa2}/icon-512.png', optimize=True)
mask_icon.save(f'{pwa2}/icon-maskable.png', optimize=True)

td = f'{base}/src-tauri/icons'
os.makedirs(td, exist_ok=True)
downscale(img_ss, 32).save(f'{td}/32x32.png', optimize=True)
downscale(img_ss, 128).save(f'{td}/128x128.png', optimize=True)
downscale(img_ss, 256).save(f'{td}/128x128@2x.png', optimize=True)
downscale(img_ss, 256).save(f'{td}/icon.png', optimize=True)

sizes_ico = [16, 24, 32, 48, 64, 128, 256]
imgs_ico = [downscale(img_ss, s) for s in sizes_ico]
imgs_ico[0].save(f'{td}/icon.ico', format='ICO',
                  append_images=imgs_ico[1:],
                  sizes=[(s, s) for s in sizes_ico])
img.save(f'{td}/icon.icns')

img.save('C:/Users/lenovo/Desktop/sun-icon-geo.png')
print('Done - Ultra quality!')
