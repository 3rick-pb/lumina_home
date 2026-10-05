/**
 * Google Identity Services (GIS) — Token flow
 * Gets a Drive access token via popup WITHOUT disrupting the admin session.
 * Docs: https://developers.google.com/identity/oauth2/web/guides/use-token-model
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
        };
      };
    };
  }
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message?: string }) => void;
  prompt?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  token_type?: string;
}

let gisLoaded = false;

export function loadGIS(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (gisLoaded || Boolean(window.google?.accounts?.oauth2)) {
    gisLoaded = true;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => {
        gisLoaded = true;
        resolve();
      });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services')));
      // If already loaded before listener attached
      if (window.google?.accounts?.oauth2) {
        gisLoaded = true;
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('No se pudo cargar el script de Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Opens a Google consent popup and returns a Drive access token.
 * Does NOT create a Supabase session — completely independent.
 */
export function requestDriveAccessToken(clientId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        return reject(new Error('Solo disponible en el navegador'));
      }

      await loadGIS();

      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services no está listo aún. Espera 2 segundos y vuelve a intentar.'));
      }

      const currentOrigin = window.location.origin;

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: (response: TokenResponse) => {
          if (response.error) {
            let userFriendlyMsg = response.error_description || response.error;
            if (response.error === 'origin_mismatch' || response.error === 'idpiframe_initialization_failed') {
              userFriendlyMsg = `Error de origen Google: "${currentOrigin}" no está en los "Orígenes de JavaScript autorizados" de tu Client ID en Google Cloud Console.`;
            } else if (response.error === 'popup_closed_by_user') {
              userFriendlyMsg = 'La ventana de Google se cerró antes de completar la autorización.';
            } else if (response.error === 'access_denied') {
              userFriendlyMsg = 'Acceso denegado: debes autorizar los permisos de Google Drive para conectar.';
            }
            reject(new Error(userFriendlyMsg));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No se recibió el token de acceso de Google'));
          }
        },
        error_callback: (err) => {
          let msg = err.message || err.type || 'Error en Google Identity';
          if (err.type === 'popup_blocked') {
            msg = 'El navegador bloqueó la ventana emergente de Google. Por favor permite las ventanas emergentes (popups) para este sitio y vuelve a intentar.';
          }
          reject(new Error(msg));
        },
      });

      // Opens Google's popup
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al abrir autenticación de Google';
      reject(new Error(msg));
    }
  });
}
