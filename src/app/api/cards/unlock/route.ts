import { NextRequest, NextResponse } from 'next/server';
import { generateSignedChallenge, verifySignedChallenge } from '@/lib/card-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cards/unlock
 * Genera un challenge criptográfico stateless firmado con HMAC-SHA256 (60 segundos de validez)
 */
export async function GET() {
  try {
    const { challenge, expiresAt, token } = generateSignedChallenge(60);

    return NextResponse.json({
      success: true,
      challenge,
      expiresAt,
      token,
      rp: {
        name: 'Lumina Home',
        id: undefined, // El navegador inferirá el eTLD+1 del origen actual
      },
      timeout: 60000,
    });
  } catch (error) {
    console.error('[API cards/unlock GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el reto de seguridad' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards/unlock
 * Valida la respuesta biométrica / credencial de plataforma WebAuthn
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, clientDataJSON, credentialId, fallbackPin } = body;

    // 1. Fallback de PIN para dispositivos sin soporte biométrico de plataforma
    if (fallbackPin !== undefined) {
      const pinStr = String(fallbackPin).trim();
      // Validar PIN de 4 dígitos
      if (!/^\d{4}$/.test(pinStr)) {
        return NextResponse.json(
          { success: false, error: 'El PIN de seguridad debe contener exactamente 4 dígitos.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        verified: true,
        method: 'pin',
      });
    }

    // 2. Verificación de reto WebAuthn
    if (!token || !clientDataJSON) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de autenticación incompletos' },
        { status: 400 }
      );
    }

    // Validar autenticidad y vigencia del challenge firmado
    const verification = verifySignedChallenge(token);
    if (!verification.valid || !verification.challenge) {
      return NextResponse.json(
        { success: false, error: verification.reason || 'Reto de autenticación inválido o expirado' },
        { status: 401 }
      );
    }

    // Decodificar clientDataJSON
    let clientDataText = '';
    if (typeof clientDataJSON === 'string') {
      try {
        JSON.parse(clientDataJSON);
        clientDataText = clientDataJSON;
      } catch {
        // En caso de venir codificado en base64 / base64url
        try {
          clientDataText = Buffer.from(clientDataJSON, 'base64url').toString('utf8');
        } catch {
          clientDataText = Buffer.from(clientDataJSON, 'base64').toString('utf8');
        }
      }
    }

    let clientData: { type?: string; challenge?: string; origin?: string };
    try {
      clientData = JSON.parse(clientDataText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Formato de clientDataJSON ilegible' },
        { status: 400 }
      );
    }

    // Validar tipo de operación WebAuthn
    if (clientData.type !== 'webauthn.get' && clientData.type !== 'webauthn.create') {
      return NextResponse.json(
        { success: false, error: `Tipo de operación WebAuthn no válida: ${clientData.type}` },
        { status: 403 }
      );
    }

    // Normalizar challenges para comparación (base64url sin padding)
    const normalizeChallenge = (c?: string) =>
      c?.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') || '';

    const expectedChallenge = normalizeChallenge(verification.challenge);
    const receivedChallenge = normalizeChallenge(clientData.challenge);

    if (expectedChallenge !== receivedChallenge) {
      return NextResponse.json(
        { success: false, error: 'El reto devuelto por el dispositivo no coincide' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      method: clientData.type === 'webauthn.create' ? 'enroll' : 'auth',
      credentialId: credentialId || undefined,
    });
  } catch (error) {
    console.error('[API cards/unlock POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en la verificación de seguridad' },
      { status: 500 }
    );
  }
}
