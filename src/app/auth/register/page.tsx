"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore, isValidEmail, sanitizeText, validateStrongPassword } from "@/lib/userStore";
import { useCartStore } from "@/lib/store";
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { useBrand } from "@/core";
import { LuminaLoginWordmark } from "@/components/ui/LuminaLoginWordmark";
import { StrongPasswordMeter } from "@/components/ui/StrongPasswordMeter";
import { supabase } from "@/lib/supabase";
import { Google } from "@thesvg/react";
import { WheelPicker, type WheelPickerOption } from "@/components/motion/wheel-picker";

const MONTH_OPTIONS: WheelPickerOption[] = [
  { label: "Ene", value: "1" },
  { label: "Feb", value: "2" },
  { label: "Mar", value: "3" },
  { label: "Abr", value: "4" },
  { label: "May", value: "5" },
  { label: "Jun", value: "6" },
  { label: "Jul", value: "7" },
  { label: "Ago", value: "8" },
  { label: "Sep", value: "9" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dic", value: "12" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: WheelPickerOption[] = Array.from(
  { length: CURRENT_YEAR - 1920 + 1 },
  (_, i) => {
    const y = String(CURRENT_YEAR - i);
    return { label: y, value: y };
  }
);

function calculateAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default function RegisterPage() {
  const brand = useBrand();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Apple Alarm App style 3-column Date Picker states (Default: 15 / 01 / 2000 => 26 years old)
  const [birthDay, setBirthDay] = useState("15");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState("2000");

  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const register = useUserStore((state) => state.register);

  // Compute days in month dynamically according to selected month & year (leap year aware)
  const daysInMonth = useMemo(() => {
    const y = parseInt(birthYear, 10) || 2000;
    const m = parseInt(birthMonth, 10) || 1;
    return new Date(y, m, 0).getDate();
  }, [birthMonth, birthYear]);

  const dayOptions: WheelPickerOption[] = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1);
      return { label: d.padStart(2, "0"), value: d };
    });
  }, [daysInMonth]);

  // Clamp selected day if month changes and current day exceeds total days in month
  useEffect(() => {
    const d = parseInt(birthDay, 10);
    if (d > daysInMonth) {
      setBirthDay(String(daysInMonth));
    }
  }, [daysInMonth, birthDay]);

  const formattedDateStr = useMemo(() => {
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!d || !m || !y) return "";
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [birthDay, birthMonth, birthYear]);

  const calculatedAge = useMemo(() => {
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!d || !m || !y) return null;
    return calculateAge(d, m, y);
  }, [birthDay, birthMonth, birthYear]);

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

    // Verify birth date & legal age +18
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!d || !m || !y) {
      setErrorMsg("Por favor, selecciona una fecha de nacimiento válida.");
      return;
    }

    const ageVal = calculateAge(d, m, y);
    if (ageVal < 18) {
      setErrorMsg(`El registro está reservado exclusivamente para mayores de 18 años (tienes ${ageVal} años).`);
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

    if (!confirmPassword) {
      setErrorMsg("Por favor, repite tu contraseña para confirmarla.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor, asegúrate de que ambas sean idénticas.");
      return;
    }

    const formattedBirthDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    setIsLoading(true);
    const { error } = await register(cleanEmail, password, cleanName, formattedBirthDate);
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
            {brand.name} • Registro Gratis
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
          <div className="mb-7">
            <h2 className="text-2xl font-display italic font-bold text-gray-900 mb-1.5">Regístrate gratis</h2>
            <p className="text-xs text-gray-500">Completa tus datos para formar parte del universo {brand.shortName}.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50/90 backdrop-blur-sm text-red-600 text-xs rounded-2xl border border-red-100 text-center font-medium">
                {errorMsg}
              </div>
            )}

            {/* Nombre Completo */}
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
                  className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="Ej. Sofía Mendoza"
                  required
                />
              </div>
            </div>

            {/* Correo Electrónico */}
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
                  placeholder="Ej. sofia.mendoza@correo.com"
                  required
                />
              </div>
            </div>

            {/* Fecha de Nacimiento — Apple Alarm App 3-Column Drum Slider (Día - Mes - Año) */}
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 p-3 sm:p-3.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8c9276]" />
                  <span>Fecha de Nacimiento</span>
                </label>
                {calculatedAge !== null && (
                  calculatedAge >= 18 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {calculatedAge} años • +18 verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
                      <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      {calculatedAge} años • Mínimo +18
                    </span>
                  )
                )}
              </div>

              {/* Apple iOS Alarm 3-Column Drum Picker */}
              <div className="relative rounded-2xl bg-white/80 dark:bg-[#18181b]/90 border border-black/[0.06] dark:border-white/10 p-2 shadow-xs overflow-hidden">
                {/* Apple iOS unified selection lens bar */}
                <div className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[36px] rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/10 z-0" />

                <div className="grid grid-cols-3 gap-1.5 relative z-10">
                  {/* COLUMNA 1: DÍA */}
                  <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 select-none">
                      Día
                    </span>
                    <WheelPicker
                      options={dayOptions}
                      value={birthDay}
                      onValueChange={setBirthDay}
                      sound={true}
                      visibleCount={3}
                      itemHeight={36}
                      className="bg-transparent border-0 shadow-none"
                    />
                  </div>

                  {/* COLUMNA 2: MES */}
                  <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 select-none">
                      Mes
                    </span>
                    <WheelPicker
                      options={MONTH_OPTIONS}
                      value={birthMonth}
                      onValueChange={setBirthMonth}
                      sound={true}
                      visibleCount={3}
                      itemHeight={36}
                      className="bg-transparent border-0 shadow-none"
                    />
                  </div>

                  {/* COLUMNA 3: AÑO */}
                  <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 select-none">
                      Año
                    </span>
                    <WheelPicker
                      options={YEAR_OPTIONS}
                      value={birthYear}
                      onValueChange={setBirthYear}
                      sound={true}
                      visibleCount={3}
                      itemHeight={36}
                      className="bg-transparent border-0 shadow-none"
                    />
                  </div>
                </div>
              </div>

              {/* Selected date preview helper */}
              <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="capitalize">{formattedDateStr}</span>
                <span className="text-[10px] text-gray-400">Desliza para cambiar</span>
              </div>
            </div>
            
            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Contraseña</label>
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
                  className="w-full pl-11 pr-11 py-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276]/40 focus:border-[#8c9276] transition-all placeholder:text-gray-400 shadow-sm"
                  placeholder="Ej. Lumina#2026"
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

            {/* Repetir Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Repetir Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"} 
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-11 pr-11 py-3 bg-white/70 backdrop-blur-md border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 shadow-sm ${
                    confirmPassword && password !== confirmPassword
                      ? "border-rose-300 focus:ring-rose-400/40 focus:border-rose-500"
                      : confirmPassword && password === confirmPassword
                      ? "border-emerald-300 focus:ring-emerald-400/40 focus:border-emerald-500"
                      : "border-white/90 focus:ring-[#8c9276]/40 focus:border-[#8c9276]"
                  }`}
                  placeholder="Ej. Lumina#2026"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="mt-1.5 ml-1">
                  {password === confirmPassword ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Las contraseñas no coinciden
                    </span>
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 h-13 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15 group disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <span>Regístrate gratis en {brand.shortName}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">o continúa con</span>
              <div className="flex-grow border-t border-gray-200/80 dark:border-white/10"></div>
            </div>

            {/* Google OAuth Register Button with Vector Logo (Official Pill UX/UI) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-11 sm:h-12 bg-white dark:bg-[#131314] hover:bg-[#f8fafd] dark:hover:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#f1f1f1] border border-[#747775]/75 hover:border-[#1f1f1f] dark:border-[#8e918f]/50 dark:hover:border-white/50 rounded-full font-medium flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer text-sm group disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1f1f1f] dark:text-gray-200" />
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

          <div className="mt-7 pt-5 border-t border-gray-200/60 text-center text-sm text-gray-600">
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
