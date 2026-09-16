"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore, isValidEmail, sanitizeText } from "@/lib/userStore";
import { useCartStore } from "@/lib/store";
import { ArrowRight, Mail, Lock, User, Sparkles, ShieldCheck, Compass } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const register = useUserStore((state) => state.register);
  const continueAsGuest = useUserStore((state) => state.continueAsGuest);

  const handleContinueAsGuest = () => {
    continueAsGuest();
    router.push("/");
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

    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe tener un mínimo de 6 caracteres.");
      return;
    }

    if (password.length > 72) {
      setErrorMsg("La contraseña excede el límite seguro de 72 caracteres.");
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
            Lumina Home • Registro Exclusivo
          </span>
        </div>

        <div className="block select-none cursor-default">
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-gray-900">
            Lumina<span className="text-[#8c9276]">.</span>
          </h1>
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
            <p className="text-xs text-gray-500">Completa tus datos para formar parte del universo Lumina.</p>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Mínimo 6 caracteres.</p>
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
                  <span>Crear Cuenta en Lumina</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">o continúa navegando</span>
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full h-12 bg-white/80 hover:bg-white text-gray-800 border border-gray-200/80 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer text-xs sm:text-sm group"
            >
              <Compass className="w-4 h-4 text-[#8c9276] group-hover:rotate-45 transition-transform duration-300" />
              <span className="font-semibold">Continuar sin cuenta (Explorar tienda)</span>
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
          <span>Privacidad Protegida • Lumina Living Studio</span>
        </div>
      </div>
    </div>
  );
}
