"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore, isValidEmail, validateStrongPassword } from "@/lib/userStore";
import { useCartStore } from "@/lib/store";
import { useCatalogStore, CatalogProduct } from "@/lib/catalogStore";
import { ArrowRight, Mail, Lock, Sparkles, ShieldCheck, Search, X, Eye, EyeOff, Compass, KeyRound, CheckCircle2 } from "lucide-react";
import { normalizeSearchText } from "@/lib/utils";
import { useBrand } from "@/core";
import { BeUILoaderMetaballs, BeUICenterMorphModal } from "@/components/ui/BeUIControls";
import { LuminaLoginWordmark } from "@/components/ui/LuminaLoginWordmark";
import { StrongPasswordMeter } from "@/components/ui/StrongPasswordMeter";

export default function LoginPage() {
  const brand = useBrand();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
  const continueAsGuest = useUserStore((state) => state.continueAsGuest);

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

  const handleContinueAsGuest = () => {
    continueAsGuest();
    router.push("/");
  };

  // Search Bar State
  const { products, categories } = useCatalogStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);

  // Dynamic suggestions: active categories with existing products in store
  const dynamicSuggestions = useMemo(() => {
    const productCategories = Array.from(
      new Set(
        products
          .map((p) => p.category?.trim())
          .filter((cat): cat is string => Boolean(cat && cat.length > 0))
      )
    );

    const activeList = categories.length > 0
      ? categories.filter((c) => productCategories.some(pc => pc.toLowerCase() === c.toLowerCase()))
      : productCategories;

    const list = activeList.length > 0 ? activeList : productCategories;
    return list.slice(0, 6);
  }, [products, categories]);

  // Filtered live search results (accent/diacritic insensitive)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeSearchText(searchQuery);
    return products.filter(p => 
      normalizeSearchText(p.title).includes(q) || 
      normalizeSearchText(p.category).includes(q) ||
      (p.description && normalizeSearchText(p.description).includes(q))
    ).slice(0, 5);
  }, [products, searchQuery]);

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

      {/* Interactive Catalog Explorer Search Bar */}
      <div className="w-full max-w-md mb-6 relative z-30">
        <div className="relative flex items-center bg-white/70 backdrop-blur-2xl border border-white/90 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:ring-2 focus-within:ring-[#8c9276]/40 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Explorar piezas y colecciones ${brand.shortName}...`}
            className="w-full bg-transparent border-none outline-none text-xs text-gray-800 placeholder:text-gray-400 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="text-gray-400 hover:text-gray-600 ml-2 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        {!searchQuery && dynamicSuggestions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 px-1 overflow-x-auto hide-scrollbar text-[10px]">
            <span className="text-gray-400 font-medium shrink-0">Sugerencias:</span>
            {dynamicSuggestions.map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
                className="px-2.5 py-1 rounded-full bg-white/50 backdrop-blur-md border border-white/70 text-gray-600 hover:text-gray-900 hover:bg-white/80 transition-all shrink-0 font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Live Search Results Dropdown */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-3 space-y-2 z-40 max-h-80 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {searchResults.length} piezas encontradas
              </span>
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Cerrar
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No encontramos piezas para <span className="font-semibold text-gray-800">&quot;{searchQuery}&quot;</span>.
              </div>
            ) : (
              searchResults.map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => setPreviewProduct(prod)}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image src={prod.imageUrl} alt={prod.title} fill sizes="44px" className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#8c9276] uppercase tracking-wider block">
                        {prod.category}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{prod.title}</h4>
                      <p className="text-xs font-extrabold text-gray-900 mt-0.5">${prod.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="p-2 text-gray-400 group-hover:text-gray-900 group-hover:bg-white rounded-xl transition-all">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Luxury Glass Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/50 backdrop-blur-2xl border border-white/80 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <div className="mb-6">
            <h2 className="text-2xl font-display italic font-bold text-gray-900 mb-1.5">Iniciar Sesión</h2>
            <p className="text-xs text-gray-500">Introduce tus credenciales registradas para ingresar al sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50/90 backdrop-blur-sm text-red-600 text-xs rounded-2xl border border-red-100 text-center font-medium">
                {errorMsg}
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
                  type={showLoginPassword ? "text" : "password"} 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
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
                    ¿Olvidaste o deseas cambiar tu contraseña?
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2.5 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15 group disabled:opacity-95 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <BeUILoaderMetaballs size={32} className="text-white" />
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
              <div className="flex-grow border-t border-gray-200/80"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">o continúa navegando</span>
              <div className="flex-grow border-t border-gray-200/80"></div>
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

          <div className="mt-6 pt-5 border-t border-gray-200/60 text-center text-xs text-gray-600">
            ¿No tienes cuenta aún?{' '}
            <Link href="/auth/register" className="font-semibold text-gray-900 hover:text-[#8c9276] hover:underline underline-offset-2 transition-colors">
              Regístrate aquí
            </Link>
          </div>
        </div>

        {/* Reassurance Seal */}
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-[#8c9276]" />
          <span>Acceso Seguro • {brand.name}</span>
        </div>
      </div>

      {/* Product Quick Preview Modal */}
      {previewProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewProduct(null)}
        >
          <div 
            className="bg-white dark:bg-[#1c1c1f] text-gray-900 dark:text-gray-100 rounded-3xl w-full max-w-sm shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-white/80 dark:border-white/10 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button: Exact Luxury Circular Glass Design Matching Cart */}
            <button 
              type="button"
              onClick={() => setPreviewProduct(null)} 
              className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-white/95 dark:bg-[#2a2a2d]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Cerrar vista rápida"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
              <Image src={previewProduct.imageUrl} alt={previewProduct.title} fill sizes="(max-width: 640px) 100vw, 384px" className="object-cover" />
            </div>

            <span className="text-[10px] font-bold text-[#8c9276] uppercase tracking-wider">
              {previewProduct.category}
            </span>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">{previewProduct.title}</h3>
            <p className="text-sm font-extrabold text-gray-900 mt-1">${previewProduct.price.toFixed(2)}</p>

            <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
              {previewProduct.description || "Diseño minimalista fabricado con materiales nobles para elevar cualquier rincón de tu hogar."}
            </p>

            <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  continueAsGuest();
                  router.push(`/product/${previewProduct.id}`);
                }}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver pieza completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setPreviewProduct(null)}
                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Password Change Modal (BeUICenterMorphModal) */}
      <BeUICenterMorphModal
        open={showChangePasswordModal}
        onOpenChange={setShowChangePasswordModal}
        className="w-full max-w-md"
      >
        <div className="p-6 sm:p-8 relative">
          {/* Exact Cart Close Button */}
          <button
            type="button"
            onClick={() => setShowChangePasswordModal(false)}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/95 dark:bg-[#2a2a2d]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/90 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3 mb-4 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-[#8c9276]/15 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8c9276]">
                Seguridad de Cuenta
              </span>
              <h3 className="text-xl font-display italic font-bold text-gray-900 dark:text-white leading-tight">
                Cambiar Contraseña
              </h3>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Correo Electrónico de tu Cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={cpEmail}
                  onChange={(e) => setCpEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/90 dark:bg-[#141416] border border-gray-200/90 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Nueva Contraseña Segura
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCpPassword ? "text" : "password"}
                  value={cpNewPassword}
                  onChange={(e) => setCpNewPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres, mayúscula, número y símbolo"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-gray-50/90 dark:bg-[#141416] border border-gray-200/90 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCpPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Interactive Live Strong Password Meter */}
              <StrongPasswordMeter password={cpNewPassword} compact />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCpPassword ? "text" : "password"}
                  value={cpConfirmPassword}
                  onChange={(e) => setCpConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/90 dark:bg-[#141416] border border-gray-200/90 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all"
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
                className="flex-1 h-12 rounded-2xl bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-[#b8e600] transition-all shadow-lg shadow-gray-900/15 disabled:opacity-60 cursor-pointer"
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
