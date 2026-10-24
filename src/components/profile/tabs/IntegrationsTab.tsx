"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  CreditCard,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Plus,
  Download,
  Database,
  Cloud,
  Globe,
  Smartphone,
  ChevronDown,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { CodeBlock } from "@/components/ui/code-block";

// ============================================================================
// TYPES & SERVICE STATUS
// ============================================================================
type ViewSection = "all" | "smtp" | "supabase" | "google" | "payphone" | "hosting" | "wallets";

interface ServiceConfigStatus {
  supabase?: {
    configured: boolean;
    url: string;
    hasAnonKey: boolean;
    hasServiceRole: boolean;
  };
  smtp?: {
    configured: boolean;
    host: string;
    port: number;
    user: string;
    from: string;
    secure: boolean;
    hasPassword: boolean;
  };
  googleDrive?: {
    configured: boolean;
    clientId: string;
    hasClientSecret: boolean;
    redirectUri: string;
    hasEncryptionKey: boolean;
  };
  payphone?: {
    configured: boolean;
    appId: string;
    storeId: string;
    hasToken: boolean;
    env: string;
    apiUrl: string;
  };
  hosting?: {
    siteUrl: string;
    hasMapbox: boolean;
    mapboxToken: string;
    masterAdminEmail: string;
  };
  wallets?: {
    configured: boolean;
    hasGoogleWallet: boolean;
    googleWalletIssuerId: string;
    googleWalletClientEmail: string;
    hasWalletSecret: boolean;
  };
}

// ============================================================================
// HARDWARE DOT-MATRIX GRAPHICS
// ============================================================================

/**
 * 04. Dot-Matrix ECG / Pulse Line
 * Inspired by Card 06 of Desing.jpg
 */
