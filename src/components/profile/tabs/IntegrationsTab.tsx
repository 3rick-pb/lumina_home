"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  ChevronDown,
  Layers,
  ShieldCheck,
  Zap,
  AtSign,
  Hash,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { CodeBlock } from "@/components/ui/code-block";

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

export function IntegrationsTab() {
  const brand = useBrand();
  const { user } = useUserStore();

  const [activeSection, setActiveSection] = useState<ViewSection>("all");
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<ServiceConfigStatus | null>(null);
  const [showLiveCode, setShowLiveCode] = useState(true);

  // Combobox Apple Liquid Glass state
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
  // 6. WALLETS STATE (GOOGLE WALLET)
  // ==========================================
  const [walletSecretKey, setWalletSecretKey] = useState("");
  const [googleWalletIssuerId, setGoogleWalletIssuerId] = useState("");
  const [googleWalletClientEmail, setGoogleWalletClientEmail] = useState("");

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

  // Master Save to Database handler triggered by "Guardar"
  const handleSaveAllToDatabase = async () => {
    setIsSavingAll(true);
    setToolState("working");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      // 1. Guardar receptores de bodega si están configurados
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

      // 2. Guardar modo y parámetros de PayPhone si están disponibles
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

      // 3. Refrescar estado general del servidor
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
          ? "✓ Guardado en la base de datos."
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
    { id: "all" as const, label: "Todas las Secciones", icon: Layers, desc: "Vista unificada de toda la infraestructura", ready: true },
    { id: "smtp" as const, label: "SMTP & Correos", icon: Mail, desc: "Servidor de emails y bodegas", ready: servicesStatus?.smtp?.configured },
    { id: "supabase" as const, label: "Supabase DB", icon: Database, desc: "PostgreSQL, Auth y Storage", ready: servicesStatus?.supabase?.configured },
    { id: "google" as const, label: "Google Cloud", icon: Cloud, desc: "OAuth 2.0 y Drive API", ready: servicesStatus?.googleDrive?.configured },
    { id: "payphone" as const, label: "PayPhone Pagos", icon: CreditCard, desc: "Tarjetas y modo de cobro", ready: servicesStatus?.payphone?.configured },
    { id: "hosting" as const, label: "Hosting & Mapas", icon: Globe, desc: "Dominio web y token Mapbox", ready: Boolean(servicesStatus?.hosting?.siteUrl) },
    { id: "wallets" as const, label: "Google Wallet", icon: Smartphone, desc: "Pases digitales de cliente y fidelidad", ready: servicesStatus?.wallets?.configured },
  ];

  const selectedCategory = navCategories.find((c) => c.id === activeSection) || navCategories[0];
  const SelectedIcon = selectedCategory.icon;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans" data-state={toolState}>
      {/* ==================================================================== */}
      {/* MASTER HUB CONTAINER (APPLE / LUMINA LUXURY BENTO)                    */}
      {/* ==================================================================== */}
      <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-3xl p-4 sm:p-7 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-6 sm:space-y-7">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="min-w-0">
            <div className="mb-2.5">
              <CloudSyncStatus
                isSyncing={isSavingAll || isSavingDispatch || isSavingPayphone}
                syncError={null}
                onSave={handleSaveAllToDatabase}
                saveLabel="Guardar"
                savedLabel="Guardado en nube"
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
        {/* SELECTOR COMBOBOX APPLE LIQUID GLASS CON EFECTO REBOTE (WWDC25)      */}
        {/* ==================================================================== */}
        <div className="pt-1 pb-1">
          <div ref={comboboxRef} className="relative z-30 w-full sm:max-w-md">
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Módulo o Sección para Configurar:
              </label>
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Navegación Rápida
              </span>
            </div>

            {/* Botón Trigger Cápsula de Cristal Líquido (Apple Liquid Glass) */}
            <motion.button
              type="button"
              onClick={() => setIsComboboxOpen((prev) => !prev)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-white/75 dark:bg-[#202024]/75 hover:bg-white/90 dark:hover:bg-[#28282c]/90 backdrop-blur-3xl backdrop-saturate-[200%] border border-white/60 dark:border-white/15 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),inset_0_1.5px_1px_rgba(255,255,255,0.85),inset_0_-1px_1px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_32px_-5px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.22),inset_0_-1px_1px_rgba(0,0,0,0.4)] text-xs font-semibold text-zinc-900 dark:text-white transition-all cursor-pointer group"
              aria-expanded={isComboboxOpen}
              aria-haspopup="listbox"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/35 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  <SelectedIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="truncate leading-tight font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
                    {selectedCategory.label}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight mt-0.5 truncate">
                    {selectedCategory.desc}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedCategory.id !== "all" && (
                  selectedCategory.ready ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Configurado" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" title="Pendiente" />
                  )
                )}
                <motion.div
                  animate={{ rotate: isComboboxOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
                </motion.div>
              </div>
            </motion.button>

            {/* Menú Desplegable Liquid Glass Apple con Scroll Vertical Estilizado (Sin Scroll Horizontal) */}
            <AnimatePresence>
              {isComboboxOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.14, ease: "easeOut" } }}
                  transition={{
                    type: "spring",
                    stiffness: 440,
                    damping: 20,
                    mass: 0.7,
                  }}
                  style={{ transformOrigin: "top left" }}
                  className="absolute left-0 right-0 top-full mt-2.5 rounded-[1.75rem] bg-white/85 dark:bg-[#161618]/90 backdrop-blur-3xl backdrop-saturate-[210%] border border-white/60 dark:border-white/15 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.25),inset_0_1.5px_1px_0_rgba(255,255,255,0.85),inset_0_-1px_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7),inset_0_1.5px_1px_0_rgba(255,255,255,0.22),inset_0_-1px_1px_0_rgba(0,0,0,0.5)] p-2 z-50 overflow-hidden"
                  role="listbox"
                >
                  <div className="space-y-1 max-h-[320px] overflow-y-auto overflow-x-hidden pr-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.4)_transparent] dark:[scrollbar-color:rgba(113,113,122,0.4)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                    {navCategories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = activeSection === cat.id;

                      return (
                        <motion.button
                          key={cat.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setActiveSection(cat.id);
                            setIsComboboxOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/20 text-zinc-950 dark:text-amber-100 font-semibold border border-amber-500/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                              isSelected 
                                ? "bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-xs" 
                                : "bg-white/70 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 border-white/30 dark:border-white/10"
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate leading-tight font-medium">{cat.label}</span>
                              <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 truncate">
                                {cat.desc}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {cat.id !== "all" && (
                              <span className={`w-1.5 h-1.5 rounded-full ${cat.ready ? "bg-emerald-500" : "bg-amber-400"}`} />
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANEL MAESTRO: CODE BLOCK RARE-UI CON GENERADOR UNIVERSAL EN VIVO    */}
        {/* ==================================================================== */}
        <div className="rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-b from-white/95 to-zinc-50/80 dark:from-[#18181c]/95 dark:to-[#121215]/90 backdrop-blur-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Variables de Entorno Generadas en Vivo (.env)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    100% de la web
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hidden sm:inline-block">
                    {computedMasterEnv.split("\n").filter(Boolean).length} líneas de variables
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Configuración maestra sincronizada con Supabase, Servidor SMTP, PayPhone y Google Cloud en un solo bloque.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => markCopied("master_all", computedMasterEnv)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {copiedKey === "master_all" ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "master_all" ? "¡Copiado Todo!" : "Copiar .env Maestro"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLiveCode((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                <span>{showLiveCode ? "Ocultar Código" : "Ver Código .env"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${showLiveCode ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showLiveCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden pt-1"
              >
                <CodeBlock
                  code={computedMasterEnv}
                  language="env"
                  accent="#F75001"
                  showLineNumbers={true}
                  showCopyButton={true}
                  showHeader={false}
                  defaultExpanded={true}
                  showFooter={true}
                  className="w-full rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ==================================================================== */}
        {/* SECCIONES EDITABLES UNIFICADAS                                       */}
        {/* ==================================================================== */}
        <div className="space-y-6 sm:space-y-8 pt-2">

          {/* ------------------------------------------------------------------ */}
          {/* 1. SERVIDOR SMTP & NOTIFICACIONES (MAIL) - BENTO 2.0 COMMAND HUB    */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "smtp") && (
            <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-gradient-to-b from-white/95 via-zinc-50/70 to-white/90 dark:from-[#1b1b1f]/95 dark:via-[#161619]/80 dark:to-[#121215]/90 p-5 sm:p-7 md:p-8 space-y-6 sm:space-y-7 shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
              
              {/* Header Principal con Mesh Visual & Telemetría Rápida */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-500/20 to-sky-400/20 border border-blue-500/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(59,130,246,0.15)]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Servidor SMTP & Notificaciones Transaccionales
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                        servicesStatus?.smtp?.configured
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${servicesStatus?.smtp?.configured ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                        <span>{servicesStatus?.smtp?.configured ? "Servidor Operativo" : "Requiere Configuración"}</span>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                      Motor de mensajería para facturas por compra, comprobantes de pago y avisos inmediatos de preparación a bodegas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                    className="px-3.5 py-2 rounded-xl border border-blue-500/20 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 font-semibold transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>{showGoogleGuide ? "Ocultar Guía Gmail" : "Guía Gmail 16 Dígitos"}</span>
                  </button>
                </div>
              </div>

              {/* Bento Ribbon de Métricas en Vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-800/50 backdrop-blur-md flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Seguridad & Protocolo</span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                      {smtpProvider === "gmail" ? "STARTTLS (Puerto 587)" : `Puerto ${smtpPort} ${smtpSecure ? "(SSL Directo)" : "(STARTTLS)"}`}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-800/50 backdrop-blur-md flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Canal de Envío</span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                      {smtpProvider === "gmail" ? "Google Cloud Relay" : (smtpHost || "Custom SMTP Host")}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-800/50 backdrop-blur-md flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Bodegas en Alerta</span>
                      <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">{dispatchRecipients.length}/7</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (dispatchRecipients.length / 7) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guía Visual Desplegable Gmail (4 Pasos Ilustrados) */}
              <AnimatePresence>
                {showGoogleGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/[0.04] to-blue-500/10 border border-amber-500/25 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Cómo generar tu Contraseña de Aplicación de 16 caracteres en Gmail</span>
                      </h4>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Abrir Seguridad Google</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 shadow-xs space-y-1.5">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center justify-center text-[11px]">
                          01
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-white block">2 Pasos Activo</span>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                          Ingresa a tu cuenta de Google y verifica tener encendida la &quot;Verificación en 2 pasos&quot;.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 shadow-xs space-y-1.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center justify-center text-[11px]">
                          02
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-white block">Contraseñas de App</span>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                          Busca &quot;Contraseñas de aplicaciones&quot; en la barra de búsqueda de tu cuenta de Google.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 shadow-xs space-y-1.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-bold flex items-center justify-center text-[11px]">
                          03
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-white block">Nombre de App</span>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                          Nombra la app como &quot;{brand.name}&quot; y presiona el botón Crear contraseña.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 shadow-xs space-y-1.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center justify-center text-[11px]">
                          04
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-white block">Pegar 16 Letras</span>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                          Copia el código generado de 16 caracteres y pégalo en el campo Contraseña abajo.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selector Visual de Proveedor (Cards Interactivas) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase block px-1">
                  Selecciona la Plataforma de Correo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Tarjeta Proveedor 1: Gmail Cloud */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSmtpProvider("gmail");
                      setSmtpHost("smtp.gmail.com");
                      setSmtpPort(587);
                      setSmtpSecure(false);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden ${
                      smtpProvider === "gmail"
                        ? "bg-white dark:bg-zinc-800/90 border-blue-500/50 shadow-[0_8px_24px_rgba(59,130,246,0.12),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-2 ring-blue-500/20"
                        : "bg-white/60 dark:bg-zinc-900/40 border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800/60 opacity-80"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">Gmail / Google Workspace</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        Puerto 587 STARTTLS automático. Máxima reputación contra filtros de spam sin configurar DNS complejos.
                      </p>
                    </div>
                    {smtpProvider === "gmail" && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>

                  {/* Tarjeta Proveedor 2: SMTP Propio */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSmtpProvider("custom")}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden ${
                      smtpProvider === "custom"
                        ? "bg-white dark:bg-zinc-800/90 border-amber-500/50 shadow-[0_8px_24px_rgba(245,158,11,0.12),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-2 ring-amber-500/20"
                        : "bg-white/60 dark:bg-zinc-900/40 border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800/60 opacity-80"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Server className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">Hosting Propio / Relay</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          Personalizado
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        Servidor cPanel, AWS SES, Resend o SendGrid con puertos configurables (587, 465, 25).
                      </p>
                    </div>
                    {smtpProvider === "custom" && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Grid Bento de 2 Columnas: Credenciales vs Prueba & Bodegas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                
                {/* Bento Card A: Credenciales del Servidor */}
                <div className="p-5 sm:p-6 rounded-3xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#1c1c20]/90 backdrop-blur-xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        Credenciales de Autenticación
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {smtpProvider === "gmail" ? "gmail-auth-v2" : "smtp-custom-auth"}
                    </span>
                  </div>

                  {smtpProvider === "custom" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <Server className="w-3 h-3 text-zinc-400" />
                          <span>Host SMTP</span>
                        </label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="mail.tudominio.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-800/70 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-zinc-400" />
                          <span>Puerto</span>
                        </label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          placeholder="587 o 465"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-800/70 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <AtSign className="w-3 h-3 text-zinc-400" />
                      <span>Correo Remitente (SMTP_USER)</span>
                    </label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="contacto@luminahome.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-800/70 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <KeyRound className="w-3 h-3 text-zinc-400" />
                        <span>{smtpProvider === "gmail" ? "Contraseña de App (16 caracteres)" : "Contraseña del Servidor"}</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">SMTP_PASS</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? "text" : "password"}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-800/70 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1"
                        aria-label="Ver u ocultar contraseña"
                      >
                        {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-zinc-400" />
                      <span>Nombre Visible de la Marca (SMTP_FROM)</span>
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={brand.name}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-800/70 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                    <span className="text-[10.5px] text-zinc-400">¿Deseas probar esta configuración?</span>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `SMTP_HOST="${smtpProvider === "gmail" ? "smtp.gmail.com" : smtpHost}"\nSMTP_PORT="${smtpProvider === "gmail" ? "587" : smtpPort}"\nSMTP_SECURE="${smtpSecure ? "true" : "false"}"\nSMTP_USER="${smtpUser}"\nSMTP_PASS="${smtpPass}"\nSMTP_FROM="${senderName} <${smtpUser}>"`;
                        markCopied("smtp_snip", snippet);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      {copiedKey === "smtp_snip" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar Bloque SMTP</span>
                    </button>
                  </div>
                </div>

                {/* Bento Card B: Consola de Diagnóstico & Receptores de Bodega */}
                <div className="space-y-5">
                  
                  {/* Sub-tarjeta 1: Consola de Diagnóstico y Prueba en Vivo */}
                  <div className="p-5 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-white/90 dark:to-[#1c1c20]/90 backdrop-blur-xl shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Send className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                          Prueba de Conexión en Vivo
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Diagnóstico Real
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Envía un correo de prueba al instante para comprobar que los puertos y la contraseña funcionen sin restricciones de firewall.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="tu_correo_personal@gmail.com"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-800/80 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[42px] sm:min-h-0"
                      />
                      <button
                        type="button"
                        onClick={handleTestSmtpConnection}
                        disabled={isTestingSmtp}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 shadow-sm shadow-emerald-600/20 min-h-[42px] sm:min-h-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingSmtp ? "Comprobando..." : "Lanzar Prueba"}</span>
                      </button>
                    </div>

                    {smtpTestResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 rounded-2xl border text-xs font-medium leading-relaxed flex items-start gap-2.5 ${
                          smtpTestResult.success
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                            : "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {smtpTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <span>{smtpTestResult.message}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Sub-tarjeta 2: Receptores de Órdenes (Bodegas) */}
                  <div className="p-5 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] to-white/90 dark:to-[#1c1c20]/90 backdrop-blur-xl shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                          Receptores de Órdenes (Bodegas)
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {dispatchRecipients.length}/7 cupos
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Hasta 7 correos recibirán una alerta automática detallada con los productos cada vez que un cliente pague exitosamente.
                    </p>

                    {/* Chips de correos registrados */}
                    <div className="flex flex-wrap gap-2 min-h-[42px] p-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                      {dispatchRecipients.length === 0 ? (
                        <div className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-400 italic">
                          <Info className="w-3.5 h-3.5 text-zinc-400" />
                          <span>No hay correos de bodega registrados todavía.</span>
                        </div>
                      ) : (
                        dispatchRecipients.map((em, idx) => (
                          <span
                            key={em}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 shadow-xs"
                          >
                            <span className="w-4 h-4 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                              B{idx + 1}
                            </span>
                            <span className="font-mono text-[11px]">{em}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(em)}
                              className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5 transition-colors"
                              aria-label={`Eliminar correo ${em}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Input para agregar bodega */}
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
                        placeholder="bodega_norte@luminahome.com"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-zinc-800/80 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[42px] sm:min-h-0"
                      />
                      <button
                        type="button"
                        onClick={handleAddRecipient}
                        disabled={dispatchRecipients.length >= 7 || !recipientInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-95 min-h-[42px] sm:min-h-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>

                    {/* Acción de prueba de alerta a bodegas */}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleTestDispatchEmail}
                        disabled={isTestingDispatch || dispatchRecipients.length === 0}
                        className="px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2 active:scale-95 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingDispatch ? "Enviando alerta..." : "Probar Alerta a Bodegas"}</span>
                      </button>
                      <span className="text-[10px] text-zinc-400">Notifica a todos los destinatarios</span>
                    </div>

                    {dispatchMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                          dispatchMsg.success
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25"
                            : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25"
                        }`}
                      >
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>{dispatchMsg.text}</span>
                      </motion.div>
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
                        {showPayphoneToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
          {/* 6. BILLETERA DIGITAL (GOOGLE WALLET PASSES)                        */}
          {/* ------------------------------------------------------------------ */}
          {(activeSection === "all" || activeSection === "wallets") && (
            <div className="p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Google Wallet Passes (Billetera Digital)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Opcional
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Permite a los clientes guardar tarjetas de fidelidad y tickets de seguimiento de pedido en Google Wallet en sus teléfonos móviles.
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snip = `WALLET_SECRET_KEY="${walletSecretKey}"\nGOOGLE_WALLET_ISSUER_ID="${googleWalletIssuerId}"\nGOOGLE_WALLET_CLIENT_EMAIL="${googleWalletClientEmail}"`;
                      markCopied("wallet_snip", snip);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedKey === "wallet_snip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Bloque Google Wallet</span>
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
