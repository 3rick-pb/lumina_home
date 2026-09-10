"use client";

import React, { useState } from "react";
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Sliders, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck, 
  MapPin, 
  Layers,
  Info,
  Check
} from "lucide-react";
import { 
  useAdminAlertStore, 
  AlertPosition, 
  AlertTheme, 
  AlertToastType, 
  THEME_FILL_MAP, 
  playAcousticChime 
} from "@/lib/adminAlertStore";

export function CartAlertsTab() {
  const { config, updateConfig, resetConfig, fireToast } = useAdminAlertStore();
  const [testSent, setTestSent] = useState(false);

  const sampleCustomers = [
    {
      name: "Valentina M.",
      location: "Guayaquil, Ecuador",
      email: "valentina.m@example.com",
      product: {
        id: "prod-sample-1",
        title: "Silla Nórdica Minimalista Nogal",
        price: 145.0,
        imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=300&auto=format&fit=crop",
        quantity: 1,
      },
    },
    {
      name: "Carlos E.",
      location: "Quito, Pichincha",
      email: "carlos.e@example.com",
      product: {
        id: "prod-sample-2",
        title: "Difusor Ultrasónico Piedra Volcánica",
        price: 68.5,
        imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=300&auto=format&fit=crop",
        quantity: 2,
      },
    },
    {
      name: "Elena R.",
      location: "Cuenca, Azuay",
      email: "elena.r@example.com",
      product: {
        id: "prod-sample-3",
        title: "Lámpara de Mesa Eclipse Minimal",
        price: 110.0,
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=300&auto=format&fit=crop",
        quantity: 1,
      },
    },
  ];

  const handleFireLiveTest = (sampleIndex = 0) => {
    const sample = sampleCustomers[sampleIndex];
    fireToast({
      userId: `user-preview-${Date.now()}`,
      userName: sample.name,
      userEmail: sample.email,
      location: sample.location,
      product: sample.product,
      timestamp: Date.now(),
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  };

  const positions: { id: AlertPosition; label: string; desc: string; iconPos: string }[] = [
    { id: "bottom-right", label: "Inferior Derecho", desc: "Recomendado para monitoreo sin obstrucción", iconPos: "bottom-2 right-2" },
    { id: "bottom-left", label: "Inferior Izquierdo", desc: "Alineado con el dock lateral izquierdo", iconPos: "bottom-2 left-2" },
    { id: "top-right", label: "Superior Derecho", desc: "Área de máxima visibilidad instantánea", iconPos: "top-2 right-2" },
    { id: "top-left", label: "Superior Izquierdo", desc: "Lateral superior sobre cabecera", iconPos: "top-2 left-2" },
  ];

  const themes: { id: AlertTheme; title: string; subtitle: string; bgClass: string; borderClass: string; textAccent: string }[] = [
    {
      id: "obsidian",
      title: "Obsidian Liquid",
      subtitle: "Glass negro profundo con bisel de plata",
      bgClass: "bg-[#101014]",
      borderClass: "border-white/20",
      textAccent: "text-white",
    },
    {
      id: "lumina",
      title: "Lumina Studio",
      subtitle: "Oliva nórdico y estética atelier",
      bgClass: "bg-[#1b1e17]",
      borderClass: "border-[#8c9276]/40",
      textAccent: "text-[#ccff00]",
    },
    {
      id: "emerald",
      title: "Emerald Neon",
      subtitle: "Verde esmeralda y lima vibrante",
      bgClass: "bg-[#081c14]",
      borderClass: "border-emerald-500/40",
      textAccent: "text-emerald-400",
    },
    {
      id: "sapphire",
      title: "Royal Sapphire",
      subtitle: "Azul medianoche y destello zafiro",
      bgClass: "bg-[#0c1427]",
      borderClass: "border-sky-500/40",
      textAccent: "text-sky-400",
    },
  ];

  const durations = [
    { ms: 4500, label: "4.5s (Rápido)" },
    { ms: 6500, label: "6.5s (Óptimo)" },
    { ms: 8500, label: "8.5s (Extendido)" },
    { ms: 12000, label: "12s (Persistente)" },
  ];

  const currentTheme = THEME_FILL_MAP[config.theme] || THEME_FILL_MAP.obsidian;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-7 sm:p-9 border border-white/80 dark:border-white/10 bg-gradient-to-br from-white/90 via-blue-50/40 to-indigo-50/20 dark:from-[#202023] dark:via-[#1c1c1f] dark:to-[#17171a] shadow-[0_12px_40px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold tracking-wider uppercase mb-3 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Exclusivo para Administradores de Lumina</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-950 dark:text-white tracking-tight">
              Alertas de Carrito en Tiempo Real
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
              Recibe notificaciones en vivo motorizadas por <strong className="text-gray-900 dark:text-gray-200">Sileo</strong> cada vez que un cliente registrado añade un producto a su bolsa de compras. Personaliza la ubicación en pantalla, paleta sensorial, duración y tono acústico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleFireLiveTest(0)}
              className="relative overflow-hidden group/btn px-5 py-3 rounded-2xl font-bold text-white text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 border border-white/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Probar Alerta en Pantalla</span>
            </button>
            <button
              onClick={resetConfig}
              className="px-3.5 py-3 rounded-2xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/70 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-xs hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restablecer configuración predeterminada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Playground & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Position on Screen */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Ubicación de Notificación en Pantalla
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Selecciona la esquina en la que emergerá la tarjeta de notificación.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                {config.position}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {positions.map((pos) => {
                const isSelected = config.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => updateConfig({ position: pos.id })}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[100px] ${
                      isSelected
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-600/20 dark:ring-blue-500/30"
                        : "border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Simulated Mini Screen */}
                    <div className="w-full h-8 rounded-lg bg-white dark:bg-[#18181a] border border-gray-200 dark:border-white/10 relative mb-3 overflow-hidden shadow-2xs">
                      <div
                        className={`absolute w-2.5 h-2.5 rounded-full transition-all ${
                          isSelected ? "bg-blue-600 dark:bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" : "bg-gray-300 dark:bg-white/20"
                        } ${pos.iconPos}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                          {pos.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {pos.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Themes & Visual Finishes */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div>
              <h3 className="font-display font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Estética & Paleta de Cristal
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Elige el acabado estético de la tarjeta emergente según tu estilo de trabajo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {themes.map((th) => {
                const isSelected = config.theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => updateConfig({ theme: th.id })}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-600/20"
                        : "border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Visual Color Orb */}
                    <div className={`w-10 h-10 rounded-xl ${th.bgClass} border ${th.borderClass} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className={`text-xs font-black ${th.textAccent}`}>L</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {th.title}
                        </h4>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {th.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Toast Type & Title */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Tipo de Alerta y Encabezado
            </h3>

            {/* Toast Type Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Modo de Notificación Sileo
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "action" as AlertToastType, label: "Acción Directa", desc: "Incluye botón interactivo" },
                  { id: "success" as AlertToastType, label: "Éxito Suave", desc: "Checkmark minimalista" },
                  { id: "info" as AlertToastType, label: "Informativo", desc: "Diseño limpio" },
                ].map((type) => {
                  const isSelected = config.toastType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => updateConfig({ toastType: type.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                          : "border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs block">{type.label}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{type.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Título del Toast
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                placeholder="¡Nuevo artículo en carrito!"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#18181a] text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Permanencia en Pantalla
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {durations.map((dur) => {
                  const isSelected = config.duration === dur.ms;
                  return (
                    <button
                      key={dur.ms}
                      onClick={() => updateConfig({ duration: dur.ms })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                          : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {dur.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.soundEnabled ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                  {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    Tono Acústico de Cristal Sintetizado
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Chime armónico suave generado con Web Audio API (cero retraso ni descargas).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={playAcousticChime}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Probar Chime
                </button>
                <button
                  onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.soundEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.soundEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview & Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sileo Toast Live Simulation Card */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Simulador Sileo en Tiempo Real
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                100% Reactivo
              </span>
            </div>

            {/* The Visual Replica of the Sileo Toast */}
            <div className="p-6 rounded-2xl bg-gray-950/5 dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center min-h-[220px]">
              <div 
                className="relative overflow-hidden w-full max-w-sm rounded-[18px] p-4 text-white shadow-[0_20px_45px_rgba(0,0,0,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.2)] border transition-all duration-300"
                style={{ backgroundColor: currentTheme.fill, borderColor: "rgba(255,255,255,0.15)" }}
              >
                {/* Specular top glare */}
                <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-xs tracking-tight text-white">
                        {config.title || "¡Nuevo artículo en carrito!"}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-white/60 font-medium">
                        <MapPin className="w-2.5 h-2.5 text-blue-400" />
                        <span>Valentina M. • Guayaquil, Ecuador</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider ${currentTheme.badge}`}>
                    {config.toastType}
                  </span>
                </div>

                {/* Item description */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-white/80 font-medium leading-tight truncate">
                    Sumó <strong className="text-white">&quot;Silla Nórdica Minimal&quot;</strong> ($145.00)
                  </p>
                  
                  {config.toastType === "action" && (
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg ${currentTheme.buttonBg} transition-all`}>
                      Ver Radar
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[10px] text-gray-400 mt-3 font-mono">
                Posición activa: {config.position} • {config.duration / 1000}s
              </span>
            </div>

            {/* Test Launcher Panel */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Disparar Clientes de Muestra:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {sampleCustomers.map((sc, idx) => (
                  <button
                    key={sc.name}
                    onClick={() => handleFireLiveTest(idx)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181a] hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                      {sc.name}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {sc.location.split(",")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Filtering Guarantee */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                <strong className="font-bold">Filtro de Privacidad Activo:</strong>
                <p className="mt-0.5 text-[11px] text-blue-800/90 dark:text-blue-400">
                  Para mantener la señal limpia y evitar ruido visual, el sistema ignora visitas anónimas. Solo las adiciones al carrito realizadas por usuarios con cuenta registrada disparan eventos en tiempo real.
                </p>
              </div>
            </div>

            {testSent && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡Alerta Sileo disparada en tu pantalla!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
