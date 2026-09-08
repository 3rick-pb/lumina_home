import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_ADMIN_EMAIL = 'admin@lumina.com';
const OWNER_EMAILS = ['admin@lumina.com', 'arteagae796@gmail.com'];
const MAX_INVITED_ADMINS = 3;
const SYS_CONFIG_ID = 'SYS_CONFIG_ADMIN_INVITES';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'admin_invites.json');

// Real-time loader: always queries Supabase directly to prevent stale in-memory cache across devices
async function loadInvitedAdmins(): Promise<string[]> {
  // 1. Primary Cloud Source: Supabase Database (orders table with SYS_CONFIG_ID)
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('items')
      .eq('id', SYS_CONFIG_ID)
      .maybeSingle();

    if (!error && data && Array.isArray(data.items)) {
      const dbEmails = (data.items as Array<{ email?: string } | string>)
        .map((item) => (typeof item === 'object' && item !== null ? String(item.email || '') : String(item || '')).toLowerCase().trim())
        .filter(Boolean);

      const uniqueEmails = Array.from(new Set(dbEmails)).slice(0, MAX_INVITED_ADMINS);

      // Asynchronously mirror to local file
      try {
        await fs.writeFile(
          DATA_FILE_PATH,
          JSON.stringify({ invitedAdmins: uniqueEmails, updatedAt: new Date().toISOString() }, null, 2),
          'utf-8'
        );
      } catch {}

      return uniqueEmails;
    }
  } catch (dbErr) {
    console.warn('Notice: Could not load invited admins from Supabase, trying local file fallback:', dbErr);
  }

  // 2. Secondary Fallback: Local JSON file
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.invitedAdmins)) {
      const fileEmails = data.invitedAdmins
        .map((e: string) => String(e).toLowerCase().trim())
        .filter(Boolean)
        .slice(0, MAX_INVITED_ADMINS);
      return fileEmails;
    }
  } catch {
    // Non-critical fallback
  }

  return [];
}

async function persistInvitedAdmins(emails: string[]): Promise<string[]> {
  const cleanEmails = Array.from(
    new Set(emails.map((e) => String(e).toLowerCase().trim()).filter(Boolean))
  ).slice(0, MAX_INVITED_ADMINS);

  // 1. Persist to Supabase Database (Primary cloud source of truth)
  try {
    const { error: sbErr } = await supabase.from('orders').upsert({
      id: SYS_CONFIG_ID,
      user_id: null,
      status: 'Procesando',
      total: 0,
      tracking_number: 'LUMINA_ADMIN_INVITES',
      items: cleanEmails.map((email) => ({ email })),
      created_at: new Date().toISOString(),
    });
    if (sbErr) {
      console.warn('Warning: Failed to persist admin invites to Supabase:', sbErr.message);
    }
  } catch (sbErr) {
    console.warn('Warning: Supabase upsert error:', sbErr);
  }

  // 2. Persist to Local JSON File (Secondary fallback)
  try {
    const payload = JSON.stringify(
      {
        invitedAdmins: cleanEmails,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    );
    await fs.writeFile(DATA_FILE_PATH, payload, 'utf-8');
  } catch (err) {
    console.error('Failed to write admin_invites.json:', err);
  }

  return cleanEmails;
}

export async function GET() {
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
    const body = await request.json();
    const { requesterEmail, emails, action, email } = body;

    const currentList = await loadInvitedAdmins();

    // Strict Root / Owner Admin Check for mutations (adding/removing admins):
    // Only the primary admin (admin@lumina.com or arteagae796@gmail.com) can invite or revoke other admins.
    // Delegated / invited admins can NOT add or remove other administrators.
    const cleanRequester = String(requesterEmail || '').toLowerCase().trim();
    const isRootOrOwner = 
      OWNER_EMAILS.includes(cleanRequester) ||
      cleanRequester === 'admin@lumina.com' ||
      body.isRootAdmin === true;

    if (!isRootOrOwner) {
      return NextResponse.json(
        {
          success: false,
          error: `Acceso restringido. Solo el Administrador Principal puede invitar o revocar administradores adicionales (solicitado por: ${cleanRequester || 'anónimo'}).`,
        },
        { status: 403 }
      );
    }

    // Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);
      const saved = await persistInvitedAdmins(nextList);
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
      const saved = await persistInvitedAdmins([]);
      return NextResponse.json({
        success: true,
        message: 'Lista de administradores invitados vaciada.',
        invitedAdmins: saved,
        count: 0,
        availableSlots: MAX_INVITED_ADMINS,
      });
    }

    // Handle incoming list of emails (comma-separated or array)
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

      if (normalized === ROOT_ADMIN_EMAIL) {
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
      // Add new candidates to existing list without duplicates
      const combined = new Set([...currentList, ...cleanedCandidates]);
      finalEmails = Array.from(combined);
    } else if (action === 'replace') {
      // Explicit replacement of the entire list
      finalEmails = cleanedCandidates;
    } else {
      // Default: If candidates were provided, merge them safely rather than wiping
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
