import forge from 'node-forge';

export interface ApplePassSignerResult {
  signature?: Buffer;
  isSigned: boolean;
  warnings?: string[];
  error?: string;
}

/**
 * Normalizes PEM string formatting from environment variables (e.g., replaces literal \n with real newlines).
 */
export function normalizePem(rawPem?: string): string {
  if (!rawPem) return '';
  let cleaned = rawPem.trim();
  if (cleaned.includes('\\n')) {
    cleaned = cleaned.replace(/\\n/g, '\n');
  }
  return cleaned;
}

/**
 * Extracts and parses all certificates in a PEM string (including certificate chains).
 */
function parseCertificatesFromPem(pemStr: string): forge.pki.Certificate[] {
  const certs: forge.pki.Certificate[] = [];
  const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;
  const matches = pemStr.match(certRegex);

  if (!matches || matches.length === 0) {
    try {
      const parsed = forge.pki.certificateFromPem(pemStr);
      if (parsed) certs.push(parsed);
    } catch {
      // Ignore
    }
    return certs;
  }

  for (const block of matches) {
    try {
      const parsed = forge.pki.certificateFromPem(block);
      if (parsed) certs.push(parsed);
    } catch (err) {
      console.warn('[applePassSigner] Could not parse PEM certificate block:', err);
    }
  }

  return certs;
}

/**
 * Parses an RSA private key from PEM, decrypting with passphrase if necessary.
 */
function parsePrivateKeyFromPem(pemStr: string, passphrase?: string): forge.pki.PrivateKey | null {
  try {
    if (passphrase) {
      const decrypted = forge.pki.decryptRsaPrivateKey(pemStr, passphrase);
      if (decrypted) return decrypted;
    }
    return forge.pki.privateKeyFromPem(pemStr);
  } catch (err) {
    console.warn('[applePassSigner] Could not parse private key:', err);
    return null;
  }
}

/**
 * Checks if Apple Wallet credentials are provided in environment variables.
 */
export function isAppleSigningConfigured(): boolean {
  const certPem = normalizePem(process.env.APPLE_PASS_CERT_PEM);
  const keyPem = normalizePem(process.env.APPLE_PASS_KEY_PEM);
  const wwdrPem = normalizePem(process.env.APPLE_WWDR_CERT_PEM);
  return Boolean(
    certPem &&
    certPem.includes('CERTIFICATE') &&
    keyPem &&
    keyPem.includes('KEY') &&
    wwdrPem &&
    wwdrPem.includes('CERTIFICATE')
  );
}

/**
 * Signs the manifest.json buffer using PKCS#7 detached digital signature according to
 * Apple PassKit specifications.
 * 
 * @param manifestBuffer The UTF-8 buffer of manifest.json
 * @returns ApplePassSignerResult containing the DER-encoded signature buffer
 */
export function signApplePassManifest(manifestBuffer: Buffer): ApplePassSignerResult {
  const warnings: string[] = [];

  const rawCertPem = normalizePem(process.env.APPLE_PASS_CERT_PEM);
  const rawKeyPem = normalizePem(process.env.APPLE_PASS_KEY_PEM);
  const rawWwdrPem = normalizePem(process.env.APPLE_WWDR_CERT_PEM);
  const passphrase = process.env.APPLE_PASS_KEY_PASSPHRASE;

  if (!rawCertPem || !rawKeyPem) {
    return {
      isSigned: false,
      error: 'Credenciales de firma de Apple Wallet no configuradas (APPLE_PASS_CERT_PEM o APPLE_PASS_KEY_PEM ausentes).',
    };
  }

  try {
    const passCerts = parseCertificatesFromPem(rawCertPem);
    if (passCerts.length === 0) {
      return {
        isSigned: false,
        error: 'No se pudo interpretar el certificado Pass Type ID (APPLE_PASS_CERT_PEM).',
      };
    }

    const privateKey = parsePrivateKeyFromPem(rawKeyPem, passphrase);
    if (!privateKey) {
      return {
        isSigned: false,
        error: 'No se pudo descifrar o parsear la clave privada de Apple Pass (APPLE_PASS_KEY_PEM).',
      };
    }

    const wwdrCerts = rawWwdrPem ? parseCertificatesFromPem(rawWwdrPem) : [];
    if (wwdrCerts.length === 0) {
      warnings.push('APPLE_WWDR_CERT_PEM no fue provisto; iOS podría requerir la cadena intermedia de Apple WWDR para validar el pase.');
    }

    // Build standard PKCS#7 signedData container
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(manifestBuffer.toString('binary'));

    // Add signer certificate and intermediate chain
    for (const cert of passCerts) {
      p7.addCertificate(cert);
    }
    for (const wwdr of wwdrCerts) {
      p7.addCertificate(wwdr);
    }

    p7.addSigner({
      key: (privateKey || rawKeyPem) as unknown as string,
      certificate: passCerts[0],
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.messageDigest,
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date() as unknown as string,
        },
      ],
    });

    // Generate detached signature (Apple requires detached: true)
    p7.sign({ detached: true });

    const derBytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const signatureBuffer = Buffer.from(derBytes, 'binary');

    return {
      signature: signatureBuffer,
      isSigned: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (signErr) {
    console.error('[applePassSigner] PKCS#7 detached signing error:', signErr);
    return {
      isSigned: false,
      error: `Error al generar la firma PKCS#7: ${String(signErr)}`,
    };
  }
}
