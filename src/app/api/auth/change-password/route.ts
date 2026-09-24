import { NextResponse } from "next/server";
import { getServiceSupabaseClient, supabaseServer } from "@/lib/serverAuth";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { isValidEmail, validateStrongPassword } from "@/lib/userStore";

/**
 * POST /api/auth/change-password
 * Updates a user's password directly in Supabase Auth after validating strong password requirements.
 */
export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, {
    keyPrefix: "auth_change_password",
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.isAllowed) {
    return createRateLimitResponse(
      "Demasiados intentos de cambio de contraseña. Por favor espera un minuto.",
      rateLimit.resetTimeMs
    );
  }

  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json(
        { success: false, error: "Por favor, ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    const pwdCheck = validateStrongPassword(newPassword);
    if (!pwdCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: pwdCheck.error || "La nueva contraseña no cumple con los estándares de seguridad.",
        },
        { status: 400 }
      );
    }

    const adminClient = getServiceSupabaseClient();

    // 1. Try finding the user ID via user_profiles or auth.admin.listUsers
    let targetUserId: string | null = null;

    try {
      const { data: profileRow } = await adminClient
        .from("user_profiles")
        .select("user_id")
        .ilike("email", rawEmail)
        .maybeSingle();

      if (profileRow?.user_id) {
        targetUserId = profileRow.user_id;
      }
    } catch {}

    if (!targetUserId && adminClient.auth?.admin?.listUsers) {
      try {
        const { data: usersList } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const matched = usersList?.users?.find(
          (u) => (u.email || "").toLowerCase().trim() === rawEmail
        );
        if (matched?.id) {
          targetUserId = matched.id;
        }
      } catch {}
    }

    // 2. If targetUserId was resolved and service role privileges are active, update directly
    if (targetUserId && adminClient.auth?.admin?.updateUserById) {
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });

      if (!updateErr) {
        return NextResponse.json({
          success: true,
          mode: "direct",
          message: "Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.",
        });
      }
    }

    // 3. Fallback: trigger Supabase recovery email if direct admin update isn't available
    try {
      const origin = new URL(request.url).origin;
      await supabaseServer.auth.resetPasswordForEmail(rawEmail, {
        redirectTo: `${origin}/auth/login`,
      });
    } catch {}

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "No encontramos una cuenta registrada con ese correo electrónico.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "email_fallback",
      message:
        "Solicitud procesada. Si tu cuenta requiere confirmación por correo, revisa tu bandeja de entrada.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al cambiar la contraseña.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
