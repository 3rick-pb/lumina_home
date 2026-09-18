import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
from collections import deque

IMAGE_MAPS = [
    {
        'id': 'chile',
        'name': 'Chile',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434413.jpg',
        'target_width': 2880,
        'target_height': 2652,
        'diff_threshold': 1.0,
        'min_intensity': 38.0,
        'contrast_boost': 1.08,
        'sharpness_boost': 1.45,
    },
    {
        'id': 'colombia',
        'name': 'Colombia',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434625.jpg',
        'target_width': 2880,
        'target_height': 1918,
        'diff_threshold': 3.5,
        'min_intensity': 50.0,
        'contrast_boost': 1.07,
        'sharpness_boost': 1.40,
    },
    {
        'id': 'mexico',
        'name': 'México',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434633.jpg',
        'target_width': 2880,
        'target_height': 1676,
        'diff_threshold': 6.0,
        'min_intensity': 65.0,
        'contrast_boost': 1.08,
        'sharpness_boost': 1.45,
    },
    {
        'id': 'argentina',
        'name': 'Argentina',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434667.jpg',
        'target_width': 2422,
        'target_height': 2880,
        'diff_threshold': 0.8,
        'min_intensity': 36.0,
        'contrast_boost': 1.08,
        'sharpness_boost': 1.45,
    },
    {
        'id': 'peru',
        'name': 'Perú',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434725.jpg',
        'target_width': 2880,
        'target_height': 2666,
        'diff_threshold': 1.5,
        'min_intensity': 38.0,
        'contrast_boost': 1.08,
        'sharpness_boost': 1.45,
    },
]

OUTPUT_DIR = r"c:\Users\WinterOS\Desktop\Test_Antigravity\lumina-home\public\images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_map_hd(config):
    country_id = config['id']
    name = config['name']
    src_path = config['src']
    target_w = config['target_width']
    target_h = config['target_height']
    diff_thresh = config.get('diff_threshold', 2.0)
    min_int = config.get('min_intensity', 40.0)
    contrast_boost = config.get('contrast_boost', 1.08)
    sharpness_boost = config.get('sharpness_boost', 1.40)
    
    print(f"\n========================================================")
    print(f"  Procesando Mapa Ultra-HD de {name} ({country_id})...")
    print(f"========================================================")
    
    if not os.path.exists(src_path):
        print(f"  [ERROR] Archivo no encontrado: {src_path}")
        return False
        
    im_orig = Image.open(src_path).convert("RGB")
    orig_w, orig_h = im_orig.size
    print(f"  Original: {orig_w}x{orig_h} -> Super-Resolución: {target_w}x{target_h}")
    
    # 1. Super-resolution upscale via Lanczos
    im_hd = im_orig.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # 2. Detail enhancement: Unsharp mask + contrast
    im_sharp = ImageEnhance.Sharpness(im_hd).enhance(sharpness_boost)
    im_enhanced = ImageEnhance.Contrast(im_sharp).enhance(contrast_boost)
    # Extra subtle unsharp mask for micro-relief definition
    im_enhanced = im_enhanced.filter(ImageFilter.UnsharpMask(radius=1.5, percent=130, threshold=1))
    
    arr = np.array(im_enhanced)
    r = arr[:, :, 0].astype(float)
    g = arr[:, :, 1].astype(float)
    b = arr[:, :, 2].astype(float)
    
    diff_rb = r - b
    intensity = (r + g + b) / 3.0
    
    # Sample corner margins for background slate/ocean color
    corner_samples = np.concatenate([
        arr[:30, :30].reshape(-1, 3),
        arr[:30, -30:].reshape(-1, 3),
        arr[-30:, :30].reshape(-1, 3),
        arr[-30:, -30:].reshape(-1, 3),
    ])
    bg_color = np.median(corner_samples, axis=0).astype(float)
    
    # Color distance from background
    color_dist = np.sqrt((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)
    
    # Segment terrain: warm relief, bright peaks, or chromatic distance from ocean
    is_land = (
        ((diff_rb >= diff_thresh) & (intensity >= min_int)) |
        (color_dist >= 28.0) |
        (intensity >= 110.0) |
        ((r >= 65.0) & (diff_rb >= 1.0))
    )
    
    # Definite background (dark ocean with cool or neutral tones close to corner)
    is_ocean = (color_dist < 18.0) | ((b > r + 3.0) & (intensity < 60.0))
    
    mask_arr = np.where(is_land & ~is_ocean, 255, 0).astype(np.uint8)
    mask_img = Image.fromarray(mask_arr, mode='L')
    
    # Fill tiny deep shadow chasms without rounding major coastal capes
    mask_img = mask_img.filter(ImageFilter.MaxFilter(7))
    mask_img = mask_img.filter(ImageFilter.MinFilter(7))
    # Subpixel anti-aliased edge smoothing
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(1.0))
    
    # Create final RGBA image
    rgba_im = im_enhanced.convert("RGBA")
    rgba_im.putalpha(mask_img)
    
    png_path = os.path.join(OUTPUT_DIR, f"map_{country_id}_cutout.png")
    webp_path = os.path.join(OUTPUT_DIR, f"map_{country_id}_cutout.webp")
    
    # Save Ultra-HD WebP at quality 96 (superb fidelity, ~400-700 KB, matching Ecuador)
    rgba_im.save(webp_path, "WEBP", quality=96, method=6)
    webp_size_kb = os.path.getsize(webp_path) / 1024
    print(f"  [OK] Ultra-HD WebP guardado: {webp_path} ({webp_size_kb:.1f} KB)")
    
    # Save High-Res PNG
    rgba_im.save(png_path, "PNG", optimize=True)
    png_size_kb = os.path.getsize(png_path) / 1024
    print(f"  [OK] High-Res PNG guardado: {png_path} ({png_size_kb:.1f} KB)")
    
    return True

def ensure_ecuador_alias():
    ecuador_orig = os.path.join(OUTPUT_DIR, "map_3d_relief_cutout.webp")
    ecuador_dest = os.path.join(OUTPUT_DIR, "map_ecuador_cutout.webp")
    if os.path.exists(ecuador_orig):
        import shutil
        shutil.copy2(ecuador_orig, ecuador_dest)
        print("  [OK] Alias map_ecuador_cutout.webp sincronizado")
        
    ecuador_png_orig = os.path.join(OUTPUT_DIR, "map_3d_relief_cutout.png")
    ecuador_png_dest = os.path.join(OUTPUT_DIR, "map_ecuador_cutout.png")
    if os.path.exists(ecuador_png_orig):
        import shutil
        shutil.copy2(ecuador_png_orig, ecuador_png_dest)
        print("  [OK] Alias map_ecuador_cutout.png sincronizado")

if __name__ == '__main__':
    print("Iniciando pipeline de Super-Resolucion Ultra-HD para mapas 3D...")
    for map_cfg in IMAGE_MAPS:
        process_map_hd(map_cfg)
    ensure_ecuador_alias()
    print("\n[FIN] Todos los mapas 3D fueron generados en Ultra-HD con maxima nitidez.")
