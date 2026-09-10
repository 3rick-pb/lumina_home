"use client";

import React, { useState } from "react";
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  Info,
  Check,
  Palette,
  AlertTriangle,
  Zap,
  Eye
} from "lucide-react";
import { 
  useAdminAlertStore, 
  AlertPosition, 
  COLOR_PRESETS,
  LAYOUT_OPTIONS,
  auditContrast,
  formatAlertContent,
  playAcousticChime,
  CartItemAddedPayload 
} from "@/lib/adminAlertStore";

export function CartAlertsTab() {
  const { 
    config, 
    updateConfig, 
    applyPreset, 
    applyRecommendedContrast, 
    resetConfig, 
    fireToast 
  } = useAdminAlertStore();
  
  const [testSent, setTestSent] = useState(false);

  const sampleCustomers: CartItemAddedPayload[] = [
    {
      userId: "user-sample-1",
      userName: "Valentina M.",
      userEmail: "valentina.m@example.com",
      location: "Guayaquil, Ecuador",
      product: {
        id: "prod-sample-1",
        title: "Silla Nórdica Minimalista Nogal",
        price: 145.0,
        imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=300&auto=format&fit=crop",
        quantity: 1,
      },
      timestamp: Date.now(),
    },
    {
      userId: "user-sample-2",
      userName: "Carlos E.",
      userEmail: "carlos.e@example.com",
      location: "Quito, Pichincha",
      product: {
        id: "prod-sample-2",
        title: "Difusor Ultrasónico Piedra Volcánica",
        price: 68.5,
        imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=300&auto=format&fit=crop",
        quantity: 2,
      },
      timestamp: Date.now(),
    },
    {
      userId: "user-sample-3",
      userName: "Elena R.",
      userEmail: "elena.r@example.com",
      location: "Cuenca, Azuay",
      product: {
        id: "prod-sample-3",
        title: "Lámpara de Mesa Eclipse Minimal",
        price: 110.0,
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=300&auto=format&fit=crop",
        quantity: 1,
      },
      timestamp: Date.now(),
    },
  ];

  const handleFireLiveTest = (sampleIndex = 0) => {
    fireToast(sampleCustomers[sampleIndex]);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  };

  const positions: { id: AlertPosition; label: string; desc: string; iconPos: string }[] = [
    { id: "bottom-right", label: "Inferior Derecho", desc: "Recomendado para monitoreo natural", iconPos: "bottom-2 right-2" },
    { id: "bottom-left", label: "Inferior Izquierdo", desc: "Alineado con el dock vertical izquierdo", iconPos: "bottom-2 left-2" },
    { id: "top-right", label: "Superior Derecho", desc: "Área de máxima visibilidad e impacto", iconPos: "top-2 right-2" },
    { id: "top-left", label: "Superior Izquierdo", desc: "Lateral superior sobre la cabecera", iconPos: "top-2 left-2" },
  ];

  const durations = [
    { ms: 4500, label: "4.5s (Rápido)" },
    { ms: 6500, label: "6.5s (Óptimo)" },
    { ms: 8500, label: "8.5s (Extendido)" },
    { ms: 12000, label: "12s (Persistente)" },
  ];

  const currentAudit = auditContrast(config.bgColor, config.textColor);
  const currentPreviewContent = formatAlertContent(config.layout, sampleCustomers[0], config.title);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-7 sm:p-9 border border-white/80 dark:border-white/10 bg-gradient-to-br from-white/95 via-blue-50/30 to-indigo-50/20 dark:from-[#202023] dark:via-[#1c1c1f] dark:to-[#17171a] shadow-[0_12px_40px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
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
              Personalización de Alertas Sileo
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
              Configura el diseño de la tarjeta, paleta de color con verificación de contraste accesible, emojis estilo iPhone (📦, 📍, 🛒) y posición en pantalla para monitorear en vivo cuando un cliente registrado suma productos a su bolsa.
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
              title="Restablecer a Blanco iPhone por defecto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer a Blanco</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Controls (7 cols) + Live Simulator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: Multiple Layout Options */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  1. Opciones de Diseño de la Notificación
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Selecciona la estructura y nivel de detalle visual con el que se presentará la notificación.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                {config.layout}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {LAYOUT_OPTIONS.map((lo) => {
                const isSelected = config.layout === lo.id;
                return (
                  <button
                    key={lo.id}
                    onClick={() => updateConfig({ layout: lo.id })}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                      isSelected
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200">
                          {lo.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <h4 className={`text-xs font-bold mt-1.5 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-950 dark:text-gray-100"}`}>
                        {lo.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {lo.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Color Palette & Custom Color Pickers */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  2. Paleta de Color & Contraste
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Personaliza los tonos del fondo, textos y botones. Por defecto: Blanco Puro con letras negras.
                </p>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2.5">
                Paletas Rápidas Prediseñadas:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = config.bgColor.toLowerCase() === preset.bgColor.toLowerCase() &&
                                     config.textColor.toLowerCase() === preset.textColor.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/20"
                          : "border-gray-200/80 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {/* Swatch */}
                      <div 
                        className="w-7 h-7 rounded-lg border shadow-2xs flex items-center justify-center shrink-0 font-black text-[10px]"
                        style={{ backgroundColor: preset.bgColor, borderColor: preset.isLight ? '#e5e7eb' : 'rgba(255,255,255,0.2)', color: preset.textColor }}
                      >
                        Aa
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 block truncate">
                          {preset.name}
                        </span>
                        <span className="text-[9px] text-gray-400 block truncate">
                          {preset.bgColor}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Color Pickers */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Ajuste Milimétrico de Colores (Personalizado):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Background Color */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Fondo
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => updateConfig({ bgColor: e.target.value, presetId: 'custom' })}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.bgColor}
                      onChange={(e) => updateConfig({ bgColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-bold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Título / Letras
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value, presetId: 'custom' })}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-bold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Subtext Color */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Detalles
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.subtextColor}
                      onChange={(e) => updateConfig({ subtextColor: e.target.value, presetId: 'custom' })}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.subtextColor}
                      onChange={(e) => updateConfig({ subtextColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-bold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Accent Button Color */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Botón Acento
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => updateConfig({ accentColor: e.target.value, presetId: 'custom' })}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => updateConfig({ accentColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-bold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contrast Audit & Smart Recommendation Banner */}
            <div className="pt-2">
              {!currentAudit.isAccessible ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                          ⚠️ Poco Contraste Detectado ({currentAudit.ratio}:1)
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                          No Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                        {currentAudit.recommendation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={applyRecommendedContrast}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Aplicar Recomendación</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-300/70 dark:border-emerald-800/60 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Excelente Visibilidad y Legibilidad ({currentAudit.ratio}:1 • Calificación WCAG {currentAudit.score})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    Óptimo
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Screen Position & Title */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              3. Ubicación & Permanencia en Pantalla
            </h3>

            {/* Position Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {positions.map((pos) => {
                const isSelected = config.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => updateConfig({ position: pos.id })}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                      isSelected
                        ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-600/20"
                        : "border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Simulated Screen */}
                    <div className="w-full h-7 rounded-lg bg-white dark:bg-[#18181a] border border-gray-200 dark:border-white/10 relative mb-2.5 overflow-hidden shadow-2xs">
                      <div
                        className={`absolute w-2.5 h-2.5 rounded-full transition-all ${
                          isSelected ? "bg-blue-600 dark:bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" : "bg-gray-300 dark:bg-white/20"
                        } ${pos.iconPos}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                        {pos.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Title Input */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Encabezado de Alerta (Emojis tipo iPhone integrados):
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                placeholder="🛒 ¡Nuevo artículo en carrito!"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#18181a] text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-gray-400">Sugerencias:</span>
                {['🛒 ¡Nuevo artículo en carrito!', '🛍️ Adición de Autor', '📦 Pieza Seleccionada'].map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => updateConfig({ title: sug })}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration & Sound */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Permanencia en Pantalla:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {durations.map((dur) => (
                    <button
                      key={dur.ms}
                      onClick={() => updateConfig({ duration: dur.ms })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        config.duration === dur.ms
                          ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                          : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Tono Acústico de Cristal:
                </label>
                <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.soundEnabled ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" : "bg-gray-200 text-gray-400 dark:bg-white/10"}`}>
                      {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <button
                      type="button"
                      onClick={playAcousticChime}
                      className="text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      Probar Chime 🔔
                    </button>
                  </div>
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
        </div>

        {/* Right Column: Live Simulated Sileo Toast Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                Simulador Sileo en Tiempo Real
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                100% Fiel a Pantalla
              </span>
            </div>

            {/* The Visual Replica of the Sileo Toast */}
            <div className="p-6 rounded-2xl bg-gray-950/5 dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center min-h-[220px]">
              <div 
                className="relative overflow-hidden w-full max-w-sm p-4 text-white shadow-[0_20px_45px_rgba(0,0,0,0.18),inset_0_1.5px_2px_rgba(255,255,255,0.4)] border transition-all duration-300"
                style={{ 
                  backgroundColor: config.bgColor, 
                  borderRadius: config.layout === 'island' ? 26 : config.layout === 'card' ? 18 : config.layout === 'bento' ? 20 : 14,
                  borderColor: config.bgColor === '#ffffff' ? '#e5e7eb' : 'rgba(255,255,255,0.15)' 
                }}
              >
                {/* Specular top glare */}
                <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                {/* Toast Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-sm"
                      style={{ 
                        backgroundColor: config.bgColor === '#ffffff' ? '#f3f4f6' : 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}
                    >
                      <span>📦</span>
                    </div>
                    <div>
                      <h4 
                        className="font-display font-extrabold text-xs tracking-tight"
                        style={{ color: config.textColor }}
                      >
                        {currentPreviewContent.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: config.subtextColor }}>
                        <span>📍</span>
                        <span>Valentina M. • Guayaquil, Ecuador</span>
                      </div>
                    </div>
                  </div>

                  <span 
                    className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: config.bgColor === '#ffffff' ? '#f1f5f9' : 'rgba(255,255,255,0.15)',
                      color: config.textColor 
                    }}
                  >
                    {config.layout}
                  </span>
                </div>

                {/* Toast Body / Description based on Layout */}
                <div 
                  className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: config.bgColor === '#ffffff' ? '#f1f5f9' : 'rgba(255,255,255,0.1)' }}
                >
                  <p 
                    className="text-[11px] font-medium leading-relaxed truncate"
                    style={{ color: config.subtextColor }}
                  >
                    Sumó <strong style={{ color: config.textColor }}>&quot;Silla Nórdica Minimal&quot;</strong> (🏷️ $145.00)
                  </p>
                  
                  {config.toastType === "action" && (
                    <span 
                      className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs"
                      style={{ 
                        backgroundColor: config.accentColor, 
                        color: '#ffffff'
                      }}
                    >
                      ⚡ Radar
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[10px] text-gray-400 mt-3 font-mono">
                {config.position} • {config.duration / 1000}s • Fondo {config.bgColor}
              </span>
            </div>

            {/* Test Launcher Panel with iPhone Emojis */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Disparar Alerta con Clientes de Muestra:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {sampleCustomers.map((sc, idx) => (
                  <button
                    key={sc.userName}
                    onClick={() => handleFireLiveTest(idx)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181a] hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                      👤 {sc.userName}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      📍 {sc.location.split(",")[0]}
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
