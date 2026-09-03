"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/userStore";
import { useCatalogStore, CatalogProduct } from "@/lib/catalogStore";
import { ArrowRight, Mail, Lock, Sparkles, ShieldCheck, Search, X, Eye } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useUserStore((state) => state.login);

  // Search Bar State
  const { products } = useCatalogStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);

  // Filtered live search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [products, searchQuery]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    if (email && password) {
      const { error } = await login(email, password);
      setIsLoading(false);
      if (error) {
        setErrorMsg(error === "Invalid login credentials" ? "Credenciales incorrectas. Verifica tu correo y contraseña." : error);
      } else {
        router.push("/");
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 flex flex-col items-center justify-center bg-transparent relative overflow-hidden px-4">
      
      {/* Grand Brand Header */}
      <div className="text-center mb-6 relative z-10 max-w-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-gray-800">
            Lumina Home • Acceso Exclusivo
          </span>
        </div>

        <Link href="/" className="block group">
          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 group-hover:opacity-90 transition-opacity">
            Lumina<span className="text-[#8c9276]">.</span>
          </h1>
        </Link>
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
            placeholder="Explorar piezas y colecciones Lumina..."
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
        {!searchQuery && (
          <div className="flex items-center gap-1.5 mt-2.5 px-1 overflow-x-auto hide-scrollbar text-[10px]">
            <span className="text-gray-400 font-medium shrink-0">Sugerencias:</span>
            {["Iluminación", "Aromaterapia", "Home Office", "Textiles", "Cerámica"].map((chip) => (
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
                      <Image src={prod.imageUrl} alt={prod.title} fill className="object-cover group-hover:scale-105 transition-transform" />
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
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
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <Link href="#" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15 group disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Ingresando...</span>
              ) : (
                <>
                  <span>Acceder a Lumina</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
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
          <span>Acceso Seguro • Lumina Living Studio</span>
        </div>
      </div>

      {/* Product Quick Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative">
            <button 
              onClick={() => setPreviewProduct(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
              <Image src={previewProduct.imageUrl} alt={previewProduct.title} fill className="object-cover" />
            </div>

            <span className="text-[10px] font-bold text-[#8c9276] uppercase tracking-wider">
              {previewProduct.category}
            </span>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">{previewProduct.title}</h3>
            <p className="text-sm font-extrabold text-gray-900 mt-1">${previewProduct.price.toFixed(2)}</p>

            <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
              {previewProduct.description || "Diseño minimalista fabricado con materiales nobles para elevar cualquier rincón de tu hogar."}
            </p>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-700 mb-3 text-center">
                Inicia sesión en el formulario para adquirir esta pieza.
              </p>
              <button 
                onClick={() => setPreviewProduct(null)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
              >
                Entendido, ir al login
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
