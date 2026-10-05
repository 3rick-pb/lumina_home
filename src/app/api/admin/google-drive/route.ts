import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface MediaAssetRow {
  id: string;
  name: string;
  mimeType?: string;
  cdnUrl: string;
  thumbnailUrl: string;
  size?: string;
  dimensions?: string;
  folderId?: string;
  folderName?: string;
  source?: string;
}

export interface DbMediaAssetRow {
  id: string;
  name: string;
  mime_type?: string;
  cdn_url: string;
  thumbnail_url?: string;
  size?: string;
  dimensions?: string;
  folder_id?: string;
  folder_name?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PhotoInputRow {
  id?: string;
  name?: string;
  mimeType?: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  size?: string;
  dimensions?: string;
  folderId?: string;
  source?: string;
}

const DEFAULT_GLOBAL_DRIVE_SETTINGS = {
  id: 'global',
  is_connected: true,
  connected_email: 'multimedia.lumina@gmail.com',
  connected_account_name: 'Lumina Home Media Assets',
  connected_at: new Date().toISOString(),
  selected_folder_id: 'folder_lumina_catalog_2026',
  selected_folder_name: 'Lumina Home - Catálogo Fotográfico 2026',
  backup_at: new Date().toISOString(),
  backup_count: 12,
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
    {
      id: "lumina_drive_img_05",
      name: "LUMINA-MARBLE-ACCENT-TABLE-05.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=400&auto=format&fit=crop",
      size: "3.4 MB",
      dimensions: "2800 x 2100",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_06",
      name: "LUMINA-BRASS-CHANDELIER-06.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=400&auto=format&fit=crop",
      size: "2.1 MB",
      dimensions: "2200 x 1650",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_07",
      name: "LUMINA-MINIMALIST-SCONCE-07.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=80&w=400&auto=format&fit=crop",
      size: "2.7 MB",
      dimensions: "2400 x 1800",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_08",
      name: "LUMINA-SCANDINAVIAN-ARMCHAIR-08.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&auto=format&fit=crop",
      size: "3.6 MB",
      dimensions: "3000 x 2000",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_09",
      name: "LUMINA-ORGANIC-WOOD-BENCH-09.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop",
      size: "2.9 MB",
      dimensions: "2600 x 1733",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_10",
      name: "LUMINA-WOVEN-RUG-NATURAL-10.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=400&auto=format&fit=crop",
      size: "2.5 MB",
      dimensions: "2400 x 1800",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_11",
      name: "LUMINA-ARCHITECTURAL-VASE-11.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400&auto=format&fit=crop",
      size: "1.9 MB",
      dimensions: "2100 x 2100",
      folderId: "folder_lumina_catalog_2026",
    },
    {
      id: "lumina_drive_img_12",
      name: "LUMINA-ECLIPSE-DESK-LAMP-12.jpg",
      mimeType: "image/jpeg",
      cdnUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=90&w=1200&auto=format&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop",
      size: "2.3 MB",
      dimensions: "2400 x 1800",
      folderId: "folder_lumina_catalog_2026",
    },
  ],
};

// In-memory fallback singleton for current server instance
let inMemoryDriveSettings = { ...DEFAULT_GLOBAL_DRIVE_SETTINGS };

