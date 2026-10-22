"use client";

import React, { useState, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore, isValidEmail, validateStrongPassword } from "@/lib/userStore";
import { useCartStore } from "@/lib/store";
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { useBrand } from "@/core";
import { BeUILoaderMetaballs, BeUICenterMorphModal } from "@/components/ui/BeUIControls";
import { LuminaLoginWordmark } from "@/components/ui/LuminaLoginWordmark";
import { StrongPasswordMeter } from "@/components/ui/StrongPasswordMeter";
import { supabase } from "@/lib/supabase";
import { Google } from "@thesvg/react";
import { ThinkingOrb } from "thinking-orbs";

const SCRAMBLE_CHARSET = "ABCDEF0123456789$#%&*?";

function LoginFormContent() {
  const brand = useBrand();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const ageParam = searchParams.get("age");
  const redirectParam = searchParams.get("next") || searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [scrambledPassword, setScrambledPassword] = useState<string | null>(null);
  const pwdTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Scramble reveal effect identical to credit card unmasking (CardFolder / register)
   */
  const runScrambleReveal = (
    realValue: string,
    toShow: boolean,
    setDisplay: (val: string | null) => void,
    timerRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!realValue) {
      setDisplay(null);
      return;
    }

    const length = realValue.length;
    const targetChars = toShow ? Array.from(realValue) : Array.from({ length }, () => "•");
    const totalSteps = 12;
    const intervalMs = 24;
    let step = 0;

    setDisplay(
      targetChars.map(() => SCRAMBLE_CHARSET[Math.floor(Math.random() * SCRAMBLE_CHARSET.length)]).join("")
    );

    timerRef.current = setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setDisplay(null);
      } else {
        const progress = step / totalSteps;
        const resolvedCount = Math.floor(progress * length);
        const frame = targetChars
          .map((ch, idx) => {
            if (idx < resolvedCount) return ch;
            const randIdx = Math.floor(Math.random() * SCRAMBLE_CHARSET.length);
            return SCRAMBLE_CHARSET[randIdx];
          })
          .join("");
        setDisplay(frame);
      }
    }, intervalMs);
  };

  const handleToggleLoginPassword = () => {
    const next = !showLoginPassword;
    setShowLoginPassword(next);
    runScrambleReveal(password, next, setScrambledPassword, pwdTimerRef);
  };

  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Interactive Password Change Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [cpEmail, setCpEmail] = useState("");
  const [cpNewPassword, setCpNewPassword] = useState("");
  const [cpConfirmPassword, setCpConfirmPassword] = useState("");
  const [showCpPassword, setShowCpPassword] = useState(false);
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const router = useRouter();
  const login = useUserStore((state) => state.login);

  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isLoading) return;
    setIsGoogleLoading(true);
    setErrorMsg("");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const safeNext = (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//") && !redirectParam.includes("\\") && !redirectParam.includes(":"))
        ? redirectParam
        : "/";

      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes: "openid email profile https://www.googleapis.com/auth/user.birthday.read",
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account",
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || "Error al conectar con Google.");
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      console.error("[login] Google OAuth initiation error:", err);
      setErrorMsg("No se pudo iniciar la conexión con Google. Inténtalo de nuevo.");
      setIsGoogleLoading(false);
    }
  };

  const openPasswordChangeModal = () => {
    setCpEmail(email.trim());
    setCpNewPassword("");
    setCpConfirmPassword("");
    setCpError("");
    setCpSuccess("");
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError("");
    setCpSuccess("");

    const cleanTargetEmail = cpEmail.trim().toLowerCase();
    if (!cleanTargetEmail || !isValidEmail(cleanTargetEmail)) {
      setCpError("Por favor, ingresa el correo electrónico válido de tu cuenta.");
      return;
    }

    const strengthCheck = validateStrongPassword(cpNewPassword);
    if (!strengthCheck.isValid) {
      setCpError(strengthCheck.error || "La nueva contraseña debe ser fuerte y segura.");
      return;
    }

    if (cpNewPassword !== cpConfirmPassword) {
      setCpError("Las contraseñas ingresadas no coinciden. Verifícalas.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanTargetEmail,
          newPassword: cpNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCpError(data.error || "No se pudo actualizar la contraseña.");
      } else {
        setCpSuccess(
          data.message || "Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión."
        );
        setEmail(cleanTargetEmail);
        setPassword(cpNewPassword);
        setSuccessNotice("Contraseña actualizada correctamente. Haz clic en Iniciar Sesión para ingresar.");
        setTimeout(() => {
          setShowChangePasswordModal(false);
        }, 1200);
      }
    } catch {
      setCpError("Error de conexión al intentar cambiar la contraseña.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };




  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMsg("Por favor, ingresa un correo electrónico con formato válido.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password.length > 72) {
      setErrorMsg("La contraseña excede el límite máximo de caracteres permitido.");
      return;
    }

    setIsLoading(true);
    const [{ error }] = await Promise.all([
      login(cleanEmail, password),
      new Promise((resolve) => setTimeout(resolve, 850)),
    ]);
    if (error) {
      setIsLoading(false);
      setErrorMsg(error === "Invalid login credentials" ? "Credenciales incorrectas. Verifica tu correo y contraseña." : error);
    } else {
      if (typeof window !== "undefined" && sessionStorage.getItem("lumina_cart_reopen") === "true") {
        sessionStorage.removeItem("lumina_cart_reopen");
        router.push("/");
        setTimeout(() => {
          useCartStore.getState().setIsOpen(true);
        }, 400);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 flex flex-col items-center justify-center bg-transparent relative overflow-hidden px-4">
      
      {/* Grand Brand Header */}
      <div className="text-center mb-6 relative z-10 max-w-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-gray-800">
            {brand.name} • Acceso Exclusivo
          </span>
        </div>

        <div className="flex justify-center select-none cursor-default my-1">
          <LuminaLoginWordmark />
        </div>
        <p className="mt-2 text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
          Espacios diseñados para perdurar. Inicia sesión con tus credenciales para acceder a la boutique y gestionar tus pedidos.
        </p>
      </div>



      {/* Main Luxury Glass Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/50 backdrop-blur-2xl border border-white/80 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <div className="mb-6">
            <h2 className="text-2xl font-display italic font-bold text-gray-900 mb-1.5">Iniciar Sesión</h2>
            <p className="text-xs text-gray-500">Introduce tus credenciales registradas para ingresar al sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Display (Credentials, Google OAuth, or Age Restriction) */}
            {(errorMsg || (errorParam === "underage" || errorParam === "missing_birth_year" ? "Edad mínima requerida +18 años." : errorParam === "google_auth_failed" ? "No se pudo completar el inicio de sesión con Google. Inténtalo de nuevo." : null)) && (
              <div className="p-3.5 bg-red-50/90 dark:bg-rose-950/40 backdrop-blur-sm text-red-600 dark:text-rose-300 text-xs rounded-2xl border border-red-100 dark:border-rose-900/40 text-center font-medium">
                {errorMsg || (errorParam === "underage" || errorParam === "missing_birth_year" ? "Edad mínima requerida +18 años." : "No se pudo completar el inicio de sesión con Google. Inténtalo de nuevo.")}
              </div>
            )}

            {successNotice && !errorMsg && (
              <div className="p-3.5 bg-emerald-50/95 backdrop-blur-sm text-emerald-700 text-xs rounded-2xl border border-emerald-200 text-center font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="password"
                  name="password"
                  type={showLoginPassword || scrambledPassword !== null ? "text" : "password"} 
                  autoComplete="current-password"
                  value={scrambledPassword !== null ? scrambledPassword : password}
                  onChange={(e) => {
                    if (scrambledPassword !== null) {
                      if (pwdTimerRef.current) clearInterval(pwdTimerRef.current);
                      setScrambledPassword(null);
                    }
                    setPassword(e.target.value);
                  }}
                  readOnly={scrambledPassword !== null}
                  className="w-full pl-11 pr-11 py-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm font-mono tracking-wide"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={handleToggleLoginPassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={openPasswordChangeModal}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7058] hover:text-gray-900 transition-colors cursor-pointer group"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#8c9276] group-hover:rotate-12 transition-transform" />
                  <span className="underline decoration-[#8c9276]/50 underline-offset-4 group-hover:decoration-gray-900">
                    ¿Olvidaste tu contraseña?
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium text-sm flex items-center justify-center gap-2.5 transition-all shadow-xs hover:shadow-sm active:scale-[0.99] group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <ThinkingOrb state="working" size={20} color="#ffffff" />
                  <span className="font-semibold tracking-wide">Iniciando sesión...</span>
                </div>
              ) : (
                <>
                  <span>Iniciar Sesión a {brand.shortName}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">o continúa con</span>
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
            </div>

            {/* Google OAuth Login Button with Vector Logo & Race Condition Shield (Official Pill UX/UI) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-11 sm:h-12 bg-white dark:bg-[#131314] hover:bg-[#f8fafd] dark:hover:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#f1f1f1] border border-[#747775]/75 hover:border-[#1f1f1f] dark:border-[#8e918f]/50 dark:hover:border-white/50 rounded-full font-medium flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer text-sm group disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <ThinkingOrb state="working" size={20} color="#000000" theme="light" />
                  <span className="font-medium text-sm text-[#1f1f1f] dark:text-gray-200">Conectando con Google...</span>
                </div>
              ) : (
                <>
                  <Google className="h-6 w-6 shrink-0 transition-transform group-hover:scale-105" />
                  <span className="font-medium text-sm tracking-normal">Continuar con Google</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-200/60 text-center text-xs text-gray-600">
            ¿No tienes cuenta aún?{' '}
            <Link href="/auth/register" className="font-semibold text-gray-900 hover:text-[#8c9276] hover:underline underline-offset-2 transition-colors">
              Regístrate gratis
            </Link>
          </div>
        </div>

        {/* Reassurance Seal */}
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-[#8c9276]" />
          <span>Acceso Seguro • {brand.name}</span>
        </div>
      </div>



      {/* Interactive Password Change Modal (BeUICenterMorphModal) */}
      <BeUICenterMorphModal
        open={showChangePasswordModal}
        onOpenChange={setShowChangePasswordModal}
        className="w-full max-w-md"
      >
        <div className="p-6 sm:p-8 relative bg-white dark:bg-[#18181b] rounded-[2rem] border border-gray-200 dark:border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.5)] text-gray-900 dark:text-white">
          {/* Exact Cart Close Button */}
          <button
            type="button"
            onClick={() => setShowChangePasswordModal(false)}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-gray-100/95 dark:bg-[#2a2a2d]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3 mb-4 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-[#8c9276]/15 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] dark:text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#767c60] dark:text-amber-400">
                Seguridad de Cuenta
              </span>
              <h3 className="text-xl font-display italic font-bold text-gray-950 dark:text-white leading-tight">
                Cambiar Contraseña
              </h3>
            </div>
          </div>

          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
            Ingresa el correo electrónico de tu cuenta y establece una nueva contraseña fuerte y segura para recuperar o actualizar tu acceso.
          </p>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            {cpError && (
              <div className="p-3 bg-red-50/95 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs rounded-2xl border border-red-200 dark:border-red-900/40 font-medium text-center">
                {cpError}
              </div>
            )}

            {cpSuccess && (
              <div className="p-3.5 bg-emerald-50/95 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-900/40 font-semibold flex items-center justify-center gap-2 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cpSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 ml-1">
                Correo Electrónico de tu Cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={cpEmail}
                  onChange={(e) => setCpEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#121214] border border-gray-300 dark:border-white/15 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 ml-1">
                Nueva Contraseña Segura
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCpPassword ? "text" : "password"}
                  value={cpNewPassword}
                  onChange={(e) => setCpNewPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres, mayúscula, número y símbolo"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-[#121214] border border-gray-300 dark:border-white/15 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCpPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Interactive Live Strong Password Meter */}
              <StrongPasswordMeter password={cpNewPassword} compact />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 ml-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCpPassword ? "text" : "password"}
                  value={cpConfirmPassword}
                  onChange={(e) => setCpConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#121214] border border-gray-300 dark:border-white/15 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="px-4 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="flex-1 h-12 rounded-2xl bg-gray-900 dark:bg-amber-400 text-white dark:text-stone-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-amber-300 transition-all shadow-lg shadow-gray-900/15 disabled:opacity-60 cursor-pointer"
              >
                {isUpdatingPassword ? (
                  <>
                    <BeUILoaderMetaballs size={26} className="text-current" />
                    <span>Actualizando contraseña...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Guardar Nueva Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </BeUICenterMorphModal>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121214] flex items-center justify-center">
          <BeUILoaderMetaballs size={36} className="text-[#8c9276]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
