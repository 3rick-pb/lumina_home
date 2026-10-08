import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/serverAuth";
import { encryptToken, decryptToken } from "@/lib/encryption";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/google-drive/callback
 * Procesa el callback directo de Google OAuth:
 * 1. Valida el state criptográfico contra la base de datos (prevención CSRF y expiración).
 * 2. Invalida el state inmediatamente (evita replay attacks).
 * 3. Intercambia el código por tokens directo con Google (Backend-to-Backend).
 * 4. Cifra los tokens con AES-256-GCM y los asocia al admin_id.
 * 5. NUNCA toca la sesión de Lumina Home ni crea usuarios en Supabase Auth.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Manejo de rechazo por parte del usuario en Google
  if (errorParam || !code || !state) {
    const errorMsg = errorParam === "access_denied"
      ? "Acceso cancelado: Se requieren permisos de Google Drive para continuar."
      : errorParam || "Parámetros de autorización ausentes.";
    return renderHtmlResponse(origin, false, errorMsg);
  }

  const supabase = getServiceSupabaseClient();

  // 1. Validar state en la base de datos
  const { data: stateRecord, error: stateDbError } = await supabase
    .from("google_drive_oauth_state")
    .select("*")
    .eq("state", state)
    .maybeSingle();

  if (stateDbError || !stateRecord) {
    return renderHtmlResponse(origin, false, "State de autorización no válido o desconocido (HTTP 403).", 403);
  }

  // Verificar que no haya sido utilizado previamente
  if (stateRecord.used) {
    return renderHtmlResponse(origin, false, "El state de autorización ya fue utilizado previamente (HTTP 403).", 403);
  }

  // Verificar expiración (TTL 10 minutos)
  if (new Date(stateRecord.expires_at).getTime() < Date.now()) {
    return renderHtmlResponse(origin, false, "El enlace de autorización ha expirado. Genera una nueva solicitud.", 403);
  }

  // 2. Marcar state como usado de inmediato
  await supabase
    .from("google_drive_oauth_state")
    .update({ used: true })
    .eq("id", stateRecord.id);

  const adminId = stateRecord.admin_id;

  // 3. Intercambio de código por tokens con Google (Servidor a Servidor)
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/admin/google-drive/callback`;

  if (!clientId || !clientSecret) {
    return renderHtmlResponse(origin, false, "Configuración GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET ausente en el servidor.", 500);
  }

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  let tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || tokenRes.statusText;
      return renderHtmlResponse(origin, false, `Fallo en intercambio de tokens de Google: ${errMsg}`, 400);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Google Token API";
    return renderHtmlResponse(origin, false, msg, 500);
  }

  const accessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 3600;
  const expiryIso = new Date(Date.now() + expiresIn * 1000).toISOString();

  // 4. Obtener información de perfil de la cuenta de Google
  let googleEmail = "Google Drive";
  let googleName = "Drive Conectado";
  try {
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userinfoRes.ok) {
      const info = await userinfoRes.json();
      googleEmail = info.email || googleEmail;
      googleName = info.name || info.email?.split("@")[0] || googleName;
    }
  } catch {}

  // 5. Preservar refresh_token anterior si Google no devolvió uno nuevo
  let finalRefreshToken = newRefreshToken;
  if (!finalRefreshToken) {
    const { data: existingRec } = await supabase
      .from("google_drive_credentials")
      .select("refresh_token_encrypted")
      .eq("admin_id", adminId)
      .maybeSingle();

    if (existingRec?.refresh_token_encrypted) {
      finalRefreshToken = decryptToken(existingRec.refresh_token_encrypted);
    }
  }

  // 6. Cifrar tokens con AES-256-GCM
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = finalRefreshToken ? encryptToken(finalRefreshToken) : null;

  // 7. Guardar en google_drive_credentials asociado exclusivamente al admin_id
  const { error: upsertError } = await supabase
    .from("google_drive_credentials")
    .upsert(
      {
        admin_id: adminId,
        google_account_email: googleEmail,
        google_account_name: googleName,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expiry: expiryIso,
        scopes: "https://www.googleapis.com/auth/drive.readonly",
        updated_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "admin_id" }
    );

  if (upsertError) {
    console.error("Error guardando credenciales en base de datos:", upsertError.message);
    return renderHtmlResponse(origin, false, "Error al persistir credenciales de Google Drive en base de datos.", 500);
  }

  // 8. Responder con página segura que notifica al popup y se cierra
  return renderHtmlResponse(origin, true, "Conexión autorizada con éxito.", 200, {
    email: googleEmail,
    name: googleName,
  });
}

function renderHtmlResponse(
  origin: string,
  success: boolean,
  message: string,
  status = 200,
  data?: { email: string; name: string }
) {
  const payloadJson = JSON.stringify({
    type: "GOOGLE_DRIVE_AUTH_SUCCESS",
    success,
    message,
    email: data?.email || "",
    name: data?.name || "",
    timestamp: Date.now(),
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Google Drive - Lumina Home</title>
  <style>
    body { background: #1c1917; color: #f5f5f4; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #292524; border: 1px solid #44403c; border-radius: 16px; padding: 32px; max-width: 360px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .icon { width: 40px; height: 40px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; }
    .success { background: #14532d; color: #4ade80; }
    .error { background: #7f1d1d; color: #f87171; }
    h2 { font-size: 15px; margin: 0 0 8px; font-weight: 600; }
    p { font-size: 12px; margin: 0; color: #a8a29e; line-height: 1.5; }
    .btn { margin-top: 18px; background: #44403c; color: #f5f5f4; border: 1px solid #57534e; border-radius: 10px; padding: 8px 18px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #57534e; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${success ? "success" : "error"}">${success ? "✓" : "!"}</div>
    <h2>${success ? "Google Drive Conectado" : "Error de Conexión"}</h2>
    <p>${message}</p>
    <p style="margin-top: 14px; font-size: 11px; color: #78716c;">${success ? "Ventana autorizada. Cerrando..." : "Puedes cerrar esta ventana e intentar de nuevo."}</p>
    <button type="button" class="btn" onclick="window.close()">Cerrar Ventana</button>
  </div>
  <script>
    (function() {
      var payload = ${payloadJson};

      // 1. Canal BroadcastChannel (funciona de inmediato entre ventanas/pestañas del mismo origen)
      try {
        var bc = new BroadcastChannel("lumina_google_drive_channel");
        bc.postMessage(payload);
        bc.close();
      } catch (e) {}

      // 2. PostMessage si el opener está disponible
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, "*");
        }
      } catch (e) {}



      if (${success ? "true" : "false"}) {
        setTimeout(function() {
          try {
            window.close();
          } catch (e) {}
        }, 1200);
      }
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
