import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MASTER_ADMIN_EMAIL = 'admin@lumina.com';
const MAX_INVITED_ADMINS = 3;
const SYS_SESSION_ID = 'SYS_ADMIN_INVITES';

/**
 * Loads the current list of invited secondary admins from the dedicated admin_invitations table
 */
async function loadInvitedAdmins(request?: Request): Promise<string[]> {
  try {
    const supabase = getScopedSupabaseClient(request);
    const { data, error } = await supabase
      .from('admin_invitations')
      .select('email')
      .eq('is_active', true);

    if (!error && Array.isArray(data)) {
      const clean = data
        .map((r) => String(r.email || '').toLowerCase().trim())
        .filter(Boolean)
        .filter((e) => e !== MASTER_ADMIN_EMAIL);

      return Array.from(new Set(clean)).slice(0, MAX_INVITED_ADMINS);
    }
  } catch (err) {
    console.warn('Notice: Failed reading admin_invitations table:', err);
  }

  return [];
}

/**
 * Persists the list of secondary invited admins directly in public.admin_invitations.
 */
async function persistInvitedAdmins(emails: string[], request?: Request): Promise<string[]> {
  const cleanEmails = Array.from(
    new Set(
      emails
        .map((e) => String(e).toLowerCase().trim())
        .filter(Boolean)
        .filter((e) => e !== MASTER_ADMIN_EMAIL)
    )
  ).slice(0, MAX_INVITED_ADMINS);

  try {
    const supabase = getScopedSupabaseClient(request);
    // 1. Remove from admin_invitations any non-master admin that is no longer in the list
    const { data: currentRows } = await supabase
      .from('admin_invitations')
      .select('email')
      .neq('email', MASTER_ADMIN_EMAIL);

    if (currentRows && Array.isArray(currentRows)) {
      for (const row of currentRows) {
        if (!cleanEmails.includes(row.email.toLowerCase())) {
          await supabase
            .from('admin_invitations')
            .delete()
            .eq('email', row.email);
        }
      }
    }

    // 2. Insert or ensure active all current cleanEmails
    for (const email of cleanEmails) {
      await supabase
        .from('admin_invitations')
        .upsert({
          email,
          invited_by: null,
          is_active: true
        }, { onConflict: 'email' });
    }

    // 3. Proactively purge the legacy SYS_ADMIN_INVITES row from active_sessions
    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', SYS_SESSION_ID);
  } catch (sysErr) {
    console.error('Error saving to admin_invitations table:', sysErr);
  }

  return cleanEmails;
}

/**
 * Broadcasts role updates to all active client tabs on the unified 'lumina:roles' channel.
 */
