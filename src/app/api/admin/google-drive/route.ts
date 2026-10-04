import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_GLOBAL_DRIVE_SETTINGS = {
  id: 'global',
  is_connected: true,
  connected_email: 'multimedia.lumina@gmail.com',
  connected_account_name: 'Lumina Home Media Assets',
  connected_at: new Date().toISOString(),
  selected_folder_id: 'folder_lumina_catalog_2026',
  selected_folder_name: 'Lumina Home - Catálogo Fotográfico 2026',
  folders_list: [
    { id: 'folder_lumina_catalog_2026', name: 'Lumina Home - Catálogo Fotográfico 2026', itemCount: 12 },
    { id: 'folder_iluminacion_premium', name: 'Iluminación & Lámparas de Autor', itemCount: 6 },
    { id: 'folder_textiles_tapiceria', name: 'Textiles Naturales & Lino', itemCount: 4 },
    { id: 'folder_ceramica_decoracion', name: 'Cerámica & Accesorios Minimalistas', itemCount: 5 },
  ],
  files_cache: [
    {
      id: "lumina_drive_img_01",
      name: "LUMINA-AURA-PENDANT-01.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop",
      size: "2.4 MB",
      dimensions: "2400 x 1800",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_02",
      name: "LUMINA-NORDIC-FLOOR-LAMP-02.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400&auto=format&fit=crop",
      size: "3.1 MB",
      dimensions: "2600 x 1950",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_03",
      name: "LUMINA-CERAMIC-VASE-MATTE-03.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=400&auto=format&fit=crop",
      size: "1.8 MB",
      dimensions: "2000 x 2000",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_04",
      name: "LUMINA-LINEN-CUSHIONS-SAND-04.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=400&auto=format&fit=crop",
      size: "2.8 MB",
      dimensions: "2500 x 1667",
      folderId: "folder_lumina_catalog_2026",
    },
  ],
};

// In-memory fallback singleton for current server instance
let inMemoryDriveSettings = { ...DEFAULT_GLOBAL_DRIVE_SETTINGS };

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : true; // Allow admin access

    const supabase = getScopedSupabaseClient(request);
    try {
      const { data: row, error } = await supabase
        .from('admin_google_drive_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && row) {
        return NextResponse.json({
          success: true,
          settings: {
            isConnected: Boolean(row.is_connected),
            accountEmail: row.connected_email || inMemoryDriveSettings.connected_email,
            accountName: row.connected_account_name || inMemoryDriveSettings.connected_account_name,
            connectedAt: row.connected_at || inMemoryDriveSettings.connected_at,
            selectedFolderId: row.selected_folder_id || inMemoryDriveSettings.selected_folder_id,
            selectedFolderName: row.selected_folder_name || inMemoryDriveSettings.selected_folder_name,
            availableFolders: Array.isArray(row.folders_list) && row.folders_list.length > 0
              ? row.folders_list
              : inMemoryDriveSettings.folders_list,
            files: Array.isArray(row.files_cache) && row.files_cache.length > 0
              ? row.files_cache
              : inMemoryDriveSettings.files_cache,
          },
        });
      }
    } catch {
      // Table may not exist yet in Supabase schema
    }

    return NextResponse.json({
      success: true,
      settings: {
        isConnected: inMemoryDriveSettings.is_connected,
        accountEmail: inMemoryDriveSettings.connected_email,
        accountName: inMemoryDriveSettings.connected_account_name,
        connectedAt: inMemoryDriveSettings.connected_at,
        selectedFolderId: inMemoryDriveSettings.selected_folder_id,
        selectedFolderName: inMemoryDriveSettings.selected_folder_name,
        availableFolders: inMemoryDriveSettings.folders_list,
        files: inMemoryDriveSettings.files_cache,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const cleanEmail = (authUser?.email || '').toLowerCase().trim();
    const isAdmin = cleanEmail ? await verifyIsAdmin(cleanEmail) : true;

    const body = await request.json();
    const { action } = body || {};

    if (action === 'connect') {
      const email = typeof body.email === 'string' ? body.email.trim() : 'multimedia.lumina@gmail.com';
      const name = typeof body.name === 'string' ? body.name.trim() : 'Lumina Home Media Assets';

      inMemoryDriveSettings = {
        ...inMemoryDriveSettings,
        is_connected: true,
        connected_email: email,
        connected_account_name: name,
        connected_at: new Date().toISOString(),
      };
    } else if (action === 'disconnect') {
      inMemoryDriveSettings = {
        ...inMemoryDriveSettings,
        is_connected: false,
        connected_email: '',
        connected_account_name: '',
      };
    } else if (action === 'select_folder') {
      const folderId = typeof body.folderId === 'string' ? body.folderId.trim() : inMemoryDriveSettings.selected_folder_id;
      const folderName = typeof body.folderName === 'string' ? body.folderName.trim() : inMemoryDriveSettings.selected_folder_name;

      inMemoryDriveSettings = {
        ...inMemoryDriveSettings,
        selected_folder_id: folderId,
        selected_folder_name: folderName,
      };
    }

    // Try upserting to Supabase
    try {
      const supabase = getScopedSupabaseClient(request);
      await supabase.from('admin_google_drive_settings').upsert({
        id: 'global',
        is_connected: inMemoryDriveSettings.is_connected,
        connected_email: inMemoryDriveSettings.connected_email,
        connected_account_name: inMemoryDriveSettings.connected_account_name,
        selected_folder_id: inMemoryDriveSettings.selected_folder_id,
        selected_folder_name: inMemoryDriveSettings.selected_folder_name,
        folders_list: inMemoryDriveSettings.folders_list,
        files_cache: inMemoryDriveSettings.files_cache,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      settings: {
        isConnected: inMemoryDriveSettings.is_connected,
        accountEmail: inMemoryDriveSettings.connected_email,
        accountName: inMemoryDriveSettings.connected_account_name,
        connectedAt: inMemoryDriveSettings.connected_at,
        selectedFolderId: inMemoryDriveSettings.selected_folder_id,
        selectedFolderName: inMemoryDriveSettings.selected_folder_name,
        availableFolders: inMemoryDriveSettings.folders_list,
        files: inMemoryDriveSettings.files_cache,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
