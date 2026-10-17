import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const cardEncryptionKey = crypto.randomBytes(32).toString('hex');
const webauthnSecretKey = crypto.randomBytes(32).toString('hex');

console.log('='.repeat(60));
console.log('🔐 Llaves Criptográficas Lumina Security Generadas:');
console.log('='.repeat(60));
console.log(`CARD_ENCRYPTION_KEY=${cardEncryptionKey}`);
console.log(`WEBAUTHN_SECRET_KEY=${webauthnSecretKey}`);
console.log('='.repeat(60));

// Si existe .env.local, actualizar o agregar manteniendo el contenido existente
if (fs.existsSync(envPath)) {
  let content = fs.readFileSync(envPath, 'utf-8');
  let updated = false;

  if (content.includes('CARD_ENCRYPTION_KEY=')) {
    content = content.replace(/CARD_ENCRYPTION_KEY=.*(?:\r?\n|$)/, `CARD_ENCRYPTION_KEY=${cardEncryptionKey}\n`);
    updated = true;
  } else {
    content += `\n# Lumina Card AES-256-GCM Encryption Key (32 bytes hex)\nCARD_ENCRYPTION_KEY=${cardEncryptionKey}\n`;
    updated = true;
  }

  if (content.includes('WEBAUTHN_SECRET_KEY=')) {
    content = content.replace(/WEBAUTHN_SECRET_KEY=.*(?:\r?\n|$)/, `WEBAUTHN_SECRET_KEY=${webauthnSecretKey}\n`);
    updated = true;
  } else {
    content += `# Lumina WebAuthn Challenge HMAC-SHA256 Secret (32 bytes hex)\nWEBAUTHN_SECRET_KEY=${webauthnSecretKey}\n`;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(envPath, content, 'utf-8');
    console.log('✅ Archivo .env.local actualizado con éxito sin modificar otras variables.');
  }
} else {
  const content = `# Lumina Card AES-256-GCM Encryption Key (32 bytes hex)\nCARD_ENCRYPTION_KEY=${cardEncryptionKey}\n# Lumina WebAuthn Challenge HMAC-SHA256 Secret (32 bytes hex)\nWEBAUTHN_SECRET_KEY=${webauthnSecretKey}\n`;
  fs.writeFileSync(envPath, content, 'utf-8');
  console.log('✅ Archivo .env.local creado con éxito.');
}