async function broadcastRoleChange(targetEmail: string, role: 'USER' | 'ADMIN', request?: Request) {
  try {
    const supabase = getScopedSupabaseClient(request);
    const rolesChan = supabase.channel('lumina:roles');
    await new Promise<void>((resolve) => {
      rolesChan.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await rolesChan.send({
            type: 'broadcast',
            event: 'role_change',
            payload: { email: targetEmail, role, timestamp: Date.now() },
          });
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          resolve();
        }
      });
      setTimeout(resolve, 600);
    });
  } catch {}
}

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  const isAdmin = authUser?.email ? await verifyIsAdmin(authUser.email) : false;

  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Acceso no autorizado. Se requieren credenciales de administrador.' },
      { status: 401 }
    );
  }

  const invitedAdmins = await loadInvitedAdmins(request);

  return NextResponse.json(
    {
      success: true,
      masterAdmin: MASTER_ADMIN_EMAIL,
      rootAdmin: MASTER_ADMIN_EMAIL,
      invitedAdmins,
      count: invitedAdmins.length,
      maxInvited: MAX_INVITED_ADMINS,
      totalCapacity: MAX_INVITED_ADMINS + 1, // 4 admins total (1 master + 3 invited)
      availableSlots: Math.max(0, MAX_INVITED_ADMINS - invitedAdmins.length),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanRequester = (authUser?.email || '').toLowerCase().trim();

    // STRICT USER REQUIREMENT: Only admin@lumina.com has the right to invite or remove administrators!
    if (cleanRequester !== MASTER_ADMIN_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso denegado. Solo la cuenta de Lumina (${MASTER_ADMIN_EMAIL}) tiene autorización para asignar o revocar administradores.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emails, action, email } = body;

    const currentList = await loadInvitedAdmins(request);

    // 1. Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);

      const saved = await persistInvitedAdmins(nextList, request);

      // Broadcast role revocation in realtime
      await broadcastRoleChange(targetEmail, 'USER', request);

      return NextResponse.json({
        success: true,
        message: `El administrador '${targetEmail}' ha sido revocado.`,
        invitedAdmins: saved,
        count: saved.length,
        availableSlots: MAX_INVITED_ADMINS - saved.length,
      });
    }

    // 2. Handle explicit clear
    if (action === 'clear') {
      const saved = await persistInvitedAdmins([], request);

      for (const prevEmail of currentList) {
        await broadcastRoleChange(prevEmail, 'USER', request);
      }

      return NextResponse.json({
        success: true,
        message: 'Lista de administradores adicionales vaciada.',
        invitedAdmins: saved,
        count: 0,
        availableSlots: MAX_INVITED_ADMINS,
      });
    }

    // 3. Handle incoming list of emails (comma-separated string or array)
    let candidateEmails: string[] = [];
    if (Array.isArray(emails)) {
      candidateEmails = emails;
    } else if (typeof emails === 'string') {
      candidateEmails = emails.split(',').map((e) => e.trim());
    } else if (email) {
      candidateEmails = [email];
    }

    if (!action && candidateEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se indicaron correos para agregar.',
        invitedAdmins: currentList,
        count: currentList.length,
        maxInvited: MAX_INVITED_ADMINS,
        totalCapacity: MAX_INVITED_ADMINS + 1,
        availableSlots: MAX_INVITED_ADMINS - currentList.length,
      });
    }

    // Clean, validate and normalize candidate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanedCandidates: string[] = [];

    for (const raw of candidateEmails) {
      const normalized = String(raw || '').toLowerCase().trim();
      if (!normalized) continue;

      if (!emailRegex.test(normalized)) {
        return NextResponse.json(
          { success: false, error: `El correo '${raw}' no tiene un formato válido.` },
          { status: 400 }
        );
      }

      if (normalized === MASTER_ADMIN_EMAIL) {
        return NextResponse.json(
          { success: false, error: `El correo '${normalized}' es la cuenta Principal del sistema.` },
          { status: 400 }
        );
      }

      if (!cleanedCandidates.includes(normalized)) {
        cleanedCandidates.push(normalized);
      }
    }

    // Merge with current list
    const combined = Array.from(new Set([...currentList, ...cleanedCandidates]));

    // Capacity enforcement: max 3 invited admins
    if (combined.length > MAX_INVITED_ADMINS) {
      return NextResponse.json(
        {
          success: false,
          error: `Capacidad excedida: Solo puedes dar acceso a hasta ${MAX_INVITED_ADMINS} correos administradores adicionales. Actualmente tendrías ${combined.length}.`,
        },
        { status: 400 }
      );
    }

    const saved = await persistInvitedAdmins(combined, request);

    // Broadcast realtime promotion to newly added admins
    for (const addedEmail of cleanedCandidates) {
      await broadcastRoleChange(addedEmail, 'ADMIN', request);
    }

    return NextResponse.json({
      success: true,
      message: 'Lista de administradores actualizada con éxito.',
      invitedAdmins: saved,
      count: saved.length,
      maxInvited: MAX_INVITED_ADMINS,
      totalCapacity: MAX_INVITED_ADMINS + 1,
      availableSlots: MAX_INVITED_ADMINS - saved.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
