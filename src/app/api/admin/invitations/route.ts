import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_ADMIN_EMAIL = 'admin@lumina.com';
const MAX_INVITED_ADMINS = 3;
const SYS_CONFIG_ID = 'SYS_CONFIG_ADMIN_INVITES';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache backed by Supabase DB + local file
let cachedInvitedAdmins: string[] = [];
let isLoaded = false;

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'admin_invites.json');

async function loadInvitedAdmins(): Promise<string[]> {
  // 1. Primary Source: Supabase Database (survives server restarts, multi-device, rebuilds)
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

      cachedInvitedAdmins = Array.from(new Set(dbEmails)).slice(0, MAX_INVITED_ADMINS);
      isLoaded = true;

      // Mirror to local file
      try {
        await fs.writeFile(
          DATA_FILE_PATH,
          JSON.stringify({ invitedAdmins: cachedInvitedAdmins, updatedAt: new Date().toISOString() }, null, 2),
          'utf-8'
        );
      } catch {}

      return cachedInvitedAdmins;
    }
  } catch (dbErr) {
    console.warn('Notice: Could not load invited admins from Supabase, trying local file fallback:', dbErr);
  }

  // 2. Secondary Fallback: Local JSON file
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.invitedAdmins)) {
      cachedInvitedAdmins = data.invitedAdmins
        .map((e: string) => String(e).toLowerCase().trim())
        .filter(Boolean)
        .slice(0, MAX_INVITED_ADMINS);
      isLoaded = true;
      return cachedInvitedAdmins;
    }
  } catch {
    // Non-critical fallback
  }

  return cachedInvitedAdmins;
}

async function persistInvitedAdmins(emails: string[]): Promise<void> {
  const cleanEmails = Array.from(
    new Set(emails.map((e) => String(e).toLowerCase().trim()).filter(Boolean))
  ).slice(0, MAX_INVITED_ADMINS);

  cachedInvitedAdmins = cleanEmails;
  isLoaded = true;

  // 1. Persist to Supabase Database (Primary source of truth in the cloud)
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
}

export async function GET() {
  if (!isLoaded) {
    await loadInvitedAdmins();
  }

  return NextResponse.json(
    {
      success: true,
      rootAdmin: ROOT_ADMIN_EMAIL,
      invitedAdmins: cachedInvitedAdmins,
      count: cachedInvitedAdmins.length,
      maxInvited: MAX_INVITED_ADMINS,
      totalCapacity: MAX_INVITED_ADMINS + 1, // 4 admins total (1 root + 3 invited)
      availableSlots: Math.max(0, MAX_INVITED_ADMINS - cachedInvitedAdmins.length),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterEmail, emails, action, email } = body;

    // 1. Strict Root Admin Authorization Check
    const cleanRequester = String(requesterEmail || '').toLowerCase().trim();
    if (cleanRequester !== ROOT_ADMIN_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado. Solo el Administrador de Raíz (admin@lumina.com) tiene privilegios para invitar o modificar administradores.',
        },
        { status: 403 }
      );
    }

    if (!isLoaded) {
      await loadInvitedAdmins();
    }

    const currentList = [...cachedInvitedAdmins];

    // Handle individual removal
    if (action === 'remove' && email) {
      const targetEmail = String(email).toLowerCase().trim();
      const nextList = currentList.filter((e) => e !== targetEmail);
      await persistInvitedAdmins(nextList);
      return NextResponse.json({
        success: true,
        message: `El administrador invitado '${targetEmail}' ha sido revocado.`,
        invitedAdmins: nextList,
        count: nextList.length,
        availableSlots: MAX_INVITED_ADMINS - nextList.length,
      });
    }

    // Handle explicit clear
    if (action === 'clear') {
      await persistInvitedAdmins([]);
      return NextResponse.json({
        success: true,
        message: 'Lista de administradores invitados vaciada.',
        invitedAdmins: [],
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
          { success: false, error: `El correo '${ROOT_ADMIN_EMAIL}' es el Administrador de Raíz y ya posee todos los privilegios.` },
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
          error: `Capacidad excedida: Solo puedes invitar hasta ${MAX_INVITED_ADMINS} administradores adicionales (total 4 administradores incluyendo la cuenta raíz). Actualmente intentas asignar ${finalEmails.length}.`,
        },
        { status: 400 }
      );
    }

    await persistInvitedAdmins(finalEmails);

    return NextResponse.json({
      success: true,
      message: 'Lista de administradores actualizada correctamente.',
      invitedAdmins: finalEmails,
      count: finalEmails.length,
      maxInvited: MAX_INVITED_ADMINS,
      totalCapacity: MAX_INVITED_ADMINS + 1,
      availableSlots: MAX_INVITED_ADMINS - finalEmails.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
