'use client';

import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
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
  Eye,
  Monitor,
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

const SAMPLE_CUSTOMERS: CartItemAddedPayload[] = [
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
    timestamp: 1726000000000,
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
    timestamp: 1726000000000,
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
    timestamp: 1726000000000,
  },
];

const POSITIONS: { id: AlertPosition; label: string; desc: string; cornerClass: string }[] = [
  { 
    id: 'bottom-right', 
    label: 'Inferior Derecho', 
    desc: 'Esquina natural de alertas en macOS. Expande y minimiza hacia la esquina inferior derecha.', 
    cornerClass: 'bottom-3 right-3' 
  },
  { 
    id: 'bottom-left', 
    label: 'Inferior Izquierdo', 
    desc: 'Alineado con el dock vertical izquierdo. Expande y minimiza hacia la esquina inferior izquierda.', 
    cornerClass: 'bottom-3 left-3' 
  },
  { 
    id: 'top-right', 
    label: 'Superior Derecho', 
    desc: 'Área de alta visibilidad. Expande y minimiza hacia la esquina superior derecha.', 
    cornerClass: 'top-3 right-3' 
  },
  { 
    id: 'top-left', 
    label: 'Superior Izquierdo', 
    desc: 'Esquina superior izquierda. Expande y minimiza hacia la cabecera lateral.', 
    cornerClass: 'top-3 left-3' 
  },
];

