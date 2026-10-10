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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { CloudSyncStatus } from "../CloudSyncStatus";

type CategoryTab = "smtp" | "supabase" | "google" | "payphone" | "hosting" | "wallets" | "master_env";

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

  const [activeTab, setActiveTab] = useState<CategoryTab>("smtp");
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [servicesStatus, setServicesStatus] = useState<ServiceConfigStatus | null>(null);

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

  // Handle PayPhone Checkout Mode saving
  const handleSavePayphoneMode = async (selectedMode: "box" | "redirect") => {
    setIsSavingPayphone(true);
    setToolState("working");
    setPayphoneMsg(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      let saved = false;
      try {
        const res = await fetch("/api/admin/payphone/settings", {
          method: "POST",
          headers,
          body: JSON.stringify({ mode: selectedMode }),
        });
        const data = await res.json();
        if (data.success) saved = true;
      } catch (e) {
        console.warn("Notice updating payphone endpoint:", e);
      }

      const userEmail = session?.user?.email || "admin@lumina.com";
      const { error: dbErr } = await supabase.from("admin_payment_settings").upsert(
        {
          id: "global",
          payment_mode: selectedMode,
          updated_by: userEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (!dbErr || saved) {
        setPayphoneMode(selectedMode);
        setToolState("done");
        setTimeout(() => setToolState("idle"), 1800);
        setPayphoneMsg({
          success: true,
          text: `Directiva actualizada: el checkout ahora usará ${
            selectedMode === "box" ? "Checkout Embebido (Cajita)" : "Redirección Bancaria (3D Secure)"
          }.`,
        });
      } else {
        throw new Error(dbErr?.message || "No se pudo guardar la configuración.");
      }
    } catch (err: unknown) {
      setToolState("idle");
      const msg = err instanceof Error ? err.message : "Error al actualizar pasarela.";
      setPayphoneMsg({ success: false, text: msg });
    } finally {
      setIsSavingPayphone(false);
    }
  };

  // Test SMTP connection live
  const handleTestSmtpConnection = async () => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      setSmtpTestResult({
        success: false,
        message: "Por favor ingresa un correo de destino válido.",
      });
      return;
    }

    setIsTestingSmtp(true);
    setToolState("working");
    setSmtpTestResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const payload: Record<string, unknown> = {
        action: "test",
        recipientEmail: testEmail.trim(),
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
        body: JSON.stringify({ action: "test_dispatch" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Error al enviar correo de prueba.");
      }

      setDispatchMsg({
        success: true,
        text: data.message || "Alerta de despacho de prueba enviada exitosamente.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar alerta.";
      setDispatchMsg({ success: false, text: msg });
    } finally {
      setIsTestingDispatch(false);
    }
  };

  // ==========================================
  // MASTER ENV BUILDER (COMPILES EVERYTHING REACTIVELY)
  // ==========================================
  const computedMasterEnv = useMemo(() => {
    const lines: string[] = [
      `# ==============================================================================`,
      `# ${brand.name.toUpperCase()} - VARIABLES DE ENTORNO COMPLETAS`,
      `# Generado automáticamente desde el Panel de Administración de ${brand.name}`,
      `# Fecha: ${new Date().toISOString()}`,
      `# ==============================================================================`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 1. BASE DE DATOS & AUTH (SUPABASE)`,
      `# ------------------------------------------------------------------------------`,
      `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl || "https://tu-proyecto.supabase.co"}"`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey || "tu_clave_publica_anon"}"`,
      `SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceRoleKey || "tu_clave_secreta_service_role"}"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 2. HOSTING, DOMINIO & GEOLOCALIZACIÓN (MAPBOX)`,
      `# ------------------------------------------------------------------------------`,
      `NEXT_PUBLIC_SITE_URL="${siteUrl || "http://localhost:3000"}"`,
      `NEXT_PUBLIC_APP_URL="${siteUrl || "http://localhost:3000"}"`,
      `NEXT_PUBLIC_MAPBOX_TOKEN="${mapboxToken || "pk.eyJ1IjoidHVfdXN1YXJpbyIsImEiOiJ0dV90b2tlbiJ9.ejemplo"}"`,
      `MASTER_ADMIN_EMAIL="${masterAdminEmail || "admin@luminahome.com"}"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 3. CORREOS TRANSACCIONALES & NOTIFICACIONES (SMTP)`,
      `# ------------------------------------------------------------------------------`,
      `SMTP_HOST="${smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost || "smtp.gmail.com"}"`,
      `SMTP_PORT="${smtpProvider === "gmail" ? "587" : String(smtpPort || 587)}"`,
      `SMTP_SECURE="${smtpSecure ? "true" : "false"}"`,
      `SMTP_USER="${smtpUser || "tu_correo@gmail.com"}"`,
      `SMTP_PASS="${smtpPass || "xxxx xxxx xxxx xxxx"}"`,
      `SMTP_FROM="${senderName || brand.name} <${smtpUser || "tu_correo@gmail.com"}>"`,
      ``,
      `# ------------------------------------------------------------------------------`,
      `# 4. GOOGLE CLOUD CONSOLE & GOOGLE DRIVE MULTIMEDIA`,
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
    { id: "smtp" as const, label: "SMTP & Correos", icon: Mail, ready: servicesStatus?.smtp?.configured },
    { id: "supabase" as const, label: "Supabase DB", icon: Database, ready: servicesStatus?.supabase?.configured },
    { id: "google" as const, label: "Google Cloud", icon: Cloud, ready: servicesStatus?.googleDrive?.configured },
    { id: "payphone" as const, label: "PayPhone Pagos", icon: CreditCard, ready: servicesStatus?.payphone?.configured },
    { id: "hosting" as const, label: "Hosting & Mapas", icon: Globe, ready: Boolean(servicesStatus?.hosting?.siteUrl) },
    { id: "wallets" as const, label: "Wallets Apple/Google", icon: Smartphone, ready: servicesStatus?.wallets?.configured },
    { id: "master_env" as const, label: "Generador .env", icon: Terminal, ready: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans" data-state={toolState}>
      {/* Container Principal Bento Apple */}
      <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-6">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <div className="mb-2.5">
              <CloudSyncStatus
                isSyncing={isLoadingStatus || isSavingDispatch || isSavingPayphone}
                syncError={null}
                onSave={fetchEnvConfig}
                saveLabel="Verificar infraestructura"
                savedLabel="Variables sincronizadas"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Server className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              <span>Infraestructura & Variables de Entorno</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Gestor integral para migración de servidores, cambio de cuentas en Supabase, nuevo proyecto en Google Cloud Console, cambio de dominio y generador universal de archivos <span className="font-mono text-zinc-800 dark:text-zinc-200">.env</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchEnvConfig}
              disabled={isLoadingStatus}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95"
              title="Refrescar estado de los servicios"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isLoadingStatus ? "animate-spin text-blue-500" : ""}`} />
              <span>Refrescar</span>
            </button>

            <button
              type="button"
              onClick={() => markCopied("master_all", computedMasterEnv)}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {copiedKey === "master_all" ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === "master_all" ? "¡Copiado Todo!" : "Copiar .env"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadEnv(".env.local")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl border border-blue-200/60 dark:border-blue-500/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.env.local</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegación Segmentada Estilo Apple */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 w-max min-w-full sm:min-w-0">
            {navCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-500" : "opacity-70"}`} />
                  <span>{cat.label}</span>
                  {cat.ready ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Configurado" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Pendiente de configurar" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: SERVIDOR SMTP & NOTIFICACIONES (MAIL)                   */}
        {/* ============================================================== */}
        {activeTab === "smtp" && (
          <div className="space-y-6">
            {/* Banner de Estado */}
            <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Servidor de Correo Transaccional
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      servicesStatus?.smtp?.configured
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}>
                      {servicesStatus?.smtp?.configured ? "Activo" : "Requiere Contraseña"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Envía facturas, confirmaciones de compra y alertas para el personal de despacho.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{showGoogleGuide ? "Ocultar Guía" : "Guía Gmail 16 Dígitos"}</span>
                </button>
              </div>
            </div>

            {/* Guía Acordeón Apple para Gmail */}
            <AnimatePresence>
              {showGoogleGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-3"
                >
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Cómo generar tu Contraseña de Aplicación de 16 caracteres</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">1. Seguridad Google</span>
                      Ve a tu cuenta de Google y activa la &quot;Verificación en 2 pasos&quot;.
                    </div>
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">2. Contraseñas de app</span>
                      Busca &quot;Contraseñas de aplicaciones&quot; en la barra de búsqueda de Google.
                    </div>
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">3. Nombre de app</span>
                      Escribe &quot;{brand.name}&quot; y haz clic en Crear.
                    </div>
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">4. Pegar aquí</span>
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

            {/* Formulario de Configuración SMTP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda: Credenciales */}
              <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-500" />
                    <span>Credenciales de Envío</span>
                  </h4>
                  
                  {/* Selector de Proveedor */}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Host SMTP</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="mail.tudominio.com"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Puerto</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        placeholder="587 o 465"
                        className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Contraseña de Aplicación (SMTP_PASS)</label>
                  <div className="relative">
                    <input
                      type={showSmtpPass ? "text" : "password"}
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full pl-3 pr-10 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `SMTP_HOST="${smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost}"\nSMTP_PORT="${smtpProvider === "gmail" ? "587" : smtpPort}"\nSMTP_SECURE="${smtpSecure ? "true" : "false"}"\nSMTP_USER="${smtpUser}"\nSMTP_PASS="${smtpPass}"\nSMTP_FROM="${senderName} <${smtpUser}>"`;
                      markCopied("smtp_snip", snippet);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === "smtp_snip" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque SMTP</span>
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Test de Envío & Receptores */}
              <div className="space-y-6">
                {/* Envío de Prueba en Vivo */}
                <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    <span>Prueba en Vivo de Conexión</span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Envía un correo de prueba para verificar que el servidor SMTP y el puerto responden sin bloqueos.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="tu_correo_personal@gmail.com"
                      className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtpConnection}
                      disabled={isTestingSmtp}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
                    >
                      <Send className={`w-3.5 h-3.5 ${isTestingSmtp ? "animate-pulse" : ""}`} />
                      <span>{isTestingSmtp ? "Enviando..." : "Probar"}</span>
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

                {/* Receptores de Despacho (Hasta 7 correos) */}
                <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        <span>Receptores de Órdenes (Bodega)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Hasta 7 correos recibirán la alerta inmediata de preparación de cada pedido confirmado.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {dispatchRecipients.length}/7
                    </span>
                  </div>

                  {/* Lista de tags de correos */}
                  <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                    {dispatchRecipients.length === 0 ? (
                      <span className="text-xs text-zinc-400 italic">No hay correos de bodega registrados.</span>
                    ) : (
                      dispatchRecipients.map((em) => (
                        <span
                          key={em}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 shadow-xs"
                        >
                          <span className="font-mono text-[11px]">{em}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(em)}
                            className="text-zinc-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Input para añadir */}
                  <div className="flex gap-2">
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
                      className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      disabled={dispatchRecipients.length >= 7 || !recipientInput.trim()}
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* Acciones de despacho */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleTestDispatchEmail}
                      disabled={isTestingDispatch || dispatchRecipients.length === 0}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTestingDispatch ? "Enviando alerta..." : "Probar Alerta de Bodega"}</span>
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

        {/* ============================================================== */}
        {/* TAB 2: BASE DE DATOS & AUTH (SUPABASE)                         */}
        {/* ============================================================== */}
        {activeTab === "supabase" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-emerald-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Base de Datos PostgreSQL & Autenticación Supabase</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Conectado
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Alberga el catálogo de productos, órdenes de compra, perfiles de usuario y carritos persistentes.
                  </p>
                </div>
              </div>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <span>Dashboard Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Formulario de Variables Supabase */}
            <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                <span>Variables para Migrar o Cambiar de Proyecto</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  URL del Proyecto (NEXT_PUBLIC_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://tu-proyecto.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-emerald-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-emerald-500 resize-none"
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
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-emerald-500 resize-none"
                />
                <span className="text-[10px] text-zinc-400 block">
                  Requerida por el backend para gestión de inventario, migración y creación de usuarios administrativos.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const snip = `NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${supabaseAnonKey}"\nSUPABASE_SERVICE_ROLE_KEY="${supabaseServiceRoleKey}"`;
                    markCopied("supabase_snip", snip);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedKey === "supabase_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar Variables Supabase</span>
                </button>
              </div>
            </div>

            {/* Guía de Migración Supabase */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 space-y-3">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                ¿Cómo migrar a una nueva cuenta de Supabase?
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <li>Crea una nueva organización o proyecto en <span className="font-mono text-blue-500">supabase.com</span>.</li>
                <li>Ve a <span className="font-medium text-zinc-900 dark:text-white">Project Settings &rarr; API</span>.</li>
                <li>Copia la <span className="font-medium text-zinc-900 dark:text-white">Project URL</span> y pégala en <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span>.</li>
                <li>Copia la clave <span className="font-mono">anon public</span> y la clave secreta <span className="font-mono">service_role</span>.</li>
                <li>Ejecuta el archivo SQL de migraciones ubicado en <span className="font-mono text-zinc-800 dark:text-zinc-200">/supabase/schema.sql</span> desde el SQL Editor de tu nuevo proyecto.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GOOGLE CLOUD CONSOLE & DRIVE API                        */}
        {/* ============================================================== */}
        {activeTab === "google" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-blue-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Google Cloud Console & Drive OAuth 2.0</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      servicesStatus?.googleDrive?.configured
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    }`}>
                      {servicesStatus?.googleDrive?.configured ? "Conectado" : "Configuración OAuth"}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Permite conectar tu Google Drive empresarial para seleccionar fotos de alta resolución directamente en productos.
                  </p>
                </div>
              </div>

              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <span>Credenciales GCP</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Formulario Google Cloud */}
            <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
                <KeyRound className="w-4 h-4 text-blue-500" />
                <span>Credenciales de OAuth 2.0 (Google Drive)</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  ID de Cliente OAuth (GOOGLE_CLIENT_ID)
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="1234567890-abcdef.apps.googleusercontent.com"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  URI de Redirección Autorizado (GOOGLE_REDIRECT_URI)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleRedirectUri}
                    onChange={(e) => setGoogleRedirectUri(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => markCopied("redir_uri", googleRedirectUri)}
                    className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-medium cursor-pointer"
                  >
                    {copiedKey === "redir_uri" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-400 block">
                  Debes registrar exactamente esta URL en los &quot;URIs de redireccionamiento autorizados&quot; en Google Cloud Console.
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
                    Generar 32 bytes aleatorios
                  </button>
                </div>
                <input
                  type="text"
                  value={googleEncryptionKey}
                  onChange={(e) => setGoogleEncryptionKey(e.target.value)}
                  placeholder="32 bytes hexadecimales para cifrar tokens en base de datos"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-blue-500"
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
                  <span>Copiar Variables Google Cloud</span>
                </button>
              </div>
            </div>

            {/* Guía de Creación de Proyecto GCP */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 space-y-3">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Paso a Paso: Crear o cambiar a un nuevo proyecto en Google Cloud Console
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <li>Ingresa a <span className="font-mono text-blue-500">console.cloud.google.com</span> y crea un proyecto llamado <span className="font-semibold text-zinc-900 dark:text-white">Lumina Drive</span>.</li>
                <li>Ve a <span className="font-medium text-zinc-900 dark:text-white">APIs & Servicios &rarr; Biblioteca</span> y habilita <span className="font-medium text-blue-500">Google Drive API</span>.</li>
                <li>Ve a <span className="font-medium text-zinc-900 dark:text-white">Pantalla de consentimiento de OAuth</span>, elige &quot;Externo&quot;, ingresa el nombre de la app y agrega tu correo de soporte.</li>
                <li>Ve a <span className="font-medium text-zinc-900 dark:text-white">Credenciales &rarr; Crear credenciales &rarr; ID de cliente de OAuth</span>.</li>
                <li>Tipo de aplicación: <span className="font-semibold text-zinc-900 dark:text-white">Aplicación web</span>.</li>
                <li>En <span className="font-medium">URIs de redireccionamiento autorizados</span>, pega exactamente la URL mostrada arriba: <span className="font-mono text-zinc-900 dark:text-zinc-100">{googleRedirectUri}</span>.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PASARELA DE PAGOS PAYPHONE ECUADOR                       */}
        {/* ============================================================== */}
        {activeTab === "payphone" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-amber-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Pasarela PayPhone Ecuador (Tarjetas Visa / MasterCard)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {payphoneEnv === "production" ? "Producción Real" : "Modo Pruebas (Sandbox)"}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Procesamiento de pagos con tarjeta de crédito/débito nacional e internacional y diferidos.
                  </p>
                </div>
              </div>

              <a
                href="https://developer.payphonetodoesposible.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
              >
                <span>Portal Developer PayPhone</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Selector de Modo de Checkout (Cajita vs Redirección) */}
            <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    Modo de Experiencia de Checkout
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Selecciona cómo tus clientes ingresan su tarjeta durante el pago.
                  </p>
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

              {/* Credenciales de PayPhone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                    </button>
                  </div>
                  <input
                    type={showPayphoneToken ? "text" : "password"}
                    value={payphoneToken}
                    onChange={(e) => setPayphoneToken(e.target.value)}
                    placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Entorno Activo (PAYPHONE_ENV)
                  </label>
                  <select
                    value={payphoneEnv}
                    onChange={(e) => setPayphoneEnv(e.target.value as "sandbox" | "production")}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium outline-none focus:border-amber-500"
                  >
                    <option value="sandbox">Sandbox (Tarjetas de prueba de PayPhone)</option>
                    <option value="production">Producción (Cobros monetarios reales)</option>
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
                  <span>Copiar Variables PayPhone</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: HOSTING, DOMAIN & MAPBOX                                */}
        {/* ============================================================== */}
        {activeTab === "hosting" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-indigo-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Hosting, Dominio Web & Telemetría Mapbox</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                      Producción
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Configuración de URL pública para callbacks bancarios, sitemap SEO y mapas interactivos de despacho.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  URL Pública del Sitio (NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL)
                </label>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://tudominio.com"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-zinc-400 block">
                  Usado por PayPhone y Google OAuth para retornar a tu sitio tras completar el proceso.
                </span>
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
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-zinc-400 block">
                  Requerido para renderizar el radar satelital y el selector interactivo de direcciones de entrega.
                </span>
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
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs outline-none focus:border-indigo-500"
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
                  <span>Copiar Variables de Hosting</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: MOBILE WALLETS (GOOGLE & APPLE PASSKIT)                 */}
        {/* ============================================================== */}
        {activeTab === "wallets" && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-rose-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Google Wallet & Apple Wallet PassKit (.pkpass)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Opcional
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Permite a tus clientes guardar su tarjeta de fidelidad y ticket de pedido directamente en el Wallet de su iPhone o Android.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/60 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Clave Criptográfica HMAC para Tokens de Seguimiento (WALLET_SECRET_KEY)
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
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Google Wallet Issuer ID</label>
                  <input
                    type="text"
                    value={googleWalletIssuerId}
                    onChange={(e) => setGoogleWalletIssuerId(e.target.value)}
                    placeholder="3388000000022XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Google Service Account Email</label>
                  <input
                    type="text"
                    value={googleWalletClientEmail}
                    onChange={(e) => setGoogleWalletClientEmail(e.target.value)}
                    placeholder="wallet@tu-gcp.iam.gserviceaccount.com"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Apple Team Identifier</label>
                  <input
                    type="text"
                    value={appleTeamId}
                    onChange={(e) => setAppleTeamId(e.target.value)}
                    placeholder="TU_TEAM_ID_APPLE"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Apple Pass Type ID</label>
                  <input
                    type="text"
                    value={applePassTypeId}
                    onChange={(e) => setApplePassTypeId(e.target.value)}
                    placeholder="pass.com.luminahome.loyalty"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono outline-none focus:border-rose-500"
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
                  <span>Copiar Variables Wallet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: GENERADOR UNIVERSAL MAESTRO .ENV                        */}
        {/* ============================================================== */}
        {activeTab === "master_env" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-500" />
                  <span>Visor Maestro de Variables de Entorno</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Reúne en un único archivo formateado el 100% de las variables necesarias para correr la tienda en desarrollo o producción.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markCopied("master_env_view", computedMasterEnv)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedKey === "master_env_view" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "master_env_view" ? "¡Copiado!" : "Copiar Todo"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadEnv(".env.production")}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .env.production</span>
                </button>
              </div>
            </div>

            {/* Terminal Code Viewer */}
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#0d0e12] overflow-hidden shadow-xl">
              <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-zinc-400 font-mono ml-2">.env.production</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">UTF-8 • Formato Vercel / Docker</span>
              </div>
              <pre className="p-4 sm:p-5 text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto max-h-[520px] scrollbar-thin">
                {computedMasterEnv}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