export async function GET(request: Request) {
  try {
    const supabase = getScopedSupabaseClient(request);
    let resolvedFiles = inMemoryDriveSettings.files_cache;
    let resolvedFolders = inMemoryDriveSettings.folders_list;
    let isConnected = inMemoryDriveSettings.is_connected;
    let connectedEmail = inMemoryDriveSettings.connected_email;
    let connectedAccountName = inMemoryDriveSettings.connected_account_name;
    let connectedAt = inMemoryDriveSettings.connected_at;
    let selectedFolderId = inMemoryDriveSettings.selected_folder_id;
    let selectedFolderName = inMemoryDriveSettings.selected_folder_name;
    let backupAt = inMemoryDriveSettings.backup_at;
    let backupCount = inMemoryDriveSettings.backup_count;

    // 1. Intentar cargar configuración global de la tabla admin_google_drive_settings
    try {
      const { data: row } = await supabase
        .from('admin_google_drive_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (row) {
        isConnected = Boolean(row.is_connected);
        connectedEmail = row.connected_email || connectedEmail;
        connectedAccountName = row.connected_account_name || connectedAccountName;
        connectedAt = row.connected_at || connectedAt;
        selectedFolderId = row.selected_folder_id || selectedFolderId;
        selectedFolderName = row.selected_folder_name || selectedFolderName;
        backupAt = row.backup_at || backupAt;
        backupCount = typeof row.backup_count === 'number' ? row.backup_count : backupCount;
        if (Array.isArray(row.folders_list) && row.folders_list.length > 0) {
          resolvedFolders = row.folders_list;
        }
        if (Array.isArray(row.files_cache) && row.files_cache.length > 0) {
          resolvedFiles = row.files_cache;
        }
      }
    } catch {
      // Ignorar si la tabla aún no fue creada
    }

    // 2. Intentar consultar la tabla relacional public.admin_media_assets para fotos individuales respaldadas
    try {
      const { data: assets, error } = await supabase
        .from('admin_media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(assets) && assets.length > 0) {
        resolvedFiles = (assets as DbMediaAssetRow[]).map((a) => ({
          id: a.id,
          name: a.name,
          mimeType: a.mime_type || 'image/jpeg',
          cdnUrl: a.cdn_url,
          thumbnailUrl: a.thumbnail_url || a.cdn_url,
          size: a.size || '2.0 MB',
          dimensions: a.dimensions || '2000 x 2000',
          folderId: a.folder_id || 'folder_lumina_catalog_2026',
        }));
        backupCount = resolvedFiles.length;
      }
    } catch {
      // Si admin_media_assets no existe aún, se usan los de files_cache
    }

    // Actualizar in-memory
    inMemoryDriveSettings = {
      ...inMemoryDriveSettings,
      is_connected: isConnected,
      connected_email: connectedEmail,
      connected_account_name: connectedAccountName,
      connected_at: connectedAt,
      selected_folder_id: selectedFolderId,
      selected_folder_name: selectedFolderName,
      folders_list: resolvedFolders,
      files_cache: resolvedFiles,
      backup_at: backupAt,
      backup_count: backupCount,
    };

    return NextResponse.json({
      success: true,
      settings: {
        isConnected,
        accountEmail: connectedEmail,
        accountName: connectedAccountName,
        connectedAt,
        selectedFolderId,
        selectedFolderName,
        availableFolders: resolvedFolders,
        files: resolvedFiles,
        backupAt,
        backupCount: resolvedFiles.length,
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
    if (cleanEmail) {
      await verifyIsAdmin(cleanEmail);
    }

    const body = await request.json();
    const { action } = body || {};
    const supabase = getScopedSupabaseClient(request);

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
    } else if (action === 'create_folder') {
      const folder = body.folder;
      if (folder && folder.id && folder.name) {
        const exists = inMemoryDriveSettings.folders_list.some((f) => f.id === folder.id);
        if (!exists) {
          inMemoryDriveSettings.folders_list = [folder, ...inMemoryDriveSettings.folders_list];
        }
        inMemoryDriveSettings.selected_folder_id = folder.id;
        inMemoryDriveSettings.selected_folder_name = folder.name;
      }
    } else if (action === 'delete_folder') {
      const folderId = body.folderId;
      if (folderId && folderId !== 'folder_lumina_catalog_2026') {
        inMemoryDriveSettings.folders_list = inMemoryDriveSettings.folders_list.filter((f) => f.id !== folderId);
        // Reasignar fotos a la carpeta raíz
        inMemoryDriveSettings.files_cache = inMemoryDriveSettings.files_cache.map((f) => 
          f.folderId === folderId ? { ...f, folderId: 'folder_lumina_catalog_2026' } : f
        );
        if (inMemoryDriveSettings.selected_folder_id === folderId) {
          inMemoryDriveSettings.selected_folder_id = 'folder_lumina_catalog_2026';
          inMemoryDriveSettings.selected_folder_name = 'Lumina Home - Catálogo Fotográfico 2026';
        }
      }
    } else if (action === 'add_photo' || action === 'add_photos') {
      const newItems: PhotoInputRow[] = Array.isArray(body.photos) 
        ? (body.photos as PhotoInputRow[]) 
        : (body.photo ? [body.photo as PhotoInputRow] : []);

      const formattedItems = newItems.map((item) => ({
        id: item.id || `lumina_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: item.name || 'FOTOGRAFIA-LUMINA.jpg',
        mimeType: item.mimeType || 'image/jpeg',
        cdnUrl: item.cdnUrl,
        thumbnailUrl: item.thumbnailUrl || item.cdnUrl,
        size: item.size || '1.8 MB',
        dimensions: item.dimensions || '2000 x 2000',
        folderId: item.folderId || inMemoryDriveSettings.selected_folder_id || 'folder_lumina_catalog_2026',
      }));

      // Agregar a cache en memoria
      inMemoryDriveSettings.files_cache = [...formattedItems, ...inMemoryDriveSettings.files_cache];

      // Actualizar contadores de carpetas
      const counts: Record<string, number> = {};
      inMemoryDriveSettings.files_cache.forEach(f => {
        counts[f.folderId || ''] = (counts[f.folderId || ''] || 0) + 1;
      });
      inMemoryDriveSettings.folders_list = inMemoryDriveSettings.folders_list.map(f => ({
        ...f,
        itemCount: counts[f.id] || (f.id === 'folder_lumina_catalog_2026' ? inMemoryDriveSettings.files_cache.length : 0),
      }));

      // Persistir cada foto en admin_media_assets si la tabla existe
      try {
        const rows = formattedItems.map((f) => ({
          id: f.id,
          name: f.name,
          cdn_url: f.cdnUrl,
          thumbnail_url: f.thumbnailUrl,
          mime_type: f.mimeType,
          size: f.size,
          dimensions: f.dimensions,
          folder_id: f.folderId,
          folder_name: inMemoryDriveSettings.selected_folder_name,
          source: body.source || 'google_drive',
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('admin_media_assets').upsert(rows);
      } catch {}
    } else if (action === 'delete_photo') {
      const photoId = body.photoId;
      if (photoId) {
        inMemoryDriveSettings.files_cache = inMemoryDriveSettings.files_cache.filter(f => f.id !== photoId);
        try {
          await supabase.from('admin_media_assets').delete().eq('id', photoId);
        } catch {}
      }
    } else if (action === 'backup_now') {
      // RESPALDO COMPLETO EN BASE DE DATOS
      const clientFiles: PhotoInputRow[] = Array.isArray(body.files) && body.files.length > 0 
        ? body.files 
        : inMemoryDriveSettings.files_cache;
      const clientFolders = Array.isArray(body.folders) && body.folders.length > 0 
        ? body.folders 
        : inMemoryDriveSettings.folders_list;
      const nowIso = new Date().toISOString();

      inMemoryDriveSettings.files_cache = clientFiles.map(f => ({
        id: f.id || `lumina_media_${Date.now()}`,
        name: f.name || 'FOTOGRAFIA-LUMINA.jpg',
        mimeType: f.mimeType || 'image/jpeg',
        cdnUrl: f.cdnUrl,
        thumbnailUrl: f.thumbnailUrl || f.cdnUrl,
        size: f.size || '2.0 MB',
        dimensions: f.dimensions || '2000 x 2000',
        folderId: f.folderId || 'folder_lumina_catalog_2026',
      }));
      inMemoryDriveSettings.folders_list = clientFolders;
      inMemoryDriveSettings.backup_at = nowIso;
      inMemoryDriveSettings.backup_count = clientFiles.length;

      let dbSaveSuccess = false;
      try {
        // 1. Guardar resumen global en admin_google_drive_settings
        await supabase.from('admin_google_drive_settings').upsert({
          id: 'global',
          is_connected: inMemoryDriveSettings.is_connected,
          connected_email: inMemoryDriveSettings.connected_email,
          connected_account_name: inMemoryDriveSettings.connected_account_name,
          selected_folder_id: inMemoryDriveSettings.selected_folder_id,
          selected_folder_name: inMemoryDriveSettings.selected_folder_name,
          folders_list: clientFolders,
          files_cache: inMemoryDriveSettings.files_cache,
          backup_at: nowIso,
          backup_count: clientFiles.length,
          updated_at: nowIso,
        });

        // 2. Guardar cada fotografía en admin_media_assets
        if (clientFiles.length > 0) {
          const rows = clientFiles.map((f) => ({
            id: f.id || `lumina_media_${Date.now()}`,
            name: f.name || 'FOTO-LUMINA.jpg',
            cdn_url: f.cdnUrl,
            thumbnail_url: f.thumbnailUrl || f.cdnUrl,
            mime_type: f.mimeType || 'image/jpeg',
            size: f.size || '2.0 MB',
            dimensions: f.dimensions || '2000 x 2000',
            folder_id: f.folderId || 'folder_lumina_catalog_2026',
            folder_name: inMemoryDriveSettings.selected_folder_name,
            source: 'backup',
            updated_at: nowIso,
          }));
          await supabase.from('admin_media_assets').upsert(rows);
        }
        dbSaveSuccess = true;
      } catch (dbErr) {
        console.warn('Backup write error to Supabase (continuing with memory/local):', dbErr);
      }

      return NextResponse.json({
        success: true,
        backedUpToDatabase: dbSaveSuccess,
        backupAt: nowIso,
        backupCount: clientFiles.length,
        settings: {
          ...inMemoryDriveSettings,
          backupAt: nowIso,
          backupCount: clientFiles.length,
        },
      });
    } else if (action === 'restore_backup') {
      // RESTAURAR TODO DESDE SUPABASE
      try {
        const { data: row } = await supabase
          .from('admin_google_drive_settings')
          .select('*')
          .eq('id', 'global')
          .maybeSingle();

        const { data: assets } = await supabase
          .from('admin_media_assets')
          .select('*')
          .order('created_at', { ascending: false });

        if (row) {
          inMemoryDriveSettings.is_connected = Boolean(row.is_connected);
          inMemoryDriveSettings.connected_email = row.connected_email || inMemoryDriveSettings.connected_email;
          inMemoryDriveSettings.connected_account_name = row.connected_account_name || inMemoryDriveSettings.connected_account_name;
          inMemoryDriveSettings.selected_folder_id = row.selected_folder_id || inMemoryDriveSettings.selected_folder_id;
          inMemoryDriveSettings.selected_folder_name = row.selected_folder_name || inMemoryDriveSettings.selected_folder_name;
          if (Array.isArray(row.folders_list) && row.folders_list.length > 0) {
            inMemoryDriveSettings.folders_list = row.folders_list;
          }
          if (Array.isArray(row.files_cache) && row.files_cache.length > 0) {
            inMemoryDriveSettings.files_cache = row.files_cache;
          }
          inMemoryDriveSettings.backup_at = row.backup_at || inMemoryDriveSettings.backup_at;
          inMemoryDriveSettings.backup_count = row.backup_count || inMemoryDriveSettings.backup_count;
        }

        if (Array.isArray(assets) && assets.length > 0) {
          inMemoryDriveSettings.files_cache = (assets as DbMediaAssetRow[]).map((a) => ({
            id: a.id,
            name: a.name,
            mimeType: a.mime_type || 'image/jpeg',
            cdnUrl: a.cdn_url,
            thumbnailUrl: a.thumbnail_url || a.cdn_url,
            size: a.size || '2.0 MB',
            dimensions: a.dimensions || '2000 x 2000',
            folderId: a.folder_id || 'folder_lumina_catalog_2026',
          }));
          inMemoryDriveSettings.backup_count = inMemoryDriveSettings.files_cache.length;
        }
      } catch (err) {
        console.warn('Restore error from Supabase:', err);
      }

      return NextResponse.json({
        success: true,
        restored: true,
        settings: inMemoryDriveSettings,
      });
    }

    // Guardado sincrónico del estado general en Supabase si aplica
    try {
      await supabase.from('admin_google_drive_settings').upsert({
        id: 'global',
        is_connected: inMemoryDriveSettings.is_connected,
        connected_email: inMemoryDriveSettings.connected_email,
        connected_account_name: inMemoryDriveSettings.connected_account_name,
        selected_folder_id: inMemoryDriveSettings.selected_folder_id,
        selected_folder_name: inMemoryDriveSettings.selected_folder_name,
        folders_list: inMemoryDriveSettings.folders_list,
        files_cache: inMemoryDriveSettings.files_cache,
        backup_at: inMemoryDriveSettings.backup_at,
        backup_count: inMemoryDriveSettings.files_cache.length,
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
        backupAt: inMemoryDriveSettings.backup_at,
        backupCount: inMemoryDriveSettings.files_cache.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
