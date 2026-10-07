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
}

export interface GoogleDriveApiFolder {
  id: string;
  name: string;
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
// RATE LIMITING EN MEMORIA: 20 solicitudes / minuto por administrador
// =========================================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 25;

function checkRateLimit(adminId: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(adminId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(adminId, { count: 1, resetAt: now + 60000 });
    return;
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitSec = Math.ceil((entry.resetAt - now) / 1000);
    throw new Error(`RATE_LIMIT_EXCEEDED: Límite de solicitudes a Google Drive excedido. Reintenta en ${waitSec}s.`);
  }

  entry.count += 1;
}

// =========================================================================
// CACHÉ EN MEMORIA (TTL: 60 segundos) para listados frecuentes
// =========================================================================
interface CacheEntry<T> {
  data: T;
  expires: number;
}
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setToCache<T>(key: string, data: T, ttlMs = 60000): void {
  memoryCache.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(adminId: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`drive:${adminId}:`)) {
      memoryCache.delete(key);
    }
  }
}

// =========================================================================
// CLASE PRINCIPAL DEL SERVICIO
// =========================================================================
export class GoogleDriveService {
  /**
   * Obtiene las credenciales descifradas del administrador y refresca el access token si expiró
   */
  static async getValidAccessToken(adminId: string): Promise<{ accessToken: string; record: StoredCredentialsRecord }> {
    const supabase = getServiceSupabaseClient();
    const { data: record, error } = await supabase
      .from("google_drive_credentials")
      .select("*")
      .eq("admin_id", adminId)
      .is("revoked_at", null)
      .maybeSingle();

    if (error || !record) {
      throw new Error("DRIVE_NOT_CONNECTED: No hay cuenta de Google Drive autorizada para este administrador.");
    }

    const rec = record as StoredCredentialsRecord;
    let accessToken = decryptToken(rec.access_token_encrypted);
    const refreshToken = rec.refresh_token_encrypted ? decryptToken(rec.refresh_token_encrypted) : "";

    const now = Date.now();
    const expiresAt = rec.token_expiry ? new Date(rec.token_expiry).getTime() : 0;
    const isExpiredOrClose = expiresAt > 0 && now >= (expiresAt - 5 * 60 * 1000);

    // Si el token expiró y poseemos refresh_token, renovarlo de forma transparente
    if ((isExpiredOrClose || !accessToken) && refreshToken) {
      const refreshed = await this.refreshAccessToken(adminId, refreshToken, rec);
      accessToken = refreshed.accessToken;
    }

    if (!accessToken) {
      throw new Error("TOKEN_INVALID: El token de Google Drive no es válido y requiere reautorización.");
    }

    // Actualizar last_used_at
    supabase
      .from("google_drive_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("admin_id", adminId)
      .then(() => {});

    return { accessToken, record: rec };
  }

  /**
   * Refresca el access token utilizando el refresh token ante Google OAuth
   */
  static async refreshAccessToken(
    adminId: string,
    refreshToken: string,
    _existingRecord?: StoredCredentialsRecord
  ): Promise<{ accessToken: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      throw new Error("CONFIG_MISSING: Faltan credenciales GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en el servidor.");
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
      await res.text().catch(() => {});
      // Si el refresh token fue revocado por el usuario en Google
      if (res.status === 400 || res.status === 401) {
        const supabase = getServiceSupabaseClient();
        await supabase
          .from("google_drive_credentials")
          .update({ revoked_at: new Date().toISOString() })
          .eq("admin_id", adminId);
        throw new Error("TOKEN_REVOKED: La autorización de Google Drive ha sido revocada. Conéctala de nuevo.");
      }
      throw new Error(`REFRESH_FAILED: Error al renovar token de Google: ${res.statusText}`);
    }

    const data = await res.json();
    const newAccessToken = data.access_token as string;
    const expiresIn = (data.expires_in as number) || 3600;
    const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Conservar el refresh_token anterior si Google no envió uno nuevo
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
  }

