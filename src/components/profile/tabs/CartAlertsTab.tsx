'use client';

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  Info,
  Check,
  Palette,
  AlertTriangle,
  Zap,
  Eye,
  Monitor,
  Sparkles,
  BellRing,
  Download,
  Copy,
  Sliders,
} from 'lucide-react';
import {
  useAdminAlertStore,
  AlertPosition,
  COLOR_PRESETS,
  LAYOUT_OPTIONS,
  DURATION_OPTIONS,
  auditContrast,
  playAcousticChime,
  CartItemAddedPayload,
} from '@/lib/adminAlertStore';
import { CartAlertCard } from '@/components/admin/CartAlertCard';
import { CloudSyncStatus } from '../CloudSyncStatus';
import { useBrand } from '@/core/hooks/useBrand';

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
      imageUrl:
        'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=300&auto=format&fit=crop',
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
      imageUrl:
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=300&auto=format&fit=crop',
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
      imageUrl:
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=300&auto=format&fit=crop',
      quantity: 1,
    },
    timestamp: 1726000000000,
  },
];

const POSITIONS: { id: AlertPosition; label: string; desc: string; cornerClass: string }[] = [
  {
    id: 'bottom-right',
    label: 'Inferior Derecho',
    desc: 'Esquina clásica de escritorio. Expande y apila tarjetas hacia la esquina inferior derecha.',
    cornerClass: 'bottom-3 right-3',
  },
  {
    id: 'bottom-left',
    label: 'Inferior Izquierdo',
    desc: 'Alineado con el menú lateral izquierdo. Expande hacia la esquina inferior izquierda.',
    cornerClass: 'bottom-3 left-3',
  },
  {
    id: 'top-right',
    label: 'Superior Derecho',
    desc: 'Área de máxima visibilidad junto a la barra superior de herramientas.',
    cornerClass: 'top-3 right-3',
  },
  {
    id: 'top-left',
    label: 'Superior Izquierdo',
    desc: 'Esquina superior izquierda despejada del flujo central del catálogo.',
    cornerClass: 'top-3 left-3',
  },
];

