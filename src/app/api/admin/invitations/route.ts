import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROOT_ADMIN_EMAIL = 'admin@lumina.com';
const MAX_INVITED_ADMINS = 3;

// In-memory cache backed by file
let cachedInvitedAdmins: string[] = [];
let isLoaded = false;

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'admin_invites.json');

async function loadInvitedAdmins(): Promise<string[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.invitedAdmins)) {
      cachedInvitedAdmins = data.invitedAdmins.map((e: string) => String(e).toLowerCase().trim()).filter(Boolean);
      isLoaded = true;
      return cachedInvitedAdmins;
    }
  } catch {
    // Return cached or empty array
  }
  return cachedInvitedAdmins;
}

async function persistInvitedAdmins(emails: string[]): Promise<void> {
  cachedInvitedAdmins = emails;
  try {
    const payload = JSON.stringify(
      {
        invitedAdmins: emails,
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

    // Handle incoming list of emails (comma-separated or array)
    let candidateEmails: string[] = [];
    if (Array.isArray(emails)) {
      candidateEmails = emails;
    } else if (typeof emails === 'string') {
      candidateEmails = emails.split(',').map((e) => e.trim());
    } else if (email) {
      candidateEmails = [email];
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
      // Add new candidates to existing list
      const combined = new Set([...currentList, ...cleanedCandidates]);
      finalEmails = Array.from(combined);
    } else {
      // Direct replacement of the list (e.g. from comma separated input form)
      finalEmails = cleanedCandidates;
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
