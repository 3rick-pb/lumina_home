import { getServiceSupabaseClient } from "./serverAuth";
import { encryptToken, decryptToken } from "./encryption";

export interface GoogleDriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  cdnUrl: string;
  thumbnailUrl: string;
  size: string;
  dimensions: string;
  folderId: string;
  source: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhoto?: string;
}

export interface GoogleDriveApiFolder {
  id: string;
  name: string;
  parentId?: string | null;
  itemCount: number;
}

export interface StoredCredentialsRecord {
  id: string;
  admin_id: string;
  google_account_email: string;
  google_account_name: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expiry: string | null;
  scopes: string;
  drive_folder_id: string;
  drive_folder_name: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

// =========================================================================
// CLASE PRINCIPAL DEL SERVICIO
// =========================================================================
export class GoogleDriveService {
  // Mutex para evitar que múltiples solicitudes concurrentes refresquen el token al mismo tiempo
  private static refreshPromises = new Map<string, Promise<{ accessToken: string }>>();
  // Caché de tokens válidos en memoria para no saturar DB al descifrar (TTL hasta expiración)
  private static tokenCache = new Map<string, { accessToken: string; expiresAt: number; record: StoredCredentialsRecord }>();

  /**
   * Obtiene las credenciales descifradas del administrador y refresca el access token si expiró
   */
  static async getValidAccessToken(adminId: string): Promise<{ accessToken: string; record: StoredCredentialsRecord }> {
    const now = Date.now();
    const cachedToken = this.tokenCache.get(adminId);
    if (cachedToken && now < cachedToken.expiresAt - 3 * 60 * 1000) {
      return { accessToken: cachedToken.accessToken, record: cachedToken.record };
    }

    const supabase = getServiceSupabaseClient();
    const { data: recordData, error } = await supabase
      .from("google_drive_credentials")
      .select("*")
      .eq("admin_id", adminId)
      .is("revoked_at", null)
      .maybeSingle();

    let record = recordData;

    // Resiliencia multi-sesión
    if (error || !record) {
      const { data: latest } = await supabase
        .from("google_drive_credentials")
        .select("*")
        .is("revoked_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) {
        record = latest;
      }
    }

    if (!record) {
      throw new Error("DRIVE_NOT_CONNECTED: No hay cuenta de Google Drive autorizada para este administrador.");
    }

    const rec = record as StoredCredentialsRecord;
    let accessToken = decryptToken(rec.access_token_encrypted);
    const refreshToken = rec.refresh_token_encrypted ? decryptToken(rec.refresh_token_encrypted) : "";

    const expiresAt = rec.token_expiry ? new Date(rec.token_expiry).getTime() : 0;
    const isExpiredOrClose = expiresAt > 0 && now >= (expiresAt - 5 * 60 * 1000);

    // Renovación transparente
    if ((isExpiredOrClose || !accessToken) && refreshToken) {
      const refreshed = await this.refreshAccessToken(rec.admin_id, refreshToken, rec);
      accessToken = refreshed.accessToken;
    }

    if (!accessToken) {
      throw new Error("TOKEN_INVALID: El token de Google Drive no es válido y requiere reautorización.");
    }

    // Actualizar caché de tokens
    const finalExpiresAt = rec.token_expiry ? new Date(rec.token_expiry).getTime() : now + 3500 * 1000;
    this.tokenCache.set(adminId, { accessToken, expiresAt: finalExpiresAt, record: rec });
    if (rec.admin_id !== adminId) {
      this.tokenCache.set(rec.admin_id, { accessToken, expiresAt: finalExpiresAt, record: rec });
    }

    // Background update de último uso
    supabase
      .from("google_drive_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", rec.id)
      .then(() => {});

    return { accessToken, record: rec };
  }

