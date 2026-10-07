import { NextResponse } from 'next/server';
import { getServiceSupabaseClient } from '@/lib/serverAuth';
import { GoogleDriveService } from '@/lib/googleDriveService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/google-drive/image?id=FILE_ID
 * Proxy streaming seguro para imágenes de Google Drive:
 * Permite visualizar imágenes de Google Drive en Fotoproductos incluso si los
 * archivos no están configurados como públicos en la unidad del usuario.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileId = url.searchParams.get('id');

  if (!fileId) {
    return new NextResponse('File ID required', { status: 400 });
  }

  // Fallback directo a Google CDN si se solicita
  const directCdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=s0`;

  try {
    const supabase = getServiceSupabaseClient();
    const { data: cred } = await supabase
      .from('google_drive_credentials')
      .select('*')
      .is('revoked_at', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cred) {
      return NextResponse.redirect(directCdnUrl);
    }

    const { accessToken } = await GoogleDriveService.getValidAccessToken(cred.admin_id);

    // Obtener stream del archivo directo con autenticación Bearer
    const googleRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!googleRes.ok) {
      return NextResponse.redirect(directCdnUrl);
    }

    const contentType = googleRes.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await googleRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.redirect(directCdnUrl);
  }
}
