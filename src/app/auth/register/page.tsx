"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore, isValidEmail, sanitizeText, validateStrongPassword } from "@/lib/userStore";
import { useCartStore } from "@/lib/store";
import { ArrowRight, Mail, Lock, User, Sparkles, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { useBrand } from "@/core";
import { LuminaLoginWordmark } from "@/components/ui/LuminaLoginWordmark";
import { StrongPasswordMeter } from "@/components/ui/StrongPasswordMeter";
import { supabase } from "@/lib/supabase";

function GoogleVectorIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const brand = useBrand();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const register = useUserStore((state) => state.register);

  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isLoading) return;
    setIsGoogleLoading(true);
    setErrorMsg("");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback`;

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
    } catch {
      setErrorMsg("No se pudo iniciar la conexión con Google.");
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanName = sanitizeText(name, 70);
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg("Por favor, ingresa tu nombre y apellido (mínimo 2 letras, sin símbolos especiales).");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMsg("Por favor, ingresa un formato de correo electrónico válido.");
      return;
    }

    const pwdValidation = validateStrongPassword(password);
    if (!pwdValidation.isValid) {
      setErrorMsg(
        pwdValidation.error ||
          "Debes utilizar una contraseña fuerte (mín. 8 caracteres, mayúscula, minúscula, número y símbolo)."
      );
      return;
    }

    setIsLoading(true);
    const { error } = await register(cleanEmail, password, cleanName);
    setIsLoading(false);
    if (error) {
      setErrorMsg(error);
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
    <div className="min-h-screen pt-16 pb-20 flex flex-col items-center justify-center bg-transparent relative overflow-hidden px-4">
      
      {/* Grand Brand Header */}
      <div className="text-center mb-8 relative z-10 max-w-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-gray-800">
            {brand.name} • Registro Exclusivo
          </span>
        </div>

        <div className="flex justify-center select-none cursor-default my-1">
          <LuminaLoginWordmark />
        </div>
        <p className="mt-3 text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
          Crea tu cuenta para disfrutar de atención personalizada, lista de deseos y seguimiento de tus piezas exclusivas.
        </p>
      </div>

      {/* Main Luxury Glass Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/50 backdrop-blur-2xl border border-white/80 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <div className="mb-8">
            <h2 className="text-2xl font-display italic font-bold text-gray-900 mb-1.5">Crear Cuenta</h2>
            <p className="text-xs text-gray-500">Completa tus datos para formar parte del universo {brand.shortName}.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-red-50/90 backdrop-blur-sm text-red-600 text-xs rounded-2xl border border-red-100 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  id="name"
                  name="name"
                  type="text" 
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="Tu nombre y apellido"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-11 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Contraseña Segura</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="Mín. 8 caracteres, mayúscula, número y símbolo"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <StrongPasswordMeter password={password} />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 h-14 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15 group disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <span>Crear Cuenta en {brand.shortName}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">o continúa con</span>
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50/90 dark:bg-[#1f1f23] dark:hover:bg-[#27272b] text-gray-800 dark:text-gray-100 border border-gray-300/80 dark:border-white/15 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer text-xs sm:text-sm group disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-300" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Conectando con Google...</span>
                </div>
              ) : (
                <>
                  <GoogleVectorIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="font-semibold">Continuar con Google</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200/60 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="font-semibold text-gray-900 hover:text-[#8c9276] hover:underline underline-offset-2 transition-colors">
              Inicia sesión aquí
            </Link>
          </div>
        </div>

        {/* Reassurance Seal */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-[#8c9276]" />
          <span>Privacidad Protegida • {brand.name}</span>
        </div>
      </div>
    </div>
  );
}
