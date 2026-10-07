"use client";

import { useEffect, useState } from "react";
import { supabaseDrive } from "@/lib/supabaseDrive";

export default function DriveCallbackPage() {
  const [status, setStatus] = useState("Conectando con Google Drive...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processCallback() {
      try {
        if (typeof window === "undefined") return;

        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");
        const hashStr = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hashStr);
        const hashProviderToken = hashParams.get("provider_token");

        let providerToken = hashProviderToken || "";
        let userEmail = "";
        let userName = "";

        // 1. Intercambiar código PKCE si está presente usando el cliente aislado supabaseDrive
        if (code) {
          try {
            const { data, error } = await supabaseDrive.auth.exchangeCodeForSession(code);
            if (error) {
              console.warn("Error en intercambio de código Supabase:", error.message);
            }
            if (data?.session) {
              providerToken = data.session.provider_token || providerToken;
              userEmail = data.session.user?.email || "";
              userName =
                data.session.user?.user_metadata?.full_name ||
                data.session.user?.user_metadata?.name ||
                userEmail.split("@")[0] ||
                "";
            }
          } catch (codeErr) {
            console.warn("Fallo al procesar código PKCE:", codeErr);
          }
        }

        // 2. Si no obtuvimos email pero sí token, consultar directamente Google userinfo
        if (providerToken && !userEmail) {
          try {
            const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${providerToken}` },
            });
            if (infoRes.ok) {
              const info = await infoRes.json();
              userEmail = info.email || "";
              userName = info.name || userEmail.split("@")[0] || "";
            }
          } catch {}
        }

        // 3. Fallback de sesión existente en supabaseDrive
        if (!providerToken) {
          try {
            const { data: { session } } = await supabaseDrive.auth.getSession();
            if (session?.provider_token) {
              providerToken = session.provider_token;
              userEmail = session.user?.email || "";
              userName =
                session.user?.user_metadata?.full_name ||
                session.user?.user_metadata?.name ||
                userEmail.split("@")[0] ||
                "";
            }
          } catch {}
        }

        if (!providerToken && !userEmail) {
          if (isMounted) {
            setErrorMsg("No se recibieron credenciales de Google Drive.");
            setStatus("Autorización cancelada o expirada.");
          }
          return;
        }

        const authPayload = {
          type: "GOOGLE_DRIVE_AUTH_SUCCESS",
          providerToken,
          email: userEmail,
          name: userName,
          timestamp: Date.now(),
        };

        // Enviar resultado a la ventana principal sin alterar su sesión de tienda
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(authPayload, "*");
          } catch {}
        }

        // Almacenar respaldo en localStorage para lectura inmediata por la ventana principal
        try {
          localStorage.setItem("lumina_fotoproductos_auth_result", JSON.stringify(authPayload));
        } catch {}

        if (isMounted) {
          setStatus("Google Drive conectado con éxito. Cerrando ventana...");
        }

        // Cerrar popup suavemente
        setTimeout(() => {
          try {
            window.close();
          } catch {}
        }, 800);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido al procesar autenticación";
        if (isMounted) {
          setErrorMsg(msg);
          setStatus("Error de conexión");
        }
      }
    }

    processCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-100 font-sans p-6 select-none">
      <div className="max-w-sm w-full p-8 rounded-2xl bg-stone-800/90 border border-stone-700/80 shadow-2xl text-center space-y-4">
        {!errorMsg ? (
          <>
            <div className="w-10 h-10 border-2 border-stone-600 border-t-stone-200 rounded-full animate-spin mx-auto" />
            <h2 className="text-sm font-semibold text-stone-100">{status}</h2>
            <p className="text-xs text-stone-400">Verificando autorización y permisos de Google Drive...</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-stone-700 text-stone-300 flex items-center justify-center mx-auto text-lg font-bold">
              !
            </div>
            <h2 className="text-sm font-semibold text-stone-100">{status}</h2>
            <p className="text-xs text-stone-400">{errorMsg}</p>
            <button
              type="button"
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-medium cursor-pointer"
            >
              Cerrar ventana
            </button>
          </>
        )}
      </div>
    </div>
  );
}
