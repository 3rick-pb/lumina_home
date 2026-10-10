"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Server,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  KeyRound,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Eye,
  EyeOff,
  RefreshCw,
  Truck,
  Trash2,
  Plus,
  CheckCircle2,
  Info,
  Download,
  Terminal,
  Database,
  Cloud,
  Globe,
  Smartphone,
  FileCode,
  SlidersHorizontal,
  ChevronDown,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { CloudSyncStatus } from "../CloudSyncStatus";

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
    hasAppleWallet: boolean;
    appleTeamId: string;
    applePassTypeId: string;
    hasWalletSecret: boolean;
  };
}

export function IntegrationsTab() {
  const brand = useBrand();
  const { user } = useUserStore();

  const [activeSection, setActiveSection] = useState<ViewSection>("all");
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [servicesStatus, setServicesStatus] = useState<ServiceConfigStatus | null>(null);
  const [showLiveCode, setShowLiveCode] = useState(true);

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const markCopied = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ==========================================
  // 1. SMTP & DESPACHO STATE
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
  // 2. SUPABASE STATE
  // ==========================================
  const [supabaseUrl, setSupabaseUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState("");
  const [showSupabaseServiceKey, setShowSupabaseServiceKey] = useState(false);

  // ==========================================
  // 3. GOOGLE CLOUD & DRIVE STATE
  // ==========================================
  const [googleClientId, setGoogleClientId] = useState(
    (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").replace("YOUR_GOOGLE_CLIENT_ID_HERE", "")
  );
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRedirectUri, setGoogleRedirectUri] = useState(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/admin/google-drive/callback`;
    }
    return "http://localhost:3000/api/admin/google-drive/callback";
  });
  const [googleEncryptionKey, setGoogleEncryptionKey] = useState("");
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
  // 6. WALLETS STATE
  // ==========================================
  const [walletSecretKey, setWalletSecretKey] = useState("");
  const [googleWalletIssuerId, setGoogleWalletIssuerId] = useState("");
  const [googleWalletClientEmail, setGoogleWalletClientEmail] = useState("");
  const [appleTeamId, setAppleTeamId] = useState("");
  const [applePassTypeId, setApplePassTypeId] = useState("pass.com.luminahome.order");

  // Generate random 32-byte secret key helper
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

          // Pre-populate form fields if available from server
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
          if (payphoneData.storeId && !payphoneData.storeId.includes("•••")) {
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

  // Handle PayPhone Mode Toggle (Box vs Redirect)
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
        text: `Modo de checkout guardado: ${modeToSave === "box" ? "Cajita Embebida en Tienda" : "Redirección 3D-Secure"}`,
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
          ? "✓ Guardado automáticamente en la base de datos."
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
        text: `✓ Notificación de prueba enviada exitosamente a ${data.sentToCount || dispatchRecipients.length} receptores de bodega.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar prueba de despacho.";
      setDispatchMsg({ success: false, text: msg });
    } finally {
      setIsTestingDispatch(false);
    }
  };

  // Real-time computed Master .env string containing ALL website environment variables
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
      `# 6. MOBILE WALLETS (GOOGLE WALLET & APPLE WALLET PASSKIT)`,
      `# ------------------------------------------------------------------------------`,
      `WALLET_SECRET_KEY="${walletSecretKey || "clave_secreta_para_firmas_hmac_32_bytes"}"`,
      `GOOGLE_WALLET_ISSUER_ID="${googleWalletIssuerId || "3388000000022XXXXXX"}"`,
      `GOOGLE_WALLET_CLIENT_EMAIL="${googleWalletClientEmail || "lumina-wallet@tu-proyecto-gcp.iam.gserviceaccount.com"}"`,
      `APPLE_TEAM_IDENTIFIER="${appleTeamId || "TU_TEAM_ID_APPLE"}"`,
      `APPLE_PASS_TYPE_IDENTIFIER="${applePassTypeId || "pass.com.luminahome.loyalty"}"`,
      `APPLE_ORDER_PASS_TYPE_IDENTIFIER="pass.com.luminahome.order"`,
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
    appleTeamId,
    applePassTypeId,
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
    { id: "all" as const, label: "Todas las Secciones", icon: Layers, ready: true },
    { id: "smtp" as const, label: "SMTP & Correos", icon: Mail, ready: servicesStatus?.smtp?.configured },
    { id: "supabase" as const, label: "Supabase DB", icon: Database, ready: servicesStatus?.supabase?.configured },
    { id: "google" as const, label: "Google Cloud", icon: Cloud, ready: servicesStatus?.googleDrive?.configured },
    { id: "payphone" as const, label: "PayPhone Pagos", icon: CreditCard, ready: servicesStatus?.payphone?.configured },
    { id: "hosting" as const, label: "Hosting & Mapas", icon: Globe, ready: Boolean(servicesStatus?.hosting?.siteUrl) },
    { id: "wallets" as const, label: "Wallets Apple/Google", icon: Smartphone, ready: servicesStatus?.wallets?.configured },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans" data-state={toolState}>
      {/* ==================================================================== */}
      {/* MASTER HUB CONTAINER (APPLE / LUMINA LUXURY BENTO)                    */}
      {/* ==================================================================== */}
      <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-3xl p-4 sm:p-7 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-6 sm:space-y-7">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="min-w-0">
            <div className="mb-2">
              <CloudSyncStatus
                isSyncing={isLoadingStatus || isSavingDispatch || isSavingPayphone}
                syncError={null}
                onSave={fetchEnvConfig}
                saveLabel="Verificar infraestructura"
                savedLabel="Variables sincronizadas"
              />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Server className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0" />
              <span>Infraestructura & Generador Universal .env</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Configura y genera todas las variables de entorno de la plataforma en un solo lugar. Cambia de cuenta de Supabase, proyecto en Google Cloud Console, proveedor SMTP o dominio web sin confusiones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchEnvConfig}
              disabled={isLoadingStatus}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95"
              title="Refrescar estado de los servicios"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isLoadingStatus ? "animate-spin text-blue-500" : ""}`} />
              <span>Refrescar</span>
            </button>

            <button
              type="button"
              onClick={() => markCopied("master_all", computedMasterEnv)}
              className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {copiedKey === "master_all" ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === "master_all" ? "¡Copiado Todo!" : "Copiar Todo"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadEnv(".env.local")}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl border border-blue-200/60 dark:border-blue-500/30 transition-all cursor-pointer active:scale-95"
              title="Descargar para entorno de desarrollo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.env.local</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadEnv(".env.production")}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl border border-black/5 dark:border-white/10 transition-all cursor-pointer active:scale-95"
              title="Descargar para Vercel o VPS"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.env.prod</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANEL MAESTRO CENTRALIZADO DE GENERACIÓN .ENV EN VIVO                */}
        {/* ==================================================================== */}
        <div className="rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-[#0d0e12] overflow-hidden shadow-xl text-white">
          <div className="px-4 py-3 bg-zinc-900/90 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold tracking-tight text-zinc-100">
                Generador Reactivo Maestro .env
              </span>
              <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                100% de variables de la web
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLiveCode((prev) => !prev)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <FileCode className="w-3 h-3 text-zinc-400" />
                <span>{showLiveCode ? "Ocultar Código" : "Expandir Código"}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${showLiveCode ? "rotate-180" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => markCopied("master_deck_copy", computedMasterEnv)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
              >
                {copiedKey === "master_deck_copy" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "master_deck_copy" ? "¡Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showLiveCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <pre className="p-3.5 sm:p-5 text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto max-h-[300px] sm:max-h-[380px] scrollbar-thin select-text">
                  {computedMasterEnv}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ==================================================================== */}
        {/* BARRA DE NAVEGACIÓN Y FILTRO RÁPIDO ENTRE SECCIONES                   */}
        {/* ==================================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 px-0.5">
            <span>Editar sección o inspeccionar servicios:</span>
            <span className="text-[11px] font-mono hidden sm:inline">Reactivo en tiempo real</span>
          </div>

          <div className="overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 w-max min-w-full sm:min-w-0">
              {navCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveSection(cat.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                      isActive
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-500" : "opacity-70"}`} />
                    <span>{cat.label}</span>
                    {cat.id !== "all" && (
                      cat.ready ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Configurado" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Pendiente" />
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECCIONES EDITABLES UNIFICADAS                                       */}
        {/* ==================================================================== */}
        <div className="space-y-6 sm:space-y-8">

          {/* ------------------------------------------------------------------ */}
          {/* 1. SERVIDOR SMTP & NOTIFICACIONES (MAIL)                           */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "smtp") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-5">
              {/* Header de la Sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Servidor SMTP & Notificaciones Transaccionales
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        servicesStatus?.smtp?.configured
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}>
                        {servicesStatus?.smtp?.configured ? "Conectado" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Envío de facturas por compra, confirmaciones de pedido a clientes y alertas de preparación para bodegas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                    className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>{showGoogleGuide ? "Ocultar Guía" : "Guía Gmail 16 Dígitos"}</span>
                  </button>
                </div>
              </div>

              {/* Guía Acordeón Gmail */}
              <AnimatePresence>
                {showGoogleGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden p-4 sm:p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-3"
                  >
                    <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Cómo generar tu Contraseña de Aplicación de 16 caracteres en Gmail</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">1. Seguridad Google</span>
                        Ve a tu cuenta de Google y activa la &quot;Verificación en 2 pasos&quot;.
                      </div>
                      <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">2. Contraseñas de app</span>
                        Busca &quot;Contraseñas de aplicaciones&quot; en la configuración de Google.
                      </div>
                      <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">3. Nombre de app</span>
                        Escribe &quot;{brand.name}&quot; y haz clic en Crear.
                      </div>
                      <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">4. Pegar en SMTP_PASS</span>
                        Copia el código amarillo de 16 letras y pégalo en el campo Contraseña abajo.
                      </div>
                    </div>
                    <div className="pt-1">
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        <span>Abrir myaccount.google.com/apppasswords</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid Responsivo de Configuración SMTP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Tarjeta A: Credenciales SMTP */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-500" />
                      <span>Credenciales de Envío</span>
                    </h4>

                    {/* Selector Proveedor */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setSmtpProvider("gmail")}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          smtpProvider === "gmail" ? "bg-white dark:bg-zinc-700 font-semibold shadow-xs" : "opacity-60"
                        }`}
                      >
                        Gmail
                      </button>
                      <button
                        type="button"
                        onClick={() => setSmtpProvider("custom")}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          smtpProvider === "custom" ? "bg-white dark:bg-zinc-700 font-semibold shadow-xs" : "opacity-60"
                        }`}
                      >
                        Personalizado
                      </button>
                    </div>
                  </div>

                  {smtpProvider === "custom" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Host SMTP</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="mail.tudominio.com"
                          className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Puerto</label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          placeholder="587 o 465"
                          className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Correo Remitente (SMTP_USER)</label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="contacto@luminahome.com"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      {smtpProvider === "gmail" ? "Contraseña de Aplicación de 16 caracteres (SMTP_PASS)" : "Contraseña de Servidor (SMTP_PASS)"}
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? "text" : "password"}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                        aria-label="Ver u ocultar contraseña"
                      >
                        {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Nombre Visible de Marca (SMTP_FROM)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={brand.name}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `SMTP_HOST="${smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost}"\nSMTP_PORT="${smtpProvider === "gmail" ? "587" : smtpPort}"\nSMTP_SECURE="${smtpSecure ? "true" : "false"}"\nSMTP_USER="${smtpUser}"\nSMTP_PASS="${smtpPass}"\nSMTP_FROM="${senderName} <${smtpUser}>"`;
                        markCopied("smtp_snip", snippet);
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      {copiedKey === "smtp_snip" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar Bloque SMTP</span>
                    </button>
                  </div>
                </div>

                {/* Tarjeta B: Prueba en Vivo & Bodegas */}
                <div className="space-y-4">
                  {/* Despacho de Prueba en Vivo */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3">
                    <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-500" />
                      <span>Prueba en Vivo de Conexión</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Envía un correo de prueba al instante para verificar autenticación y puertos sin bloqueos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="tu_correo_personal@gmail.com"
                        className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs outline-none focus:border-emerald-500 min-h-[42px] sm:min-h-0"
                      />
                      <button
                        type="button"
                        onClick={handleTestSmtpConnection}
                        disabled={isTestingSmtp}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 min-h-[42px] sm:min-h-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingSmtp ? "Enviando..." : "Enviar Prueba"}</span>
                      </button>
                    </div>

                    {smtpTestResult && (
                      <div className={`p-3 rounded-xl border text-xs font-medium leading-relaxed flex items-start gap-2 ${
                        smtpTestResult.success
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                      }`}>
                        {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{smtpTestResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Receptores de Despacho (Bodegas) */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-500" />
                          <span>Receptores de Órdenes (Bodegas)</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Hasta 7 correos recibirán la alerta inmediata de preparación de cada compra confirmada.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {dispatchRecipients.length}/7
                      </span>
                    </div>

                    {/* Chips de correos */}
                    <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                      {dispatchRecipients.length === 0 ? (
                        <span className="text-xs text-zinc-400 italic">No hay correos de bodega registrados.</span>
                      ) : (
                        dispatchRecipients.map((em) => (
                          <span
                            key={em}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 shadow-xs"
                          >
                            <span className="font-mono text-[11px] break-all">{em}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(em)}
                              className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5"
                              aria-label={`Eliminar correo ${em}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Input para añadir */}
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        placeholder="bodega@luminahome.com"
                        className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                      />
                      <button
                        type="button"
                        onClick={handleAddRecipient}
                        disabled={dispatchRecipients.length >= 7 || !recipientInput.trim()}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1 active:scale-95 min-h-[42px] sm:min-h-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>

                    {/* Acciones de prueba bodega */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleTestDispatchEmail}
                        disabled={isTestingDispatch || dispatchRecipients.length === 0}
                        className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5 active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isTestingDispatch ? "Enviando alerta..." : "Probar Alerta a Bodegas"}</span>
                      </button>
                    </div>

                    {dispatchMsg && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        dispatchMsg.success
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}>
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>{dispatchMsg.text}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* 2. BASE DE DATOS & AUTH (SUPABASE)                                 */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "supabase") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Base de Datos PostgreSQL & Autenticación (Supabase)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {servicesStatus?.supabase?.configured ? "Conectado" : "Pendiente"}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Alberga el catálogo de productos, compras, perfiles de clientes y cupones de descuento.
                    </p>
                  </div>
                </div>

                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors shrink-0"
                >
                  <span>Dashboard Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    URL del Proyecto (NEXT_PUBLIC_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://tu-proyecto.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-emerald-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Clave Pública Anónima (NEXT_PUBLIC_SUPABASE_ANON_KEY)
                  </label>
                  <textarea
                    rows={2}
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-emerald-500 resize-none break-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Clave Secreta Service Role (SUPABASE_SERVICE_ROLE_KEY)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSupabaseServiceKey(!showSupabaseServiceKey)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1"
                    >
                      {showSupabaseServiceKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSupabaseServiceKey ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={supabaseServiceRoleKey}
                    onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                    placeholder={showSupabaseServiceKey ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." : "••••••••••••••••••••••••••••••••••••••••"}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-emerald-500 resize-none break-all"
                  />
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snip = `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey}"\nSUPABASE_SERVICE_ROLE_KEY="${supabaseServiceRoleKey}"`;
                      markCopied("supabase_snip", snip);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedKey === "supabase_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque Supabase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* 3. GOOGLE CLOUD CONSOLE & DRIVE API                                */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "google") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Google Cloud Console & Drive OAuth 2.0</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {servicesStatus?.googleDrive?.configured ? "Conectado" : "Pendiente"}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Conexión con carpetas de Google Drive para la galería de fotoproductos.
                    </p>
                  </div>
                </div>

                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors shrink-0"
                >
                  <span>Credenciales GCP</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    ID de Cliente OAuth (GOOGLE_CLIENT_ID)
                  </label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="1234567890-abcdef.apps.googleusercontent.com"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Clave Secreta de Cliente (GOOGLE_CLIENT_SECRET)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer flex items-center gap-1"
                    >
                      {showGoogleSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showGoogleSecret ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>
                  <input
                    type={showGoogleSecret ? "text" : "password"}
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    placeholder="GOCSPX-••••••••••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    URI de Redirección Autorizado (GOOGLE_REDIRECT_URI)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={googleRedirectUri}
                      onChange={(e) => setGoogleRedirectUri(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                    />
                    <button
                      type="button"
                      onClick={() => markCopied("redir_uri", googleRedirectUri)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-medium cursor-pointer flex items-center justify-center gap-1 active:scale-95 shrink-0 min-h-[42px] sm:min-h-0"
                    >
                      {copiedKey === "redir_uri" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar URI</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">
                    Pega esta URL en los &quot;URIs de redireccionamiento autorizados&quot; de tu Google Cloud Console.
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Clave de Cifrado AES-256 para Tokens (GOOGLE_TOKEN_ENCRYPTION_KEY)
                    </label>
                    <button
                      type="button"
                      onClick={() => setGoogleEncryptionKey(generateRandomHexKey())}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline"
                    >
                      Generar 32 bytes
                    </button>
                  </div>
                  <input
                    type="text"
                    value={googleEncryptionKey}
                    onChange={(e) => setGoogleEncryptionKey(e.target.value)}
                    placeholder="32 bytes hexadecimales para cifrado"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-blue-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snip = `GOOGLE_CLIENT_ID="${googleClientId}"\nNEXT_PUBLIC_GOOGLE_CLIENT_ID="${googleClientId}"\nGOOGLE_CLIENT_SECRET="${googleClientSecret}"\nGOOGLE_REDIRECT_URI="${googleRedirectUri}"\nGOOGLE_TOKEN_ENCRYPTION_KEY="${googleEncryptionKey}"`;
                      markCopied("gcloud_snip", snip);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedKey === "gcloud_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque Google Cloud</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* 4. PASARELA DE PAGOS PAYPHONE ECUADOR                              */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "payphone") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Pasarela PayPhone Ecuador (Tarjetas de Crédito/Débito)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {payphoneEnv === "production" ? "Producción" : "Sandbox"}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Cobros electrónicos con Visa, MasterCard y diferidos para clientes en Ecuador.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSavePayphoneMode("box")}
                    disabled={isSavingPayphone}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                      payphoneMode === "box"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Cajita Embebida
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePayphoneMode("redirect")}
                    disabled={isSavingPayphone}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                      payphoneMode === "redirect"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Redirección 3D-Secure
                  </button>
                </div>
              </div>

              {payphoneMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  payphoneMsg.success
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}>
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{payphoneMsg.text}</span>
                </div>
              )}

              <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Token de Comercio Bearer (PAYPHONE_TOKEN)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPayphoneToken(!showPayphoneToken)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-800 cursor-pointer flex items-center gap-1"
                      >
                        {showPayphoneToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPayphoneToken ? "Ocultar" : "Mostrar"}</span>
                      </button>
                    </div>
                    <input
                      type={showPayphoneToken ? "text" : "password"}
                      value={payphoneToken}
                      onChange={(e) => setPayphoneToken(e.target.value)}
                      placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6..."
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-amber-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      ID de Sucursal (PAYPHONE_STORE_ID)
                    </label>
                    <input
                      type="text"
                      value={payphoneStoreId}
                      onChange={(e) => setPayphoneStoreId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-amber-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      ID de Aplicación (NEXT_PUBLIC_PAYPHONE_APP_ID)
                    </label>
                    <input
                      type="text"
                      value={payphoneAppId}
                      onChange={(e) => setPayphoneAppId(e.target.value)}
                      placeholder="tu_app_id_generado"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-amber-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Entorno Activo (PAYPHONE_ENV)
                    </label>
                    <select
                      value={payphoneEnv}
                      onChange={(e) => setPayphoneEnv(e.target.value as "sandbox" | "production")}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-medium outline-none focus:border-amber-500 min-h-[42px] sm:min-h-0"
                    >
                      <option value="sandbox">Sandbox (Modo Pruebas PayPhone)</option>
                      <option value="production">Producción (Cobros Monetarios Reales)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snip = `PAYPHONE_TOKEN="${payphoneToken}"\nNEXT_PUBLIC_PAYPHONE_APP_ID="${payphoneAppId}"\nPAYPHONE_APP_ID="${payphoneAppId}"\nPAYPHONE_STORE_ID="${payphoneStoreId}"\nNEXT_PUBLIC_PAYPHONE_ENV="${payphoneEnv}"\nPAYPHONE_ENV="${payphoneEnv}"\nPAYPHONE_API_URL="https://pay.payphonetodoesposible.com/api"\nPAYPHONE_PAYMENT_MODE="${payphoneMode}"`;
                      markCopied("payphone_snip", snip);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedKey === "payphone_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque PayPhone</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* 5. HOSTING, DOMINIO & MAPBOX                                       */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "hosting") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Hosting, Dominio Web & Mapas Mapbox</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                      Producción
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    URL pública para redirecciones bancarias, SEO y geolocalización de envíos.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    URL Pública del Sitio (NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL)
                  </label>
                  <input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://tudominio.com"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-indigo-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Token Público de Mapbox (NEXT_PUBLIC_MAPBOX_TOKEN)
                    </label>
                    <a
                      href="https://account.mapbox.com/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Tokens Mapbox</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={mapboxToken}
                    onChange={(e) => setMapboxToken(e.target.value)}
                    placeholder="pk.eyJ1Ijoi..."
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-indigo-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Correo del Administrador Raíz (MASTER_ADMIN_EMAIL)
                  </label>
                  <input
                    type="email"
                    value={masterAdminEmail}
                    onChange={(e) => setMasterAdminEmail(e.target.value)}
                    placeholder="admin@luminahome.com"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs outline-none focus:border-indigo-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snip = `NEXT_PUBLIC_SITE_URL="${siteUrl}"\nNEXT_PUBLIC_APP_URL="${siteUrl}"\nNEXT_PUBLIC_MAPBOX_TOKEN="${mapboxToken}"\nMASTER_ADMIN_EMAIL="${masterAdminEmail}"`;
                      markCopied("host_snip", snip);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedKey === "host_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque Hosting</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* 6. MOBILE WALLETS (GOOGLE & APPLE PASSKIT)                         */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "wallets") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Google Wallet & Apple Wallet PassKit (.pkpass)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Opcional
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Permite a los clientes guardar tarjetas de fidelidad y tickets de pedido en la app Wallet de su celular.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Clave HMAC para Tokens de Seguimiento (WALLET_SECRET_KEY)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWalletSecretKey(generateRandomHexKey())}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold cursor-pointer hover:underline"
                    >
                      Generar Clave Segura
                    </button>
                  </div>
                  <input
                    type="text"
                    value={walletSecretKey}
                    onChange={(e) => setWalletSecretKey(e.target.value)}
                    placeholder="clave_secreta_anti_enumeracion_32_bytes"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-rose-500 min-h-[42px] sm:min-h-0"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Google Wallet Issuer ID</label>
                    <input
                      type="text"
                      value={googleWalletIssuerId}
                      onChange={(e) => setGoogleWalletIssuerId(e.target.value)}
                      placeholder="3388000000022XXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-rose-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Google Service Account Email</label>
                    <input
                      type="text"
                      value={googleWalletClientEmail}
                      onChange={(e) => setGoogleWalletClientEmail(e.target.value)}
                      placeholder="wallet@tu-gcp.iam.gserviceaccount.com"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-rose-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Apple Team Identifier</label>
                    <input
                      type="text"
                      value={appleTeamId}
                      onChange={(e) => setAppleTeamId(e.target.value)}
                      placeholder="TU_TEAM_ID_APPLE"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-rose-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Apple Pass Type ID</label>
                    <input
                      type="text"
                      value={applePassTypeId}
                      onChange={(e) => setApplePassTypeId(e.target.value)}
                      placeholder="pass.com.luminahome.loyalty"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-base sm:text-xs font-mono outline-none focus:border-rose-500 min-h-[42px] sm:min-h-0"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snip = `WALLET_SECRET_KEY="${walletSecretKey}"\nGOOGLE_WALLET_ISSUER_ID="${googleWalletIssuerId}"\nGOOGLE_WALLET_CLIENT_EMAIL="${googleWalletClientEmail}"\nAPPLE_TEAM_IDENTIFIER="${appleTeamId}"\nAPPLE_PASS_TYPE_IDENTIFIER="${applePassTypeId}"`;
                      markCopied("wallet_snip", snip);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedKey === "wallet_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque Wallets</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
