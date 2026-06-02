"""Convert user icon to all required sizes for Tauri + PWA"""
from PIL import Image
import os

# Source icon
SOURCE = 'C:/Users/lenovo/Desktop/sun-icon-geo.png'
BASE = 'D:/Software/ai-student-hub'

# Load source
img_ss = Image.open(SOURCE).convert('RGBA')
print(f'Loaded source: {img_ss.size}')

# Ensure square - crop to center if needed
w, h = img_ss.size
if w != h:
    size = min(w, h)
    left = (w - size) // 2
    top = (h - size) // 2
    img_ss = img_ss.crop((left, top, left + size, top + size))
    print(f'Cropped to square: {img_ss.size}')

def downscale(src, size):
    return src.resize((size, size), Image.LANCZOS)

# Main 512px icon
img = downscale(img_ss, 512)

# Save to all locations
print('Generating icons...')

# Project root
img.save(f'{BASE}/app-icon.png', optimize=True)
print('  app-icon.png')

# PWA icons - frontend
pwa = f'{BASE}/frontend/public/icons'
os.makedirs(pwa, exist_ok=True)
downscale(img_ss, 192).save(f'{pwa}/icon-192.png', optimize=True)
img.save(f'{pwa}/icon-512.png', optimize=True)

# Maskable icon (orange background)
mask_icon = Image.new('RGBA', (512, 512), (249, 115, 22, 255))
sz = 400
m_icon = downscale(img_ss, sz)
mask_icon.paste(m_icon, ((512 - sz) // 2,) * 2, m_icon)
mask_icon.save(f'{pwa}/icon-maskable.png', optimize=True)
print('  frontend/public/icons/')

# PWA icons - frontend-new
pwa2 = f'{BASE}/frontend-new/public/icons'
os.makedirs(pwa2, exist_ok=True)
downscale(img_ss, 192).save(f'{pwa2}/icon-192.png', optimize=True)
img.save(f'{pwa2}/icon-512.png', optimize=True)
mask_icon.save(f'{pwa2}/icon-maskable.png', optimize=True)
print('  frontend-new/public/icons/')

# Tauri icons
td = f'{BASE}/src-tauri/icons'
os.makedirs(td, exist_ok=True)
downscale(img_ss, 32).save(f'{td}/32x32.png', optimize=True)
downscale(img_ss, 128).save(f'{td}/128x128.png', optimize=True)
downscale(img_ss, 256).save(f'{td}/128x128@2x.png', optimize=True)
downscale(img_ss, 256).save(f'{td}/icon.png', optimize=True)

# ICO file
sizes_ico = [16, 24, 32, 48, 64, 128, 256]
imgs_ico = [downscale(img_ss, s) for s in sizes_ico]
imgs_ico[0].save(f'{td}/icon.ico', format='ICO',
                  append_images=imgs_ico[1:],
                  sizes=[(s, s) for s in sizes_ico])

# ICNS file
img.save(f'{td}/icon.icns')
print('  src-tauri/icons/')

print('Done!')