  static async refreshAccessToken(
    adminId: string,
    refreshToken: string,
    _existingRecord?: StoredCredentialsRecord
  ): Promise<{ accessToken: string }> {
    const inFlight = this.refreshPromises.get(adminId);
    if (inFlight) {
      return inFlight;
    }

    const refreshPromise = (async () => {
      try {
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

        if (!clientId || !clientSecret) {
          throw new Error("CONFIG_MISSING: Faltan credenciales GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET.");
        }

        const params = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        });

        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          let isExplicitRevocation = false;
          try {
            const errJson = JSON.parse(errText);
            if (errJson.error === "invalid_grant" && (errJson.error_description?.toLowerCase().includes("revoked") || errJson.error_description?.toLowerCase().includes("expired"))) {
              isExplicitRevocation = true;
            }
          } catch {}

          if (isExplicitRevocation) {
            const supabase = getServiceSupabaseClient();
            await supabase
              .from("google_drive_credentials")
              .update({ revoked_at: new Date().toISOString() })
              .eq("admin_id", adminId);
            this.tokenCache.delete(adminId);
            throw new Error("TOKEN_REVOKED: La autorización ha sido revocada.");
          }

          throw new Error(`REFRESH_FAILED: Error al renovar token: ${res.statusText}`);
        }

        const data = await res.json();
        const newAccessToken = data.access_token as string;
        const expiresIn = (data.expires_in as number) || 3600;
        const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
        const newRefreshToken = data.refresh_token ? (data.refresh_token as string) : refreshToken;

        const supabase = getServiceSupabaseClient();
        await supabase
          .from("google_drive_credentials")
          .update({
            access_token_encrypted: encryptToken(newAccessToken),
            refresh_token_encrypted: encryptToken(newRefreshToken),
            token_expiry: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq("admin_id", adminId);

        return { accessToken: newAccessToken };
      } finally {
        this.refreshPromises.delete(adminId);
      }
    })();

    this.refreshPromises.set(adminId, refreshPromise);
    return refreshPromise;
  }

  /**
   * Ejecuta una sincronización completa asíncrona hacia Supabase con paginación
   */
  static async syncAllToDatabase(adminId: string, targetFolderId?: string): Promise<{ filesCount: number; foldersCount: number }> {
    const { accessToken, record } = await this.getValidAccessToken(adminId);
    
    // 1. Obtener TODAS las carpetas (siempre necesitamos las carpetas para el selector)
    let folders: GoogleDriveApiFolder[] = [{ id: "root", name: "Mi Unidad", parentId: null, itemCount: 0 }];
    let pageToken: string | undefined;
    const folderQuery = encodeURIComponent("trashed = false and mimeType = 'application/vnd.google-apps.folder' and 'me' in owners and sharedWithMe = false");

    do {
      const url = `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&pageSize=1000&fields=nextPageToken,files(id,name,parents)&orderBy=name${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await this.fetchWithBackoff(url, accessToken);
      if (!res.ok) throw new Error(`Google API Folders Error: ${res.statusText}`);
      
      const data = await res.json();
      const apiFolders = Array.isArray(data.files) ? data.files : [];
      
      folders = folders.concat(apiFolders.map((f: GoogleDriveApiFolder & { parents?: string[] }) => ({
        id: f.id,
        name: f.name,
        parentId: f.parents?.[0] || "root",
        itemCount: 0
      })));
      
      pageToken = data.nextPageToken;
    } while (pageToken);

    // 2. Obtener TODAS las imágenes DE LA CARPETA SELECCIONADA
    let files: GoogleDriveApiFile[] = [];
    pageToken = undefined;
    
    const target = targetFolderId || record.drive_folder_id || "root";
    let fileQueryStr = "trashed = false and (mimeType contains 'image/') and 'me' in owners and sharedWithMe = false";
    if (target !== "root" && target !== "folder_lumina_catalog_2026") {
      fileQueryStr += ` and '${target}' in parents`;
    }
    const fileQuery = encodeURIComponent(fileQueryStr);
    
    let totalFetched = 0;
    const MAX_FILES = 5000;

    do {
      const url = `https://www.googleapis.com/drive/v3/files?q=${fileQuery}&pageSize=1000&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,webContentLink,size,imageMediaMetadata,parents,owners)&orderBy=modifiedTime desc${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await this.fetchWithBackoff(url, accessToken);
      if (!res.ok) throw new Error(`Google API Files Error: ${res.statusText}`);
      
      const data = await res.json();
      const apiFiles = Array.isArray(data.files) ? data.files : [];
      
      const batchFiles = apiFiles.map((f: {
        id: string;
        name: string;
        mimeType?: string;
        thumbnailLink?: string;
        size?: string;
        imageMediaMetadata?: { width?: number; height?: number };
        parents?: string[];
        owners?: Array<{ displayName?: string; emailAddress?: string; photoLink?: string }>;
      }) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType || "image/jpeg",
        cdnUrl: `/api/admin/google-drive/image?id=${f.id}`,
        thumbnailUrl: f.thumbnailLink || `/api/admin/google-drive/image?id=${f.id}&thumb=1`,
        size: f.size ? `${(parseInt(f.size, 10) / (1024 * 1024)).toFixed(1)} MB` : "HD",
        dimensions: f.imageMediaMetadata?.width && f.imageMediaMetadata?.height ? `${f.imageMediaMetadata.width} x ${f.imageMediaMetadata.height}` : "Resolución Google Drive",
        folderId: f.parents?.[0] || "root",
        source: "google_drive",
        ownerName: f.owners?.[0]?.displayName || record.google_account_name || "Admin",
        ownerEmail: f.owners?.[0]?.emailAddress || record.google_account_email || "admin@lumina.com",
        ownerPhoto: f.owners?.[0]?.photoLink || "",
      }));
      
