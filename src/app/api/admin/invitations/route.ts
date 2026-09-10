import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MASTER_ADMIN_EMAIL = 'admin@lumina.com';
const ROOT_ADMIN_EMAILS = ['admin@lumina.com', 'arteagae796@gmail.com'];
const MAX_INVITED_ADMINS = 3;
const SYS_SESSION_ID = 'SYS_ADMIN_INVITES';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const baseSupabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Loads the current list of invited secondary admins from the cloud source of truth:
 * active_sessions row with user_id = 'SYS_ADMIN_INVITES'
 */
async function loadInvitedAdmins(): Promise<string[]> {
  try {
    const { data: sysRow, error: sysErr } = await baseSupabase
      .from('active_sessions')
      .select('email')
      .eq('user_id', SYS_SESSION_ID)
      .maybeSingle();

    if (!sysErr && sysRow?.email) {
      try {
        const parsed = JSON.parse(sysRow.email);
        if (Array.isArray(parsed)) {
          const clean = parsed
            .map((e) => String(e || '').toLowerCase().trim())
            .filter(Boolean)
            .filter((e) => e !== MASTER_ADMIN_EMAIL && !ROOT_ADMIN_EMAILS.includes(e));

          return Array.from(new Set(clean)).slice(0, MAX_INVITED_ADMINS);
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Notice: Failed reading active_sessions for admin invites:', err);
  }

  return [];
}

/**
 * Persists the list of secondary invited admins in active_sessions (SYS_ADMIN_INVITES).
 * Guarantees permanent updates and deletes across refreshes.
 */
async function persistInvitedAdmins(emails: string[]): Promise<string[]> {
  const cleanEmails = Array.from(
    new Set(
      emails
        .map((e) => String(e).toLowerCase().trim())
        .filter(Boolean)
        .filter((e) => e !== MASTER_ADMIN_EMAIL && !ROOT_ADMIN_EMAILS.includes(e))
    )
  ).slice(0, MAX_INVITED_ADMINS);

  try {
    await baseSupabase.from('active_sessions').upsert({
      user_id: SYS_SESSION_ID,
      name: 'SYS_CONFIG',
      email: JSON.stringify(cleanEmails),
      current_section: 'SYSTEM_CONFIG',
      is_online: false,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (sysErr) {
    console.error('Error saving to active_sessions cloud store:', sysErr);
  }

  return cleanEmails;
}

/**
 * Broadcasts role updates to all active client tabs on the unified 'lumina:roles' channel.
 */
async function broadcastRoleChange(targetEmail: string, role: 'USER' | 'ADMIN') {
  try {
    const rolesChan = baseSupabase.channel('lumina:roles');
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

  const invitedAdmins = await loadInvitedAdmins();

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

    const currentList = await loadInvitedAdmins();

    // 1. Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);

      const saved = await persistInvitedAdmins(nextList);

      // Broadcast role revocation in realtime
      await broadcastRoleChange(targetEmail, 'USER');

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
      const saved = await persistInvitedAdmins([]);

      for (const prevEmail of currentList) {
        await broadcastRoleChange(prevEmail, 'USER');
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

      if (normalized === MASTER_ADMIN_EMAIL || ROOT_ADMIN_EMAILS.includes(normalized)) {
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

    const saved = await persistInvitedAdmins(combined);

    // Broadcast realtime promotion to newly added admins
    for (const addedEmail of cleanedCandidates) {
      await broadcastRoleChange(addedEmail, 'ADMIN');
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