export function CartAlertsTab() {
  const { 
    config, 
    updateConfig, 
    applyPreset, 
    applyRecommendedContrast, 
    resetConfig, 
    fireToast,
    isSyncing,
    syncError,
    loadConfigFromCloud,
    saveConfigToCloud
  } = useAdminAlertStore();

  React.useEffect(() => {
    loadConfigFromCloud();
  }, [loadConfigFromCloud]);
  
  const [testSent, setTestSent] = useState(false);

  const handleFireLiveTest = React.useCallback((sampleIndex = 0) => {
    fireToast(SAMPLE_CUSTOMERS[sampleIndex]);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2200);
  }, [fireToast]);

  const currentAudit = React.useMemo(() => {
    return auditContrast(config.bgColor, config.textColor);
  }, [config.bgColor, config.textColor]);

  return (
    <div className="space-y-6 animate-fade-in pb-0 w-full">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#202023] shadow-sm backdrop-blur-2xl w-full">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 text-[11px] font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Personalización Global Unificada</span>
              </div>
              {isSyncing ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Sincronizando con base de datos...</span>
                </div>
              ) : syncError ? (
                <button 
                  onClick={() => saveConfigToCloud()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200/60 text-red-700 dark:text-red-400 text-[11px] font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Error al guardar (reintentar)</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Base de datos Supabase conectada</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
              Notificaciones de Carrito en Vivo
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Configuración global única para todos los administradores. Cualquier cambio aplicado aquí se actualiza inmediatamente en todos los dispositivos y cuentas de administración.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => saveConfigToCloud()}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl font-semibold text-white text-xs bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Guardar cambios permanentemente en base de datos"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Guardando...' : 'Guardar en nube'}</span>
            </button>
            <button
              onClick={() => handleFireLiveTest(0)}
              className="px-5 py-2.5 rounded-xl font-semibold text-white text-xs bg-gray-900 dark:bg-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Probar en pantalla</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: 4 Genuine Layout Structures (NO "Isla Dinámica") */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-5">
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
                    className={`relative p-4 rounded-2xl border text-left transition-[border-color,background-color] duration-150 cursor-pointer flex flex-col justify-between min-h-[110px] ${
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
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white shrink-0" />}
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

          {/* SECTION 2: Realistic Desktop Viewport Simulator */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-600" />
                Ubicación y Tiempo de Muestra en Pantalla
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Simulador realista de tu monitor para previsualizar la posición exacta respecto a la tienda y al menú lateral.
              </p>
            </div>

            {/* REALISTIC DESKTOP MONITOR VIEWPORT MOCKUP */}
            <div className="relative rounded-2xl border border-gray-300/80 dark:border-white/15 bg-gray-100 dark:bg-[#151517] overflow-hidden shadow-inner p-3">
              {/* Browser Window Chrome */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-white/10 text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                {/* Specific URL requested: https://esta-tienda.com/notificaciones */}
                <div className="px-3 py-0.5 rounded-md bg-white dark:bg-[#202023] border border-gray-200 dark:border-white/10 text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate max-w-[240px]">
                  https://esta-tienda.com/notificaciones
                </div>
                <div className="text-[10px] font-semibold text-gray-400">
                  Monitor 16:9
                </div>
              </div>

              {/* Simulated Browser Webpage Content */}
              <div className="relative h-44 sm:h-48 rounded-xl bg-white dark:bg-[#1a1a1c] border border-gray-200/70 dark:border-white/10 overflow-hidden flex">
                {/* Simulated Left Sidebar Dock */}
                <div className="w-8 sm:w-10 bg-gray-50 dark:bg-[#18181a] border-r border-gray-200/80 dark:border-white/10 p-1.5 flex flex-col items-center gap-2 shrink-0">
                  <div className="w-5 h-5 rounded-md bg-emerald-600/30 text-emerald-500 flex items-center justify-center text-[9px] font-bold">
                    L
                  </div>
                  <div className="w-3.5 h-[1px] bg-gray-300 dark:bg-white/10 my-0.5" />
                  <div className="w-4 h-4 rounded bg-gray-200 dark:bg-white/10" />
                  <div className="w-4 h-4 rounded bg-gray-200 dark:bg-white/10" />
                  <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center text-[8px]">
                    🔔
                  </div>
                  <div className="w-4 h-4 rounded bg-gray-200 dark:bg-white/10 mt-auto" />
                </div>

                {/* Simulated Main Webpage Area */}
                <div className="flex-1 p-3 flex flex-col justify-between relative overflow-hidden bg-dot-pattern">
                  {/* Wireframe Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-3 rounded bg-gray-300 dark:bg-white/20" />
                      <div className="w-8 h-2.5 rounded bg-gray-200 dark:bg-white/10" />
                      <div className="w-8 h-2.5 rounded bg-gray-200 dark:bg-white/10" />
                    </div>
                    <div className="w-12 h-3 rounded-full bg-gray-200 dark:bg-white/10" />
                  </div>

                  {/* Wireframe Catalog Grid Cards */}
                  <div className="grid grid-cols-3 gap-2 my-auto opacity-40">
                    <div className="h-11 rounded-lg bg-gray-200 dark:bg-white/10 p-1 space-y-1">
                      <div className="w-full h-5 rounded bg-gray-300 dark:bg-white/15" />
                      <div className="w-8 h-1.5 rounded bg-gray-300 dark:bg-white/20" />
                    </div>
                    <div className="h-11 rounded-lg bg-gray-200 dark:bg-white/10 p-1 space-y-1">
                      <div className="w-full h-5 rounded bg-gray-300 dark:bg-white/15" />
                      <div className="w-8 h-1.5 rounded bg-gray-300 dark:bg-white/20" />
                    </div>
                    <div className="h-11 rounded-lg bg-gray-200 dark:bg-white/10 p-1 space-y-1">
                      <div className="w-full h-5 rounded bg-gray-300 dark:bg-white/15" />
                      <div className="w-8 h-1.5 rounded bg-gray-300 dark:bg-white/20" />
                    </div>
                  </div>

                  {/* MINI NOTIFICATION AT EXACT CONFIG POSITION (Zero layout thrashing, 120fps CSS transition) */}
                  <div
                    className={`absolute z-20 pointer-events-none transition-all duration-300 ease-out ${
                      config.position === 'bottom-right'
                        ? 'bottom-2.5 right-2.5'
                        : config.position === 'bottom-left'
                        ? 'bottom-2.5 left-2.5'
                        : config.position === 'top-right'
                        ? 'top-2.5 right-2.5'
                        : 'top-2.5 left-2.5'
                    }`}
                  >
                    <div 
                      className="rounded-xl p-2 border shadow-lg flex items-center gap-2 backdrop-blur-md"
                      style={{ 
                        backgroundColor: config.bgColor,
                        borderColor: config.bgColor.toLowerCase() === '#ffffff' ? '#d1d5db' : 'rgba(255,255,255,0.2)',
                        color: config.textColor
                      }}
                    >
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">
                        📦
                      </div>
                      <div className="leading-none pr-1">
                        <div className="text-[9px] font-extrabold tracking-tight">
                          NOTIFICACIÓN
                        </div>
                        <div className="text-[8px] font-mono mt-0.5 opacity-70" style={{ color: config.subtextColor }}>
                          {config.position}
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {POSITIONS.map((pos) => {
                const isSelected = config.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => updateConfig({ position: pos.id })}
                    className={`relative p-4 rounded-2xl border text-left transition-[border-color,background-color] duration-150 cursor-pointer flex flex-col justify-between min-h-[100px] ${
                      isSelected
                        ? 'border-gray-900 dark:border-white bg-gray-50/80 dark:bg-white/5 ring-1 ring-gray-900/10 dark:ring-white/20 shadow-xs'
                        : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {pos.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      {pos.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Non-repeating Durations & Sound */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-white/5">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Permanencia en pantalla:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur.ms}
                      onClick={() => updateConfig({ duration: dur.ms })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-[border-color,background-color] duration-150 cursor-pointer ${
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

          {/* SECTION 3: Color Palette & Contrast Audit */}
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-5">
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
                      className={`p-3 rounded-xl border text-left transition-[border-color,background-color] duration-150 cursor-pointer flex items-center gap-2.5 ${
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

            {/* Contrast Audit Banner */}
            <div className="pt-1">
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

        </div>

        {/* Right Column: Live Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#202022] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                Vista previa en vivo
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Fiel a pantalla
              </span>
            </div>

            {/* The Live Interactive Component (Strictly Contained, Zero Overflow) */}
            <div className="relative p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-black/25 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center min-h-[300px] overflow-hidden w-full">
              <div className="w-full flex justify-center py-2">
                <CartAlertCard
                  payload={SAMPLE_CUSTOMERS[0]}
                  config={config}
                  isPreview={true}
                />
              </div>

              <div className="flex items-center justify-between w-full mt-3 text-[10px] text-gray-400 font-mono">
                <span>{config.position}</span>
                <span>{config.duration / 1000}s de permanencia</span>
              </div>
            </div>

            {/* Test Triggers with sample registered customer profiles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Probar con perfiles de cliente:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_CUSTOMERS.map((sc, idx) => (
                  <button
                    key={sc.userName}
                    onClick={() => handleFireLiveTest(idx)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181a] hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-[border-color,background-color] duration-150 active:scale-95 cursor-pointer shadow-2xs"
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