function DotHeartbeat({ active = true }: { active?: boolean }) {
  return (
    <div className="flex items-center justify-center py-2 px-1">
      <svg className="w-full max-w-[240px] h-10" viewBox="0 0 200 40">
        {/* Baseline dots */}
        {[
          [10, 20], [20, 20], [30, 20], [40, 20], [50, 20],
          [60, 24], [70, 14], [80, 20],
          [90, 20], [98, 20],
          // Pulse Spike with orange peak
          [105, 34], [112, 6], [118, 30], [125, 20],
          [135, 20], [145, 20], [155, 17], [165, 20],
          [175, 20], [185, 20], [195, 20],
        ].map(([cx, cy], i) => {
          const isSpike = cx >= 105 && cx <= 125;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isSpike ? 2.2 : 1.5}
              className={
                isSpike && active
                  ? "fill-[#ff5500] filter drop-shadow-[0_0_5px_#ff5500]"
                  : "fill-zinc-400"
              }
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: INTEGRATIONS TAB (Desing.jpg TAL CUAL)
// ============================================================================
export function IntegrationsTab() {
  const brand = useBrand();
  const { user } = useUserStore();

  const [activeSection, setActiveSection] = useState<ViewSection>("all");
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<ServiceConfigStatus | null>(null);
  const [showLiveCode, setShowLiveCode] = useState(true);

  // Combobox Dropdown State
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Close combobox on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
      }
    }
    if (isComboboxOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isComboboxOpen]);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const markCopied = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ==========================================
  // 1. SMTP SERVER STATE
  // ==========================================
  const [smtpProvider, setSmtpProvider] = useState<"gmail" | "custom">("gmail");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [senderName, setSenderName] = useState(brand.name);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dispatchRecipients, setDispatchRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [isSavingDispatch, setIsSavingDispatch] = useState(false);
  const [isTestingDispatch, setIsTestingDispatch] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  // ==========================================
  // 2. SUPABASE DB STATE
  // ==========================================
  const [supabaseUrl, setSupabaseUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState("");
  const [showSupabaseServiceKey, setShowSupabaseServiceKey] = useState(false);

  // ==========================================
  // 3. GOOGLE CLOUD & DRIVE STATE
  // ==========================================
  const [googleClientId, setGoogleClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ""
  );
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRedirectUri, setGoogleRedirectUri] = useState(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/admin/google-drive/callback`;
    }
    return "http://localhost:3000/api/admin/google-drive/callback";
  });
  const [googleEncryptionKey] = useState("");
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);

  // ==========================================
  // 4. PAYPHONE ECUADOR STATE
  // ==========================================
  const [payphoneToken, setPayphoneToken] = useState("");
  const [payphoneAppId, setPayphoneAppId] = useState(process.env.NEXT_PUBLIC_PAYPHONE_APP_ID || "");
  const [payphoneStoreId, setPayphoneStoreId] = useState("");
  const [payphoneEnv, setPayphoneEnv] = useState<"sandbox" | "production">("sandbox");
  const [payphoneMode, setPayphoneMode] = useState<"box" | "redirect">("box");
  const [showPayphoneToken, setShowPayphoneToken] = useState(false);
  const [isSavingPayphone, setIsSavingPayphone] = useState(false);
  const [payphoneMsg, setPayphoneMsg] = useState<{ success: boolean; text: string } | null>(null);

  // ==========================================
  // 5. HOSTING, DOMAIN & MAPBOX STATE
  // ==========================================
  const [siteUrl, setSiteUrl] = useState(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  });
  const [mapboxToken, setMapboxToken] = useState(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "");
  const [masterAdminEmail, setMasterAdminEmail] = useState(user?.email || "admin@luminahome.com");

  // ==========================================
  // 6. WALLETS STATE (GOOGLE WALLET)
  // ==========================================
  const [walletSecretKey, setWalletSecretKey] = useState("");
  const [googleWalletIssuerId, setGoogleWalletIssuerId] = useState("");
  const [googleWalletClientEmail, setGoogleWalletClientEmail] = useState("");
  const [showWalletSecret, setShowWalletSecret] = useState(false);

  // Computed infrastructure status (Vercel / Stripe Style)
  const infraServices = useMemo(() => {
    const isSmtpOnline = Boolean(servicesStatus?.smtp?.configured || (smtpUser && smtpPass));
    const isSupabaseOnline = Boolean(servicesStatus?.supabase?.configured || (supabaseUrl && supabaseAnonKey));
    const isGoogleOnline = Boolean(servicesStatus?.googleDrive?.configured || (googleClientId && googleClientSecret));
    const isPayphoneOnline = Boolean(servicesStatus?.payphone?.configured || (payphoneToken && payphoneAppId));
    const isWalletOnline = Boolean(servicesStatus?.wallets?.configured || (walletSecretKey || googleWalletIssuerId));

    return [
      {
        id: "smtp",
        name: "SMTP Correo",
        isOnline: isSmtpOnline,
        detail: smtpProvider === "gmail" ? "Gmail TLS (587)" : `${smtpHost}:${smtpPort}`,
      },
      {
        id: "supabase",
        name: "Supabase DB",
        isOnline: isSupabaseOnline,
        detail: "PostgreSQL Cloud",
      },
      {
        id: "google",
        name: "Google Drive API",
        isOnline: isGoogleOnline,
        detail: "OAuth 2.0 Storage",
      },
      {
        id: "payphone",
        name: "PayPhone Pagos",
        isOnline: isPayphoneOnline,
        detail: payphoneEnv === "production" ? "Producción" : "Sandbox / Pruebas",
      },
      {
        id: "wallets",
        name: "Google Wallet",
        isOnline: isWalletOnline,
        detail: "Passes API v1",
      },
    ];
  }, [
    servicesStatus,
    smtpUser,
    smtpPass,
    smtpProvider,
    smtpHost,
    smtpPort,
    supabaseUrl,
    supabaseAnonKey,
    googleClientId,
    googleClientSecret,
    payphoneToken,
    payphoneAppId,
    payphoneEnv,
    walletSecretKey,
    googleWalletIssuerId,
  ]);

  const configuredCount = infraServices.filter((s) => s.isOnline).length;

  // Random 32-byte generator
  const generateRandomHexKey = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Fetch full environment status from server
  const fetchEnvConfig = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      // 1. Fetch server environment status
      const res = await fetch("/api/admin/env-config", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.services) {
          setServicesStatus(data.services);

          if (data.services.smtp) {
            const s = data.services.smtp;
            if (s.user) setSmtpUser((prev) => prev || s.user);
            if (s.host) setSmtpHost(s.host);
            if (s.port) setSmtpPort(s.port);
            if (typeof s.secure === "boolean") setSmtpSecure(s.secure);
          }
          if (data.services.supabase?.url) {
            setSupabaseUrl((prev) => prev || data.services.supabase.url);
          }
          if (data.services.googleDrive?.clientId) {
            setGoogleClientId((prev) => prev || data.services.googleDrive.clientId);
          }
          if (data.services.googleDrive?.redirectUri) {
            setGoogleRedirectUri((prev) => prev || data.services.googleDrive.redirectUri);
          }
          if (data.services.payphone) {
            const p = data.services.payphone;
            if (p.appId) setPayphoneAppId((prev) => prev || p.appId);
            if (p.storeId) setPayphoneStoreId((prev) => prev || p.storeId);
            if (p.env === "production" || p.env === "sandbox") setPayphoneEnv(p.env);
          }
          if (data.services.hosting?.siteUrl) {
            setSiteUrl((prev) => prev || data.services.hosting.siteUrl);
          }
          if (data.services.hosting?.mapboxToken) {
            setMapboxToken((prev) => prev || data.services.hosting.mapboxToken);
          }
        }
      }

      // 2. Fetch dispatch recipients and PayPhone settings
      const smtpRes = await fetch("/api/admin/smtp", { headers });
      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        if (smtpData.success && Array.isArray(smtpData.dispatchRecipients)) {
          setDispatchRecipients(smtpData.dispatchRecipients);
        }
      }

      const payphoneRes = await fetch("/api/admin/payphone/settings", { headers });
      if (payphoneRes.ok) {
        const payphoneData = await payphoneRes.json();
        if (payphoneData.success) {
          setPayphoneMode(payphoneData.mode === "redirect" ? "redirect" : "box");
          if (payphoneData.storeId && !payphoneData.storeId.includes("••••")) {
            setPayphoneStoreId(payphoneData.storeId);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch environment configuration:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvConfig();
  }, [fetchEnvConfig]);

  // Master Save handler
  const handleSaveAllToDatabase = async () => {
    setIsSavingAll(true);
    setToolState("working");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      // Save dispatch recipients
      if (dispatchRecipients.length > 0) {
        await fetch("/api/admin/smtp", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "save_dispatch_recipients",
            recipients: dispatchRecipients,
          }),
        });
      }

      // Save PayPhone mode
      if (payphoneMode) {
        await fetch("/api/admin/payphone/settings", {
          method: "POST",
          headers,
          body: JSON.stringify({
            mode: payphoneMode,
            storeId: payphoneStoreId.trim() || undefined,
          }),
        });
      }

      await fetchEnvConfig();
      setToolState("done");
      setTimeout(() => setToolState("idle"), 2500);
    } catch (err) {
      console.warn("Error al guardar en la nube:", err);
      setToolState("idle");
    } finally {
      setIsSavingAll(false);
    }
  };

  // PayPhone Mode Toggle
  const handleSavePayphoneMode = async (modeToSave: "box" | "redirect") => {
    setIsSavingPayphone(true);
    setPayphoneMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/payphone/settings", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: modeToSave,
          storeId: payphoneStoreId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar el modo de PayPhone.");
      }

      setPayphoneMode(modeToSave);
      setPayphoneMsg({
        success: true,
        text: `Modo de checkout guardado: ${modeToSave === "box" ? "Cajita Embebida" : "Redirección 3D-Secure"}`,
      });
      fetchEnvConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar modo PayPhone.";
      setPayphoneMsg({ success: false, text: msg });
    } finally {
      setIsSavingPayphone(false);
    }
  };

  // SMTP test email dispatch
  const handleTestSmtpConnection = async () => {
    if (!testEmail.trim()) {
      setSmtpTestResult({ success: false, message: "Ingresa un correo destinatario para la prueba." });
      return;
    }

    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    setToolState("working");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const payload: Record<string, unknown> = {
        action: "verify_and_test",
        testRecipient: testEmail.trim(),
        host: smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost,
        port: smtpProvider === "gmail" ? 587 : smtpPort,
        secure: smtpSecure,
      };

      if (smtpUser.trim() && smtpPass.trim()) {
        payload.host = smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost;
        payload.port = smtpProvider === "gmail" ? 587 : smtpPort;
        payload.secure = smtpSecure;
        payload.user = smtpUser.trim();
        payload.pass = smtpPass.trim();
        payload.from = `${senderName.trim() || brand.name} <${smtpUser.trim()}>`;
      }

      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Error al verificar conexión SMTP.");
      }

      setSmtpTestResult({ success: true, message: data.message });
      setToolState("done");
      setTimeout(() => setToolState("idle"), 2000);
      fetchEnvConfig();
    } catch (err: unknown) {
      setToolState("idle");
      const msg = err instanceof Error ? err.message : "Error al probar conexión.";
      setSmtpTestResult({ success: false, message: msg });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Dispatch recipients management
  const persistDispatchRecipients = async (listToSave: string[], isAuto = false) => {
    setIsSavingDispatch(true);
    setToolState("working");
    if (!isAuto) setDispatchMsg(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "save_dispatch_recipients",
          recipients: listToSave,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Error al guardar receptores.");
      }

      setDispatchRecipients(data.dispatchRecipients || listToSave);
      setToolState("done");
      setTimeout(() => setToolState("idle"), 1800);
      setDispatchMsg({
        success: true,
        text: isAuto
          ? "Guardado en la base de datos."
          : data.message || "Receptores de despacho guardados exitosamente.",
      });
    } catch (err: unknown) {
      setToolState("idle");
      const msg = err instanceof Error ? err.message : "Error inesperado al guardar.";
      setDispatchMsg({ success: false, text: msg });
    } finally {
      setIsSavingDispatch(false);
    }
  };

  const handleAddRecipient = () => {
    const raw = recipientInput.trim();
    if (!raw) return;

    const candidates = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = candidates.find((e) => !emailRegex.test(e));
    if (invalid) {
      setDispatchMsg({
        success: false,
        text: `El correo '${invalid}' no tiene un formato válido.`,
      });
      return;
    }

    const currentSet = new Set(dispatchRecipients.map((e) => e.toLowerCase().trim()));
    const newItems: string[] = [];

    for (const c of candidates) {
      if (currentSet.has(c)) continue;
      currentSet.add(c);
      newItems.push(c);
    }

    if (newItems.length === 0) {
      setDispatchMsg({
        success: false,
        text: "Los correos ingresados ya están en la lista.",
      });
      return;
    }

    const nextList = [...dispatchRecipients, ...newItems];
    if (nextList.length > 7) {
      setDispatchMsg({
        success: false,
        text: `Límite alcanzado: Máximo 7 correos. Tienes ${nextList.length}.`,
      });
      return;
    }

    setDispatchRecipients(nextList);
    setRecipientInput("");
    persistDispatchRecipients(nextList, true);
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    const nextList = dispatchRecipients.filter(
      (e) => e.toLowerCase().trim() !== emailToRemove.toLowerCase().trim()
    );
    setDispatchRecipients(nextList);
    persistDispatchRecipients(nextList, true);
  };

  const handleTestDispatchEmail = async () => {
    setIsTestingDispatch(true);
    setDispatchMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "test_dispatch_email",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Fallo en la prueba de despacho.");
      }

      setDispatchMsg({
        success: true,
        text: `Notificación de prueba enviada a ${data.sentToCount || dispatchRecipients.length} receptores de bodega.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar prueba de despacho.";
      setDispatchMsg({ success: false, text: msg });
    } finally {
      setIsTestingDispatch(false);
    }
  };

  // Real-time computed Master .env string
  const computedMasterEnv = useMemo(() => {
    const lines = [
      `# ==============================================================================`,
      `# LUMINA HOME - MASTER ENVIRONMENT VARIABLES CONFIGURATION`,
      `# Generado en vivo: ${new Date().toISOString()}`,
      `# Plataforma: Next.js 14 App Router • Supabase • PayPhone • Google Drive API`,
      `# ==============================================================================`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 1. BASE DE DATOS POSTGRESQL & AUTENTICACIÓN (SUPABASE)`,
      `# ------------------------------------------------------------------------------`,
      `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl || "https://tu-proyecto.supabase.co"}"`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_anon_key"}"`,
      `SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceRoleKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_service_role_key"}"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 2. DOMINIO PÚBLICO, HOSTING & TELEMETRÍA`,
      `# ------------------------------------------------------------------------------`,
      `NEXT_PUBLIC_SITE_URL="${siteUrl || "http://localhost:3000"}"`,
      `NEXT_PUBLIC_APP_URL="${siteUrl || "http://localhost:3000"}"`,
      `NEXT_PUBLIC_MAPBOX_TOKEN="${mapboxToken || "pk.eyJ1Ijoi..."}"`,
      `MASTER_ADMIN_EMAIL="${masterAdminEmail || "admin@luminahome.com"}"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 3. SERVIDOR DE CORREO TRANSACCIONAL (SMTP / GMAIL / HOSTING)`,
      `# ------------------------------------------------------------------------------`,
      `SMTP_HOST="${smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost || "smtp.gmail.com"}"`,
      `SMTP_PORT="${smtpProvider === "gmail" ? 587 : smtpPort}"`,
      `SMTP_SECURE="${smtpSecure ? "true" : "false"}"`,
      `SMTP_USER="${smtpUser || "contacto@luminahome.com"}"`,
      `SMTP_PASS="${smtpPass || "tu_contrasena_de_aplicacion_16_caracteres"}"`,
      `SMTP_FROM="${senderName || brand.name} <${smtpUser || "contacto@luminahome.com"}>"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 4. GOOGLE CLOUD PLATFORM & GOOGLE DRIVE API (FOTOPRODUCTOS)`,
      `# ------------------------------------------------------------------------------`,
      `GOOGLE_CLIENT_ID="${googleClientId || "tu_google_client_id.apps.googleusercontent.com"}"`,
      `NEXT_PUBLIC_GOOGLE_CLIENT_ID="${googleClientId || "tu_google_client_id.apps.googleusercontent.com"}"`,
      `GOOGLE_CLIENT_SECRET="${googleClientSecret || "tu_google_client_secret"}"`,
      `GOOGLE_REDIRECT_URI="${googleRedirectUri || "http://localhost:3000/api/admin/google-drive/callback"}"`,
      googleEncryptionKey ? `GOOGLE_TOKEN_ENCRYPTION_KEY="${googleEncryptionKey}"` : `# GOOGLE_TOKEN_ENCRYPTION_KEY="clave_32_bytes_opcional"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 5. PASARELA DE PAGOS: PAYPHONE ECUADOR`,
      `# ------------------------------------------------------------------------------`,
      `PAYPHONE_TOKEN="${payphoneToken || "tu_token_de_comercio_payphone"}"`,
      `NEXT_PUBLIC_PAYPHONE_APP_ID="${payphoneAppId || "tu_app_id_payphone"}"`,
      `PAYPHONE_APP_ID="${payphoneAppId || "tu_app_id_payphone"}"`,
      `PAYPHONE_STORE_ID="${payphoneStoreId || "tu_store_id_de_sucursal"}"`,
      `NEXT_PUBLIC_PAYPHONE_ENV="${payphoneEnv}"`,
      `PAYPHONE_ENV="${payphoneEnv}"`,
      `PAYPHONE_API_URL="https://pay.payphonetodoesposible.com/api"`,
      `PAYPHONE_PAYMENT_MODE="${payphoneMode}"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 6. BILLETERA DIGITAL (GOOGLE WALLET PASSES)`,
      `# ------------------------------------------------------------------------------`,
      `WALLET_SECRET_KEY="${walletSecretKey || "clave_secreta_para_firmas_hmac_32_bytes"}"`,
      `GOOGLE_WALLET_ISSUER_ID="${googleWalletIssuerId || "3388000000022XXXXXX"}"`,
      `GOOGLE_WALLET_CLIENT_EMAIL="${googleWalletClientEmail || "lumina-wallet@tu-proyecto-gcp.iam.gserviceaccount.com"}"`,
    ];
    return lines.join("\n");
  }, [
    brand.name,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    siteUrl,
    mapboxToken,
    masterAdminEmail,
    smtpProvider,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    senderName,
    googleClientId,
    googleClientSecret,
    googleRedirectUri,
    googleEncryptionKey,
    payphoneToken,
    payphoneAppId,
    payphoneStoreId,
    payphoneEnv,
    payphoneMode,
    walletSecretKey,
    googleWalletIssuerId,
    googleWalletClientEmail,
  ]);

  const handleDownloadEnv = (filename: ".env.local" | ".env.production") => {
    const blob = new Blob([computedMasterEnv], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navCategories = [
    { id: "all" as const, label: "00 TODAS LAS SECCIONES", icon: Layers, desc: "Telemetría completa de la infraestructura", ready: true },
    { id: "smtp" as const, label: "01 SMTP & CORREOS", icon: Mail, desc: "Servidor de emails, test y bodegas", ready: servicesStatus?.smtp?.configured },
    { id: "supabase" as const, label: "02 SUPABASE DB", icon: Database, desc: "PostgreSQL, Auth y Storage", ready: servicesStatus?.supabase?.configured },
    { id: "google" as const, label: "03 GOOGLE CLOUD", icon: Cloud, desc: "OAuth 2.0 y Drive API", ready: servicesStatus?.googleDrive?.configured },
    { id: "payphone" as const, label: "04 PAYPHONE PAGOS", icon: CreditCard, desc: "Tarjetas y modo de cobro", ready: servicesStatus?.payphone?.configured },
    { id: "hosting" as const, label: "05 HOSTING & MAPAS", icon: Globe, desc: "Dominio web y token Mapbox", ready: Boolean(servicesStatus?.hosting?.siteUrl) },
    { id: "wallets" as const, label: "06 GOOGLE WALLET", icon: Smartphone, desc: "Pases digitales de cliente", ready: servicesStatus?.wallets?.configured },
  ];

  const selectedCategory = navCategories.find((c) => c.id === activeSection) || navCategories[0];
  const SelectedIcon = selectedCategory.icon;

  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] bg-[#0c0d12] text-zinc-100 p-4 sm:p-7 md:p-9 border border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.8)] space-y-7 sm:space-y-8 animate-fade-in font-sans"
      data-state={toolState}
    >
      {/* ==================================================================== */}
      {/* AMBIENT LIGHTING & DOT MATRIX GRID OVERLAY (TAL CUAL Desing.jpg)     */}
      {/* ==================================================================== */}
      {/* Ethereal sunset/amber glow pouring from upper-left */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.28)_0%,rgba(234,88,12,0.12)_40%,transparent_75%)] blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,85,0,0.06)_0%,transparent_70%)] blur-3xl" />
      
      {/* Fine tactical background dot grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.14]" 
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />

      {/* ==================================================================== */}
      {/* TOP HEADER: HARDWARE TELEMETRY & DOT MATRIX TITLE                    */}
      {/* ==================================================================== */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          {/* LED Status line with pulsing indicator */}
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-400 font-bold mb-2 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
            <span>INFRAESTRUCTURA DE SERVICIOS</span>
          </div>

          <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wider text-white">
            Infraestructura y Variables de Entorno (.ENV)
          </h1>
          <p className="font-mono text-xs text-zinc-400 tracking-wider mt-1">
            ESTADO DE SERVICIOS EN TIEMPO REAL &amp; BOOTSTRAP DE CONFIGURACIÓN
          </p>

          <div className="mt-3">
            <CloudSyncStatus
              isSyncing={isSavingAll || isSavingDispatch || isSavingPayphone}
              syncError={null}
              onSave={handleSaveAllToDatabase}
              saveLabel="Guardar Todo"
              savedLabel="Hardware Sincronizado"
            />
          </div>
        </div>

        {/* Action buttons (Mac/Obsidian Hardware Style) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchEnvConfig}
            disabled={isLoadingStatus}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#171821] hover:bg-[#1f202b] text-zinc-300 text-xs font-mono font-medium rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Refrescar telemetría"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isLoadingStatus ? "animate-spin text-amber-500" : ""}`} />
            <span>REFRESH</span>
          </button>

          <button
            type="button"
            onClick={() => markCopied("master_all", computedMasterEnv)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ff5500] hover:bg-[#ff691e] text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(255,85,0,0.35)]"
          >
            {copiedKey === "master_all" ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === "master_all" ? "COPIADO" : "COPY MASTER .ENV"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadEnv(".env.local")}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#171821] hover:bg-[#1f202b] text-amber-400 text-xs font-mono font-semibold rounded-xl border border-amber-500/25 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>.env.local</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadEnv(".env.production")}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#171821] hover:bg-[#1f202b] text-zinc-300 text-xs font-mono font-semibold rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>.env.prod</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION NAV COMBOBOX: OBSIDIAN GLASS WITH VERTICAL SCROLL ONLY        */}
      {/* ==================================================================== */}
      <div className="relative z-20 pt-1">
        <div ref={comboboxRef} className="relative w-full sm:max-w-md">
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="text-[11px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
              MODULO DE TELEMETRÍA:
            </label>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              FILTRAR MODULO
            </span>
          </div>

          <motion.button
            type="button"
            onClick={() => setIsComboboxOpen((prev) => !prev)}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#141419]/90 hover:bg-[#1b1b22]/90 backdrop-blur-2xl border border-white/10 hover:border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.5)] text-xs font-mono font-semibold text-white transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-zinc-300 flex items-center justify-center shrink-0">
                <SelectedIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="truncate leading-tight font-bold text-white text-xs sm:text-sm">
                  {selectedCategory.label}
                </span>
                <span className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5 truncate">
                  {selectedCategory.desc}
                </span>
              </div>
            </div>

            <motion.div
              animate={{ rotate: isComboboxOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"
            >
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isComboboxOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ type: "spring", stiffness: 440, damping: 22 }}
                className="absolute left-0 right-0 top-full mt-2.5 rounded-2xl bg-[#141419]/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] p-2 z-50 overflow-hidden"
              >
                <div className="space-y-1 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
                  {navCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = activeSection === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(cat.id);
                          setIsComboboxOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-white/10 text-white font-bold border border-white/20"
                            : "text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected ? "bg-white/15 text-white border-white/25" : "bg-white/5 text-zinc-400 border-white/10"
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate leading-tight">{cat.label}</span>
                            <span className="text-[10px] text-zinc-500 truncate">{cat.desc}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-zinc-200 shrink-0 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRA DE ESTADO DE INFRAESTRUCTURA (ESTILO VERCEL / STRIPE)          */}
      {/* ==================================================================== */}
      <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="font-mono text-xs font-bold tracking-wider uppercase text-zinc-200">
              Barra de Estado de Infraestructura
            </span>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">
            {configuredCount === 5 ? "5 de 5 servicios verificados" : `${configuredCount} de 5 servicios activos`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {infraServices.map((svc) => (
            <div
              key={svc.id}
              className="flex flex-col justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                  {svc.name}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    svc.isOnline
                      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                      : "bg-zinc-600"
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-white/[0.04]">
                <span className="text-[10px] text-zinc-500 font-mono truncate">
                  {svc.detail}
                </span>
                <span
                  className={`text-[10px] font-mono font-medium ${
                    svc.isOnline ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {svc.isOnline ? "Operativo" : "Standby"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 04 & 05 & 06: SMTP VAULT, TEST LAB & DISPATCH RECIPIENTS             */}
      {/* ==================================================================== */}
      {(activeSection === "all" || activeSection === "smtp") && (
        <div className="relative z-10 space-y-6">
          
          {/* Bento Grid: Vault (Left) + Test & Dispatch (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* TILE 04: SMTP CREDENTIALS VAULT */}
            <div className="rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                    04 SMTP CREDENTIALS
                  </span>
                  <h3 className="font-mono text-base sm:text-lg font-bold text-white mt-0.5">
                    Bóveda de Servidor Transaccional
                  </h3>
                </div>
                <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                  AES-256 VAULT
                </span>
              </div>

              {/* Provider Selector Tiles (Gmail Cloud vs Custom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setSmtpProvider("gmail");
                    setSmtpHost("smtp.gmail.com");
                    setSmtpPort(587);
                    setSmtpSecure(false);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    smtpProvider === "gmail"
                      ? "bg-white/10 border-white/25 text-white shadow-sm"
                      : "bg-[#18181f] border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">GMAIL CLOUD</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">STARTTLS 587</span>
                  </div>
                  {smtpProvider === "gmail" && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSmtpProvider("custom")}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    smtpProvider === "custom"
                      ? "bg-white/10 border-white/25 text-white shadow-sm"
                      : "bg-[#18181f] border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">CUSTOM RELAY</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">HOSTING PROPIO</span>
                  </div>
                  {smtpProvider === "custom" && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />}
                </button>
              </div>

              {/* Collapsible Gmail 16-character guide button */}
              <div className="font-mono">
                <button
                  type="button"
                  onClick={() => setShowGoogleGuide((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs text-zinc-300 font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    <span>CÓMO GENERAR CONTRASEÑA DE APP (16 LETRAS)</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGoogleGuide ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showGoogleGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-3 space-y-2 text-xs"
                    >
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-3 rounded-xl bg-[#16161c] border border-white/5">
                          <span className="text-zinc-200 font-bold block">01 VERIFICACIÓN</span>
                          <span className="text-zinc-400">Activa verificación en 2 pasos en tu cuenta Google.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#16161c] border border-white/5">
                          <span className="text-zinc-200 font-bold block">02 CONTRASEÑAS</span>
                          <span className="text-zinc-400">Busca &quot;Contraseñas de aplicaciones&quot; en Seguridad.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#16161c] border border-white/5">
                          <span className="text-zinc-200 font-bold block">03 CREAR</span>
                          <span className="text-zinc-400">Nombra la app &quot;{brand.name}&quot; y genera la clave.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#16161c] border border-white/5">
                          <span className="text-zinc-200 font-bold block">04 PEGAR</span>
                          <span className="text-zinc-400">Pega las 16 letras en el campo SMTP_PASS abajo.</span>
                        </div>
                      </div>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white hover:underline pt-1"
                      >
                        <span>Abrir Seguridad de Cuenta Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form Controls */}
              <div className="space-y-3.5 font-mono text-xs">
                {smtpProvider === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-400 text-[10px] uppercase">SMTP_HOST</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="mail.tudominio.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400 text-[10px] uppercase">SMTP_PORT</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        placeholder="587"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-zinc-400 text-[10px] uppercase">CORREO REMITENTE (SMTP_USER)</label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="contacto@luminahome.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-400 text-[10px] uppercase">CONTRASEÑA DE APP (SMTP_PASS)</label>
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showSmtpPass ? "text" : "password"}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 text-[10px] uppercase">NOMBRE VISIBLE (SMTP_FROM)</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={brand.name}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-white/[0.06] font-mono text-xs">
                <span className="text-zinc-500 text-[11px]">CONFIGURACIÓN LISTA</span>
                <button
                  type="button"
                  onClick={() => {
                    const snippet = `SMTP_HOST="${smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost}"\nSMTP_PORT="${smtpProvider === "gmail" ? "587" : smtpPort}"\nSMTP_SECURE="${smtpSecure ? "true" : "false"}"\nSMTP_USER="${smtpUser}"\nSMTP_PASS="${smtpPass}"\nSMTP_FROM="${senderName} <${smtpUser}>"`;
                    markCopied("smtp_snip", snippet);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === "smtp_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>COPIAR SMTP</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: 05 TEST LAB & 06 DISPATCH RECIPIENTS */}
            <div className="space-y-6">
              
              {/* TILE 05: SMTP TEST LAB */}
              <div className="rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                      05 REALTIME DIAGNOSTIC
                    </span>
                    <h3 className="font-mono text-base font-bold text-white mt-0.5">
                      Laboratorio de Prueba SMTP
                    </h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                </div>

                {/* ECG Heartbeat Visualizer */}
                <DotHeartbeat active={Boolean(servicesStatus?.smtp?.configured)} />

                <div className="flex flex-col sm:flex-row gap-2 font-mono text-xs">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="correo_destinatario@gmail.com"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={handleTestSmtpConnection}
                    disabled={isTestingSmtp}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 border border-white/10"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingSmtp ? "PROBANDO..." : "LANZAR TEST"}</span>
                  </button>
                </div>

                {smtpTestResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 rounded-xl border font-mono text-xs ${
                      smtpTestResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {smtpTestResult.message}
                  </motion.div>
                )}
              </div>

              {/* TILE 06: BODEGAS DISPATCH RECIPIENTS */}
              <div className="rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                      06 DISPATCH RECIPIENTS
                    </span>
                    <h3 className="font-mono text-base font-bold text-white mt-0.5">
                      Bodegas de Despacho
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10">
                    {dispatchRecipients.length}/7 CUPOS
                  </span>
                </div>

                {/* Chips of added emails */}
                <div className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  {dispatchRecipients.length === 0 ? (
                    <span className="font-mono text-xs text-zinc-500 italic px-2 py-1">
                      No hay bodegas agregadas. Agrega un correo abajo.
                    </span>
                  ) : (
                    dispatchRecipients.map((em, idx) => (
                      <span
                        key={em}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181822] border border-white/10 text-xs font-mono text-zinc-200"
                      >
                        <span className="w-4 h-4 rounded bg-white/10 text-zinc-300 text-[10px] font-bold flex items-center justify-center">
                          B{idx + 1}
                        </span>
                        <span>{em}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(em)}
                          className="text-zinc-500 hover:text-red-400 cursor-pointer p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add email input */}
                <div className="flex flex-col sm:flex-row gap-2 font-mono text-xs">
                  <input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                    placeholder="bodega_norte@luminahome.com"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    disabled={dispatchRecipients.length >= 7 || !recipientInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 border border-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>AGREGAR</span>
                  </button>
                </div>

                {/* Test dispatch email button */}
                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <button
                    type="button"
                    onClick={handleTestDispatchEmail}
                    disabled={isTestingDispatch || dispatchRecipients.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold transition-all border border-white/10 flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isTestingDispatch ? "ENVIANDO..." : "PROBAR ALERTA BODEGAS"}</span>
                  </button>
                  <span className="text-[10px] text-zinc-500">DESPACHO A TODAS</span>
                </div>

                {dispatchMsg && (
                  <div className={`p-2.5 rounded-xl font-mono text-xs ${
                    dispatchMsg.success ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"
                  }`}>
                    {dispatchMsg.text}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 07: SUPABASE DATABASE MODULE                                         */}
      {/* ==================================================================== */}
      {(activeSection === "all" || activeSection === "supabase") && (
        <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-300 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  07 SUPABASE DATABASE
                </span>
                <h3 className="font-mono text-base font-bold text-white mt-0.5">
                  PostgreSQL, Autenticación y Storage
                </h3>
              </div>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-zinc-400 hover:text-white hover:underline flex items-center gap-1"
            >
              <span>DASHBOARD</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">NEXT_PUBLIC_SUPABASE_URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://tu-proyecto.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
              <textarea
                rows={2}
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30 resize-none break-all"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400 text-[10px] uppercase">SUPABASE_SERVICE_ROLE_KEY</label>
                <button
                  type="button"
                  onClick={() => setShowSupabaseServiceKey(!showSupabaseServiceKey)}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showSupabaseServiceKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <input
                type={showSupabaseServiceKey ? "text" : "password"}
                value={supabaseServiceRoleKey}
                onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="pt-2 font-mono">
            <button
              type="button"
              onClick={() => {
                const snip = `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey}"\nSUPABASE_SERVICE_ROLE_KEY="${supabaseServiceRoleKey}"`;
                markCopied("supabase_snip", snip);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === "supabase_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>COPIAR SUPABASE</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 08: GOOGLE CLOUD & DRIVE API MODULE                                  */}
      {/* ==================================================================== */}
      {(activeSection === "all" || activeSection === "google") && (
        <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-300 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  08 GOOGLE CLOUD ENGINE
                </span>
                <h3 className="font-mono text-base font-bold text-white mt-0.5">
                  OAuth 2.0 & Google Drive API (Fotoproductos)
                </h3>
              </div>
            </div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-zinc-400 hover:text-white hover:underline flex items-center gap-1"
            >
              <span>GCP CONSOLE</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">GOOGLE_CLIENT_ID</label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="tu_client_id.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400 text-[10px] uppercase">GOOGLE_CLIENT_SECRET</label>
                <button
                  type="button"
                  onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showGoogleSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <input
                type={showGoogleSecret ? "text" : "password"}
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                placeholder="GOCSPX-••••••••"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 text-[10px] uppercase">GOOGLE_REDIRECT_URI</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={googleRedirectUri}
                  onChange={(e) => setGoogleRedirectUri(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => markCopied("redir_uri", googleRedirectUri)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold border border-white/10 cursor-pointer"
                >
                  {copiedKey === "redir_uri" ? <Check className="w-3.5 h-3.5" /> : "COPIAR"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 font-mono">
            <button
              type="button"
              onClick={() => {
                const snip = `GOOGLE_CLIENT_ID="${googleClientId}"\nGOOGLE_CLIENT_SECRET="${googleClientSecret}"\nGOOGLE_REDIRECT_URI="${googleRedirectUri}"`;
                markCopied("gcloud_snip", snip);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === "gcloud_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>COPIAR GOOGLE CLOUD</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 09: PAYPHONE ECUADOR PAYMENT GATEWAY MODULE                          */}
      {/* ==================================================================== */}
      {(activeSection === "all" || activeSection === "payphone") && (
        <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-300 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  09 PAYPHONE ECUADOR
                </span>
                <h3 className="font-mono text-base font-bold text-white mt-0.5">
                  Pasarela de Tarjetas Visa / MasterCard
                </h3>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#16161c] border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleSavePayphoneMode("box")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  payphoneMode === "box" ? "bg-white/15 text-white font-bold shadow-xs border border-white/20" : "text-zinc-400 hover:text-white"
                }`}
              >
                Cajita Embebida
              </button>
              <button
                type="button"
                onClick={() => handleSavePayphoneMode("redirect")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  payphoneMode === "redirect" ? "bg-white/15 text-white font-bold shadow-xs border border-white/20" : "text-zinc-400 hover:text-white"
                }`}
              >
                Redirección 3D
              </button>
            </div>
          </div>

          {payphoneMsg && (
            <div className={`p-2.5 rounded-xl font-mono text-xs ${
              payphoneMsg.success ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"
            }`}>
              {payphoneMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400 text-[10px] uppercase">PAYPHONE_TOKEN</label>
                <button
                  type="button"
                  onClick={() => setShowPayphoneToken(!showPayphoneToken)}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showPayphoneToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <input
                type={showPayphoneToken ? "text" : "password"}
                value={payphoneToken}
                onChange={(e) => setPayphoneToken(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1Ni..."
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">PAYPHONE_STORE_ID</label>
              <input
                type="text"
                value={payphoneStoreId}
                onChange={(e) => setPayphoneStoreId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">NEXT_PUBLIC_PAYPHONE_APP_ID</label>
              <input
                type="text"
                value={payphoneAppId}
                onChange={(e) => setPayphoneAppId(e.target.value)}
                placeholder="app_id_payphone"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">PAYPHONE_ENV</label>
              <select
                value={payphoneEnv}
                onChange={(e) => setPayphoneEnv(e.target.value as "sandbox" | "production")}
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              >
                <option value="sandbox">Sandbox (Pruebas)</option>
                <option value="production">Producción (Cobros Reales)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 font-mono">
            <button
              type="button"
              onClick={() => {
                const snip = `PAYPHONE_TOKEN="${payphoneToken}"\nNEXT_PUBLIC_PAYPHONE_APP_ID="${payphoneAppId}"\nPAYPHONE_APP_ID="${payphoneAppId}"\nPAYPHONE_STORE_ID="${payphoneStoreId}"\nPAYPHONE_ENV="${payphoneEnv}"\nPAYPHONE_PAYMENT_MODE="${payphoneMode}"`;
                markCopied("payphone_snip", snip);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === "payphone_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>COPIAR PAYPHONE</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10: HOSTING, DOMAIN & MAPBOX MODULE                                  */}
      {/* ==================================================================== */}
      {(activeSection === "all" || activeSection === "hosting") && (
        <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-300 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  10 HOSTING & MAPBOX
                </span>
                <h3 className="font-mono text-base font-bold text-white mt-0.5">
                  Dominio Público y Token de Mapas
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">NEXT_PUBLIC_SITE_URL</label>
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://tudominio.com"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-[10px] uppercase">NEXT_PUBLIC_MAPBOX_TOKEN</label>
              <input
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1Ijoi..."
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 text-[10px] uppercase">MASTER_ADMIN_EMAIL</label>
              <input
                type="email"
                value={masterAdminEmail}
                onChange={(e) => setMasterAdminEmail(e.target.value)}
                placeholder="admin@luminahome.com"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="pt-2 font-mono">
            <button
              type="button"
              onClick={() => {
                const snip = `NEXT_PUBLIC_SITE_URL="${siteUrl}"\nNEXT_PUBLIC_APP_URL="${siteUrl}"\nNEXT_PUBLIC_MAPBOX_TOKEN="${mapboxToken}"\nMASTER_ADMIN_EMAIL="${masterAdminEmail}"`;
                markCopied("host_snip", snip);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === "host_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>COPIAR HOSTING</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 11: GOOGLE WALLET DIGITAL PASSES MODULE                              */}
      {/* ==================================================================== */}
      {(activeSection === "all" || activeSection === "wallets") && (
        <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-300 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                  11 GOOGLE WALLET PASSES
                </span>
                <h3 className="font-mono text-base font-bold text-white mt-0.5">
                  Billetera Digital y Pases de Fidelidad
                </h3>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400 text-[10px] uppercase">WALLET_SECRET_KEY</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWalletSecret(!showWalletSecret)}
                    className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showWalletSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletSecretKey(generateRandomHexKey())}
                    className="text-zinc-400 hover:text-white hover:underline cursor-pointer text-[10px]"
                  >
                    GENERAR CLAVE 32 BYTES
                  </button>
                </div>
              </div>
              <input
                type={showWalletSecret ? "text" : "password"}
                value={walletSecretKey}
                onChange={(e) => setWalletSecretKey(e.target.value)}
                placeholder="clave_secreta_anti_enumeracion"
                className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] uppercase">GOOGLE_WALLET_ISSUER_ID</label>
                <input
                  type="text"
                  value={googleWalletIssuerId}
                  onChange={(e) => setGoogleWalletIssuerId(e.target.value)}
                  placeholder="3388000000022XXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] uppercase">GOOGLE_WALLET_CLIENT_EMAIL</label>
                <input
                  type="text"
                  value={googleWalletClientEmail}
                  onChange={(e) => setGoogleWalletClientEmail(e.target.value)}
                  placeholder="wallet@proyecto.iam.gserviceaccount.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#16161c] border border-white/10 text-white outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 font-mono">
            <button
              type="button"
              onClick={() => {
                const snip = `WALLET_SECRET_KEY="${walletSecretKey}"\nGOOGLE_WALLET_ISSUER_ID="${googleWalletIssuerId}"\nGOOGLE_WALLET_CLIENT_EMAIL="${googleWalletClientEmail}"`;
                markCopied("wallet_snip", snip);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === "wallet_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>COPIAR WALLET</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 12: MASTER .ENV TERMINAL (FULL CODE VIEW WITH RARE-UI CODEBLOCK)     */}
      {/* ==================================================================== */}
      <div className="relative z-10 rounded-2xl bg-[#111113] border border-white/[0.08] p-5 sm:p-7 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
            </div>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                12 MASTER .ENV TERMINAL
              </span>
              <h3 className="font-mono text-base font-bold text-white mt-0.5">
                Variables de Entorno Generadas en Vivo
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => markCopied("master_all", computedMasterEnv)}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer border border-white/10 flex items-center gap-1.5"
            >
              {copiedKey === "master_all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>COPIAR TODO</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLiveCode((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold border border-white/10 cursor-pointer"
            >
              {showLiveCode ? "PLEGAR" : "EXPANDIR"}
            </button>
          </div>
        </div>

        {/* CodeBlock Component: Natural Height, no lines clipped */}
        <AnimatePresence>
          {showLiveCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1"
            >
              <CodeBlock
                code={computedMasterEnv}
                language="env"
                accent="#ff5500"
                filename=".env.production"
                showHeader={true}
                showLineNumbers={true}
                showCopyButton={true}
                defaultExpanded={true}
                maxHeight={false}
                showFooter={true}
                className="w-full rounded-2xl shadow-2xl overflow-hidden border border-white/10"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================================================================== */}
      {/* HARDWARE FOOTER: TAL CUAL Desing.jpg                                 */}
      {/* ==================================================================== */}
      <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 font-mono text-xs text-zinc-500 border-t border-white/[0.06]">
        <div>
          <span className="text-zinc-400 block tracking-wider">BUILD ANYTHING</span>
          <span className="text-zinc-200 block tracking-wider font-bold">
            WITH INTELLIGENCE <span className="text-[#ff5500] animate-pulse">_</span>
          </span>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-zinc-400 block tracking-wider">Lumina Core</span>
          <span className="text-zinc-500 block tracking-wider text-[11px]">by Engineering</span>
        </div>
      </div>

    </div>
  );
}
