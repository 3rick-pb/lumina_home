'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { 
  useAdminAlertStore, 
  AlertPosition, 
  COLOR_PRESETS,
  LAYOUT_OPTIONS,
  DURATION_OPTIONS,
  auditContrast,
  playAcousticChime,
  CartItemAddedPayload 
} from '@/lib/adminAlertStore';
import { CartAlertCard } from '@/components/admin/CartAlertCard';

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
      userId: 'user-sample-1',
      userName: 'Valentina M.',
      userEmail: 'valentina.m@example.com',
      location: 'Guayaquil, Ecuador',
      product: {
        id: 'prod-sample-1',
        title: 'Silla Nórdica Minimalista Nogal',
        price: 145.0,
        imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=300&auto=format&fit=crop',
        quantity: 1,
      },
      timestamp: Date.now(),
    },
    {
      userId: 'user-sample-2',
      userName: 'Carlos E.',
      userEmail: 'carlos.e@example.com',
      location: 'Quito, Pichincha',
      product: {
        id: 'prod-sample-2',
        title: 'Difusor Ultrasónico Piedra Volcánica',
        price: 68.5,
        imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=300&auto=format&fit=crop',
        quantity: 2,
      },
      timestamp: Date.now(),
    },
    {
      userId: 'user-sample-3',
      userName: 'Elena R.',
      userEmail: 'elena.r@example.com',
      location: 'Cuenca, Azuay',
      product: {
        id: 'prod-sample-3',
        title: 'Lámpara de Mesa Eclipse Minimal',
        price: 110.0,
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=300&auto=format&fit=crop',
        quantity: 1,
      },
      timestamp: Date.now(),
    },
  ];

  const handleFireLiveTest = (sampleIndex = 0) => {
    fireToast(sampleCustomers[sampleIndex]);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2200);
  };

  const positions: { id: AlertPosition; label: string; desc: string; iconPos: string }[] = [
    { id: 'bottom-right', label: 'Inferior Derecho', desc: 'Recomendado para monitoreo continuo', iconPos: 'bottom-2 right-2' },
    { id: 'bottom-left', label: 'Inferior Izquierdo', desc: 'Alineado con el dock vertical izquierdo', iconPos: 'bottom-2 left-2' },
    { id: 'top-right', label: 'Superior Derecho', desc: 'Área de alta visibilidad e impacto', iconPos: 'top-2 right-2' },
    { id: 'top-left', label: 'Superior Izquierdo', desc: 'Lateral superior sobre la cabecera', iconPos: 'top-2 left-2' },
  ];

  const currentAudit = auditContrast(config.bgColor, config.textColor);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] p-7 sm:p-9 border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#202023] shadow-sm backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 text-[11px] font-semibold uppercase tracking-wider mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Panel exclusivo de administración</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
              Notificaciones de Carrito en Vivo
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Configura la presentación visual, la trayectoria de envío animada con paquete en tránsito, colores de alto contraste y el aviso sonoro cuando un comprador registrado añade un producto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleFireLiveTest(0)}
              className="px-5 py-2.5 rounded-xl font-semibold text-white text-xs bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Probar notificación</span>
            </button>
            <button
              onClick={resetConfig}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restablecer configuración predeterminada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings (7 cols) + Live Simulator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: 4 Genuine Layout Structures */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Estructura de Notificación
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Cuatro formatos con geometrías y distribuciones de información realmente distintas.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
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
                        ? 'border-gray-900 dark:border-white bg-gray-50/80 dark:bg-white/5 ring-1 ring-gray-900/10 dark:ring-white/20 shadow-xs'
                        : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                          {lo.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white" />}
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                        {lo.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      {lo.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Color Palette & Contrast Audit */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div>
              <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                Colores y Legibilidad
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Elige entre combinaciones sobrias de autor o ajusta los tonos manualmente con verificación WCAG.
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Paletas predefinidas:
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
                          ? 'border-gray-900 dark:border-white bg-gray-50/80 dark:bg-white/5 ring-1 ring-gray-900/10'
                          : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded-lg border shadow-2xs flex items-center justify-center shrink-0 font-bold text-[10px]"
                        style={{ 
                          backgroundColor: preset.bgColor, 
                          borderColor: preset.isLight ? '#e5e7eb' : 'rgba(255,255,255,0.2)', 
                          color: preset.textColor 
                        }}
                      >
                        A
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white block truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
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
                Ajuste manual de tonos:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Background */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Fondo
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => updateConfig({ bgColor: e.target.value, presetId: 'custom' })}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.bgColor}
                      onChange={(e) => updateConfig({ bgColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Main Text */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Texto Principal
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value, presetId: 'custom' })}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Subtext */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Detalles
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.subtextColor}
                      onChange={(e) => updateConfig({ subtextColor: e.target.value, presetId: 'custom' })}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.subtextColor}
                      onChange={(e) => updateConfig({ subtextColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Accent Button */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Botón Acción
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => updateConfig({ accentColor: e.target.value, presetId: 'custom' })}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => updateConfig({ accentColor: e.target.value, presetId: 'custom' })}
                      className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contrast Audit & Recommendation Banner */}
            <div className="pt-2">
              {!currentAudit.isAccessible ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          Bajo contraste detectado ({currentAudit.ratio}:1)
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                          No recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                        {currentAudit.recommendation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={applyRecommendedContrast}
                    className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Aplicar contraste óptimo</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-300/70 dark:border-emerald-800/60 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                      Excelente contraste y visibilidad ({currentAudit.ratio}:1 • Nivel WCAG {currentAudit.score})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    Legible
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Screen Position & Clean Durations */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Ubicación y Tiempo de Muestra
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
                        ? 'border-gray-900 dark:border-white bg-gray-50/80 dark:bg-white/5 ring-1 ring-gray-900/10'
                        : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="w-full h-7 rounded-lg bg-gray-100 dark:bg-[#18181a] border border-gray-200 dark:border-white/10 relative mb-2.5 overflow-hidden shadow-2xs">
                      <div
                        className={`absolute w-2 h-2 rounded-full transition-all ${
                          isSelected ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-white/20'
                        } ${pos.iconPos}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {pos.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Non-repeating Durations & Sound */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Permanencia en pantalla:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur.ms}
                      onClick={() => updateConfig({ duration: dur.ms })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        config.duration === dur.ms
                          ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-950 shadow-xs'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Aviso sonoro discreto:
                </label>
                <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#18181a] border border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.soundEnabled ? 'bg-gray-200 text-gray-900 dark:bg-white/15 dark:text-white' : 'bg-gray-200 text-gray-400 dark:bg-white/10'}`}>
                      {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <button
                      type="button"
                      onClick={playAcousticChime}
                      className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Probar sonido
                    </button>
                  </div>
                  <button
                    onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.soundEnabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full ${config.soundEnabled ? 'bg-white dark:bg-gray-950' : 'bg-white'} shadow ring-0 transition duration-200 ease-in-out ${
                        config.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                Vista previa en vivo
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Fiel a pantalla
              </span>
            </div>

            {/* The Live Interactive Component (Exact replica of the floating alert) */}
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-black/25 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center min-h-[280px]">
              <CartAlertCard
                payload={sampleCustomers[0]}
                config={config}
                isPreview={true}
              />

              <span className="text-[10px] text-gray-400 mt-4 font-mono">
                {config.position} • {config.duration / 1000}s de permanencia
              </span>
            </div>

            {/* Test Triggers with sample registered customer profiles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Probar con perfiles de cliente:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {sampleCustomers.map((sc, idx) => (
                  <button
                    key={sc.userName}
                    onClick={() => handleFireLiveTest(idx)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181a] hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                      {sc.userName}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {sc.location.split(',')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Note */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <strong className="font-semibold text-gray-900 dark:text-white">Filtro de privacidad estricto:</strong>
                <p className="mt-0.5 text-[11px]">
                  Solo las adiciones de clientes registrados y verificados emiten notificaciones en vivo. La actividad anónima no genera alertas para preservar una pantalla limpia y enfocada.
                </p>
              </div>
            </div>

            {testSent && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Notificación enviada a tu pantalla</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