export function CartAlertsTab() {
  const brand = useBrand();
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
    saveConfigToCloud,
  } = useAdminAlertStore();

  React.useEffect(() => {
    loadConfigFromCloud();
  }, [loadConfigFromCloud]);

  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'palette'>('architecture');
  const [testSent, setTestSent] = useState(false);
  const [burstSent, setBurstSent] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [toolState, setToolState] = useState<'idle' | 'working' | 'done'>('idle');

  const handleFireLiveTest = React.useCallback(
    (sampleIndex = 0) => {
      setToolState('working');
      fireToast(SAMPLE_CUSTOMERS[sampleIndex]);
      setTestSent(true);
      setTimeout(() => {
        setToolState('done');
        setTimeout(() => setToolState('idle'), 1800);
      }, 200);
      setTimeout(() => setTestSent(false), 2200);
    },
    [fireToast]
  );

  const handleFireBurstTest = React.useCallback(() => {
    setBurstSent(true);
    setToolState('working');
    SAMPLE_CUSTOMERS.forEach((customer, idx) => {
      setTimeout(() => {
        fireToast(customer);
      }, idx * 750);
    });
    setTimeout(() => {
      setToolState('done');
      setBurstSent(false);
      setTimeout(() => setToolState('idle'), 1500);
    }, 3600);
  }, [fireToast]);

  const currentAudit = React.useMemo(() => {
    return auditContrast(config.bgColor, config.textColor);
  }, [config.bgColor, config.textColor]);

  const activeLayoutObj = React.useMemo(() => {
    return LAYOUT_OPTIONS.find((l) => l.id === config.layout) || LAYOUT_OPTIONS[0];
  }, [config.layout]);

  const activePositionObj = React.useMemo(() => {
    return POSITIONS.find((p) => p.id === config.position) || POSITIONS[0];
  }, [config.position]);

  const handleCopyThemeJson = () => {
    const exportPayload = {
      brand: brand.name,
      module: 'cart_alerts_studio_v2',
      layout: config.layout,
      position: config.position,
      durationMs: config.duration,
      soundEnabled: config.soundEnabled,
      colors: {
        bgColor: config.bgColor,
        textColor: config.textColor,
        subtextColor: config.subtextColor,
        accentColor: config.accentColor,
      },
      wcagContrast: `${currentAudit.ratio}:1 (${currentAudit.score})`,
    };
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2400);
  };

  const handleDownloadThemeJson = () => {
    const exportPayload = {
      brand: brand.name,
      module: 'cart_alerts_studio_v2',
      layout: config.layout,
      position: config.position,
      durationMs: config.duration,
      soundEnabled: config.soundEnabled,
      colors: {
        bgColor: config.bgColor,
        textColor: config.textColor,
        subtextColor: config.subtextColor,
        accentColor: config.accentColor,
      },
      wcagContrast: `${currentAudit.ratio}:1 (${currentAudit.score})`,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina-cart-alerts-${config.layout}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-0 w-full font-sans" data-state={toolState}>
      {/* Main Container — Exact Mi Perfil Bento Architecture matching CardsTab, OverviewTab & LoyaltyCardsTab */}
      <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <CloudSyncStatus
                isSyncing={isSyncing}
                syncError={syncError}
                onSave={() => saveConfigToCloud()}
                saveLabel="Guardar en nube"
                savedLabel="Sincronizado en nube"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-[#8c9276]" /> Alertas de Bolsa en Tiempo Real
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-2xl">
              Estudio de configuración visual, auditoría de contraste WCAG y simulación interactiva de avisos de compra para {brand.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={resetConfig}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-2xl transition-all cursor-pointer"
              title="Restablecer configuración predeterminada"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8c9276]" />
              <span>Restablecer</span>
            </button>
            <button
              type="button"
              onClick={() => handleFireLiveTest(0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Probar en Pantalla</span>
            </button>
          </div>
        </div>

        {/* Clean Metrics Strip matching OverviewTab & LoyaltyCardsTab */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Geometría Activa
            </span>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block truncate">
              {activeLayoutObj.title}
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Anclaje en Monitor
            </span>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block truncate">
              {activePositionObj.label}
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Contraste WCAG
            </span>
            <span className="text-lg font-display font-bold text-[#8c9276] mt-1 block">
              {currentAudit.ratio}:1 ({currentAudit.score})
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Tiempo & Sonido
            </span>
            <span className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block">
              {config.duration / 1000}s • {config.soundEnabled ? 'Activo' : 'Mudo'}
            </span>
          </div>
        </div>

        {/* Sub-navigation Switcher (Micro-SaaS Tool Pattern) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-[#2a2a2c]/80 border border-gray-200/60 dark:border-white/5 w-fit">
            <button
              type="button"
              onClick={() => setActiveSubTab('architecture')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'architecture'
                  ? 'bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#8c9276]" />
              <span>1. Estructura, Posición & Audio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('palette')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'palette'
                  ? 'bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-[#8c9276]" />
              <span>2. Paleta Cromática, Contraste WCAG & Exportación</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyThemeJson}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-[#8c9276]" /> : <Copy className="w-3.5 h-3.5 text-[#8c9276]" />}
              <span>{copiedJson ? 'JSON Copiado' : 'Copiar JSON'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadThemeJson}
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#8c9276]" />
              <span>Exportar .JSON</span>
            </button>
          </div>
        </div>

        {/* Workspace Grid: Settings (7 cols) + Live Simulator (5 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tool Controls (7 cols) */}
          <div className="xl:col-span-7 space-y-5">
            {activeSubTab === 'architecture' && (
              <>
                {/* SECTION 1: 4 Genuine Layout Structures */}
                <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#8c9276]" />
                        <span>Geometría de la Tarjeta de Alerta</span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Elige entre 4 estructuras de visualización diseñadas para avisos de compras en vivo.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white dark:bg-[#202022] text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10">
                      {config.layout}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LAYOUT_OPTIONS.map((lo) => {
                      const isSelected = config.layout === lo.id;
                      return (
                        <button
                          key={lo.id}
                          type="button"
                          onClick={() => updateConfig({ layout: lo.id })}
                          className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[108px] ${
                            isSelected
                              ? 'border-gray-900 dark:border-white bg-white dark:bg-[#202022] shadow-xs'
                              : 'border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#202022]/50 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#2a2a2c] text-gray-700 dark:text-gray-300">
                                {lo.badge}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#8c9276] shrink-0" />
                              )}
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
                <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-[#8c9276]" />
                      <span>Posición en Monitor & Tiempo en Pantalla</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Selecciona en qué esquina del monitor aparecerán las notificaciones y cuánto tiempo permanecerán visibles.
                    </p>
                  </div>

                  {/* REALISTIC DESKTOP MONITOR VIEWPORT MOCKUP */}
                  <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181a] overflow-hidden shadow-xs p-3">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 inline-block" />
                      </div>
                      <div className="px-3 py-0.5 rounded-md bg-gray-50 dark:bg-[#202022] border border-gray-200/70 dark:border-white/10 text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate max-w-[240px]">
                        https://lumina-home.ec/shop
                      </div>
                      <div className="text-[10px] font-semibold text-gray-400">Vista 16:9</div>
                    </div>

                    <div className="relative h-44 sm:h-48 rounded-xl bg-gray-50/70 dark:bg-[#202022] border border-gray-200/60 dark:border-white/5 overflow-hidden flex">
                      {/* Simulated Left Sidebar Dock */}
                      <div className="w-8 sm:w-10 bg-white dark:bg-[#18181a] border-r border-gray-200/70 dark:border-white/5 p-1.5 flex flex-col items-center gap-2 shrink-0">
                        <div className="w-5 h-5 rounded-md bg-[#8c9276]/20 text-[#8c9276] flex items-center justify-center text-[9px] font-bold">
                          {brand.shortName.charAt(0)}
                        </div>
                        <div className="w-3.5 h-[1px] bg-gray-200 dark:bg-white/10 my-0.5" />
                        <div className="w-4 h-4 rounded bg-gray-200/70 dark:bg-white/10" />
                        <div className="w-4 h-4 rounded bg-gray-200/70 dark:bg-white/10" />
                        <div className="w-4 h-4 rounded bg-[#8c9276] text-white flex items-center justify-center text-[8px]">
                          🔔
                        </div>
                      </div>

                      {/* Simulated Main Webpage Area */}
                      <div className="flex-1 p-3 flex flex-col justify-between relative overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200/50 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-3 rounded bg-gray-200 dark:bg-white/15" />
                            <div className="w-8 h-2.5 rounded bg-gray-200/70 dark:bg-white/10" />
                          </div>
                          <div className="w-12 h-3 rounded-full bg-gray-200/70 dark:bg-white/10" />
                        </div>

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

                        {/* MINI NOTIFICATION AT EXACT CONFIG POSITION */}
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
                            className="rounded-xl p-2 border shadow-md flex items-center gap-2 backdrop-blur-md"
                            style={{
                              backgroundColor: config.bgColor,
                              borderColor:
                                config.bgColor.toLowerCase() === '#ffffff'
                                  ? '#d1d5db'
                                  : 'rgba(255,255,255,0.2)',
                              color: config.textColor,
                            }}
                          >
                            <div className="w-5 h-5 rounded-md bg-[#8c9276]/20 text-[#8c9276] flex items-center justify-center text-[10px]">
                              🛍️
                            </div>
                            <div className="leading-none pr-1">
                              <div className="text-[9px] font-bold tracking-tight">
                                ALERTA EN VIVO
                              </div>
                              <div
                                className="text-[8px] font-mono mt-0.5 opacity-75"
                                style={{ color: config.subtextColor }}
                              >
                                {config.position}
                              </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-[#8c9276] animate-ping shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Position Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {POSITIONS.map((pos) => {
                      const isSelected = config.position === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => updateConfig({ position: pos.id })}
                          className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[92px] ${
                            isSelected
                              ? 'border-gray-900 dark:border-white bg-white dark:bg-[#202022] shadow-xs'
                              : 'border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#202022]/50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {pos.label}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#8c9276] stroke-[2.5]" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {pos.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Durations & Sound */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-200/60 dark:border-white/5">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                        Permanencia en pantalla:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {DURATION_OPTIONS.map((dur) => (
                          <button
                            key={dur.ms}
                            type="button"
                            onClick={() => updateConfig({ duration: dur.ms })}
                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                              config.duration === dur.ms
                                ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 shadow-xs'
                                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                        Aviso sonoro al recibir compra:
                      </label>
                      <div className="p-2.5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              config.soundEnabled
                                ? 'bg-[#8c9276]/20 text-[#8c9276]'
                                : 'bg-gray-100 text-gray-400 dark:bg-white/10'
                            }`}
                          >
                            {config.soundEnabled ? (
                              <Volume2 className="w-4 h-4" />
                            ) : (
                              <VolumeX className="w-4 h-4" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={playAcousticChime}
                            className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            Probar timbre
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            config.soundEnabled
                              ? 'bg-gray-900 dark:bg-gray-100'
                              : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full ${
                              config.soundEnabled
                                ? 'bg-white dark:bg-gray-900 translate-x-5'
                                : 'bg-white translate-x-0'
                            } shadow transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSubTab === 'palette' && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#8c9276]" />
                    <span>Paleta Cromática & Auditoría de Legibilidad WCAG</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Selecciona un tema predefinido o ajusta cada tono con validación automática de contraste.
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
                    Temas Predefinidos
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected =
                        config.bgColor.toLowerCase() === preset.bgColor.toLowerCase() &&
                        config.textColor.toLowerCase() === preset.textColor.toLowerCase();
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-gray-900 dark:border-white bg-white dark:bg-[#202022] shadow-xs'
                              : 'border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#202022]/50 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-lg border shadow-2xs flex items-center justify-center shrink-0 font-bold text-[10px]"
                            style={{
                              backgroundColor: preset.bgColor,
                              borderColor: preset.isLight ? '#e5e7eb' : 'rgba(255,255,255,0.2)',
                              color: preset.textColor,
                            }}
                          >
                            A
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 block truncate">
                              {preset.bgColor}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="pt-3 border-t border-gray-200/60 dark:border-white/5 space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Personalización HEX en Tiempo Real
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Fondo
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.bgColor}
                          onChange={(e) =>
                            updateConfig({ bgColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={config.bgColor}
                          onChange={(e) =>
                            updateConfig({ bgColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Texto Principal
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.textColor}
                          onChange={(e) =>
                            updateConfig({ textColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={config.textColor}
                          onChange={(e) =>
                            updateConfig({ textColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Subtexto
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.subtextColor}
                          onChange={(e) =>
                            updateConfig({ subtextColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={config.subtextColor}
                          onChange={(e) =>
                            updateConfig({ subtextColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Acento
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.accentColor}
                          onChange={(e) =>
                            updateConfig({ accentColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={config.accentColor}
                          onChange={(e) =>
                            updateConfig({ accentColor: e.target.value, presetId: 'custom' })
                          }
                          className="w-full text-xs font-mono font-semibold bg-transparent outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contrast Audit Banner */}
                <div className="pt-1">
                  {!currentAudit.isAccessible ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Bajo contraste detectado ({currentAudit.ratio}:1)
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                              Ajuste sugerido
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                            {currentAudit.recommendation}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={applyRecommendedContrast}
                        className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Corregir Contraste</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#8c9276] shrink-0" />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          Contraste óptimo verificado ({currentAudit.ratio}:1 • Estándar WCAG {currentAudit.score})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8c9276] bg-[#8c9276]/10 px-2.5 py-0.5 rounded-full">
                        Legible
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Simulator (5 cols) */}
          <div className="xl:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5 sticky top-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#8c9276]" />
                    <span>Simulador 1:1 en Tiempo Real</span>
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                    Previsualización exacta antes de publicar
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#8c9276] bg-[#8c9276]/15 px-2.5 py-1 rounded-full">
                  En Vivo
                </span>
              </div>

              {/* The Live Interactive Component */}
              <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-200/70 dark:border-white/10 flex flex-col items-center justify-center min-h-[280px] overflow-hidden w-full">
                <div className="w-full flex justify-center py-2">
                  <CartAlertCard
                    key={`${config.layout}_${config.presetId}_${config.bgColor}_${config.textColor}`}
                    payload={SAMPLE_CUSTOMERS[0]}
                    config={config}
                    isPreview={true}
                  />
                </div>

                <div className="flex items-center justify-between w-full mt-3 pt-2 border-t border-gray-100 dark:border-white/5 text-[10px] text-gray-400 font-mono">
                  <span>{config.position}</span>
                  <span>{config.duration / 1000}s de permanencia</span>
                </div>
              </div>

              {/* Multi-notification Stacking Burst Trigger */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Prueba de Apilamiento Múltiple (3 Tarjetas)
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Dispara 3 notificaciones seguidas para verificar la animación de baraja en la esquina seleccionada.
                </p>
                <button
                  type="button"
                  onClick={handleFireBurstTest}
                  disabled={burstSent}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {burstSent
                      ? 'Enviando ráfaga apilada...'
                      : 'Disparar Ráfaga de 3 Alertas'}
                  </span>
                </button>
              </div>

              {/* Test Triggers with sample registered customer profiles */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Simular Clientes Individuales
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_CUSTOMERS.map((sc, idx) => (
                    <button
                      key={sc.userName}
                      type="button"
                      onClick={() => handleFireLiveTest(idx)}
                      className="p-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#202022] hover:border-[#8c9276] text-left transition-all cursor-pointer"
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
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#8c9276] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <strong className="font-semibold text-gray-900 dark:text-white">
                    Filtro inteligente activo:
                  </strong>{' '}
                  Solo las adiciones a la bolsa de clientes registrados disparan alertas en pantalla.
                </div>
              </div>

              {(testSent || burstSent) && (
                <div className="p-3 rounded-xl bg-[#8c9276]/15 border border-[#8c9276]/30 text-gray-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#8c9276]" />
                  <span>
                    {burstSent
                      ? 'Ráfaga de 3 alertas enviada a tu pantalla'
                      : 'Alerta de prueba enviada a tu pantalla'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
