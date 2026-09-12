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
  Wallet, 
  Building2, 
  Eye, 
  EyeOff, 
  RefreshCw 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/lib/userStore";

export function IntegrationsTab() {
  const { user } = useUserStore();

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
  const [senderName, setSenderName] = useState("Lumina Home");
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live Test Email state
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Guide accordion
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  // Fetch current Vercel environment variable status
  const fetchSmtpStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/smtp", { headers });
      const data = await res.json();
      if (data.success) {
        setSmtpStatus(data);
        if (data.user) {
          setGmailUser(prev => prev || data.user);
        }
      }
    } catch (err) {
      console.warn("Could not fetch SMTP status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchSmtpStatus();
  }, [fetchSmtpStatus]);

  // Compute generated block for Vercel
  const finalEmail = gmailUser.trim() || "tu_correo@gmail.com";
  const finalPass = gmailPass.trim() || "xxxx xxxx xxxx xxxx";
  const finalFrom = `${senderName.trim() || 'Lumina Home'} <${finalEmail}>`;

  const vercelEnvSnippet = `SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="${finalEmail}"
SMTP_PASS="${finalPass}"
SMTP_FROM="${finalFrom}"`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(vercelEnvSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Run live test dispatch
  const handleTestConnection = async (useCurrentFormCredentials = false) => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      setTestResult({ success: false, message: "Por favor ingresa un correo de destino válido para recibir la prueba." });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const payload: Record<string, unknown> = {
        action: 'test',
        recipientEmail: testEmail.trim(),
      };

      if (useCurrentFormCredentials) {
        if (!gmailUser.trim() || !gmailPass.trim()) {
          setTestResult({ success: false, message: "Ingresa tu correo de Gmail y tu contraseña de aplicación para probar estas credenciales." });
          setIsTesting(false);
          return;
        }
        payload.host = 'smtp.gmail.com';
        payload.port = 587;
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
      fetchSmtpStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al probar conexión.";
      setTestResult({ success: false, message: msg });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Header Banner */}
      <div className="bg-white/90 dark:bg-[#202022]/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Capa 1: Vercel Production
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Exclusivo Administradores</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Server className="w-6 h-6 text-[#8c9276]" /> Servidor SMTP & Pasarelas
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Gestiona la infraestructura de notificaciones por correo de Lumina Home con las variables de entorno de Vercel.
          </p>
        </div>

        <button 
          onClick={fetchSmtpStatus}
          disabled={isLoadingStatus}
          className="self-start md:self-auto px-4 py-2 bg-gray-100 dark:bg-[#3a3a3c] hover:bg-gray-200 dark:hover:bg-[#4a4a4c] text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          Refrescar Estado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: VERCEL STATUS & GENERATOR (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Module 1: Live Status in Vercel */}
          <div className="bg-white/90 dark:bg-[#202022]/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8c9276]" />
                Estado del Servidor en Vercel
              </h3>
              {isLoadingStatus ? (
                <div className="w-4 h-4 border-2 border-[#8c9276] border-t-transparent rounded-full animate-spin" />
              ) : smtpStatus?.isConfigured ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado en Vercel
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Modo Simulación Activo
                </span>
              )}
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-gray-50 dark:bg-[#1a1a1c] rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Host SMTP</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                  {smtpStatus?.host || 'smtp.gmail.com'}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-[#1a1a1c] rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Puerto TLS</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                  {smtpStatus?.port || 587} (Seguro TLS)
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-[#1a1a1c] rounded-2xl border border-gray-100 dark:border-white/5 space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Usuario Remitente Activo</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {smtpStatus?.user || 'No configurado en Vercel (Se usa simulación en consola)'}
                </p>
              </div>
            </div>

            {smtpStatus?.isConfigured && (
              <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-500">¿Deseas probar las variables activas?</span>
                <button
                  onClick={() => handleTestConnection(false)}
                  disabled={isTesting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isTesting ? "Verificando..." : "Enviar Correo de Prueba"}
                </button>
              </div>
            )}
          </div>

          {/* Module 2: Vercel Variable Generator (Gmail Option B) */}
          <div className="bg-white/90 dark:bg-[#202022]/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Generador de Variables para Vercel
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ingresa los datos de tu cuenta de Google para generar el bloque de variables de entorno para vercel.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Correo Gmail / Google Workspace (SMTP_USER)
                </label>
                <input 
                  type="email" 
                  value={gmailUser}
                  onChange={e => setGmailUser(e.target.value)}
                  placeholder="ej: tu_tienda@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#8c9276]/30 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Contraseña de Aplicación de Google (SMTP_PASS)
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    ¿Cómo obtenerla? <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={gmailPass}
                    onChange={e => setGmailPass(e.target.value)}
                    placeholder="16 caracteres (ej: abcd efgh ijkl mnop)"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#8c9276]/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Remitente Visible (SMTP_FROM)
                </label>
                <input 
                  type="text" 
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Lumina Home"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#8c9276]/30 font-medium"
                />
              </div>
            </div>

            {/* Google Guide Accordion */}
            {showGoogleGuide && (
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl text-xs space-y-2.5 animate-fade-in text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Pasos para generar tu Contraseña de Aplicación en Google:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800 dark:text-blue-300 pl-1">
                  <li>Ingresa a tu cuenta de Google en <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="underline font-semibold">myaccount.google.com/security</a>.</li>
                  <li>Asegúrate de tener activa la <strong>Verificación en 2 pasos</strong>.</li>
                  <li>En el buscador superior escribe <em>&quot;Contraseñas de aplicaciones&quot;</em> o entra a dicha opción al fondo de Seguridad.</li>
                  <li>En nombre de la app escribe <strong>Lumina Home</strong> y presiona <strong>Crear</strong>.</li>
                  <li>Google te dará un código de 16 letras amarillas. Cópialo y pégalo aquí.</li>
                </ol>
              </div>
            )}

            {/* Code Output Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300">Bloque generado para Vercel:</span>
                <span className="text-[11px] text-gray-400">Settings &gt; Environment Variables</span>
              </div>
              <div className="relative group">
                <pre className="p-4 bg-gray-950 text-gray-100 rounded-2xl text-xs font-mono overflow-x-auto selection:bg-[#8c9276] selection:text-white border border-gray-800">
                  {vercelEnvSnippet}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Test Credentials Action */}
            <div className="p-4 bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#8c9276]" />
                    Probar estas credenciales antes de ir a Vercel
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Envía un correo de prueba en tiempo real para verificar que Google las acepte.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="Tu correo para recibir la prueba"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#202022] text-gray-900 dark:text-gray-100 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleTestConnection(true)}
                  disabled={isTesting}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isTesting ? "Enviando..." : "🧪 Probar Credenciales"}
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40'}`}>
                  {testResult.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  <span className="leading-tight">{testResult.message}</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: PAYMENT GATEWAYS PREPARATION (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          <div className="bg-white/90 dark:bg-[#202022]/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-[#8c9276]" />
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Pasarelas de Pago
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded-md tracking-wider">
                Fase Siguiente · Arquitectura Vercel
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Esta sección está preparada para vincular las pasarelas oficiales de cobro siguiendo el mismo estándar de variables de entorno de Vercel.
              </p>
            </div>

            {/* Gateway Cards */}
            <div className="space-y-3">
              
              {/* PlaceToPay */}
              <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gradient-to-br from-white to-gray-50/50 dark:from-[#202022] dark:to-[#1a1a1c] space-y-2 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs">
                      P2P
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">PlaceToPay (Ecuador)</h4>
                      <p className="text-[10px] text-gray-400">Tarjetas de Crédito / Débito & Red Bancaria</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    Configuración Disponible
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-white/5 p-2 rounded-lg truncate">
                  PLACETOPAY_LOGIN, PLACETOPAY_TRAN_KEY
                </div>
              </div>

              {/* PayPhone */}
              <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gradient-to-br from-white to-gray-50/50 dark:from-[#202022] dark:to-[#1a1a1c] space-y-2 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">PayPhone (Ecuador)</h4>
                      <p className="text-[10px] text-gray-400">App Móvil PayPhone & Tarjetas</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    Configuración Disponible
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-white/5 p-2 rounded-lg truncate">
                  PAYPHONE_TOKEN, PAYPHONE_CLIENT_ID
                </div>
              </div>

              {/* Bank Transfer */}
              <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gradient-to-br from-white to-gray-50/50 dark:from-[#202022] dark:to-[#1a1a1c] space-y-2 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#8c9276]/10 flex items-center justify-center text-[#8c9276] font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Transferencias Bancarias</h4>
                      <p className="text-[10px] text-gray-400">Cuentas Corrientes & Comprobantes</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    Alternativa Manual
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-white/5 p-2 rounded-lg truncate">
                  BANK_ACCOUNTS_METADATA
                </div>
              </div>

            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              💡 <strong>Regla de Pasarelas:</strong> Ambas pasarelas (PlaceToPay y PayPhone) se podrán configurar en esta sección, pero solo 1 estará activa a la vez para los clientes durante el checkout.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
