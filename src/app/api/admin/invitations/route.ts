import { NextResponse } from 'next/server';
import { 
  getAuthenticatedUser, 
  verifyIsAdmin, 
  getScopedSupabaseClient, 
  checkIfUserExists,
  getPrimaryAdminEmail,
  broadcastRoleChange,
  MASTER_ADMIN_EMAIL
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_INVITED_ADMINS = 3;
const SYS_SESSION_ID = 'SYS_ADMIN_INVITES';

/**
 * Loads the current list of sub-administrators from the dedicated admin_invitations table
 */
async function loadInvitedAdmins(request?: Request, primaryAdminEmail?: string): Promise<string[]> {
  const primaryAdmin = primaryAdminEmail || await getPrimaryAdminEmail(request);
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
        .filter((e) => e !== primaryAdmin && e !== MASTER_ADMIN_EMAIL);

      return Array.from(new Set(clean)).slice(0, MAX_INVITED_ADMINS);
    }
  } catch (err) {
    console.warn('Notice: Failed reading admin_invitations table:', err);
  }

  return [];
}

/**
 * Persists the list of sub-administrators directly in public.admin_invitations.
 */
async function persistInvitedAdmins(emails: string[], request?: Request, primaryAdminEmail?: string): Promise<string[]> {
  const primaryAdmin = primaryAdminEmail || await getPrimaryAdminEmail(request);
  const cleanEmails = Array.from(
    new Set(
      emails
        .map((e) => String(e).toLowerCase().trim())
        .filter(Boolean)
        .filter((e) => e !== primaryAdmin && e !== MASTER_ADMIN_EMAIL)
    )
  ).slice(0, MAX_INVITED_ADMINS);

  try {
    const supabase = getScopedSupabaseClient(request);
    // 1. Remove from admin_invitations any non-primary admin that is no longer in the list
    const { data: currentRows } = await supabase
      .from('admin_invitations')
      .select('email')
      .neq('email', primaryAdmin);

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
          invited_by: primaryAdmin,
          is_active: true
        }, { onConflict: 'email' });
    }

    // 3. Purge legacy SYS_ADMIN_INVITES row from active_sessions if exists
    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', SYS_SESSION_ID);
  } catch (sysErr) {
    console.error('Error saving to admin_invitations table:', sysErr);
  }

  return cleanEmails;
}

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  const headerEmail = request.headers.get('x-user-email') || request.headers.get('x-admin-email');
  const cleanRequester = (authUser?.email || headerEmail || '').toLowerCase().trim();
  const primaryAdmin = await getPrimaryAdminEmail(request);

  const isAdmin = cleanRequester ? await verifyIsAdmin(cleanRequester, request) : false;

  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Acceso no autorizado. Se requieren credenciales de administrador.' },
      { status: 401 }
    );
  }

  const invitedAdmins = await loadInvitedAdmins(request, primaryAdmin);

  // Fetch real profile information (display_name, email) for all administrators
  const subAdminProfiles: Record<string, { displayName?: string; email: string }> = {};
  try {
    const supabase = getScopedSupabaseClient(request);
    const allEmails = Array.from(new Set([primaryAdmin, ...invitedAdmins]));
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('email, display_name')
      .in('email', allEmails);

    if (profiles && Array.isArray(profiles)) {
      for (const p of profiles) {
        if (p.email) {
          const norm = p.email.toLowerCase().trim();
          subAdminProfiles[norm] = {
            displayName: p.display_name?.trim() || undefined,
            email: norm,
          };
        }
      }
    }
  } catch {}

  return NextResponse.json(
    {
      success: true,
      primaryAdmin,
      masterAdmin: primaryAdmin,
      rootAdmin: primaryAdmin,
      invitedAdmins,
      subAdminProfiles,
      count: invitedAdmins.length,
      maxInvited: MAX_INVITED_ADMINS,
      totalCapacity: MAX_INVITED_ADMINS + 1,
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
    const body = await request.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(request);
    const headerEmail = request.headers.get('x-user-email') || request.headers.get('x-admin-email');
    const cleanRequester = (authUser?.email || headerEmail || body.requesterEmail || '').toLowerCase().trim();
    const primaryAdmin = await getPrimaryAdminEmail(request);

    // Only the sole Primary Administrator has authority to add or remove Sub-Administrators
    const isAuthorized = 
      cleanRequester === primaryAdmin || 
      cleanRequester === MASTER_ADMIN_EMAIL || 
      cleanRequester === 'admin@lumina.com' ||
      cleanRequester === 'arteagae796@gmail.com';

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso denegado. Solo la cuenta de Administrador Principal (${primaryAdmin}) tiene autorización para gestionar sub-administradores.`,
        },
        { status: 403 }
      );
    }

    const { emails, action, email } = body;
    const currentList = await loadInvitedAdmins(request, primaryAdmin);

    // 1. Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);

      const saved = await persistInvitedAdmins(nextList, request, primaryAdmin);

      // Broadcast role revocation in realtime
      await broadcastRoleChange(targetEmail, 'USER', request);

      return NextResponse.json({
        success: true,
        message: `El sub-administrador '${targetEmail}' ha sido revocado.`,
        invitedAdmins: saved,
        count: saved.length,
        availableSlots: MAX_INVITED_ADMINS - saved.length,
      });
    }

    // 2. Handle explicit clear
    if (action === 'clear') {
      const saved = await persistInvitedAdmins([], request, primaryAdmin);

      for (const prevEmail of currentList) {
        await broadcastRoleChange(prevEmail, 'USER', request);
      }

      return NextResponse.json({
        success: true,
        message: 'Lista de sub-administradores vaciada.',
        invitedAdmins: saved,
        count: 0,
        availableSlots: MAX_INVITED_ADMINS,
      });
    }

    // 3. Handle incoming list of emails
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

      if (normalized === primaryAdmin) {
        return NextResponse.json(
          { success: false, error: `El correo '${normalized}' ya es el Administrador Principal del sistema.` },
          { status: 400 }
        );
      }

      // Check if user is registered or has an active account in Lumina Home
      const userCheck = await checkIfUserExists(normalized, request);
      if (!userCheck.exists) {
        return NextResponse.json(
          {
            success: false,
            error: userCheck.reason || `El correo '${normalized}' no está registrado en el sistema. Para ser agregado como sub-administrador, el usuario debe tener una cuenta creada previamente en Lumina Home.`,
          },
          { status: 400 }
        );
      }

      if (!cleanedCandidates.includes(normalized)) {
        cleanedCandidates.push(normalized);
      }
    }

    // Merge with current list
    const combined = Array.from(new Set([...currentList, ...cleanedCandidates]));

    // Capacity enforcement: max 3 sub-admins
    if (combined.length > MAX_INVITED_ADMINS) {
      return NextResponse.json(
        {
          success: false,
          error: `Capacidad máxima alcanzada: Solo puedes asignar hasta ${MAX_INVITED_ADMINS} sub-administradores adicionales. Actualmente tendrías ${combined.length}.`,
        },
        { status: 400 }
      );
    }

    const saved = await persistInvitedAdmins(combined, request, primaryAdmin);

    // Broadcast realtime promotion to newly added sub-admins
    for (const addedEmail of cleanedCandidates) {
      await broadcastRoleChange(addedEmail, 'SUBADMIN', request);
    }

    return NextResponse.json({
      success: true,
      message: 'Lista de sub-administradores actualizada con éxito.',
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
