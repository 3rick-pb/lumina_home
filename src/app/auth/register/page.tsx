"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { ThinkingOrb } from "thinking-orbs";
import { WheelPicker, type WheelPickerOption } from "@/components/motion/wheel-picker";

// Charset idéntico a CardFolder.tsx para el efecto de revelación progresiva
const SCRAMBLE_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$?#%&";

// Nombres completos de meses en español con mayúscula inicial
const FULL_MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Opciones estáticas para garantizar máxima estabilidad y cero re-renderizados bruscos en el WheelPicker
const DAY_OPTIONS: WheelPickerOption[] = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1);
  return { label: d.padStart(2, "0"), value: d };
});

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

  // Estados de animación para el efecto scramble/revelación de tarjetas en la contraseña
  const [scrambledPassword, setScrambledPassword] = useState<string | null>(null);
  const [scrambledConfirm, setScrambledConfirm] = useState<string | null>(null);
  const pwdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cpwdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selector de fecha estilo Apple Alarm (Default: 15 / Ene / 2000 => 26 años)
  const [birthDay, setBirthDay] = useState("15");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState("2000");

  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const register = useUserStore((state) => state.register);

  /**
   * Efecto de revelación progresiva idéntico al de las tarjetas bancarias (CardFolder):
   * Anima los caracteres de izquierda a derecha a través de glifos y símbolos ($ ? # % &)
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

  const handleTogglePassword = () => {
    const next = !showPassword;
    setShowPassword(next);
    runScrambleReveal(password, next, setScrambledPassword, pwdTimerRef);
  };

  const handleToggleConfirmPassword = () => {
    const next = !showConfirmPassword;
    setShowConfirmPassword(next);
    runScrambleReveal(confirmPassword, next, setScrambledConfirm, cpwdTimerRef);
  };

  const dateContainerRef = useRef<HTMLDivElement | null>(null);

  // Aislamiento total del scroll para que la interacción con la fecha no haga scroll en la página
  useEffect(() => {
    const el = dateContainerRef.current;
    if (!el) return;
    const blockWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    el.addEventListener("wheel", blockWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", blockWheel);
    };
  }, []);

  const formattedDateStr = useMemo(() => {
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!d || !m || !y || m < 1 || m > 12) return "";
    const monthName = FULL_MONTHS_ES[m - 1];
    return `${monthName} ${d} del ${y}`;
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

    // Validación de fecha de nacimiento y edad mínima +18
    const rawD = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    if (!rawD || !m || !y) {
      setErrorMsg("Por favor, selecciona tu fecha de nacimiento.");
      return;
    }

    const maxDays = new Date(y, m, 0).getDate();
    const d = Math.min(rawD, maxDays);

    const ageVal = calculateAge(d, m, y);
    if (ageVal < 18) {
      setErrorMsg("Edad mínima requerida +18 años.");
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
      
      {/* Brand Header */}
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
          <div className="mb-6">
            <h2 className="text-2xl font-display italic font-bold text-gray-900 mb-1.5">Crear Cuenta</h2>
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
                  placeholder="Sofía Mendoza"
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
                  placeholder="sofia.mendoza@correo.com"
                  required
                />
              </div>
            </div>

            {/* Fecha de Nacimiento — Apple Alarm App 3-Column Drum Slider (Día - Mes - Año) */}
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-[#8c9276]" />
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Fecha de Nacimiento
                </label>
              </div>

              {/* Encabezados de Columna (Día - Mes - Año) colocados arriba y fuera del tambor para centrado perfecto */}
              <div className="grid grid-cols-3 gap-2 px-3 pb-1 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
                  Día
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
                  Mes
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none">
                  Año
                </span>
              </div>

              {/* Apple iOS Alarm 3-Column Drum Picker - Mayor espacio vertical y aislamiento total de scroll */}
              <div 
                ref={dateContainerRef}
                data-lenis-prevent
                className="relative rounded-2xl bg-white/85 dark:bg-[#18181b]/95 border border-black/[0.06] dark:border-white/10 p-2 shadow-inner overflow-hidden select-none"
                style={{ overscrollBehavior: "contain" }}
              >
                {/* Apple iOS unified selection lens bar - Centrado exacto con la fila activa */}
                <div 
                  className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/10 z-10"
                  style={{ height: 40 }}
                />

                {/* Máscaras de gradiente superior e inferior para realzar el desenfoque óptico */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/95 dark:from-[#18181b]/95 to-transparent z-20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/95 dark:from-[#18181b]/95 to-transparent z-20" />

                <div className="grid grid-cols-3 gap-1 relative z-0">
                  {/* COLUMNA 1: DÍA */}
                  <div className="text-center">
                    <WheelPicker
                      options={DAY_OPTIONS}
                      value={birthDay}
                      onValueChange={setBirthDay}
                      sound={false}
                      visibleCount={5}
                      itemHeight={40}
                      hideLens={true}
                      blurOuter={true}
                      className="bg-transparent border-0 shadow-none text-center"
                      aria-label="Seleccionar día de nacimiento"
                    />
                  </div>

                  {/* COLUMNA 2: MES */}
                  <div className="text-center">
                    <WheelPicker
                      options={MONTH_OPTIONS}
                      value={birthMonth}
                      onValueChange={setBirthMonth}
                      sound={false}
                      visibleCount={5}
                      itemHeight={40}
                      hideLens={true}
                      blurOuter={true}
                      className="bg-transparent border-0 shadow-none text-center"
                      aria-label="Seleccionar mes de nacimiento"
                    />
                  </div>

                  {/* COLUMNA 3: AÑO */}
                  <div className="text-center">
                    <WheelPicker
                      options={YEAR_OPTIONS}
                      value={birthYear}
                      onValueChange={setBirthYear}
                      sound={false}
                      visibleCount={5}
                      itemHeight={40}
                      hideLens={true}
                      blurOuter={true}
                      className="bg-transparent border-0 shadow-none text-center"
                      aria-label="Seleccionar año de nacimiento"
                    />
                  </div>
                </div>
              </div>

              {/* Selected date preview helper - Formato exacto: "Julio 31 del 2007" */}
              <div className="mt-2.5 text-center text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wide">
                {formattedDateStr}
              </div>
            </div>
            
            {/* Contraseña con Scramble Reveal de Tarjetas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="password"
                  name="password"
                  type={showPassword || scrambledPassword !== null ? "text" : "password"} 
                  autoComplete="new-password"
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
                  placeholder="Lumina#2026"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <StrongPasswordMeter password={password} />
            </div>

            {/* Repetir Contraseña con Scramble Reveal de Tarjetas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Repetir Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword || scrambledConfirm !== null ? "text" : "password"} 
                  autoComplete="new-password"
                  value={scrambledConfirm !== null ? scrambledConfirm : confirmPassword}
                  onChange={(e) => {
                    if (scrambledConfirm !== null) {
                      if (cpwdTimerRef.current) clearInterval(cpwdTimerRef.current);
                      setScrambledConfirm(null);
                    }
                    setConfirmPassword(e.target.value);
                  }}
                  readOnly={scrambledConfirm !== null}
                  className={`w-full pl-11 pr-11 py-3 bg-white/70 backdrop-blur-md border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 shadow-sm font-mono tracking-wide ${
                    confirmPassword && password !== confirmPassword
                      ? "border-rose-300 focus:ring-rose-400/40 focus:border-rose-500"
                      : confirmPassword && password === confirmPassword
                      ? "border-emerald-300 focus:ring-emerald-400/40 focus:border-emerald-500"
                      : "border-white/90 focus:ring-[#8c9276]/40 focus:border-[#8c9276]"
                  }`}
                  placeholder="Lumina#2026"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={handleToggleConfirmPassword}
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

            {/* Botón de Finalización con Proporciones Estudiadas */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium text-sm flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg shadow-gray-900/15 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <ThinkingOrb state="working" size={20} color="#ffffff" />
                  <span>Creando cuenta...</span>
                </div>
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

            {/* Google OAuth Register Button with Vector Logo (Official Pill UX/UI) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-11 sm:h-12 bg-white dark:bg-[#131314] hover:bg-[#f8fafd] dark:hover:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#f1f1f1] border border-[#747775]/75 hover:border-[#1f1f1f] dark:border-[#8e918f]/50 dark:hover:border-white/50 rounded-full font-medium flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm cursor-pointer text-sm group disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <ThinkingOrb state="working" size={20} />
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
