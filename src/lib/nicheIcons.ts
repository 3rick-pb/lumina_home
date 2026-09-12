import {
  Lamp,
  Bed,
  Flame,
  Sofa,
  Armchair,
  Laptop,
  Palette,
  Coffee,
  Utensils,
  Wine,
  Heart,
  Flower2,
  Sun,
  Moon,
  Sparkles,
  Watch,
  Glasses,
  Feather,
  Box,
  Layers,
  Gem,
  Shirt,
  Gift,
  Crown,
  Compass,
  Headphones,
  Tv,
  Speaker,
  BookOpen,
  Fan,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "./supabase";

export interface NicheIconItem {
  id: string;
  name: string;
  label: string;
  category: string;
  icon: LucideIcon;
}

export const NICHE_ICONS_CATALOG: NicheIconItem[] = [
  { id: "lamp", name: "Lamp", label: "Iluminación", category: "iluminacion", icon: Lamp },
  { id: "bed", name: "Bed", label: "Textiles", category: "textiles", icon: Bed },
  { id: "flame", name: "Flame", label: "Aromaterapia", category: "aromaterapia", icon: Flame },
  { id: "sofa", name: "Sofa", label: "Salón & Sofás", category: "decoracion", icon: Sofa },
  { id: "armchair", name: "Armchair", label: "Sillones & Relax", category: "decoracion", icon: Armchair },
  { id: "laptop", name: "Laptop", label: "Home Office", category: "home office", icon: Laptop },
  { id: "palette", name: "Palette", label: "Arte & Decoración", category: "decoracion", icon: Palette },
  { id: "coffee", name: "Coffee", label: "Ritual Barista", category: "cocina", icon: Coffee },
  { id: "utensils", name: "Utensils", label: "Cocina & Mesa", category: "cocina", icon: Utensils },
  { id: "wine", name: "Wine", label: "Copas & Bodega", category: "cocina", icon: Wine },
  { id: "heart", name: "Heart", label: "Bienestar", category: "bienestar", icon: Heart },
  { id: "flower2", name: "Flower2", label: "Plantas & Flores", category: "decoracion", icon: Flower2 },
  { id: "sun", name: "Sun", label: "Exterior & Luz", category: "iluminacion", icon: Sun },
  { id: "moon", name: "Moon", label: "Noche & Descanso", category: "bienestar", icon: Moon },
  { id: "sparkles", name: "Sparkles", label: "Tendencias", category: "gadgets", icon: Sparkles },
  { id: "watch", name: "Watch", label: "Relojes & Tiempo", category: "gadgets", icon: Watch },
  { id: "glasses", name: "Glasses", label: "Lectura & Óptica", category: "gadgets", icon: Glasses },
  { id: "feather", name: "Feather", label: "Lino & Suavidad", category: "textiles", icon: Feather },
  { id: "box", name: "Box", label: "Almacenamiento", category: "almacenamiento", icon: Box },
  { id: "layers", name: "Layers", label: "Colecciones", category: "decoracion", icon: Layers },
  { id: "gem", name: "Gem", label: "Piezas de Autor", category: "ceramica", icon: Gem },
  { id: "shirt", name: "Shirt", label: "Ropa de Hogar", category: "textiles", icon: Shirt },
  { id: "gift", name: "Gift", label: "Packs de Regalo", category: "bienestar", icon: Gift },
  { id: "crown", name: "Crown", label: "Edición Limitada", category: "decoracion", icon: Crown },
  { id: "compass", name: "Compass", label: "Diseño Nórdico", category: "decoracion", icon: Compass },
  { id: "headphones", name: "Headphones", label: "Audio & Acústica", category: "gadgets", icon: Headphones },
  { id: "tv", name: "Tv", label: "Multimedia", category: "gadgets", icon: Tv },
  { id: "speaker", name: "Speaker", label: "Sonido Ambiente", category: "gadgets", icon: Speaker },
  { id: "bookopen", name: "BookOpen", label: "Libros & Revisteros", category: "home office", icon: BookOpen },
  { id: "fan", name: "Fan", label: "Ventilación & Aire", category: "gadgets", icon: Fan },
];

export interface NicheSlotConfig {
  id: string;
  label: string;
  iconName: string;
  category: string;
}

export const DEFAULT_NICHE_SLOTS: NicheSlotConfig[] = [
  { id: "slot1", label: "Iluminación", iconName: "Lamp", category: "iluminacion" },
  { id: "slot2", label: "Textiles", iconName: "Bed", category: "textiles" },
];

export const getNicheIconByName = (name: string): LucideIcon => {
  const found = NICHE_ICONS_CATALOG.find(
    (item) => item.name.toLowerCase() === (name || "").toLowerCase()
  );
  return found ? found.icon : Sparkles;
};

export const getSavedNicheSlots = (): NicheSlotConfig[] => {
  if (typeof window === "undefined") return DEFAULT_NICHE_SLOTS;
  try {
    const raw = localStorage.getItem("lumina_header_niches");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0]?.label && parsed[1]?.label) {
        return [
          {
            id: "slot1",
            label: parsed[0].label || "Iluminación",
            iconName: parsed[0].iconName || "Lamp",
            category: (parsed[0].category || parsed[0].label || "iluminacion").toLowerCase(),
          },
          {
            id: "slot2",
            label: parsed[1].label || "Textiles",
            iconName: parsed[1].iconName || "Bed",
            category: (parsed[1].category || parsed[1].label || "textiles").toLowerCase(),
          },
        ];
      }
    }
  } catch {}
  return DEFAULT_NICHE_SLOTS;
};

export const fetchNicheSlotsFromCloud = async (): Promise<NicheSlotConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('header_niche_slots')
      .select('*')
      .order('slot_id', { ascending: true });

    if (!error && data && data.length >= 2) {
      const s1 = data.find((d: { slot_id: string }) => d.slot_id === 'slot1') || data[0];
      const s2 = data.find((d: { slot_id: string }) => d.slot_id === 'slot2') || data[1];
      const slots: NicheSlotConfig[] = [
        { id: 'slot1', label: s1.label, iconName: s1.icon_name, category: s1.category },
        { id: 'slot2', label: s2.label, iconName: s2.icon_name, category: s2.category },
      ];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lumina_header_niches', JSON.stringify(slots));
        } catch {}
      }
      return slots;
    }
  } catch {}
  return getSavedNicheSlots();
};

export const saveNicheSlotsToCloud = async (slots: NicheSlotConfig[]): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lumina_header_niches', JSON.stringify(slots));
      window.dispatchEvent(new Event('lumina_header_niches_updated'));
    } catch {}
  }
  try {
    const rows = slots.map((s, idx) => ({
      slot_id: s.id || (idx === 0 ? 'slot1' : 'slot2'),
      label: s.label,
      icon_name: s.iconName,
      category: s.category,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('header_niche_slots').upsert(rows);
    return !error;
  } catch (err) {
    console.warn('Could not sync header niche slots to database:', err);
    return false;
  }
};

