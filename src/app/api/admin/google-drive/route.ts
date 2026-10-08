import { NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyIsAdmin, getScopedSupabaseClient, getServiceSupabaseClient } from '@/lib/serverAuth';
import { GoogleDriveService } from '@/lib/googleDriveService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const supabase = getScopedSupabaseClient(request);
    const serviceSupabase = getServiceSupabaseClient();
    const authUser = await getAuthenticatedUser(request);
    
    let isConnected = false;
    let connectedEmail = '';
    let connectedAccountName = '';
    let connectedAt: string | null = null;
    let selectedFolderId = 'root';
    let selectedFolderName = 'Mi Unidad';
    
    let resolvedFolders: Array<{ id: string; name: string; itemCount: number; parentId?: string | null }> = [{ id: 'root', name: 'Mi Unidad', itemCount: 0 }];
    let resolvedFiles: Array<{ id: string; name: string; mimeType?: string; cdnUrl: string; thumbnailUrl: string; size?: string; dimensions?: string; folderId?: string; source?: string }> = [];
    let backupAt: string | null = null;
    let backupCount = 0;

    const urlObj = new URL(request.url);
    const folderIdParam = urlObj.searchParams.get('folderId');

    // 1. Verificar si hay credenciales activas
    let cred = null;
    if (authUser?.id) {
      const { data: userCred } = await serviceSupabase
        .from('google_drive_credentials')
        .select('*')
        .eq('admin_id', authUser.id)
        .is('revoked_at', null)
        .maybeSingle();
      if (userCred) cred = userCred;
    }

    if (!cred) {
      const { data: latestCred } = await serviceSupabase
        .from('google_drive_credentials')
        .select('*')
        .is('revoked_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestCred) cred = latestCred;
    }

    // 2. Leer configuraciones globales guardadas en base de datos (NUESTRO CACHÉ)
    const { data: globalSettings } = await supabase
      .from('admin_google_drive_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (cred || (globalSettings && globalSettings.is_connected)) {
      isConnected = true;
      connectedEmail = cred?.google_account_email || globalSettings?.connected_email || '';
      connectedAccountName = cred?.google_account_name || globalSettings?.connected_account_name || '';
      connectedAt = cred?.created_at || globalSettings?.updated_at || null;
      
      const defaultCredFolder = cred?.drive_folder_id || globalSettings?.selected_folder_id || 'root';
      selectedFolderId = folderIdParam && folderIdParam !== 'folder_lumina_catalog_2026' ? folderIdParam : defaultCredFolder;
      
      selectedFolderName = cred?.drive_folder_name || globalSettings?.selected_folder_name || 'Mi Unidad';
      
      if (Array.isArray(globalSettings?.folders_list) && globalSettings.folders_list.length > 1) {
        resolvedFolders = globalSettings.folders_list;
      } else if (cred?.admin_id) {
        // Si no hay carpetas en caché, cargarlas automáticamente de Google Drive
        try {
          const freshFolders = await GoogleDriveService.listFolders(cred.admin_id, true);
          if (Array.isArray(freshFolders) && freshFolders.length > 0) {
            resolvedFolders = freshFolders;
          }
        } catch (err: unknown) {
          console.error("Error auto-cargando carpetas de Drive:", err);
        }
      }

      // Resolver el nombre de la carpeta seleccionada si no es la raíz
      if (selectedFolderId !== 'root') {
        const foundFolder = resolvedFolders.find((f) => f.id === selectedFolderId);
        if (foundFolder) {
          selectedFolderName = foundFolder.name;
        }
      }

      backupAt = globalSettings?.backup_at || null;
    }

    // 3. Obtener archivos desde la tabla de caché (admin_media_assets)
    // REQUISITO ESTRICTO: Antes de seleccionar una carpeta de Mi Unidad, NO se muestra ninguna imagen.
    if (selectedFolderId && selectedFolderId !== 'root' && selectedFolderId !== 'folder_lumina_catalog_2026') {
      try {
        const query = serviceSupabase
          .from('admin_media_assets')
          .select('*')
          .eq('folder_id', selectedFolderId)
          .order('created_at', { ascending: false })
          .limit(2000);
        
        const { data: assets, error } = await query;
        if (!error && Array.isArray(assets) && assets.length > 0) {
          resolvedFiles = assets.map((a: {
            id: string;
            name: string;
            mime_type?: string;
            cdn_url: string;
            thumbnail_url?: string;
            size?: string;
            dimensions?: string;
            folder_id?: string;
            source?: string;
          }) => ({
            id: a.id,
            name: a.name,
            mimeType: a.mime_type || 'image/jpeg',
            cdnUrl: a.cdn_url,
            thumbnailUrl: a.thumbnail_url || a.cdn_url,
            size: a.size || 'HD',
            dimensions: a.dimensions || '2000 x 2000',
            folderId: a.folder_id || selectedFolderId,
            source: a.source || 'google_drive'
          }));
          backupCount = resolvedFiles.length;
        } else if (cred?.admin_id && isConnected) {
          // Si la carpeta seleccionada no tiene imágenes en caché, cargarlas bajo demanda
          try {
            const freshFiles = await GoogleDriveService.fetchFolderImages(cred.admin_id, selectedFolderId);
            if (Array.isArray(freshFiles) && freshFiles.length > 0) {
              resolvedFiles = freshFiles.map((f) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                cdnUrl: f.cdnUrl,
                thumbnailUrl: f.thumbnailUrl,
                size: f.size,
                dimensions: f.dimensions,
                folderId: f.folderId,
                source: f.source,
              }));
              backupCount = resolvedFiles.length;
            }
          } catch (err: unknown) {
            console.error("Error auto-cargando fotos de carpeta:", err);
          }
        }
      } catch (e) {
        console.warn("No se pudieron cargar archivos del caché", e);
      }
    } else {
      // En 'Mi Unidad' (sin carpeta específica seleccionada), NO se muestra ninguna imagen.
      resolvedFiles = [];
    }

    // Consultar el recuento global de fotos por carpeta directamente en la BD (admin_media_assets)
    let totalDbMediaCount = 0;
    const dbFileFolderCounts: Record<string, number> = {};
    try {
      const { data: dbAssetCounts } = await serviceSupabase
        .from('admin_media_assets')
        .select('folder_id');

      if (Array.isArray(dbAssetCounts)) {
        totalDbMediaCount = dbAssetCounts.length;
        for (const row of dbAssetCounts) {
          if (row.folder_id) {
            dbFileFolderCounts[row.folder_id] = (dbFileFolderCounts[row.folder_id] || 0) + 1;
          }
        }
      }
    } catch (e) {
      console.warn("No se pudo consultar conteo de admin_media_assets:", e);
    }

    // Actualizar itemCount de cada carpeta combinando BD y Drive
    resolvedFolders = resolvedFolders.map((folder) => {
      const dbCount = dbFileFolderCounts[folder.id];
      const count = folder.id === 'root'
        ? totalDbMediaCount
        : (dbCount !== undefined && dbCount > 0 ? dbCount : (folder.itemCount || 0));
      return {
        ...folder,
        itemCount: count,
      };
    });

    // FILTRADO DE RAÍZ EN BD: Excluir estrictamente todas las carpetas vacías (itemCount === 0)
    // Mi Unidad ('root') siempre permanece como ancla raíz
    resolvedFolders = resolvedFolders.filter(
      (folder) => folder.id === 'root' || (folder.itemCount && folder.itemCount > 0)
    );

    // Persistir lista filtrada limpia en BD si hay conexión activa
    if (globalSettings?.is_connected) {
      supabase.from('admin_google_drive_settings').update({
        folders_list: resolvedFolders,
        updated_at: new Date().toISOString()
      }).eq('id', 'global').then(() => {});
    }

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
        backupCount,
        googleClientId: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '').replace('YOUR_GOOGLE_CLIENT_ID_HERE', ''),
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

    if (action === 'sync') {
      let targetAdminId = authUser?.id;
      if (!targetAdminId) {
        const serviceSupabase = getServiceSupabaseClient();
        const { data: latest } = await serviceSupabase
          .from('google_drive_credentials')
          .select('admin_id')
          .is('revoked_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest?.admin_id) targetAdminId = latest.admin_id;
      }

      if (targetAdminId) {
        try {
          const stats = await GoogleDriveService.syncAllToDatabase(targetAdminId, body.folderId);
          return NextResponse.json({ success: true, message: `Sincronización completa: ${stats.filesCount} archivos y ${stats.foldersCount} carpetas.` });
        } catch (err: unknown) {
          return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
        }
      } else {
        return NextResponse.json({ success: false, error: 'No admin credentials found' }, { status: 400 });
      }
    } else if (action === 'disconnect') {
      if (authUser?.id) {
        try {
          await GoogleDriveService.disconnect(authUser.id);
        } catch {}
      }
      return NextResponse.json({ success: true });
    } else if (action === 'select_folder') {
      const folderId = typeof body.folderId === 'string' ? body.folderId.trim() : 'root';
      const folderName = typeof body.folderName === 'string' ? body.folderName.trim() : 'Mi Unidad';
      
      let targetAdminId = authUser?.id;
      if (!targetAdminId) {
        const serviceSupabase = getServiceSupabaseClient();
        const { data: latest } = await serviceSupabase
          .from('google_drive_credentials')
          .select('admin_id')
          .is('revoked_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest?.admin_id) targetAdminId = latest.admin_id;
      }

      let folderFiles: unknown[] = [];
      if (targetAdminId) {
        await GoogleDriveService.selectFolder(targetAdminId, folderId, folderName);
        if (folderId !== 'root') {
          try {
            folderFiles = await GoogleDriveService.fetchFolderImages(targetAdminId, folderId);
          } catch (e) {
            console.error("Error fetching images on select_folder:", e);
          }
        }
      }
      return NextResponse.json({ success: true, files: folderFiles });
    } else if (action === 'create_folder') {
      const folder = body.folder;
      if (folder && folder.id && folder.name) {
        // En un caso real crearíamos la carpeta en Google Drive.
        // Aquí solo actualizamos el caché local (admin_google_drive_settings)
        const { data: globalSettings } = await supabase.from('admin_google_drive_settings').select('folders_list').eq('id', 'global').maybeSingle();
        if (globalSettings && Array.isArray(globalSettings.folders_list)) {
          const updatedFolders = [folder, ...globalSettings.folders_list];
          await supabase.from('admin_google_drive_settings').update({ folders_list: updatedFolders, selected_folder_id: folder.id, selected_folder_name: folder.name }).eq('id', 'global');
        }
      }
      return NextResponse.json({ success: true });
    } else if (action === 'delete_folder') {
      const folderId = body.folderId;
      if (folderId) {
        const { data: globalSettings } = await supabase.from('admin_google_drive_settings').select('folders_list').eq('id', 'global').maybeSingle();
        if (globalSettings && Array.isArray(globalSettings.folders_list)) {
          const updatedFolders = globalSettings.folders_list.filter((f: { id: string }) => f.id !== folderId);
          await supabase.from('admin_google_drive_settings').update({ folders_list: updatedFolders, selected_folder_id: 'root', selected_folder_name: 'Mi Unidad' }).eq('id', 'global');
        }
      }
      return NextResponse.json({ success: true });
    } else if (action === 'add_photo' || action === 'add_photos') {
      const newItems = Array.isArray(body.photos) ? body.photos : (body.photo ? [body.photo] : []);
      const rows = newItems.map((f: { id?: string; name?: string; cdnUrl: string; thumbnailUrl?: string; mimeType?: string; size?: string; dimensions?: string; folderId?: string }) => ({
        id: f.id || `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name || 'FOTOGRAFIA.jpg',
        cdn_url: f.cdnUrl,
        thumbnail_url: f.thumbnailUrl || f.cdnUrl,
        mime_type: f.mimeType || 'image/jpeg',
        size: f.size || '1.8 MB',
        dimensions: f.dimensions || '2000 x 2000',
        folder_id: f.folderId || 'root',
        source: 'upload',
        updated_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        await supabase.from('admin_media_assets').upsert(rows);
      }
      return NextResponse.json({ success: true });
    } else if (action === 'delete_photo') {
      if (body.photoId) {
        await supabase.from('admin_media_assets').delete().eq('id', body.photoId);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