      files = files.concat(batchFiles);
      totalFetched += batchFiles.length;
      
      pageToken = data.nextPageToken;
      if (totalFetched >= MAX_FILES) break;
    } while (pageToken);

    // 3. Persistir en Supabase
    const supabase = getServiceSupabaseClient();
    
    // Contar items por carpeta
    const folderCounts: Record<string, number> = {};
    files.forEach(f => {
      folderCounts[f.folderId] = (folderCounts[f.folderId] || 0) + 1;
    });
    
    const finalFolders = folders.map(f => ({
      ...f,
      itemCount: f.id === 'root' ? files.length : (folderCounts[f.id] || 0)
    }));

    // Actualizar carpetas en admin_google_drive_settings
    await supabase.from('admin_google_drive_settings').upsert({
      id: 'global',
      is_connected: true,
      connected_email: record.google_account_email,
      connected_account_name: record.google_account_name,
      folders_list: finalFolders,
      updated_at: new Date().toISOString()
    });

    // Actualizar fotos en admin_media_assets
    if (files.length > 0) {
      // Opcional: borrar solo las fotos sincronizadas de drive antes de insertar masivamente
      // await supabase.from('admin_media_assets').delete().eq('source', 'google_drive');
      
      const chunkSize = 500;
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        const rows = chunk.map(f => ({
          id: f.id,
          name: f.name,
          cdn_url: f.cdnUrl,
          thumbnail_url: f.thumbnailUrl,
          mime_type: f.mimeType,
          size: f.size,
          dimensions: f.dimensions,
          folder_id: f.folderId,
          source: 'google_drive',
          updated_at: new Date().toISOString()
        }));
        await supabase.from('admin_media_assets').upsert(rows);
      }
    }

    return { filesCount: files.length, foldersCount: finalFolders.length };
  }

  static async selectFolder(adminId: string, folderId: string, folderName: string): Promise<void> {
    const supabase = getServiceSupabaseClient();
    await supabase
      .from("google_drive_credentials")
      .update({
        drive_folder_id: folderId,
        drive_folder_name: folderName,
        updated_at: new Date().toISOString(),
      })
      .eq("admin_id", adminId);
      
    await supabase
      .from("admin_google_drive_settings")
      .update({
        selected_folder_id: folderId,
        selected_folder_name: folderName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global");
  }

  static async disconnect(adminId: string): Promise<void> {
    const supabase = getServiceSupabaseClient();
    try {
      const { data: record } = await supabase
        .from("google_drive_credentials")
        .select("access_token_encrypted")
        .eq("admin_id", adminId)
        .maybeSingle();

      if (record?.access_token_encrypted) {
        const token = decryptToken(record.access_token_encrypted);
        if (token) {
          fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }).catch(() => {});
        }
      }
    } catch {}

    await supabase.from("google_drive_credentials").delete().eq("admin_id", adminId);
    this.tokenCache.delete(adminId);
    
    await supabase.from('admin_google_drive_settings').upsert({
      id: 'global',
      is_connected: false,
      connected_email: '',
      connected_account_name: '',
      updated_at: new Date().toISOString()
    });
  }

  private static async fetchWithBackoff(url: string, token: string, maxRetries = 3): Promise<Response> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        attempt++;
        if (attempt > maxRetries) return res;
        const delay = Math.pow(2, attempt) * 400 + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    }
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
}
