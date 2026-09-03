"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/userStore";
import { ArrowRight, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const register = useUserStore((state) => state.register);

  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (email && name && password) {
      const { error } = await register(email, password, name);
      if (error) {
        setErrorMsg(error);
      } else {
        router.push("/profile");
      }
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 flex items-center justify-center bg-transparent relative overflow-hidden">
      
      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-display italic font-bold text-gray-900 mb-2">Crear Cuenta</h1>
            <p className="text-sm text-gray-600">Únete a Lumina y gestiona tus pedidos fácilmente.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 text-center">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-md border border-white/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all placeholder:text-gray-400"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-md border border-white/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all placeholder:text-gray-400"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-md border border-white/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full mt-4 h-14 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 group"
            >
              Completar Registro
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-semibold text-gray-900 hover:underline underline-offset-2">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
