"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Mail,
  ShieldCheck,
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
  Users,
  CheckCircle2,
  Info,
  Lock,
  Download,
  Terminal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { CloudSyncStatus } from "../CloudSyncStatus";

export function IntegrationsTab() {
  const brand = useBrand();
  const { user } = useUserStore();

  const [activeSubTab, setActiveSubTab] = useState<"smtp" | "dispatch" | "payphone">("smtp");
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");

  // Server status state
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [smtpStatus, setSmtpStatus] = useState<{
    isConfigured: boolean;
    host: string;
    port: number;
    user: string | null;
    from: string | null;
    hasPassword: boolean;
    source: string;
  } | null>(null);

  // Vercel Generator state (Option B: Gmail)
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPass, setGmailPass] = useState("");
  const [senderName, setSenderName] = useState(brand.name);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedMasterEnv, setCopiedMasterEnv] = useState(false);

  // Live Test Email state
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Receptores de Órdenes de Despacho (Máximo 7 correos)
  const [dispatchRecipients, setDispatchRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [isSavingDispatch, setIsSavingDispatch] = useState(false);
  const [isTestingDispatch, setIsTestingDispatch] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [dispatchJustSaved, setDispatchJustSaved] = useState(false);

  // Guide accordion
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  // PayPhone Payment Mode & Admin settings
  const [payphoneMode, setPayphoneMode] = useState<"box" | "redirect">("box");
  const [payphoneStoreId, setPayphoneStoreId] = useState<string | null>(null);
  const [payphoneIsConfigured, setPayphoneIsConfigured] = useState(false);
  const [, setPayphoneIsSimulated] = useState(true);
  const [isLoadingPayphone, setIsLoadingPayphone] = useState(true);
  const [isSavingPayphone, setIsSavingPayphone] = useState(false);
  const [payphoneMsg, setPayphoneMsg] = useState<{ success: boolean; text: string } | null>(null);

  // PayPhone Vercel Variables Generator state
  const [payphoneToken, setPayphoneToken] = useState("");
  const [payphoneStoreIdInput, setPayphoneStoreIdInput] = useState("");
  const [showPayphoneToken, setShowPayphoneToken] = useState(false);
  const [copiedPayphone, setCopiedPayphone] = useState(false);

  // Fetch current Vercel environment variable status & dispatch recipients
  const fetchSmtpStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/smtp", { headers });
      const data = await res.json();
      if (data.success) {
        setSmtpStatus(data);
        if (data.user) {
          setGmailUser((prev) => prev || data.user);
        }
        if (Array.isArray(data.dispatchRecipients)) {
          setDispatchRecipients(data.dispatchRecipients);
        }
      }
    } catch (err) {
      console.warn("Could not fetch SMTP status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Fetch current PayPhone Admin Settings
  const fetchPayphoneSettings = useCallback(async () => {
    setIsLoadingPayphone(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/payphone/settings", { headers });
      const data = await res.json();
      if (data.success) {
        setPayphoneMode(data.mode === "redirect" ? "redirect" : "box");
        setPayphoneStoreId(data.storeId);
        setPayphoneIsConfigured(data.isConfigured);
        setPayphoneIsSimulated(data.isSimulated);
      }
    } catch (err) {
      console.warn("Could not fetch PayPhone settings:", err);
    } finally {
      setIsLoadingPayphone(false);
    }
  }, []);

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
        if (data.success) {
          saved = true;
        }
      } catch (apiErr) {
        console.warn("API settings update notice:", apiErr);
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
          text: `Directiva actualizada: el checkout usará ${
            selectedMode === "box" ? "Checkout Embebido (Cajita)" : "Redirección Bancaria (3D Secure)"
          }.`,
        });
      } else {
        throw new Error(dbErr?.message || "No se pudo guardar la configuración en la base de datos.");
      }
    } catch (err: unknown) {
      setToolState("idle");
      const msg = err instanceof Error ? err.message : "Error al comunicarse con el servidor.";
      setPayphoneMsg({
        success: false,
        text: msg,
      });
    } finally {
      setIsSavingPayphone(false);
    }
  };

  useEffect(() => {
    fetchSmtpStatus();
    fetchPayphoneSettings();
  }, [fetchSmtpStatus, fetchPayphoneSettings]);

  // Compute generated block for Vercel
  const finalEmail = gmailUser.trim() || "tu_correo@gmail.com";
  const finalPass = gmailPass.trim() || "xxxx xxxx xxxx xxxx";
  const finalFrom = `${senderName.trim() || brand.name} <${finalEmail}>`;

  const vercelEnvSnippet = `SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="${finalEmail}"
SMTP_PASS="${finalPass}"
SMTP_FROM="${finalFrom}"`;

  const finalPayphoneToken = payphoneToken.trim() || "tu_token_privado_de_payphone";
  const finalPayphoneStoreId =
    payphoneStoreIdInput.trim() ||
    (payphoneStoreId && !payphoneStoreId.includes("••••")
      ? payphoneStoreId
      : "tu_store_id_de_sucursal");

  const vercelPayphoneEnvSnippet = `PAYPHONE_TOKEN="${finalPayphoneToken}"
PAYPHONE_STORE_ID="${finalPayphoneStoreId}"
PAYPHONE_PAYMENT_MODE="${payphoneMode}"`;

  const masterEnvBundle = `# === ${brand.name.toUpperCase()} · VERCEL PRODUCTION ENVIRONMENT ===
${vercelEnvSnippet}

# === PAYPHONE ECUADOR GATEWAY ===
${vercelPayphoneEnvSnippet}`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(vercelEnvSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  };

  const handleCopyPayphoneSnippet = () => {
    navigator.clipboard.writeText(vercelPayphoneEnvSnippet);
    setCopiedPayphone(true);
    setTimeout(() => setCopiedPayphone(false), 2600);
  };

  const handleCopyMasterBundle = () => {
    navigator.clipboard.writeText(masterEnvBundle);
    setCopiedMasterEnv(true);
    setTimeout(() => setCopiedMasterEnv(false), 2600);
  };

  const handleDownloadEnvFile = () => {
    const blob = new Blob([masterEnvBundle], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lumina-home.env.production";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run live test dispatch
  const handleTestConnection = async (useCurrentFormCredentials = false) => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      setTestResult({
        success: false,
        message: "Por favor ingresa un correo de destino válido para recibir la prueba.",
      });
      return;
    }

    setIsTesting(true);
    setToolState("working");
    setTestResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const payload: Record<string, unknown> = {
        action: "test",
        recipientEmail: testEmail.trim(),
        secure: true,
      };

      if (useCurrentFormCredentials) {
        if (!gmailUser.trim() || !gmailPass.trim()) {
          setTestResult({
            success: false,
            message:
              "Ingresa tu correo de Gmail y tu contraseña de aplicación para probar estas credenciales.",
          });
          setIsTesting(false);
          setToolState("idle");
          return;
        }
        payload.host = "smtp.gmail.com";
        payload.port = 587;
        payload.secure = true;
        payload.user = gmailUser.trim();
        payload.pass = gmailPass.trim();
        payload.from = finalFrom;
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

      setTestResult({ success: true, message: data.message });
      setToolState("done");
      setTimeout(() => setToolState("idle"), 2000);
      fetchSmtpStatus();
    } catch (err: unknown) {
      setToolState("idle");
      const msg = err instanceof Error ? err.message : "Error inesperado al probar conexión.";
      setTestResult({ success: false, message: msg });
    } finally {
      setIsTesting(false);
    }
  };

  // Dedicated persistence routine for dispatch recipients (instant auto-save + optional manual save)
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
      setDispatchJustSaved(true);
      setToolState("done");
      setTimeout(() => {
        setDispatchJustSaved(false);
        setToolState("idle");
      }, 2400);

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
        text: "Los correos ingresados ya están presentes en la lista.",
      });
      return;
    }

    const nextList = [...dispatchRecipients, ...newItems];
    if (nextList.length > 7) {
      setDispatchMsg({
        success: false,
        text: `Límite alcanzado: Puedes registrar hasta un máximo de 7 correos. Actualmente tendrías ${nextList.length}.`,
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

  const handleSaveDispatchRecipients = async () => {
    await persistDispatchRecipients(dispatchRecipients, false);
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
          action: "test_dispatch",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Error al enviar correo de prueba de despacho.");
      }

      setDispatchMsg({
        success: true,
        text: data.message || "Alerta de despacho de prueba enviada exitosamente.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar prueba de despacho.";
      setDispatchMsg({ success: false, text: msg });
    } finally {
      setIsTestingDispatch(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" data-state={toolState}>
      {/* Main Container — Exact Mi Perfil Bento Architecture matching CardsTab, OverviewTab & LoyaltyCardsTab */}
      <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <CloudSyncStatus
                isSyncing={isLoadingStatus || isSavingDispatch || isSavingPayphone}
                syncError={null}
                onSave={() => {
                  fetchSmtpStatus();
                  fetchPayphoneSettings();
                }}
                saveLabel="Sincronizar estado"
                savedLabel="Infraestructura verificada"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Server className="w-5 h-5 text-[#8c9276]" /> Servidor SMTP, Logística & Pasarelas Bancarias
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-2xl">
              Estudio de configuración transaccional de {brand.name}: generador de variables de entorno para Vercel, correos de despacho para bodega y pasarela oficial PayPhone Ecuador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                fetchSmtpStatus();
                fetchPayphoneSettings();
              }}
              disabled={isLoadingStatus}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-2xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8c9276] ${isLoadingStatus ? "animate-spin" : ""}`} />
              <span>Refrescar</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadEnvFile}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .env.production</span>
            </button>
          </div>
        </div>

        {/* Clean 4-Column Telemetry Strip matching OverviewTab & LoyaltyCardsTab */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Estado Servidor SMTP
            </span>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block truncate">
              {smtpStatus?.isConfigured ? "Conectado (TLS)" : "Simulación Local"}
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Receptores de Bodega
            </span>
            <span className="text-lg font-display font-bold text-[#8c9276] mt-1 block">
              {dispatchRecipients.length} / 7 activos
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Modalidad PayPhone
            </span>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block truncate">
              {payphoneMode === "box" ? "Checkout Embebido" : "Redirección 3DS"}
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Seguridad Activa
            </span>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block truncate">
              Puerto {smtpStatus?.port || 587} • PCI-DSS
            </span>
          </div>
        </div>

        {/* Sub-navigation Switcher (Micro-SaaS Tool Pattern) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-[#2a2a2c]/80 border border-gray-200/60 dark:border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab("smtp")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "smtp"
                ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#8c9276]" />
            <span>1. Servidor SMTP & Generador .ENV</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("dispatch")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "dispatch"
                ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#8c9276]" />
            <span>2. Receptores de Despacho ({dispatchRecipients.length}/7)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("payphone")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "payphone"
                ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#8c9276]" />
            <span>3. Pasarela PayPhone Ecuador</span>
          </button>
        </div>

        {/* Workspace Grid: Active Tool (7 cols) + Live Environment Bundle & Diagnostic Console (5 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Active Tool Module (7 cols) */}
          <div className="xl:col-span-7 space-y-5">
            {activeSubTab === "smtp" && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200/60 dark:border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8c9276]" />
                      <span>Generador de Variables SMTP (Google Workspace / Gmail)</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Configura el correo remitente oficial de {brand.name} y verifica la entrega TLS en tiempo real.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                      smtpStatus?.isConfigured
                        ? "bg-[#8c9276]/15 text-[#686e54] dark:text-[#cbd1b2]"
                        : "bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {smtpStatus?.isConfigured ? "SMTP ACTIVO" : "MODO SIMULACIÓN"}
                  </span>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Correo Gmail / Google Workspace (SMTP_USER)
                    </label>
                    <input
                      type="email"
                      value={gmailUser}
                      onChange={(e) => setGmailUser(e.target.value)}
                      placeholder="ej: notificaciones@luminahome.ec"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 outline-none focus:border-[#8c9276]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Contraseña de Aplicación de Google (SMTP_PASS)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                          className="text-[11px] text-[#8c9276] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <span>¿Cómo obtenerla?</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPass ? "Ocultar" : "Mostrar"}</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type={showPass ? "text" : "password"}
                      value={gmailPass}
                      onChange={(e) => setGmailPass(e.target.value)}
                      placeholder="16 caracteres (ej: abcd efgh ijkl mnop)"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-[#8c9276]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre Remitente Visible (SMTP_FROM)
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={brand.name}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 outline-none focus:border-[#8c9276]"
                    />
                  </div>
                </div>

                {/* Google Guide Accordion */}
                {showGoogleGuide && (
                  <div className="p-4 bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 rounded-2xl text-xs space-y-2 animate-fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-gray-900 dark:text-white">
                      <KeyRound className="w-4 h-4 text-[#8c9276]" />
                      <span>Pasos para generar tu Contraseña de Aplicación en Google:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-600 dark:text-gray-300 pl-1">
                      <li>
                        Ingresa a{" "}
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-semibold text-[#8c9276]"
                        >
                          myaccount.google.com/security
                        </a>
                        .
                      </li>
                      <li>Activa la <strong>Verificación en dos pasos</strong>.</li>
                      <li>Busca <em>&quot;Contraseñas de aplicaciones&quot;</em> en la barra superior.</li>
                      <li>
                        Crea una clave bajo el nombre <strong>{brand.name}</strong> y pega los 16
                        caracteres arriba.
                      </li>
                    </ol>
                  </div>
                )}

                {/* Live SMTP Handshake Test Box */}
                <div className="p-4 bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 rounded-2xl space-y-3">
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#8c9276]" />
                      <span>Probar Conexión SMTP en Tiempo Real</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Envía un correo de diagnóstico para validar el handshake TLS antes de desplegar en Vercel.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Correo para recibir la prueba"
                      className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-gray-50 dark:bg-[#2a2a2c] text-gray-900 dark:text-gray-100 outline-none focus:border-[#8c9276]"
                    />
                    <button
                      type="button"
                      onClick={() => handleTestConnection(true)}
                      disabled={isTesting}
                      className="h-10 px-5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Prueba</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        testResult.success
                          ? "bg-[#8c9276]/15 text-gray-900 dark:text-white border border-[#8c9276]/30"
                          : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40"
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="w-4 h-4 text-[#8c9276] shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-tight font-medium">{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === "dispatch" && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/60 dark:border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#8c9276]" />
                      <span>Receptores de Órdenes de Despacho (Bodega & Logística)</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Configura hasta 7 correos para recibir automáticamente las guías de despacho tras cada venta.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 text-xs font-mono font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#8c9276]" />
                    <span>{dispatchRecipients.length} / 7 cupos</span>
                  </div>
                </div>

                {/* Input & Quick Add */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Agregar Correo de Despacho
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
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
                        placeholder="ej: bodega@luminahome.ec, logistica@empresa.com"
                        disabled={dispatchRecipients.length >= 7 || isSavingDispatch}
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 outline-none focus:border-[#8c9276] disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRecipient}
                      disabled={
                        !recipientInput.trim() || dispatchRecipients.length >= 7 || isSavingDispatch
                      }
                      className="h-10 px-5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#8c9276]" />
                    <span>
                      Puedes pegar varios correos separados por coma. Quedan{" "}
                      {Math.max(0, 7 - dispatchRecipients.length)} cupos disponibles.
                    </span>
                  </p>
                </div>

                {/* Recipients List Grid */}
                <div className="space-y-2.5">
                  {dispatchRecipients.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white dark:bg-[#202022] border border-dashed border-gray-200 dark:border-white/10 text-center space-y-1.5">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Sin correos logísticos adicionales
                      </p>
                      <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                        Las órdenes de despacho se envían actualmente al correo administrador principal.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {dispatchRecipients.map((email, idx) => (
                        <div
                          key={email}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-[#8c9276]/15 text-[#8c9276] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate font-mono">
                                {email}
                              </p>
                              <span className="text-[10px] text-[#8c9276] font-medium block">
                                Receptor Activo
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(email)}
                            disabled={isSavingDispatch}
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Eliminar receptor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {dispatchMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                      dispatchMsg.success
                        ? "bg-[#8c9276]/15 text-gray-900 dark:text-white border-[#8c9276]/30"
                        : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {dispatchMsg.success ? (
                        <CheckCircle2 className="w-4 h-4 text-[#8c9276] shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span className="font-medium">{dispatchMsg.text}</span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleTestDispatchEmail}
                    disabled={isTestingDispatch || isSavingDispatch}
                    className="px-4 py-2 bg-white dark:bg-[#202022] hover:bg-gray-100 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border border-gray-200 dark:border-white/10"
                  >
                    {isTestingDispatch ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#8c9276]" />
                    )}
                    <span>
                      {isTestingDispatch ? "Enviando orden..." : "Enviar Orden de Despacho de Prueba"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDispatchRecipients}
                    disabled={isSavingDispatch}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{dispatchJustSaved ? "Guardado" : "Guardar Lista"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeSubTab === "payphone" && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200/60 dark:border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#8c9276]" />
                      <span>Pasarela Bancaria PayPhone Ecuador</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Selecciona el modo de cobro en el checkout y genera las variables de servidor para Vercel.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 text-[10px] font-mono font-bold text-gray-700 dark:text-gray-200">
                    {payphoneIsConfigured ? "LIVE API" : "MODO SANDBOX"}
                  </span>
                </div>

                {/* Mode Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPayphoneMode("box");
                      handleSavePayphoneMode("box");
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[116px] ${
                      payphoneMode === "box"
                        ? "border-gray-900 dark:border-white bg-white dark:bg-[#202022] shadow-xs"
                        : "border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#202022]/50 hover:border-gray-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-[#2a2a2c] text-gray-700 dark:text-gray-300">
                          SDK EMBEBIDO
                        </span>
                        {payphoneMode === "box" && (
                          <CheckCircle2 className="w-4 h-4 text-[#8c9276] shrink-0" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                        Cajita de Pagos (En Página)
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      El cliente paga con tarjeta o saldo PayPhone sin salir de la tienda.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayphoneMode("redirect");
                      handleSavePayphoneMode("redirect");
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[116px] ${
                      payphoneMode === "redirect"
                        ? "border-gray-900 dark:border-white bg-white dark:bg-[#202022] shadow-xs"
                        : "border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#202022]/50 hover:border-gray-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-[#2a2a2c] text-gray-700 dark:text-gray-300">
                          3D SECURE 2.0
                        </span>
                        {payphoneMode === "redirect" && (
                          <CheckCircle2 className="w-4 h-4 text-[#8c9276] shrink-0" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                        Redirección Bancaria Oficial
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      Transfiere el cobro al portal seguro de PayPhone y retorna a la tienda al confirmar.
                    </p>
                  </button>
                </div>

                {/* PayPhone API Credentials Inputs */}
                <div className="space-y-3.5 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Token Privado de API (PAYPHONE_TOKEN)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPayphoneToken(!showPayphoneToken)}
                        className="text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {showPayphoneToken ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>{showPayphoneToken ? "Ocultar" : "Mostrar"}</span>
                      </button>
                    </div>
                    <input
                      type={showPayphoneToken ? "text" : "password"}
                      value={payphoneToken}
                      onChange={(e) => setPayphoneToken(e.target.value)}
                      placeholder="ej: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-[#8c9276]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Identificador de Sucursal (PAYPHONE_STORE_ID)
                    </label>
                    <input
                      type="text"
                      value={payphoneStoreIdInput}
                      onChange={(e) => setPayphoneStoreIdInput(e.target.value)}
                      placeholder={
                        payphoneStoreId && !payphoneStoreId.includes("••••")
                          ? payphoneStoreId
                          : "ej: 5c0a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c"
                      }
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-[#8c9276]"
                    />
                  </div>
                </div>

                {payphoneMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      payphoneMsg.success
                        ? "bg-[#8c9276]/15 text-gray-900 dark:text-white border border-[#8c9276]/30"
                        : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300"
                    }`}
                  >
                    <Check className="w-4 h-4 text-[#8c9276] shrink-0 mt-0.5" />
                    <span className="leading-tight font-medium">{payphoneMsg.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live .ENV Output & Infrastructure Inspector (5 cols) */}
          <div className="xl:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#8c9276]" />
                    <span>Variables de Producción (.ENV)</span>
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                    Bloque compilado listo para Vercel Environment Variables
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMasterBundle}
                  className="px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedMasterEnv ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedMasterEnv ? "Copiado" : "Copiar Todo"}</span>
                </button>
              </div>

              {/* Code Output Box */}
              <div className="relative">
                <pre className="p-4 bg-[#171717] text-gray-100 rounded-2xl text-[11px] font-mono overflow-x-auto border border-white/10 leading-relaxed shadow-inner selection:bg-[#8c9276] selection:text-white">
                  {masterEnvBundle}
                </pre>
              </div>

              {/* Quick Section Copy Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-[#202022] hover:bg-gray-100 border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#8c9276]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#8c9276]" />
                  )}
                  <span>{copied ? "SMTP Copiado" : "Solo SMTP_*"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPayphoneSnippet}
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-[#202022] hover:bg-gray-100 border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedPayphone ? (
                    <Check className="w-3.5 h-3.5 text-[#8c9276]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#8c9276]" />
                  )}
                  <span>{copiedPayphone ? "PayPhone Copiado" : "Solo PAYPHONE_*"}</span>
                </button>
              </div>

              {/* Security & Local Compilation Note */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#8c9276] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <strong className="font-semibold text-gray-900 dark:text-white">
                    Seguridad de secretos:
                  </strong>{" "}
                  El bloque <code>.env</code> se genera localmente en tu navegador. Pega estas variables en{" "}
                  <strong>Vercel &gt; Settings &gt; Environment Variables</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
