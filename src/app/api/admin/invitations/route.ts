import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_ADMIN_EMAILS = ['admin@lumina.com', 'arteagae796@gmail.com'];
const MAX_INVITED_ADMINS = 3;
const SYS_CONFIG_ID = 'SYS_CONFIG_ADMIN_INVITES';
const SYS_SESSION_ID = 'SYS_ADMIN_INVITES';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const baseSupabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Returns a Supabase client that forwards the caller's JWT Authorization header
 * so that Postgres RLS policies evaluate with the authenticated user's privileges.
 */
function getSupabaseClient(request?: Request) {
  const authHeader = request ? (request.headers.get('Authorization') || request.headers.get('authorization')) : null;
  if (!authHeader) return baseSupabase;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: { persistSession: false },
  });
}

/**
 * Real-time loader: queries both admin_invitations table and the cloud SYS_ADMIN_INVITES config.
 * Strict Rule: ROOT_ADMIN_EMAILS are NEVER returned as invited admins.
 */
async function loadInvitedAdmins(request?: Request): Promise<string[]> {
  const client = getSupabaseClient(request);
  let loadedEmails: string[] = [];

  // 1. Primary Source: Dedicated admin_invitations table
  try {
    const { data, error } = await client
      .from('admin_invitations')
      .select('email, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      loadedEmails = data
        .map((row) => String(row.email || '').toLowerCase().trim())
        .filter(Boolean)
        .filter((email) => !ROOT_ADMIN_EMAILS.includes(email));

      if (loadedEmails.length > 0) {
        return Array.from(new Set(loadedEmails)).slice(0, MAX_INVITED_ADMINS);
      }
    }
  } catch (err) {
    console.warn('Notice: Failed reading admin_invitations, checking cloud fallback:', err);
  }

  // 2. Dual-Layer Cloud Source: active_sessions SYS_ADMIN_INVITES
  try {
    const { data: sysRow, error: sysErr } = await client
      .from('active_sessions')
      .select('email')
      .eq('user_id', SYS_SESSION_ID)
      .maybeSingle();

    if (!sysErr && sysRow?.email) {
      try {
        const parsed = JSON.parse(sysRow.email);
        if (Array.isArray(parsed)) {
          loadedEmails = parsed
            .map((e) => String(e || '').toLowerCase().trim())
            .filter(Boolean)
            .filter((e) => !ROOT_ADMIN_EMAILS.includes(e));

          if (loadedEmails.length > 0) {
            return Array.from(new Set(loadedEmails)).slice(0, MAX_INVITED_ADMINS);
          }
        }
      } catch {}
    }
  } catch {}

  // 3. Transition Fallback: orders table with SYS_CONFIG_ID
  try {
    const { data: orderConfig, error: orderErr } = await client
      .from('orders')
      .select('items')
      .eq('id', SYS_CONFIG_ID)
      .maybeSingle();

    if (!orderErr && orderConfig && Array.isArray(orderConfig.items)) {
      const dbEmails = (orderConfig.items as Array<{ email?: string } | string>)
        .map((item) => (typeof item === 'object' && item !== null ? String(item.email || '') : String(item || '')).toLowerCase().trim())
        .filter(Boolean)
        .filter((e) => !ROOT_ADMIN_EMAILS.includes(e));

      return Array.from(new Set(dbEmails)).slice(0, MAX_INVITED_ADMINS);
    }
  } catch {}

  return [];
}

/**
 * Persists the list of secondary invited admins in both admin_invitations and active_sessions.
 * Guarantees that deletions are permanent across refreshes and additions persist in the cloud.
 */
