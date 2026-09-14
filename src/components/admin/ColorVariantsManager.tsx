"use client";

import React from "react";
import { Plus, Trash2, Palette, Sparkles } from "lucide-react";

export interface ColorVariant {
  name: string;
  hex: string;
}

export const LUXURY_COLOR_PRESETS: ColorVariant[] = [
  { name: "Blanco Puro", hex: "#FFFFFF" },
  { name: "Negro Azabache", hex: "#18181B" },
  { name: "Terracota", hex: "#C86446" },
  { name: "Verde Salvia", hex: "#7A8B7B" },
  { name: "Roble Natural", hex: "#8C6239" },
  { name: "Azul Índigo", hex: "#2C3E50" },
  { name: "Latón Dorado", hex: "#D4AF37" },
  { name: "Gris Grafito", hex: "#4B5563" },
  { name: "Arena Cálido", hex: "#E8DFD8" },
  { name: "Rojo Carmesí", hex: "#991B1B" },
  { name: "Nogal Oscuro", hex: "#4A3525" },
  { name: "Verde Bosque", hex: "#1E3F20" }
];

const SMART_COLOR_MAP: Record<string, string> = {
  rojo: "#DC2626",
  verde: "#16A34A",
  azul: "#2563EB",
  negro: "#18181B",
  blanco: "#FFFFFF",
  gris: "#6B7280",
  amarillo: "#EAB308",
  dorado: "#D4AF37",
  oro: "#D4AF37",
  plata: "#E5E7EB",
  madera: "#8C6239",
  roble: "#8C6239",
  nogal: "#4A3525",
  terracota: "#C86446",
  salvia: "#7A8B7B",
  oliva: "#65A30D",
  marino: "#1E3A8A",
  indigo: "#312E81",
  índigo: "#312E81",
  arena: "#E8DFD8",
  beige: "#F5F5DC",
  rosa: "#EC4899",
  rosado: "#F472B6",
  cobre: "#B45309",
  naranja: "#EA580C",
  vino: "#831843",
  grafito: "#374151",
  carbon: "#1F2937",
  carbón: "#1F2937",
  hueso: "#F9F6F0",
  crema: "#FFFDD0",
  morado: "#7C3AED",
  violeta: "#8B5CF6",
  turquesa: "#0D9488",
  cian: "#06B6D4",
  menta: "#6EE7B7"
};

const detectHexFromName = (name: string): string | null => {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [keyword, hex] of Object.entries(SMART_COLOR_MAP)) {
    const keyNorm = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes(keyNorm)) {
      return hex;
    }
  }
  return null;
};

interface ColorVariantsManagerProps {
  hasColors?: boolean;
  onHasColorsChange?: (hasColors: boolean) => void;
  colors: ColorVariant[];
  onChange: (colors: ColorVariant[]) => void;
}

