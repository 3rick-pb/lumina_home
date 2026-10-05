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

function loadGIS(): Promise<void> {
  if (gisLoaded || (typeof window !== 'undefined' && window.google?.accounts?.oauth2)) {
    gisLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
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
      await loadGIS();

      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services no disponible'));
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: TokenResponse) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No se recibió el token de acceso'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err.message || err.type));
        },
      });

      // This opens Google's popup — no page redirect
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}
