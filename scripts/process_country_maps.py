import os
import sys
from PIL import Image, ImageFilter
from collections import deque

IMAGE_MAPS = [
    {
        'id': 'chile',
        'name': 'Chile',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434413.jpg',
        'target_width': 1024,
        'min_component_size': 80,
    },
    {
        'id': 'colombia',
        'name': 'Colombia',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434625.jpg',
        'target_width': 1024,
        'min_component_size': 120,
    },
    {
        'id': 'mexico',
        'name': 'México',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434633.jpg',
        'target_width': 1024,
        'min_component_size': 100,
    },
    {
        'id': 'argentina',
        'name': 'Argentina',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434667.jpg',
        'target_width': 1024,
        'min_component_size': 120,
    },
    {
        'id': 'peru',
        'name': 'Perú',
        'src': r'C:/Users/WinterOS/.gemini/antigravity/brain/201eb56a-18f0-4c5a-bb92-a1ff9829a921/.user_uploaded/media_1789771434725.jpg',
        'target_width': 1024,
        'min_component_size': 120,
    },
]

OUTPUT_DIR = r"c:\Users\WinterOS\Desktop\Test_Antigravity\lumina-home\public\images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_map(config):
    country_id = config['id']
    name = config['name']
    src_path = config['src']
    min_comp_size = config.get('min_component_size', 100)
    
    print(f"\n========================================================")
    print(f"  Procesando Mapa 3D de {name} ({country_id})...")
    print(f"========================================================")
    
    if not os.path.exists(src_path):
        print(f"  ❌ Archivo no encontrado: {src_path}")
        return False
        
    im = Image.open(src_path).convert("RGB")
    orig_w, orig_h = im.size
    print(f"  Dimensiones originales: {orig_w}x{orig_h} (Aspect: {orig_w}/{orig_h})")
    
    # Scale if target_width is specified
    tw = config.get('target_width', orig_w)
    if tw != orig_w:
        th = int(orig_h * (tw / orig_w))
        im_work = im.resize((tw, th), Image.Resampling.LANCZOS)
    else:
        im_work = im
        tw, th = orig_w, orig_h
        
    w, h = tw, th
    pixels = im_work.load()
    
    # Step 1: Detect land vs dark slate ocean
    # In all these 3D relief maps, the ocean has b > r or r ≈ g ≈ b (neutral dark grey/blue)
    # The landmass is warm terracotta / clay / sandstone / highlights: r > b or high intensity
    raw_mask = [[False for _ in range(w)] for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            diff = r - b
            intensity = (r + g + b) // 3
            # Strict terrain detection
            if (diff >= 6 and r >= 48) or (intensity >= 65 and diff >= 3) or (r >= 82 and g >= 72):
                raw_mask[y][x] = True
                
    # Step 2: Connected components to keep true landmass (mainland + significant islands)
    # and discard tiny specular ocean dust
    visited = [[False for _ in range(w)] for _ in range(h)]
    components = []
    
    for y in range(h):
        for x in range(w):
            if raw_mask[y][x] and not visited[y][x]:
                comp = []
                queue = deque([(x, y)])
                visited[y][x] = True
                
                while queue:
                    cx, cy = queue.popleft()
                    comp.append((cx, cy))
                    
                    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            if raw_mask[ny][nx] and not visited[ny][nx]:
                                visited[ny][nx] = True
                                queue.append((nx, ny))
                                
                if len(comp) >= min_comp_size:
                    components.append(comp)
                    
    print(f"  Componentes terrestres conservados: {len(components)}")
    
    # Build clean binary mask
    clean_mask = Image.new("L", (w, h), 0)
    mask_pixels = clean_mask.load()
    for comp in components:
        for x, y in comp:
            mask_pixels[x, y] = 255
            
    # Morphological closing: Fill deep shadows/canyons inside the terrain
    clean_mask = clean_mask.filter(ImageFilter.MaxFilter(9))
    clean_mask = clean_mask.filter(ImageFilter.MinFilter(9))
    
    # Smooth optical antialiasing on coastlines
    clean_mask = clean_mask.filter(ImageFilter.GaussianBlur(1.2))
    
    # Composite transparent RGBA image
    rgba_im = im_work.convert("RGBA")
    rgba_im.putalpha(clean_mask)
    
    # Destination paths
    png_path = os.path.join(OUTPUT_DIR, f"map_{country_id}_cutout.png")
    webp_path = os.path.join(OUTPUT_DIR, f"map_{country_id}_cutout.webp")
    
    # Save PNG
    rgba_im.save(png_path, "PNG", optimize=True)
    png_size_kb = os.path.getsize(png_path) / 1024
    print(f"  [OK] PNG guardado: {png_path} ({png_size_kb:.1f} KB)")
    
    # Save WebP with high quality and lossless/efficient compression
    rgba_im.save(webp_path, "WEBP", quality=90, method=6)
    webp_size_kb = os.path.getsize(webp_path) / 1024
    print(f"  [OK] WebP optimizado: {webp_path} ({webp_size_kb:.1f} KB)")
    
    return True

# Ensure Ecuador alias also exists
def ensure_ecuador_alias():
    ecuador_orig = os.path.join(OUTPUT_DIR, "map_3d_relief_cutout.webp")
    ecuador_dest = os.path.join(OUTPUT_DIR, "map_ecuador_cutout.webp")
    if os.path.exists(ecuador_orig) and not os.path.exists(ecuador_dest):
        import shutil
        shutil.copy2(ecuador_orig, ecuador_dest)
        print("  [OK] Alias map_ecuador_cutout.webp creado a partir de map_3d_relief_cutout.webp")
        
    ecuador_png_orig = os.path.join(OUTPUT_DIR, "map_3d_relief_cutout.png")
    ecuador_png_dest = os.path.join(OUTPUT_DIR, "map_ecuador_cutout.png")
    if os.path.exists(ecuador_png_orig) and not os.path.exists(ecuador_png_dest):
        import shutil
        shutil.copy2(ecuador_png_orig, ecuador_png_dest)
        print("  [OK] Alias map_ecuador_cutout.png creado a partir de map_3d_relief_cutout.png")

if __name__ == '__main__':
    print("Iniciando procesamiento de los mapas 3D...")
    for map_cfg in IMAGE_MAPS:
        process_map(map_cfg)
    ensure_ecuador_alias()
    print("\n[OK] Todos los mapas 3D fueron procesados y optimizados con exito!")