export function ColorVariantsManager({
  colors,
  onChange,
}: ColorVariantsManagerProps) {
  React.useEffect(() => {
    if (!colors || colors.length === 0) {
      onChange([
        { name: "Negro Grafito", hex: "#18181B" }
      ]);
    }
  }, [colors, onChange]);

  const addVariant = (variant?: ColorVariant) => {
    const nextVariant: ColorVariant = variant || {
      name: `Color ${(colors?.length || 0) + 1}`,
      hex: "#18181B",
    };
    onChange([...(colors || []), nextVariant]);
  };

  const removeVariant = (index: number) => {
    if (colors.length <= 1) return; // Must keep at least 1 color
    const next = colors.filter((_, i) => i !== index);
    onChange(next);
  };

  const updateVariant = (index: number, field: "name" | "hex", value: string) => {
    const next = [...colors];
    const item = { ...next[index] };

    if (field === "name") {
      item.name = value;
      // If the user hasn't explicitly set a custom hex yet, auto-suggest color based on common Spanish words
      const detected = detectHexFromName(value);
      if (detected && (item.hex === "#94a3b8" || item.hex === "#18181B" || item.hex === "#FFFFFF" || !item.hex)) {
        item.hex = detected;
      }
    } else {
      item.hex = value;
    }

    next[index] = item;
    onChange(next);
  };

  return (
    <div className="pt-3 border-t border-gray-200 dark:border-white/10 space-y-3">
      {/* Header (Mandatory & Always Active) */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#8c9276]" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Colores & Acabados del Producto <span className="text-red-500">*</span>
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cada producto cuenta con al menos un tono para garantizar simetría visual y catálogo interactivo.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full shadow-2xs">
          Siempre Activo
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#1a1a1c] border border-gray-200/80 dark:border-white/10 space-y-4">
          {/* Quick Presets Palette */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Paleta rápida de autor
              </span>
              <span className="text-[10px] text-gray-400">Clic para agregar</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LUXURY_COLOR_PRESETS.map((preset) => {
                const isAlreadyAdded = colors.some(
                  (c) => c.hex.toLowerCase() === preset.hex.toLowerCase()
                );
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addVariant(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                      isAlreadyAdded
                        ? "border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/5 text-gray-500 opacity-60"
                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#242426] text-gray-800 dark:text-gray-200 hover:border-gray-400 hover:scale-105 shadow-2xs"
                    }`}
                    title={`Agregar ${preset.name} (${preset.hex})`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-2xs"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] font-medium">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Active Variants */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Variantes configuradas ({colors.length})
              </span>
              <button
                type="button"
                onClick={() => addVariant()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c9276] hover:text-[#7a8064] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar variante personalizada
              </button>
            </div>

            {colors.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                No has agregado ninguna variante. Clic en la paleta rápida arriba o en agregar.
              </p>
            ) : (
              <div className="space-y-2">
                {colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 shadow-2xs"
                  >
                    {/* Visual Color Swatch Picker */}
                    <label
                      className="relative w-9 h-9 rounded-full shrink-0 cursor-pointer overflow-hidden border-2 border-white dark:border-[#202022] shadow-sm hover:scale-105 transition-transform ring-1 ring-black/15 dark:ring-white/20"
                      style={{ backgroundColor: color.hex || "#94a3b8" }}
                      title="Haz clic para abrir el selector visual de color"
                    >
                      <input
                        type="color"
                        value={color.hex && color.hex.startsWith("#") && color.hex.length === 7 ? color.hex : "#18181B"}
                        onChange={(e) => updateVariant(idx, "hex", e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>

                    {/* Color Name Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => updateVariant(idx, "name", e.target.value)}
                        placeholder="Ej: Rojo Terracota, Blanco Nieve"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-gray-900 dark:focus:border-white font-medium"
                      />
                    </div>

                    {/* HEX Input */}
                    <div className="w-24 shrink-0">
                      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#151517]">
                        <span className="text-[10px] text-gray-400 select-none">#</span>
                        <input
                          type="text"
                          maxLength={7}
                          value={color.hex.replace("#", "").toUpperCase()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "");
                            updateVariant(idx, "hex", val ? `#${val}` : "#");
                          }}
                          placeholder="FFFFFF"
                          className="w-full text-xs font-mono bg-transparent text-gray-700 dark:text-gray-300 outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      disabled={colors.length <= 1}
                      onClick={() => removeVariant(idx)}
                      className={`p-2 rounded-lg transition-colors shrink-0 ${
                        colors.length <= 1 
                          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" 
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                      }`}
                      title={colors.length <= 1 ? "Todo producto debe conservar al menos 1 color" : "Eliminar este color"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Customer Preview Strip */}
          {colors.length > 0 && (
            <div className="p-3 rounded-xl bg-white/70 dark:bg-[#202022]/70 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Así lo verá el cliente:
              </span>
              <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#2c2c2e] rounded-full border border-gray-200 dark:border-white/10">
                {colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs shrink-0"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
