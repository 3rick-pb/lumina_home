import cv2
import numpy as np
import os
import sys

def main():
    print("Starting 4K Photorealistic Hero Relighting Engine...")
    
    master_path = r'c:\Users\WinterOS\Desktop\Test_Antigravity\lumina-home\public\images\hero\Lumina_Hero_Original.jpg'
    if not os.path.exists(master_path):
        print(f"Error: master image not found at {master_path}")
        sys.exit(1)
        
    master = cv2.imread(master_path)
    h, w, _ = master.shape
    print(f"Loaded Master: {w}x{h}")
    
    # 1. Color science: sRGB <-> Linear RGB
    def srgb_to_linear(x):
        return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)

    def linear_to_srgb(x):
        x = np.clip(x, 0.0, 1.0)
        return np.where(x <= 0.0031308, x * 12.92, 1.055 * (x ** (1.0 / 2.4)) - 0.055)

    # Split master into linear float channels [0, 1]
    b, g, r = cv2.split(master.astype(np.float32) / 255.0)
    lin_r = srgb_to_linear(r)
    lin_g = srgb_to_linear(g)
    lin_b = srgb_to_linear(b)
    
    # 2. Coordinate grids
    Y, X = np.ogrid[:h, :w]
    X_norm = X.astype(np.float32) / w  # 0 at left (window), 1 at right
    Y_norm = Y.astype(np.float32) / h  # 0 at top, 1 at bottom
    
    # 3. Geometric and optical positions of both lamps
    lamp_l_pos = (1009, 2162)
    lamp_r_pos = (3183, 2016)
    
    # Lampshade inner emission masks (soft-edged super-ellipses)
    mask_shade_l = np.exp(-(((X - lamp_l_pos[0]) / 210.0)**4 + ((Y - lamp_l_pos[1]) / 170.0)**4)).astype(np.float32)
    mask_shade_r = np.exp(-(((X - lamp_r_pos[0]) / 210.0)**4 + ((Y - lamp_r_pos[1]) / 170.0)**4)).astype(np.float32)
    
    # Atmospheric bloom halos around the lampshades
    bloom_l = np.exp(-(((X - lamp_l_pos[0]) / 420.0)**2 + ((Y - lamp_l_pos[1]) / 350.0)**2)).astype(np.float32)
    bloom_r = np.exp(-(((X - lamp_r_pos[0]) / 420.0)**2 + ((Y - lamp_r_pos[1]) / 350.0)**2)).astype(np.float32)
    
    # Radial inverse-square light falloff for table, books, and wall
    d_l = np.sqrt(((X - lamp_l_pos[0]) / 1.35)**2 + ((Y - lamp_l_pos[1]) / 1.0)**2)
    d_r = np.sqrt(((X - lamp_r_pos[0]) / 1.35)**2 + ((Y - lamp_r_pos[1]) / 1.0)**2)
    
    falloff_l = (1.0 / (1.0 + (d_l / 580.0)**2)).astype(np.float32)
    falloff_r = (1.0 / (1.0 + (d_r / 580.0)**2)).astype(np.float32)
    
    # Table boost: light pools downward onto console surface and upward onto lower frames
    table_direction_l = np.clip(1.0 + (Y - lamp_l_pos[1]) / 900.0, 0.45, 1.45).astype(np.float32)
    table_direction_r = np.clip(1.0 + (Y - lamp_r_pos[1]) / 900.0, 0.45, 1.45).astype(np.float32)
    
    lamp_light_field = np.maximum(falloff_l * table_direction_l, falloff_r * table_direction_r)
    lamp_bloom_field = np.maximum(bloom_l, bloom_r)
    lamp_shade_field = np.maximum(mask_shade_l, mask_shade_r)

    # Window directional light fields
    # Window is on left (X=0)
    window_wash_left = np.exp(-X_norm / 0.45).astype(np.float32)
    window_wash_sunset = np.exp(-X_norm / 0.58).astype(np.float32)
    
    # ==========================================
    # PHASE 1: AMANECER (Sunrise / Dawn)
    # ==========================================
    print("Rendering Amanecer (Sunrise)...")
    # Soft golden dawn light entering from window, lamps off
    sun_beam = window_wash_left * (0.85 + 0.35 * Y_norm)
    
    amanecer_r = lin_r * (1.12 + 0.28 * sun_beam) + 0.04 * sun_beam
    amanecer_g = lin_g * (1.04 + 0.16 * sun_beam) + 0.025 * sun_beam
    amanecer_b = lin_b * (0.92 + 0.08 * sun_beam) + 0.01 * sun_beam
    
    amanecer_out = cv2.merge([
        linear_to_srgb(amanecer_b),
        linear_to_srgb(amanecer_g),
        linear_to_srgb(amanecer_r)
    ])
    amanecer_u8 = (amanecer_out * 255.0).astype(np.uint8)
    
    # ==========================================
    # PHASE 3: ATARDECER (Sunset / Golden Hour)
    # ==========================================
    print("Rendering Atardecer (Sunset)...")
    # Rich amber/honey golden hour glow from low sun, lamps off
    sunset_beam = window_wash_sunset * (0.95 + 0.25 * Y_norm)
    
    atardecer_r = lin_r * (1.26 + 0.38 * sunset_beam) + 0.06 * sunset_beam
    atardecer_g = lin_g * (1.02 + 0.18 * sunset_beam) + 0.03 * sunset_beam
    atardecer_b = lin_b * (0.72 + 0.06 * sunset_beam) + 0.005 * sunset_beam
    
    atardecer_out = cv2.merge([
        linear_to_srgb(atardecer_b),
        linear_to_srgb(atardecer_g),
        linear_to_srgb(atardecer_r)
    ])
    atardecer_u8 = (atardecer_out * 255.0).astype(np.uint8)

    # Lampshade fabric masks (only illuminates the actual lampshade fabric, not the air/wall around it)
    gray_m = cv2.cvtColor(master, cv2.COLOR_BGR2GRAY) / 255.0
    shade_geo_l = np.exp(-(((X - lamp_l_pos[0]) / 185.0)**4 + ((Y - lamp_l_pos[1]) / 145.0)**4)).astype(np.float32)
    shade_geo_r = np.exp(-(((X - lamp_r_pos[0]) / 185.0)**4 + ((Y - lamp_r_pos[1]) / 145.0)**4)).astype(np.float32)
    shade_geo = np.maximum(shade_geo_l, shade_geo_r)
    # Modulated by actual brightness so it only hits the fabric and bulb area
    fabric_mask = shade_geo * np.clip((gray_m - 0.35) / 0.45, 0.0, 1.0).astype(np.float32)
    # Inner core (bulb glow)
    core_mask = shade_geo * np.clip((gray_m - 0.60) / 0.30, 0.0, 1.0).astype(np.float32)

    # Multiplicative light pools on table & surfaces
    lamp_pool_mult = lamp_light_field

    # ==========================================
    # PHASE 4: CREPÚSCULO (Twilight / Blue Hour)
    # ==========================================
    print("Rendering Crepúsculo (Twilight + Multiplicative Lamps ON)...")
    # Ambient: cool blue hour, ~50% daylight, zero milky fog
    crep_ambient_r = 0.50 + 0.02 * window_wash_left
    crep_ambient_g = 0.56 + 0.04 * window_wash_left
    crep_ambient_b = 0.68 + 0.12 * window_wash_left

    # Lamp light pool: warm golden 2700K (multiplicative on surface texture)
    crep_lamp_r = 0.90 * lamp_pool_mult * 1.35
    crep_lamp_g = 0.90 * lamp_pool_mult * 1.05
    crep_lamp_b = 0.90 * lamp_pool_mult * 0.65

    mult_crep_r = crep_ambient_r + crep_lamp_r
    mult_crep_g = crep_ambient_g + crep_lamp_g
    mult_crep_b = crep_ambient_b + crep_lamp_b

    crep_r = lin_r * mult_crep_r + fabric_mask * 0.55 + core_mask * 0.25
    crep_g = lin_g * mult_crep_g + fabric_mask * 0.42 + core_mask * 0.20
    crep_b = lin_b * mult_crep_b + fabric_mask * 0.20 + core_mask * 0.10

    # Contrast curve: keeps shadows rich and deep, highlights crisp
    crep_r = np.clip(crep_r, 0.0, 1.0) ** 1.05
    crep_g = np.clip(crep_g, 0.0, 1.0) ** 1.05
    crep_b = np.clip(crep_b, 0.0, 1.0) ** 1.05

    crep_out = cv2.merge([
        linear_to_srgb(crep_b),
        linear_to_srgb(crep_g),
        linear_to_srgb(crep_r)
    ])
    crep_u8 = (crep_out * 255.0).astype(np.uint8)

    # ==========================================
    # PHASE 5: NOCHE (Night + Lamps ON Brightly)
    # ==========================================
    print("Rendering Noche (Night + Pure Blacks + Multiplicative Lamps ON)...")
    # Ambient: deep nighttime, ~20% daylight (deep slate/charcoal, zero milky veil)
    noche_ambient_r = 0.18
    noche_ambient_g = 0.19
    noche_ambient_b = 0.23 + 0.02 * window_wash_left

    # Lamp light pool: rich incandescent 2400K (multiplicative)
    noche_lamp_r = 1.15 * lamp_pool_mult * 1.45
    noche_lamp_g = 1.15 * lamp_pool_mult * 1.10
    noche_lamp_b = 1.15 * lamp_pool_mult * 0.55

    mult_noche_r = noche_ambient_r + noche_lamp_r
    mult_noche_g = noche_ambient_g + noche_lamp_g
    mult_noche_b = noche_ambient_b + noche_lamp_b

    noche_r = lin_r * mult_noche_r + fabric_mask * 0.75 + core_mask * 0.35
    noche_g = lin_g * mult_noche_g + fabric_mask * 0.58 + core_mask * 0.28
    noche_b = lin_b * mult_noche_b + fabric_mask * 0.28 + core_mask * 0.14

    # Contrast curve: deep inky blacks, punchy warm highlights
    noche_r = np.clip(noche_r, 0.0, 1.0) ** 1.08
    noche_g = np.clip(noche_g, 0.0, 1.0) ** 1.08
    noche_b = np.clip(noche_b, 0.0, 1.0) ** 1.08

    night_out = cv2.merge([
        linear_to_srgb(noche_b),
        linear_to_srgb(noche_g),
        linear_to_srgb(noche_r)
    ])
    night_u8 = (night_out * 255.0).astype(np.uint8)

    # Save to public/images/hero/ (preserving 4K PNG/JPEG resolution)
    out_dir = r'c:\Users\WinterOS\Desktop\Test_Antigravity\lumina-home\public\images\hero'
    
    png_opts = [cv2.IMWRITE_PNG_COMPRESSION, 9]
    cv2.imwrite(os.path.join(out_dir, 'Amanecer_clean.png'), amanecer_u8, png_opts)
    print("Saved public/images/hero/Amanecer_clean.png")
    
    cv2.imwrite(os.path.join(out_dir, 'Atardecer_clean.png'), atardecer_u8, png_opts)
    print("Saved public/images/hero/Atardecer_clean.png")
    
    cv2.imwrite(os.path.join(out_dir, 'Crepusculo_clean.png'), crep_u8, png_opts)
    print("Saved public/images/hero/Crepusculo_clean.png")
    
    cv2.imwrite(os.path.join(out_dir, 'Noche_clean.png'), night_u8, png_opts)
    print("Saved public/images/hero/Noche_clean.png")

    # Generate verification collage artifacts
    artifact_dir = r'C:\Users\WinterOS\.gemini\antigravity\brain\201eb56a-18f0-4c5a-bb92-a1ff9829a921'
    
    # 1. Full view thumbnails collage (960x700 each)
    thumb_amanecer = cv2.resize(amanecer_u8, (480, 350))
    thumb_master = cv2.resize(master, (480, 350))
    thumb_atardecer = cv2.resize(atardecer_u8, (480, 350))
    thumb_crep = cv2.resize(crep_u8, (480, 350))
    thumb_noche = cv2.resize(night_u8, (480, 350))
    
    # Label each thumbnail
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(thumb_amanecer, '1. Amanecer (Dawn)', (20, 35), font, 0.7, (255, 255, 255), 2)
    cv2.putText(thumb_master, '2. Medio Dia (Master 4K)', (20, 35), font, 0.7, (255, 255, 255), 2)
    cv2.putText(thumb_atardecer, '3. Atardecer (Sunset)', (20, 35), font, 0.7, (255, 255, 255), 2)
    cv2.putText(thumb_crep, '4. Crepusculo (Lamps ON)', (20, 35), font, 0.7, (255, 255, 255), 2)
    cv2.putText(thumb_noche, '5. Noche (Night Interior)', (20, 35), font, 0.7, (255, 255, 255), 2)
    
    row1 = np.hstack([thumb_amanecer, thumb_master, thumb_atardecer])
    row2 = np.hstack([thumb_crep, thumb_noche, np.zeros_like(thumb_noche)])
    collage_full = np.vstack([row1, row2])
    cv2.imwrite(os.path.join(artifact_dir, 'all_5_phases_full.jpg'), collage_full, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("Saved all_5_phases_full.jpg")

    # 2. Boy face zoom-in comparison (500x500 crop of top-row portrait)
    # y: 450..950, x: 1950..2450
    crop_face_am = cv2.resize(amanecer_u8[450:950, 1950:2450], (300, 300))
    crop_face_md = cv2.resize(master[450:950, 1950:2450], (300, 300))
    crop_face_at = cv2.resize(atardecer_u8[450:950, 1950:2450], (300, 300))
    crop_face_cr = cv2.resize(crep_u8[450:950, 1950:2450], (300, 300))
    crop_face_no = cv2.resize(night_u8[450:950, 1950:2450], (300, 300))
    
    cv2.putText(crop_face_am, 'Amanecer', (10, 30), font, 0.6, (0, 255, 255), 2)
    cv2.putText(crop_face_md, 'Medio Dia', (10, 30), font, 0.6, (0, 255, 0), 2)
    cv2.putText(crop_face_at, 'Atardecer', (10, 30), font, 0.6, (0, 200, 255), 2)
    cv2.putText(crop_face_cr, 'Crepusculo', (10, 30), font, 0.6, (255, 200, 0), 2)
    cv2.putText(crop_face_no, 'Noche', (10, 30), font, 0.6, (200, 200, 255), 2)
    
    face_strip = np.hstack([crop_face_am, crop_face_md, crop_face_at, crop_face_cr, crop_face_no])
    cv2.imwrite(os.path.join(artifact_dir, 'face_preservation_strip.jpg'), face_strip, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print("Saved face_preservation_strip.jpg")

    # 3. Lamp zoom-in comparison
    crop_lamp_am = cv2.resize(amanecer_u8[1850:2550, 650:1350], (300, 300))
    crop_lamp_md = cv2.resize(master[1850:2550, 650:1350], (300, 300))
    crop_lamp_at = cv2.resize(atardecer_u8[1850:2550, 650:1350], (300, 300))
    crop_lamp_cr = cv2.resize(crep_u8[1850:2550, 650:1350], (300, 300))
    crop_lamp_no = cv2.resize(night_u8[1850:2550, 650:1350], (300, 300))
    
    cv2.putText(crop_lamp_am, 'Off (Amanecer)', (10, 30), font, 0.6, (0, 255, 255), 2)
    cv2.putText(crop_lamp_md, 'Off (Medio Dia)', (10, 30), font, 0.6, (0, 255, 0), 2)
    cv2.putText(crop_lamp_at, 'Off (Atardecer)', (10, 30), font, 0.6, (0, 200, 255), 2)
    cv2.putText(crop_lamp_cr, 'ON (Crepusculo)', (10, 30), font, 0.6, (0, 255, 255), 2)
    cv2.putText(crop_lamp_no, 'ON (Noche)', (10, 30), font, 0.6, (0, 255, 255), 2)
    
    lamp_strip = np.hstack([crop_lamp_am, crop_lamp_md, crop_lamp_at, crop_lamp_cr, crop_lamp_no])
    cv2.imwrite(os.path.join(artifact_dir, 'lamps_lighting_strip.jpg'), lamp_strip, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print("Saved lamps_lighting_strip.jpg")
    print("Photorealistic relighting finished successfully!")

if __name__ == '__main__':
    main()