  /**
   * Obtiene la lista de imágenes de Google Drive para un administrador
   */
  static async listImages(
    adminId: string,
    folderIdOverride?: string
  ): Promise<{ files: GoogleDriveApiFile[]; folderId: string; folderName: string }> {
    checkRateLimit(adminId);

    const { accessToken, record } = await this.getValidAccessToken(adminId);
    const targetFolderId = folderIdOverride || record.drive_folder_id || "root";
    const cacheKey = `drive:${adminId}:files:${targetFolderId}`;

    const cached = getFromCache<{ files: GoogleDriveApiFile[]; folderId: string; folderName: string }>(cacheKey);
    if (cached) return cached;

    // Consulta de imágenes en Google Drive API v3
    let query = "trashed = false and (mimeType contains 'image/')";
    if (targetFolderId && targetFolderId !== "root" && targetFolderId !== "folder_lumina_catalog_2026") {
      query += ` and '${targetFolderId}' in parents`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&pageSize=100&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,webContentLink,size,imageMediaMetadata,parents)&orderBy=modifiedTime desc`;

    const res = await this.fetchWithBackoff(url, accessToken);
    if (!res.ok) {
      throw new Error(`GOOGLE_API_ERROR: (${res.status}) ${res.statusText}`);
    }

    interface RawDriveFile {
      id: string;
      name: string;
      mimeType?: string;
      thumbnailLink?: string;
      size?: string;
      imageMediaMetadata?: { width?: number; height?: number };
      parents?: string[];
    }

    const data = await res.json();
    const rawFiles: RawDriveFile[] = Array.isArray(data.files) ? data.files : [];

    const files: GoogleDriveApiFile[] = rawFiles.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType || "image/jpeg",
      cdnUrl: `/api/admin/google-drive/image?id=${f.id}`,
      thumbnailUrl: f.thumbnailLink || `/api/admin/google-drive/image?id=${f.id}&thumb=1`,
      size: f.size ? `${(parseInt(f.size, 10) / (1024 * 1024)).toFixed(1)} MB` : "HD",
      dimensions:
        f.imageMediaMetadata?.width && f.imageMediaMetadata?.height
          ? `${f.imageMediaMetadata.width} x ${f.imageMediaMetadata.height}`
          : "Resolución Google Drive",
      folderId: f.parents?.[0] || targetFolderId,
      source: "google_drive",
    }));

    const result = {
      files,
      folderId: targetFolderId,
      folderName: record.drive_folder_name || "Mi Unidad",
    };

    setToCache(cacheKey, result, 45000); // 45s de caché
    return result;
  }

  /**
   * Obtiene la lista de carpetas disponibles en la unidad
   */
  static async listFolders(adminId: string): Promise<GoogleDriveApiFolder[]> {
    checkRateLimit(adminId);

    const { accessToken } = await this.getValidAccessToken(adminId);
    const cacheKey = `drive:${adminId}:folders`;

    const cached = getFromCache<GoogleDriveApiFolder[]>(cacheKey);
    if (cached) return cached;

    const query = encodeURIComponent("trashed = false and mimeType = 'application/vnd.google-apps.folder'");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=60&fields=files(id,name)&orderBy=name`;

    const res = await this.fetchWithBackoff(url, accessToken);
    if (!res.ok) {
      throw new Error(`GOOGLE_API_ERROR: (${res.status}) ${res.statusText}`);
    }

    interface RawFolder {
      id: string;
      name: string;
    }

    const data = await res.json();
    const rawFolders: RawFolder[] = Array.isArray(data.files) ? data.files : [];

    const folders: GoogleDriveApiFolder[] = [
      { id: "root", name: "Mi Unidad", itemCount: 0 },
      ...rawFolders.map((f) => ({ id: f.id, name: f.name, itemCount: 0 })),
    ];

    setToCache(cacheKey, folders, 60000);
    return folders;
  }

  /**
   * Actualiza la carpeta activa seleccionada por el administrador
   */
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

    invalidateCache(adminId);
  }

  /**
   * Desconecta Google Drive del administrador (revoca tokens y elimina registro)
   * NUNCA toca la sesión del administrador en Lumina Home
   */
  static async disconnect(adminId: string): Promise<void> {
    const supabase = getServiceSupabaseClient();

    // Obtener token para intentar revocación ante Google si es posible
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

    // Eliminar credenciales asociadas al admin_id
    await supabase.from("google_drive_credentials").delete().eq("admin_id", adminId);
    invalidateCache(adminId);
  }

  /**
   * Ejecuta peticiones HTTP con exponential backoff + jitter para errores 5xx o 429
   */
  private static async fetchWithBackoff(url: string, token: string, maxRetries = 2): Promise<Response> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
