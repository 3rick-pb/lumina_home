import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedUser, verifyIsAdmin, getServiceSupabaseClient } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/google-drive/auth
 * Inicia el flujo OAuth 2.0 de forma segura:
 * 1. Verifica que quien solicita sea administrador de Lumina Home.
 * 2. Genera un state criptográfico único para prevenir CSRF.
 * 3. Asocia el state al admin_id con un TTL de 10 minutos.
 * 4. Devuelve la URL de consentimiento directo de Google.
 */
export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !authUser.id || !authUser.email) {
      return NextResponse.json(
        { success: false, error: "No autenticado en Lumina Home." },
        { status: 401 }
      );
    }

    const isAdmin = await verifyIsAdmin(authUser.email, request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: Se requiere rol de administrador." },
        { status: 403 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_CLIENT_ID no está configurado en el servidor." },
        { status: 500 }
      );
    }

    // Resolver redirect_uri
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/admin/google-drive/callback`;

    // Generar state criptográficamente seguro (32 bytes urlsafe)
    const state = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

    // Almacenar state en google_drive_oauth_state asociado al admin_id
    const supabase = getServiceSupabaseClient();
    const { error: stateError } = await supabase.from("google_drive_oauth_state").insert({
      state,
      admin_id: authUser.id,
      expires_at: expiresAt,
      used: false,
    });

    if (stateError) {
      console.error("Error guardando oauth state:", stateError.message);
      return NextResponse.json(
        { success: false, error: "Error al registrar estado de seguridad OAuth." },
        { status: 500 }
      );
    }

    // Parámetros OAuth según especificación estricta
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      success: true,
      url: googleAuthUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno al iniciar OAuth";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
