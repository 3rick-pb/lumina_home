"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Layers, 
  Sparkles, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Search, 
  Trash2, 
  Tag, 
  Home as HomeIcon, 
  User as UserIcon 
} from "lucide-react";
import { 
  NICHE_ICONS_CATALOG, 
  getNicheIconByName, 
  getSavedNicheSlots, 
  DEFAULT_NICHE_SLOTS, 
  type NicheSlotConfig 
} from "@/lib/nicheIcons";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";
import { CloudSyncStatus } from "../CloudSyncStatus";

interface NichesTabProps {
  onRequestDeleteNiche: (catName: string) => void;
}

export function NichesTab({ onRequestDeleteNiche }: NichesTabProps) {
  const { products, categories, badges, addCategory, addBadge, deleteBadge, fetchProducts } = useCatalogStore();

  // Category & Badge manager state
  const [newCatInput, setNewCatInput] = useState("");
  const [newBadgeInput, setNewBadgeInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Dynamic Header Niche Customizer State
  const [nicheSlots, setNicheSlots] = useState<NicheSlotConfig[]>(DEFAULT_NICHE_SLOTS);
  const [activeEditingSlot, setActiveEditingSlot] = useState<1 | 2>(1);
  const [previewActiveTab, setPreviewActiveTab] = useState<string>("niche1");
  const [previewHoveredTab, setPreviewHoveredTab] = useState<string | null>(null);
  const [nicheSaveFeedback, setNicheSaveFeedback] = useState<string | null>(null);
  const iconSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNicheSlots(getSavedNicheSlots());
    }
  }, []);

  const handleUpdateNicheSlot = (slotIndex: 0 | 1, updates: Partial<NicheSlotConfig>) => {
    setNicheSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = { ...copy[slotIndex], ...updates };
      return copy;
    });
  };

  const handleSelectIconForActiveSlot = (iconName: string) => {
    handleUpdateNicheSlot(activeEditingSlot === 1 ? 0 : 1, { iconName });
  };

  const handleSaveNicheSlots = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lumina_header_niches", JSON.stringify(nicheSlots));
        window.dispatchEvent(new Event("lumina_header_niches_updated"));
        setNicheSaveFeedback("?Men? de pastilla actualizado con ?xito para la p?gina de inicio!");
        setTimeout(() => setNicheSaveFeedback(null), 3500);
      } catch {}
    }
  };

  const handleResetNicheSlots = () => {
    setNicheSlots(DEFAULT_NICHE_SLOTS);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lumina_header_niches", JSON.stringify(DEFAULT_NICHE_SLOTS));
        window.dispatchEvent(new Event("lumina_header_niches_updated"));
        setNicheSaveFeedback("Restablecido a los nichos predeterminados (Iluminaci?n & Textiles)");
        setTimeout(() => setNicheSaveFeedback(null), 3500);
      } catch {}
    }
  };

  const scrollIconSlider = (direction: "left" | "right") => {
    if (iconSliderRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      iconSliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    addCategory(newCatInput.trim());
    setNewCatInput("");
  };

  const handleAddBadgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBadgeInput.trim()) {
      addBadge(newBadgeInput.trim());
      setNewBadgeInput("");
    }
  };

  const handleSyncNichesAndCategories = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      handleSaveNicheSlots();
      if (fetchProducts) {
        await fetchProducts();
      }
    } catch {
      setSyncError("Error al sincronizar nichos y colecciones");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <CloudSyncStatus
              isSyncing={isSyncing}
              syncError={syncError}
              onSave={handleSyncNichesAndCategories}
              saveLabel="Guardar en nube"
              savedLabel="Guardado en nube"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8c9276]" /> Gestión de Nichos & Colecciones
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Personaliza el menú flotante interactivo de la tienda, crea nuevos nichos de mercado o elimina aquellos sin existencias.</p>
        </div>
      </div>

              {/* ========================================================================= */}
              {/* SIMULADOR INTERACTIVO LIQUID GLASS PARA EL MENÚ DE INICIO */}
              {/* ========================================================================= */}
              <div className="rounded-[2.5rem] bg-gradient-to-br from-stone-50 via-stone-100/70 to-stone-200/50 dark:from-[#18181a] dark:via-[#1c1c1f] dark:to-[#141416] p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-none space-y-8 overflow-hidden relative">
                
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c9276]/15 text-[#636852] dark:text-[#b8be9e] text-[11px] font-semibold tracking-wide uppercase mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Simulador en Tiempo Real
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      Menú de Pastilla Liquid Glass (Inicio)
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                      Previsualiza de forma interactiva el menú flotante que verán tus clientes en la tienda. Modifica los dos nichos destacados, cambia sus nombres y selecciona de entre más de 25 iconos en el slider.
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetNicheSlots}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all shadow-sm"
                      title="Restablecer a Iluminación y Textiles"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restablecer
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveNicheSlots}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-all shadow-md active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Guardar en Inicio
                    </button>
                  </div>
                </div>

                {/* Feedback banner if saved */}
                {nicheSaveFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 font-medium shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{nicheSaveFeedback}</span>
                  </motion.div>
                )}

                {/* PILL SIMULATOR CANVAS (Mimicking Storefront Floating Menu) */}
                <div className="relative rounded-3xl bg-gradient-to-b from-stone-200/50 via-stone-100/40 to-stone-200/30 dark:from-[#242428]/60 dark:via-[#1c1c1f]/40 dark:to-[#141416]/60 p-6 sm:p-10 border border-white/60 dark:border-white/5 flex flex-col items-center justify-center min-h-[160px] overflow-hidden backdrop-blur-md">
                  
                  {/* Subtle watermark background for context */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] select-none text-9xl font-display font-black tracking-widest text-gray-900 dark:text-white">
                    LUMINA
                  </div>

                  {/* Label indicator */}
                  <div className="absolute top-3 left-4 text-[10px] font-mono tracking-wider uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Vista previa interactiva (solo visual)
                  </div>

                  {/* The Replica of Header Pill */}
                  <div className="relative z-10 max-w-full overflow-x-auto py-2 px-1">
                    <div className="flex items-center justify-between p-2 rounded-full bg-white/60 dark:bg-[#1a1a1c]/80 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] select-none">
                      
                      {/* Logo Section */}
                      <div className="pl-4 pr-5 flex items-center gap-2 cursor-default">
                        <span className="font-display italic text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                          Lumina.
                        </span>
                      </div>

                      {/* Liquid Glass Navigation Tabs */}
                      <nav 
                        className="flex items-center gap-1 relative" 
                        onMouseLeave={() => setPreviewHoveredTab(null)}
                      >
                        {/* Tab 1: Inicio */}
                        <button
                          type="button"
                          onClick={() => setPreviewActiveTab("home")}
                          onMouseEnter={() => setPreviewHoveredTab("home")}
                          className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                            previewActiveTab === "home" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {previewActiveTab === "home" && (
                            <motion.div
                              layoutId="preview-active-pill"
                              className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          {previewActiveTab !== "home" && previewHoveredTab === "home" && (
                            <motion.div
                              layoutId="preview-hover-pill"
                              className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                            />
                          )}
                          <HomeIcon className="relative z-10 w-4 h-4" />
                          <span className="relative z-10">Inicio</span>
                        </button>

                        {/* Tab 2: Todo */}
                        <button
                          type="button"
                          onClick={() => setPreviewActiveTab("shop")}
                          onMouseEnter={() => setPreviewHoveredTab("shop")}
                          className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                            previewActiveTab === "shop" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          {previewActiveTab === "shop" && (
                            <motion.div
                              layoutId="preview-active-pill"
                              className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          {previewActiveTab !== "shop" && previewHoveredTab === "shop" && (
                            <motion.div
                              layoutId="preview-hover-pill"
                              className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                            />
                          )}
                          <Sparkles className="relative z-10 w-4 h-4" />
                          <span className="relative z-10">Todo</span>
                        </button>

                        {/* Tab 3: Nicho 1 Dinámico */}
                        {(() => {
                          const slot1 = nicheSlots[0] || DEFAULT_NICHE_SLOTS[0];
                          const IconComponent = getNicheIconByName(slot1.iconName);
                          const isSelectedTab = previewActiveTab === "niche1";
                          const isHovered = previewHoveredTab === "niche1";

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewActiveTab("niche1");
                                setActiveEditingSlot(1);
                              }}
                              onMouseEnter={() => setPreviewHoveredTab("niche1")}
                              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                isSelectedTab ? "text-gray-900 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              } ${activeEditingSlot === 1 ? "ring-2 ring-[#8c9276] ring-offset-2 ring-offset-transparent" : ""}`}
                              title="Haz clic para editar este nicho"
                            >
                              {isSelectedTab && (
                                <motion.div
                                  layoutId="preview-active-pill"
                                  className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                              )}
                              {!isSelectedTab && isHovered && (
                                <motion.div
                                  layoutId="preview-hover-pill"
                                  className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                                />
                              )}
                              <IconComponent className="relative z-10 w-4 h-4 text-[#8c9276]" />
                              <span className="relative z-10">{slot1.label || "Nicho 1"}</span>
                              {activeEditingSlot === 1 && (
                                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#8c9276] -ml-1" />
                              )}
                            </button>
                          );
                        })()}

                        {/* Tab 4: Nicho 2 Dinámico */}
                        {(() => {
                          const slot2 = nicheSlots[1] || DEFAULT_NICHE_SLOTS[1];
                          const IconComponent = getNicheIconByName(slot2.iconName);
                          const isSelectedTab = previewActiveTab === "niche2";
                          const isHovered = previewHoveredTab === "niche2";

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewActiveTab("niche2");
                                setActiveEditingSlot(2);
                              }}
                              onMouseEnter={() => setPreviewHoveredTab("niche2")}
                              className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                                isSelectedTab ? "text-gray-900 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              } ${activeEditingSlot === 2 ? "ring-2 ring-[#8c9276] ring-offset-2 ring-offset-transparent" : ""}`}
                              title="Haz clic para editar este nicho"
                            >
                              {isSelectedTab && (
                                <motion.div
                                  layoutId="preview-active-pill"
                                  className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/20"
                                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                              )}
                              {!isSelectedTab && isHovered && (
                                <motion.div
                                  layoutId="preview-hover-pill"
                                  className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10"
                                />
                              )}
                              <IconComponent className="relative z-10 w-4 h-4 text-[#8c9276]" />
                              <span className="relative z-10">{slot2.label || "Nicho 2"}</span>
                              {activeEditingSlot === 2 && (
                                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#8c9276] -ml-1" />
                              )}
                            </button>
                          );
                        })()}
                      </nav>

                      {/* Dummy Right Actions in Pill */}
                      <div className="flex items-center gap-2 pl-4 pr-2">
                        <div className="w-9 h-9 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="hidden sm:flex items-center relative">
                          <div className="h-9 rounded-full pl-9 pr-4 text-xs text-gray-400 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 flex items-center">
                            <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400" />
                            <span>Buscar...</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* NICHE SLOTS EDITORS (2 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Card Slot 1 */}
                  {(() => {
                    const slot = nicheSlots[0] || DEFAULT_NICHE_SLOTS[0];
                    const CurrentIcon = getNicheIconByName(slot.iconName);
                    const isSelected = activeEditingSlot === 1;

                    return (
                      <div 
                        onClick={() => setActiveEditingSlot(1)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected 
                            ? "bg-white dark:bg-[#202022] border-[#8c9276] shadow-lg ring-2 ring-[#8c9276]/20" 
                            : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c9276] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Seleccionado para editar
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] shrink-0">
                            <CurrentIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c9276] font-bold">
                              Nicho Destacado 1
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                              {slot.label || "Sin título"}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Icono actual: <span className="font-mono font-medium">{slot.iconName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Etiqueta / Texto en la Pastilla:
                            </label>
                            <input
                              type="text"
                              value={slot.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(0, { label: e.target.value })}
                              placeholder="Ej: Iluminación"
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Filtrar por Categoría de Tienda:
                            </label>
                            <select
                              value={slot.category}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(0, { category: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card Slot 2 */}
                  {(() => {
                    const slot = nicheSlots[1] || DEFAULT_NICHE_SLOTS[1];
                    const CurrentIcon = getNicheIconByName(slot.iconName);
                    const isSelected = activeEditingSlot === 2;

                    return (
                      <div 
                        onClick={() => setActiveEditingSlot(2)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected 
                            ? "bg-white dark:bg-[#202022] border-[#8c9276] shadow-lg ring-2 ring-[#8c9276]/20" 
                            : "bg-white/60 dark:bg-[#1a1a1c]/60 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c9276] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Seleccionado para editar
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#8c9276]/10 dark:bg-[#8c9276]/20 border border-[#8c9276]/30 flex items-center justify-center text-[#8c9276] shrink-0">
                            <CurrentIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c9276] font-bold">
                              Nicho Destacado 2
                            </span>
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                              {slot.label || "Sin título"}
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Icono actual: <span className="font-mono font-medium">{slot.iconName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Etiqueta / Texto en la Pastilla:
                            </label>
                            <input
                              type="text"
                              value={slot.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(1, { label: e.target.value })}
                              placeholder="Ej: Textiles"
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Filtrar por Categoría de Tienda:
                            </label>
                            <select
                              value={slot.category}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateNicheSlot(1, { category: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 dark:bg-[#151517] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8c9276]"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ICON SLIDER & PICKER */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#8c9276]" />
                        Catálogo de Iconos para el Nicho {activeEditingSlot} ({activeEditingSlot === 1 ? nicheSlots[0]?.label || "Nicho 1" : nicheSlots[1]?.label || "Nicho 2"})
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Desliza horizontalmente con las flechas y haz clic en el icono deseado para aplicarlo inmediatamente.
                      </p>
                    </div>

                    {/* Slider Navigation Arrows */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => scrollIconSlider("left")}
                        className="w-8 h-8 rounded-full bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                        title="Desplazar a la izquierda"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollIconSlider("right")}
                        className="w-8 h-8 rounded-full bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                        title="Desplazar a la derecha"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* The Scrollable Icons Track */}
                  <div 
                    ref={iconSliderRef}
                    className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {NICHE_ICONS_CATALOG.map((item) => {
                      const Icon = item.icon;
                      const currentSlotIcon = activeEditingSlot === 1 ? nicheSlots[0]?.iconName : nicheSlots[1]?.iconName;
                      const isIconSelected = currentSlotIcon?.toLowerCase() === item.name.toLowerCase();

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectIconForActiveSlot(item.name)}
                          className={`group flex flex-col items-center justify-center min-w-[94px] max-w-[94px] p-3 rounded-2xl border transition-all shrink-0 select-none ${
                            isIconSelected
                              ? "bg-[#8c9276] text-white border-[#8c9276] shadow-md scale-105"
                              : "bg-white dark:bg-[#202022] border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#8c9276]/60 hover:shadow-sm"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${
                            isIconSelected ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200"
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[11px] font-semibold text-center truncate w-full ${
                            isIconSelected ? "text-white" : "text-gray-800 dark:text-gray-200"
                          }`}>
                            {item.label}
                          </span>
                          <span className={`text-[9px] font-mono truncate w-full text-center ${
                            isIconSelected ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                          }`}>
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ---------------------------------------------------- */}
              {/* Category Management */}
              {/* ---------------------------------------------------- */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Añadir Categoría al Catálogo
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Crea nuevos nichos de mercado o elimina aquellos sin existencias.</p>
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategorySubmit} className="flex gap-3 max-w-md">
                  <input 
                    type="text"
                    value={newCatInput} 
                    onChange={e => setNewCatInput(e.target.value)}
                    placeholder="Nombre del nuevo nicho (ej: Cerámica)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
 <button 
 type="submit" 
 className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
 >
 + Añadir Nicho
 </button>
 </form>

 {/* Categories Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
 {categories.map(cat => {
 const count = products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
 const isEmpty = count === 0;

 return (
 <div 
 key={cat} 
 className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
 isEmpty ? "bg-amber-50/70 border-amber-200" : "bg-white dark:bg-[#202022] border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none"
 }`}
 >
 <div>
 <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{cat}</h4>
 <p className={`text-xs mt-0.5 ${isEmpty ? "text-amber-700 font-semibold" : "text-gray-400"}`}>
 {count} {count === 1 ? "producto" : "productos"} activos
 </p>
 </div>

 <button 
 onClick={() => onRequestDeleteNiche(cat)}
 className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
 title="Eliminar nicho"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 );
 })}
 </div>
              </div>

 {/* ---------------------------------------------------- */}
 {/* Marketing Badges Section */}
 {/* ---------------------------------------------------- */}
 <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
 <div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
 <Tag className="w-5 h-5 text-[#8c9276]" /> Badges & Etiquetas de Marketing
 </h2>
 <p className="text-xs text-gray-500 dark:text-gray-400">
 Crea o elimina distintivos comerciales para destacar tus piezas (ej: Más Vendido, Bestseller, Edición Limitada).
 </p>
 </div>

 {/* Add Badge Form */}
 <form onSubmit={handleAddBadgeSubmit} className="flex gap-3 max-w-md">
 <input 
 type="text" 
 value={newBadgeInput} 
 onChange={e => setNewBadgeInput(e.target.value)}
 placeholder="Nombre del nuevo badge (ej: Edición Limitada)"
 className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
 />
 <button 
 type="submit" 
 className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm dark:shadow-none shrink-0"
 >
 + Añadir Badge
 </button>
 </form>

 {/* Badges Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
 {badges.map(badge => {
 const count = products.filter(p => p.badge?.toLowerCase() === badge.toLowerCase()).length;

 return (
 <div 
 key={badge} 
 className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#202022] shadow-sm dark:shadow-none flex items-center justify-between"
 >
 <div className="flex items-center gap-2.5">
 <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
 isAgotadoBadge(badge)
 ? "bg-red-50 text-red-600 border border-red-200"
 : "bg-amber-50 text-amber-900 border border-amber-200"
 }`}>
 {badge}
 </span>
 <span className="text-[11px] text-gray-400">
 {count} {count === 1 ? "producto" : "productos"}
 </span>
 </div>

 <button 
 onClick={() => deleteBadge(badge)}
 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
 title="Eliminar badge"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 );
 })}
 </div>
 </div>
 </div>
  );
}
