const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createOgImage() {
  const width = 1200;
  const height = 630;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background subtle gradient: warm matte melon palette -->
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FCF6EF" />
          <stop offset="50%" stop-color="#FAF1E8" />
          <stop offset="100%" stop-color="#F2E5D5" />
        </linearGradient>

        <!-- Luxury radial glow -->
        <radialGradient id="softGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#FAF1E8" stop-opacity="0" />
        </radialGradient>

        <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8C9276" stop-opacity="0" />
          <stop offset="30%" stop-color="#8C9276" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#C5A059" stop-opacity="0.95" />
          <stop offset="70%" stop-color="#8C9276" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#8C9276" stop-opacity="0" />
        </linearGradient>

        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#242C1C" flood-opacity="0.1" />
        </filter>
      </defs>

      <!-- Background Base -->
      <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
      <rect width="${width}" height="${height}" fill="url(#softGlow)" />

      <!-- Outer Luxury Double Inset Frame -->
      <rect x="36" y="36" width="1128" height="558" rx="20" fill="none" stroke="#E3D5C5" stroke-width="1.5" />
      <rect x="48" y="48" width="1104" height="534" rx="14" fill="none" stroke="#242C1C" stroke-opacity="0.08" stroke-width="1" />

      <!-- Corner Ornamental Crosshairs -->
      <path d="M 60 72 L 72 72 L 72 60" fill="none" stroke="#8C9276" stroke-width="1.5" />
      <path d="M 1140 72 L 1128 72 L 1128 60" fill="none" stroke="#8C9276" stroke-width="1.5" />
      <path d="M 60 558 L 72 558 L 72 570" fill="none" stroke="#8C9276" stroke-width="1.5" />
      <path d="M 1140 558 L 1128 558 L 1128 570" fill="none" stroke="#8C9276" stroke-width="1.5" />

      <!-- TOP: Positioning Micro-Pill (What We Do & Where) -->
      <g transform="translate(600, 108)" text-anchor="middle">
        <rect x="-240" y="-20" width="480" height="40" rx="20" fill="#242C1C" fill-opacity="0.06" stroke="#242C1C" stroke-opacity="0.12" stroke-width="1" />
        <text x="0" y="5" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="#3D4A32">
          MUEBLES DE DISEÑO · PIEZAS DE AUTOR
        </text>
      </g>

      <!-- Decorative Divider Top -->
      <line x1="430" y1="152" x2="770" y2="152" stroke="url(#goldLine)" stroke-width="1.5" />

      <!-- CENTER: Lumina Emblem Vector Icon -->
      <g transform="translate(565, 172) scale(0.18)" filter="url(#subtleShadow)">
        <path
          fill="#1E251A"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M 157.3 14.7 L 18.5 165.0 C 53.7 217.7, 83.8 270.3, 98.5 323.0 C 96.7 270.3, 69.8 217.7, 53.5 165.0 L 160.4 52.3 L 257.5 165.0 C 244.2 213.0, 216.0 261.0, 211.5 309.0 C 227.9 261.0, 258.5 213.0, 288.5 165.0 Z M 242.7 14.7 L 381.5 165.0 C 346.3 217.7, 316.2 270.3, 301.5 323.0 C 303.3 270.3, 330.2 217.7, 346.5 165.0 L 239.6 52.3 L 142.5 165.0 C 155.8 213.0, 184.0 261.0, 188.5 309.0 C 172.1 261.0, 141.5 213.0, 111.5 165.0 Z"
        />
      </g>

      <!-- Brand Name / Centered Title -->
      <g transform="translate(600, 310)" text-anchor="middle">
        <text x="0" y="0" font-family="Georgia, 'Times New Roman', serif" font-size="62" font-weight="bold" letter-spacing="2" fill="#182013">
          Lumina<tspan fill="#8C9276">.</tspan> Home
        </text>
        <text x="0" y="44" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="23" fill="#58634E" letter-spacing="0.5">
          Espacios con Alma y Diseño de Autor
        </text>
      </g>

      <!-- Value Proposition / Hook -->
      <g transform="translate(600, 412)" text-anchor="middle">
        <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="500" fill="#3D4733" letter-spacing="0.6">
          Iluminación Escultural · Decoración Minimalista · Aromaterapia
        </text>
        <g transform="translate(0, 32)">
          <rect x="-210" y="-16" width="420" height="32" rx="16" fill="#8C9276" fill-opacity="0.18" stroke="#8C9276" stroke-opacity="0.4" stroke-width="1" />
          <text x="0" y="5" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#202A19" letter-spacing="1.5">
            ENVÍOS A TODO EL PAÍS · 15% OFF EN TU 1ª COMPRA
          </text>
        </g>
      </g>

      <!-- Decorative Divider Bottom -->
      <line x1="390" y1="506" x2="810" y2="506" stroke="url(#goldLine)" stroke-width="1" />

      <!-- BOTTOM: Domain & Security Badges -->
      <g transform="translate(600, 546)" text-anchor="middle">
        <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="2.5" fill="#182013">
          luminahome-3rick.vercel.app
        </text>
      </g>
    </svg>
  `;

  const publicDir = path.join(__dirname, '..', 'public');
  const targetJpg = path.join(publicDir, 'og-default.jpg');
  const targetPng = path.join(publicDir, 'og-default.png');

  // Generate JPEG (< 300 KB, exactly 1200x630, ultra compatible with WhatsApp crawler)
  const infoJpg = await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(targetJpg);

  const statsJpg = fs.statSync(targetJpg);

  // Also export PNG as backup
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(targetPng);

  const statsPng = fs.statSync(targetPng);

  console.log('✅ Generated og-default.jpg:');
  console.log(`   Dimensions: ${infoJpg.width}x${infoJpg.height} px`);
  console.log(`   File Size: ${(statsJpg.size / 1024).toFixed(2)} KB (Required: < 300 KB)`);
  console.log(`   Destination: ${targetJpg}`);
  console.log(`✅ Generated og-default.png (${(statsPng.size / 1024).toFixed(2)} KB)`);
}

createOgImage().catch(console.error);