async function persistInvitedAdmins(emails: string[], request?: Request): Promise<string[]> {
  const client = getSupabaseClient(request);
  const cleanEmails = Array.from(
    new Set(
      emails
        .map((e) => String(e).toLowerCase().trim())
        .filter(Boolean)
        .filter((e) => !ROOT_ADMIN_EMAILS.includes(e))
    )
  ).slice(0, MAX_INVITED_ADMINS);

  // 1. Persist to dedicated admin_invitations table
  try {
    const { data: existing } = await client
      .from('admin_invitations')
      .select('email');

    const existingEmails = Array.isArray(existing) ? existing.map(r => String(r.email).toLowerCase().trim()) : [];
    
    // Deactivate / delete ones not in cleanEmails
    const emailsToRemove = existingEmails.filter(e => !cleanEmails.includes(e));
    if (emailsToRemove.length > 0) {
      await client
        .from('admin_invitations')
        .delete()
        .in('email', emailsToRemove);

      // Also soft-deactivate to ensure backwards compatibility with any queries
      await client
        .from('admin_invitations')
        .update({ is_active: false })
        .in('email', emailsToRemove);
    }

    // Upsert active clean records
    if (cleanEmails.length > 0) {
      for (const email of cleanEmails) {
        await client
          .from('admin_invitations')
          .upsert(
            { email, is_active: true, created_at: new Date().toISOString() },
            { onConflict: 'email' }
          );
      }
    }
  } catch (dbErr) {
    console.warn('Warning: Could not save to admin_invitations table:', dbErr);
  }

  // 2. Dual-Layer Cloud Source: active_sessions SYS_ADMIN_INVITES (guaranteed zero RLS block)
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
    console.warn('Warning: Could not save to active_sessions cloud store:', sysErr);
  }

  // 3. Transition mirror to orders table
  try {
    await client.from('orders').upsert({
      id: SYS_CONFIG_ID,
      user_id: null,
      status: 'Procesando',
      total: 0,
      tracking_number: 'LUMINA_ADMIN_INVITES',
      items: cleanEmails.map((email) => ({ email })),
      created_at: new Date().toISOString(),
    });
  } catch {}

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
      setTimeout(resolve, 800);
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
      rootAdmin: ROOT_ADMIN_EMAILS[0],
      rootAdmins: ROOT_ADMIN_EMAILS,
      invitedAdmins,
      count: invitedAdmins.length,
      maxInvited: MAX_INVITED_ADMINS,
      totalCapacity: MAX_INVITED_ADMINS + 1, // 4 admins total (1 root + 3 invited)
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
    const isRootOrOwner = ROOT_ADMIN_EMAILS.includes(cleanRequester);

    if (!isRootOrOwner) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso restringido. Solo los Administradores Principales autorizados pueden invitar o revocar administradores.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emails, action, email } = body;

    const currentList = await loadInvitedAdmins(request);

    // Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);
      
      const client = getSupabaseClient(request);
      try {
        await client.from('admin_invitations').delete().eq('email', targetEmail);
        await client.from('admin_invitations').update({ is_active: false }).eq('email', targetEmail);
      } catch {}

      const saved = await persistInvitedAdmins(nextList, request);

      // Broadcast role revocation in realtime
      await broadcastRoleChange(targetEmail, 'USER');

      return NextResponse.json({
        success: true,
        message: `El administrador invitado '${targetEmail}' ha sido revocado.`,
        invitedAdmins: saved,
        count: saved.length,
        availableSlots: MAX_INVITED_ADMINS - saved.length,
      });
    }

    // Handle explicit clear
    if (action === 'clear') {
      const client = getSupabaseClient(request);
      try {
        await client.from('admin_invitations').delete().neq('email', '');
        await client.from('admin_invitations').update({ is_active: false }).neq('email', '');
      } catch {}

      const saved = await persistInvitedAdmins([], request);

      // Broadcast role revocation for all previously invited admins
      for (const prevEmail of currentList) {
        await broadcastRoleChange(prevEmail, 'USER');
      }

      return NextResponse.json({
        success: true,
        message: 'Lista de administradores invitados vaciada.',
        invitedAdmins: saved,
        count: 0,
        availableSlots: MAX_INVITED_ADMINS,
      });
    }

    // Handle incoming list of emails
    let candidateEmails: string[] = [];
    if (Array.isArray(emails)) {
      candidateEmails = emails;
    } else if (typeof emails === 'string') {
      candidateEmails = emails.split(',').map((e) => e.trim());
    } else if (email) {
      candidateEmails = [email];
    }

    // Defensive Guard: If no action is specified and candidate list is empty, return current state
    if (!action && candidateEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se realizaron cambios en la lista de administradores.',
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
          { success: false, error: `El correo '${raw}' no tiene un formato de correo electrónico válido.` },
          { status: 400 }
        );
      }

      if (ROOT_ADMIN_EMAILS.includes(normalized)) {
        return NextResponse.json(
          { success: false, error: `El correo '${normalized}' es una cuenta Principal del sistema y ya posee acceso de Administrador.` },
          { status: 400 }
        );
      }

      if (!cleanedCandidates.includes(normalized)) {
        cleanedCandidates.push(normalized);
      }
    }

    let finalEmails: string[] = [];

    if (action === 'add') {
      const combined = new Set([...currentList, ...cleanedCandidates]);
      finalEmails = Array.from(combined);
    } else if (action === 'replace') {
      finalEmails = cleanedCandidates;
    } else {
      const combined = new Set([...currentList, ...cleanedCandidates]);
      finalEmails = Array.from(combined);
    }

    // Strict capacity enforcement: max 3 invited admins
    if (finalEmails.length > MAX_INVITED_ADMINS) {
      return NextResponse.json(
        {
          success: false,
          error: `Capacidad excedida: Solo puedes invitar hasta ${MAX_INVITED_ADMINS} administradores adicionales (total 4 administradores incluyendo la cuenta principal). Actualmente intentas asignar ${finalEmails.length}.`,
        },
        { status: 400 }
      );
    }

    const saved = await persistInvitedAdmins(finalEmails, request);

    // Broadcast realtime promotion to newly added admins
    for (const addedEmail of cleanedCandidates) {
      await broadcastRoleChange(addedEmail, 'ADMIN');
    }

    return NextResponse.json({
      success: true,
      message: 'Lista de administradores actualizada correctamente.',
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
