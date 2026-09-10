import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, verifyIsAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_ADMIN_EMAIL = 'admin@lumina.com';
const MAX_INVITED_ADMINS = 3;
const SYS_CONFIG_ID = 'SYS_CONFIG_ADMIN_INVITES';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// Real-time loader: queries dedicated admin_invitations table directly
async function loadInvitedAdmins(): Promise<string[]> {
  // 1. Primary Source: Dedicated admin_invitations table
  try {
    const { data, error } = await supabase
      .from('admin_invitations')
      .select('email, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      const activeEmails = data
        .map((row) => String(row.email || '').toLowerCase().trim())
        .filter(Boolean);
      return Array.from(new Set(activeEmails)).slice(0, MAX_INVITED_ADMINS);
    }
  } catch (err) {
    console.warn('Notice: Failed reading admin_invitations, checking orders fallback:', err);
  }

  // 2. Transition Fallback: orders table with SYS_CONFIG_ID (until migration executes)
  try {
    const { data: orderConfig, error: orderErr } = await supabase
      .from('orders')
      .select('items')
      .eq('id', SYS_CONFIG_ID)
      .maybeSingle();

    if (!orderErr && orderConfig && Array.isArray(orderConfig.items)) {
      const dbEmails = (orderConfig.items as Array<{ email?: string } | string>)
        .map((item) => (typeof item === 'object' && item !== null ? String(item.email || '') : String(item || '')).toLowerCase().trim())
        .filter(Boolean);

      return Array.from(new Set(dbEmails)).slice(0, MAX_INVITED_ADMINS);
    }
  } catch {}

  return [];
}

async function persistInvitedAdmins(emails: string[]): Promise<string[]> {
  const cleanEmails = Array.from(
    new Set(emails.map((e) => String(e).toLowerCase().trim()).filter(Boolean))
  ).slice(0, MAX_INVITED_ADMINS);

  // 1. Persist to dedicated admin_invitations table
  try {
    // Read all existing records
    const { data: existing } = await supabase
      .from('admin_invitations')
      .select('email');

    const existingEmails = Array.isArray(existing) ? existing.map(r => String(r.email).toLowerCase().trim()) : [];
    
    // Deactivate / remove ones not in cleanEmails
    const emailsToRemove = existingEmails.filter(e => !cleanEmails.includes(e));
    if (emailsToRemove.length > 0) {
      await supabase
        .from('admin_invitations')
        .delete()
        .in('email', emailsToRemove);
    }

    // Upsert new/remaining records
    if (cleanEmails.length > 0) {
      for (const email of cleanEmails) {
        await supabase
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

  // 2. Transition mirror to orders table (backward compatibility until cleanup phase)
  try {
    await supabase.from('orders').upsert({
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

async function broadcastRoleChange(targetEmail: string, role: 'USER' | 'ADMIN') {
  try {
    const rolesChan = supabase.channel(`srv_roles_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    await new Promise<void>((resolve) => {
      rolesChan.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await rolesChan.send({
            type: 'broadcast',
            event: 'role_change',
            payload: { email: targetEmail, role, timestamp: Date.now() },
          });
          supabase.removeChannel(rolesChan);
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

  const invitedAdmins = await loadInvitedAdmins();

  return NextResponse.json(
    {
      success: true,
      rootAdmin: ROOT_ADMIN_EMAIL,
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
    const isRootOrOwner = cleanRequester === ROOT_ADMIN_EMAIL;

    if (!isRootOrOwner) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso restringido. Solo el Administrador Principal (${ROOT_ADMIN_EMAIL}) autenticado puede invitar o revocar administradores.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emails, action, email } = body;

    const currentList = await loadInvitedAdmins();

    // Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);
      
      // Also explicitly delete from table
      try {
        await supabase.from('admin_invitations').delete().eq('email', targetEmail);
      } catch {}

      const saved = await persistInvitedAdmins(nextList);

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
      try {
        await supabase.from('admin_invitations').delete().neq('email', '');
      } catch {}

      const saved = await persistInvitedAdmins([]);

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

    // Defensive Guard: If no action is specified and candidate list is empty, DO NOT wipe!
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

      if (ROOT_ADMIN_EMAIL === normalized) {
        return NextResponse.json(
          { success: false, error: `El correo '${ROOT_ADMIN_EMAIL}' es la cuenta principal del sistema y ya posee acceso de Administrador.` },
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

    const saved = await persistInvitedAdmins(finalEmails);

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
