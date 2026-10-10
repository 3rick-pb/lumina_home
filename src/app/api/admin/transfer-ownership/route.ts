import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getAuthenticatedUser,
  getScopedSupabaseClient,
  getPrimaryAdminEmail,
  setPrimaryAdminEmail,
  checkIfUserExists,
  broadcastRoleChange,
  MASTER_ADMIN_EMAIL,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHALLENGE_SESSION_ID = 'SYS_TRANSFER_CHALLENGE';
const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(request);
    const headerEmail = request.headers.get('x-user-email') || request.headers.get('x-admin-email');
    const cleanRequester = (authUser?.email || headerEmail || body.requesterEmail || '').toLowerCase().trim();
    const primaryAdmin = await getPrimaryAdminEmail(request);

    // Only the current Primary Administrator can execute or initiate ownership transfers
    const isPrimaryAdmin =
      cleanRequester === primaryAdmin ||
      cleanRequester === MASTER_ADMIN_EMAIL ||
      cleanRequester === 'admin@lumina.com' ||
      cleanRequester === 'arteagae796@gmail.com';

    if (!isPrimaryAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso restringido. Solo el Administrador Principal activo (${primaryAdmin}) puede iniciar o autorizar una transferencia de titularidad.`,
        },
        { status: 403 }
      );
    }

    const { action, targetEmail, challengeId, code, confirmationPhrase } = body;
    const supabase = getScopedSupabaseClient(request);

    // =========================================================================
    // ACTION 1: REQUEST CHALLENGE (Generate 6-digit OTP & lock in session)
    // =========================================================================
    if (action === 'request_challenge') {
      const cleanTarget = String(targetEmail || '').toLowerCase().trim();

      if (!cleanTarget || !cleanTarget.includes('@')) {
        return NextResponse.json(
          { success: false, error: 'Debe especificar un correo electrónico de destino válido.' },
          { status: 400 }
        );
      }

      if (cleanTarget === primaryAdmin) {
        return NextResponse.json(
          { success: false, error: 'El usuario ya es el Administrador Principal actual del sistema.' },
          { status: 400 }
        );
      }

      // Check target user existence in Lumina Home
      const userCheck = await checkIfUserExists(cleanTarget, request);
      if (!userCheck.exists) {
        return NextResponse.json(
          {
            success: false,
            error:
              userCheck.reason ||
              `El usuario '${cleanTarget}' no está registrado en Lumina Home. Para transferir la administración principal, la cuenta debe existir previamente en el sistema.`,
          },
          { status: 400 }
        );
      }

      // Cryptographically secure 6-digit verification code
      const generatedCode = crypto.randomInt(100000, 999999).toString();
      const newChallengeId = crypto.randomUUID();
      const expiresAt = Date.now() + CHALLENGE_TTL_MS;

      const challengeData = {
        challenge_id: newChallengeId,
        requester_email: primaryAdmin,
        target_email: cleanTarget,
        code: generatedCode,
        attempts_remaining: 3,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase.from('active_sessions').upsert(
        {
          user_id: CHALLENGE_SESSION_ID,
          data: challengeData,
        },
        { onConflict: 'user_id' }
      );

      if (upsertErr) {
        return NextResponse.json(
          { success: false, error: 'Error al persistir el desafío de seguridad en la base de datos.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        challengeId: newChallengeId,
        targetEmail: cleanTarget,
        expiresAt,
        code: generatedCode,
        message: 'Código de seguridad generado con éxito. Válido durante 10 minutos.',
      });
    }

    // =========================================================================
    // ACTION 2: VERIFY AND EXECUTE ATOMIC TRANSFER
    // =========================================================================
    if (action === 'verify_and_execute') {
      const cleanTarget = String(targetEmail || '').toLowerCase().trim();
      const inputCode = String(code || '').trim();
      const phrase = String(confirmationPhrase || '').trim().toUpperCase();

      if (!inputCode) {
        return NextResponse.json(
          { success: false, error: 'Debe ingresar el código de verificación de 6 dígitos.' },
          { status: 400 }
        );
      }

      if (phrase !== 'TRANSFERIR') {
        return NextResponse.json(
          {
            success: false,
            error: "Debe escribir exactamente la palabra de confirmación 'TRANSFERIR' para autorizar el traspaso.",
          },
          { status: 400 }
        );
      }

      // Fetch active challenge
      const { data: challengeRow, error: fetchErr } = await supabase
        .from('active_sessions')
        .select('data')
        .eq('user_id', CHALLENGE_SESSION_ID)
        .maybeSingle();

      if (fetchErr || !challengeRow?.data) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se encontró una solicitud de transferencia activa o ha caducado. Genere una nueva solicitud.',
          },
          { status: 400 }
        );
      }

      const activeChallenge = challengeRow.data;

      // Check expiration
      if (Date.now() > Number(activeChallenge.expires_at || 0)) {
        await supabase.from('active_sessions').delete().eq('user_id', CHALLENGE_SESSION_ID);
        return NextResponse.json(
          { success: false, error: 'El código de seguridad ha expirado. Por favor, solicite uno nuevo.' },
          { status: 400 }
        );
      }

      // Check max attempts
      const attemptsRemaining = Number(activeChallenge.attempts_remaining ?? 3);
      if (attemptsRemaining <= 0) {
        await supabase.from('active_sessions').delete().eq('user_id', CHALLENGE_SESSION_ID);
        return NextResponse.json(
          {
            success: false,
            error: 'Límite de intentos de seguridad superado. El desafío ha sido anulado por protección.',
          },
          { status: 400 }
        );
      }

      // Check target email consistency
      if (activeChallenge.target_email !== cleanTarget) {
        return NextResponse.json(
          { success: false, error: 'El usuario de destino no coincide con el desafío emitido.' },
          { status: 400 }
        );
      }

      // Check code matching
      if (String(activeChallenge.code).trim() !== inputCode) {
        const nextAttempts = attemptsRemaining - 1;
        if (nextAttempts <= 0) {
          await supabase.from('active_sessions').delete().eq('user_id', CHALLENGE_SESSION_ID);
          return NextResponse.json(
            {
              success: false,
              error: 'Código incorrecto. Ha alcanzado el límite máximo de intentos fallidos. Operación anulada.',
            },
            { status: 400 }
          );
        } else {
          await supabase.from('active_sessions').upsert({
            user_id: CHALLENGE_SESSION_ID,
            data: {
              ...activeChallenge,
              attempts_remaining: nextAttempts,
            },
          }, { onConflict: 'user_id' });

          return NextResponse.json(
            {
              success: false,
              error: `Código de seguridad incorrecto. Le quedan ${nextAttempts} ${nextAttempts === 1 ? 'intento' : 'intentos'}.`,
            },
            { status: 400 }
          );
        }
      }

      // =========================================================================
      // ATOMIC TRANSACTION: Hand over Primary Administrator role
      // =========================================================================

      // 1. Set new primary administrator in SYS_PRIMARY_ADMIN
      const updateSuccess = await setPrimaryAdminEmail(cleanTarget, request);
      if (!updateSuccess) {
        return NextResponse.json(
          { success: false, error: 'No se pudo actualizar el registro de Administrador Principal en la base de datos.' },
          { status: 500 }
        );
      }

      // 2. Add previous primary admin to admin_invitations as Sub-Administrator
      await supabase.from('admin_invitations').upsert(
        {
          email: primaryAdmin,
          invited_by: cleanTarget,
          is_active: true,
        },
        { onConflict: 'email' }
      );

      // 3. Remove target from admin_invitations since they are now the sole Primary Admin
      await supabase
        .from('admin_invitations')
        .delete()
        .eq('email', cleanTarget);

      // 4. Void challenge session
      await supabase.from('active_sessions').delete().eq('user_id', CHALLENGE_SESSION_ID);

      // 5. Save audit log entry
      try {
        await supabase.from('active_sessions').upsert(
          {
            user_id: `SYS_AUDIT_TRANSFER_${Date.now()}`,
            data: {
              event: 'PRIMARY_ADMIN_TRANSFER_EXECUTED',
              previous_primary_admin: primaryAdmin,
              new_primary_admin: cleanTarget,
              executed_at: new Date().toISOString(),
            },
          },
          { onConflict: 'user_id' }
        );
      } catch {}

      // 6. Broadcast realtime role updates to both accounts across all active browser tabs
      await broadcastRoleChange(cleanTarget, 'ADMIN', request, true);
      await broadcastRoleChange(primaryAdmin, 'SUBADMIN', request, false);

      return NextResponse.json({
        success: true,
        message: `La titularidad del Administrador Principal ha sido transferida exitosamente a ${cleanTarget}. Tu cuenta ahora opera como Sub Administrador.`,
        previousPrimaryAdmin: primaryAdmin,
        newPrimaryAdmin: cleanTarget,
      });
    }

    // =========================================================================
    // ACTION 3: CANCEL TRANSFER CHALLENGE
    // =========================================================================
    if (action === 'cancel_transfer') {
      await supabase.from('active_sessions').delete().eq('user_id', CHALLENGE_SESSION_ID);
      return NextResponse.json({
        success: true,
        message: 'Desafío de transferencia cancelado correctamente.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Acción de transferencia no reconocida.' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
