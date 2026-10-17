const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createOgImage() {
  const width = 1200;
  const height = 630;

  // Diseño: Tarjeta de información rápida limpia, moderna y directa
  // Sin marcos universitarios, sin cruces ornamentales ni líneas académicas
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Fondo suave mate tono melón bajito brandeado Lumina -->
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FCF8F3" />
          <stop offset="50%" stop-color="#FAF1E8" />
          <stop offset="100%" stop-color="#F2E6D8" />
        </linearGradient>

        <!-- Sombra moderna, sutil y flotante para la tarjeta -->
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#1A2114" flood-opacity="0.08" />
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1A2114" flood-opacity="0.04" />
        </filter>
      </defs>

      <!-- Fondo Lienzo -->
      <rect width="${width}" height="${height}" fill="url(#bg)" />

      <!-- Tarjeta de Información Rápida Flotante -->
      <g filter="url(#cardShadow)">
        <rect 
          x="160" 
          y="95" 
          width="880" 
          height="440" 
          rx="32" 
          fill="#FFFFFF" 
          stroke="#EDE4D8" 
          stroke-width="1.5" 
        />
      </g>

      <!-- Contenido Interior de la Tarjeta -->
      <!-- 1. Emblema Lumina Arcos Diamante Gemelos -->
      <g transform="translate(567, 145) scale(0.17)">
        <path
          fill="#1C2417"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M 157.3 14.7 L 18.5 165.0 C 53.7 217.7, 83.8 270.3, 98.5 323.0 C 96.7 270.3, 69.8 217.7, 53.5 165.0 L 160.4 52.3 L 257.5 165.0 C 244.2 213.0, 216.0 261.0, 211.5 309.0 C 227.9 261.0, 258.5 213.0, 288.5 165.0 Z M 242.7 14.7 L 381.5 165.0 C 346.3 217.7, 316.2 270.3, 301.5 323.0 C 303.3 270.3, 330.2 217.7, 346.5 165.0 L 239.6 52.3 L 142.5 165.0 C 155.8 213.0, 184.0 261.0, 188.5 309.0 C 172.1 261.0, 141.5 213.0, 111.5 165.0 Z"
        />
      </g>

      <!-- 2. Nombre de la Marca -->
      <g transform="translate(600, 285)" text-anchor="middle">
        <text 
          x="0" 
          y="0" 
          font-family="Georgia, 'Times New Roman', serif" 
          font-size="62" 
          font-weight="bold" 
          letter-spacing="1" 
          fill="#182013"
        >
          Lumina<tspan fill="#8C9276">.</tspan> Home
        </text>
      </g>

      <!-- 3. Frase / Descripción solicitada por el usuario -->
      <g transform="translate(600, 350)" text-anchor="middle">
        <text 
          x="0" 
          y="0" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="26" 
          font-weight="500" 
          letter-spacing="0.2" 
          fill="#4A5543"
        >
          Descubre piezas de diseño y mucho más
        </text>
      </g>

      <!-- 4. Píldora moderna inferior con el dominio -->
      <g transform="translate(600, 442)" text-anchor="middle">
        <rect 
          x="-170" 
          y="-20" 
          width="340" 
          height="40" 
          rx="20" 
          fill="#FAF4EC" 
          stroke="#E5DACD" 
          stroke-width="1" 
        />
        <text 
          x="0" 
          y="6" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="14" 
          font-weight="600" 
          letter-spacing="1.5" 
          fill="#222B1B"
        >
          luminahome-3rick.vercel.app
        </text>
      </g>
    </svg>
  `;

  const publicDir = path.join(__dirname, '..', 'public');
  const targetJpg = path.join(publicDir, 'og-default.jpg');
  const targetPng = path.join(publicDir, 'og-default.png');

  // Generar JPEG (< 300 KB, compatible 100% WhatsApp, 1200x630)
  const infoJpg = await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(targetJpg);

  const statsJpg = fs.statSync(targetJpg);

  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(targetPng);

  const statsPng = fs.statSync(targetPng);

  console.log('✅ Tarjeta de información rápida generada:');
  console.log(`   Dimensiones: ${infoJpg.width}x${infoJpg.height} px`);
  console.log(`   Tamaño JPEG: ${(statsJpg.size / 1024).toFixed(2)} KB (Requisito: < 300 KB)`);
  console.log(`   Tamaño PNG: ${(statsPng.size / 1024).toFixed(2)} KB`);
}

createOgImage().catch(console.error);
