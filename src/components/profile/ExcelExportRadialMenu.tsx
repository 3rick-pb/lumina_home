"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Package, 
  Layers, 
  X, 
  Check, 
  Loader2,
  Sparkles
} from "lucide-react";
import * as XLSX from "xlsx";
import { useUserStore, Order } from "@/lib/userStore";
import { useCatalogStore, CatalogProduct } from "@/lib/catalogStore";

/**
 * Excel 2025 Fluent Modern Icon
 * Multi-layer 3D emerald spreadsheet sheet + front badge with bold X
 */
function Excel2025Icon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="exBackGrad" x1="7" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#107C41" />
          <stop offset="0.6" stopColor="#0E6837" />
          <stop offset="1" stopColor="#084222" />
        </linearGradient>
        <linearGradient id="exFrontGrad" x1="2.5" y1="8" x2="15" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22C55E" />
          <stop offset="0.45" stopColor="#16A34A" />
          <stop offset="1" stopColor="#107C41" />
        </linearGradient>
        <filter id="exShadow" x="0.5" y="6.5" width="17" height="17" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Back Spreadsheet Card */}
      <rect x="7.5" y="3.5" width="16" height="21" rx="3.5" fill="url(#exBackGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      
      {/* Grid lines inside back card */}
      <path d="M12.5 8.5H20.5M12.5 13.5H20.5M12.5 18.5H20.5" stroke="white" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 5.5V22.5" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />

      {/* Front Excel Badge with 3D Shadow */}
      <g filter="url(#exShadow)">
        <rect x="2.5" y="8" width="12" height="12" rx="2.8" fill="url(#exFrontGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        {/* Bold Modern X */}
        <path d="M5.5 11.2L11.5 16.8M11.5 11.2L5.5 16.8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Specular gloss sheen across top */}
      <path d="M7.5 4.5C9 6.5 14 7.5 23 5V9.5C16 10.5 10 9 7.5 7V4.5Z" fill="white" fillOpacity="0.22" />
    </svg>
  );
}

export function ExcelExportRadialMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [successExport, setSuccessExport] = useState<string | null>(null);
  const [isTouchOrMobile, setIsTouchOrMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detect mobile / tablet / touch devices to permanently display descriptions
  useEffect(() => {
    const updateDevice = () => {
      setIsTouchOrMobile(
        window.innerWidth <= 1024 ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  // Helper to format current date for filenames
  const getDateSlug = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // 1. EXPORT ALL ORDERS TO EXCEL
  const handleExportOrders = async () => {
    setActiveExport("orders");
    try {
      let ordersList: Order[] = useUserStore.getState().orders;
      if (ordersList.length === 0) {
        await useUserStore.getState().refreshOrders();
        ordersList = useUserStore.getState().orders;
      }

      const rows = ordersList.map((ord, idx) => {
        const itemsSummary = (ord.items || [])
          .map(it => `${it.product.title} (x${it.quantity})`)
          .join(" | ");

        const totalUnits = (ord.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

        return {
          "Nº": idx + 1,
          "ID Pedido": ord.id,
          "Fecha": ord.date || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("es-ES") : "Reciente"),
          "Hora": ord.time || (ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""),
          "Cliente": ord.customerName || "Cliente",
          "Email": ord.customerEmail || "",
          "Destinatario": ord.recipient || ord.customerName || "",
          "Ciudad": ord.shippingAddress?.city || "",
          "Dirección de Envío": ord.shippingAddress ? `${ord.shippingAddress.street}, ${ord.shippingAddress.city}, ${ord.shippingAddress.state}` : "No especificada",
          "Estado": ord.status,
          "Método de Pago": ord.paymentMethod || "Tarjeta",
          "Nº Seguimiento": ord.trackingNumber || "N/A",
          "Total Piezas": totalUnits,
          "Productos": itemsSummary,
          "Total Compra (USD)": Number(ord.total || 0).toFixed(2),
        };
      });

      if (rows.length === 0) {
        rows.push({
          "Nº": 1,
          "ID Pedido": "ORD-SAMPLE-01",
          "Fecha": new Date().toLocaleDateString("es-ES"),
          "Hora": "10:30",
          "Cliente": "Cliente de Prueba",
          "Email": "cliente@lumina.com",
          "Destinatario": "Cliente de Prueba",
          "Ciudad": "Quito",
          "Dirección de Envío": "Av. República y Eloy Alfaro",
          "Estado": "Procesando",
          "Método de Pago": "Tarjeta Visa",
          "Nº Seguimiento": "TRK-98234-EC",
          "Total Piezas": 1,
          "Productos": "Lámpara Eclipse Minimal (x1)",
          "Total Compra (USD)": "120.00",
        });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 3, 14)
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Pedidos Lumina Home");
      XLSX.writeFile(wb, `pedidos_lumina_home_${getDateSlug()}.xlsx`);

      setSuccessExport("orders");
      setTimeout(() => setSuccessExport(null), 2500);
    } catch (err) {
      console.error("Error al exportar pedidos:", err);
    } finally {
      setActiveExport(null);
    }
  };

  // 2. EXPORT ALL PRODUCTS TO EXCEL
  const handleExportProducts = async () => {
    setActiveExport("products");
    try {
      let prods: CatalogProduct[] = useCatalogStore.getState().products;
      if (prods.length === 0) {
        await useCatalogStore.getState().fetchProducts();
        prods = useCatalogStore.getState().products;
      }

      const rows = prods.map((p, idx) => {
        const colorsList = (p.colors || []).map(c => c.name).join(", ");
        const stockQty = typeof p.stock === "number" ? p.stock : 10;
        const isOutOfStock = stockQty === 0 || (p.badge && p.badge.toUpperCase() === "AGOTADO");

        return {
          "Nº": idx + 1,
          "ID Producto": p.id,
          "Título / Nombre": p.title,
          "Subtítulo / Resalte": p.titleHighlight || "",
          "Categoría / Nicho": p.category || "General",
          "Precio Actual (USD)": Number(p.price || 0).toFixed(2),
          "Precio Anterior (USD)": p.oldPrice ? Number(p.oldPrice).toFixed(2) : "",
          "Descuento": p.discount || "",
          "Stock Unidades": stockQty,
          "Estado Stock": isOutOfStock ? "AGOTADO" : "DISPONIBLE",
          "Insignia / Badge": p.badge || "Ninguna",
          "Colores": colorsList || "Estándar",
          "Garantía": p.warranty || "1 Año",
          "Envíos": p.shipping || "Nacional",
          "Dimensiones": p.dimensions || "N/A",
          "Materiales": p.materials || "Acabados de autor",
          "Descripción": p.description || "",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 3, 16)
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Catálogo de Productos");
      XLSX.writeFile(wb, `catalogo_productos_lumina_${getDateSlug()}.xlsx`);

      setSuccessExport("products");
      setTimeout(() => setSuccessExport(null), 2500);
    } catch (err) {
      console.error("Error al exportar catálogo:", err);
    } finally {
      setActiveExport(null);
    }
  };

  // 3. EXPORT NICHE INVENTORY TO EXCEL
  const handleExportNiches = async () => {
    setActiveExport("niches");
    try {
      let prods: CatalogProduct[] = useCatalogStore.getState().products;
      if (prods.length === 0) {
        await useCatalogStore.getState().fetchProducts();
        prods = useCatalogStore.getState().products;
      }

      const nicheMap = new Map<string, {
        count: number;
        totalStock: number;
        totalValue: number;
        prices: number[];
        inStockCount: number;
        outOfStockCount: number;
      }>();

      prods.forEach(p => {
        const cat = p.category || "General";
        const current = nicheMap.get(cat) || {
          count: 0,
          totalStock: 0,
          totalValue: 0,
          prices: [],
          inStockCount: 0,
          outOfStockCount: 0,
        };

        const stock = typeof p.stock === "number" ? p.stock : 10;
        const price = Number(p.price || 0);
        const isOutOfStock = stock === 0 || (p.badge && p.badge.toUpperCase() === "AGOTADO");

        current.count += 1;
        current.totalStock += stock;
        current.totalValue += stock * price;
        current.prices.push(price);
        if (isOutOfStock) current.outOfStockCount += 1;
        else current.inStockCount += 1;

        nicheMap.set(cat, current);
      });

      const totalCatalogProducts = prods.length || 1;
      const rows: Record<string, string | number>[] = [];
      let grandTotalStock = 0;
      let grandTotalValue = 0;

      Array.from(nicheMap.entries())
        .sort((a, b) => b[1].totalValue - a[1].totalValue)
        .forEach(([niche, data], idx) => {
          grandTotalStock += data.totalStock;
          grandTotalValue += data.totalValue;
          const avgPrice = data.prices.length > 0 
            ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length 
            : 0;
          const pct = ((data.count / totalCatalogProducts) * 100).toFixed(1);

          rows.push({
            "Nº": idx + 1,
            "Nicho / Colección": niche,
            "Variedad Productos": data.count,
            "% del Catálogo": `${pct}%`,
            "Stock Total (Unidades)": data.totalStock,
            "Disponibles": data.inStockCount,
            "Agotados": data.outOfStockCount,
            "Precio Promedio (USD)": avgPrice.toFixed(2),
            "Valor Total Inventario (USD)": data.totalValue.toFixed(2),
          });
        });

      rows.push({
        "Nº": "TOTAL",
        "Nicho / Colección": "TOTAL CATÁLOGO LUMINA HOME",
        "Variedad Productos": prods.length,
        "% del Catálogo": "100%",
        "Stock Total (Unidades)": grandTotalStock,
        "Disponibles": rows.reduce((acc, r) => acc + (typeof r["Disponibles"] === "number" ? r["Disponibles"] : 0), 0),
        "Agotados": rows.reduce((acc, r) => acc + (typeof r["Agotados"] === "number" ? r["Agotados"] : 0), 0),
        "Precio Promedio (USD)": (rows.length > 0 ? (grandTotalValue / (grandTotalStock || 1)).toFixed(2) : "0.00"),
        "Valor Total Inventario (USD)": grandTotalValue.toFixed(2),
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 3, 18)
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Inventario por Nicho");
      XLSX.writeFile(wb, `inventario_por_nicho_lumina_${getDateSlug()}.xlsx`);

      setSuccessExport("niches");
      setTimeout(() => setSuccessExport(null), 2500);
    } catch (err) {
      console.error("Error al exportar inventario por nicho:", err);
    } finally {
      setActiveExport(null);
    }
  };

  /**
   * EQUIDISTANT RADIAL ARCHITECTURE (Exact Trigonometry):
   * Radius R = 95px
   * Sat 1: 135 deg (up-left)     -> (-67, -67) (distance = 95px)
   * Sat 2: 180 deg (pure left)   -> (-95, 0)   (distance = 95px)
   * Sat 3: 225 deg (down-left)   -> (-67, 67)  (distance = 95px)
   * Distance between Sat 1 and Sat 2 = 72.7px
   * Distance between Sat 2 and Sat 3 = 72.7px (100% IDENTICAL)
   */
  const subButtons = [
    {
      id: "orders",
      label: "Exportar Pedidos",
      icon: ShoppingBag,
      onClick: handleExportOrders,
      targetX: -67,
      targetY: -67,
      originX: 0,
      originY: 0,
      accentColor: "text-emerald-500 dark:text-emerald-300",
      glowColor: "rgba(16, 185, 129, 0.45)",
      badgeColor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      borderGlow: "border-emerald-400/50 dark:border-emerald-400/40",
      bgGradient: "from-emerald-500/15 via-white/80 to-emerald-50/90 dark:from-emerald-950/40 dark:via-[#1f2822] dark:to-[#171f1a]",
    },
    {
      id: "products",
      label: "Exportar Catálogo",
      icon: Package,
      onClick: handleExportProducts,
      targetX: -95,
      targetY: 0,
      originX: -67,
      originY: -67,
      accentColor: "text-sky-500 dark:text-cyan-300",
      glowColor: "rgba(6, 182, 212, 0.45)",
      badgeColor: "bg-sky-500/20 text-sky-700 dark:text-cyan-300 border-sky-500/30",
      borderGlow: "border-sky-400/50 dark:border-cyan-400/40",
      bgGradient: "from-sky-500/15 via-white/80 to-sky-50/90 dark:from-sky-950/40 dark:via-[#1a232b] dark:to-[#141b22]",
    },
    {
      id: "niches",
      label: "Inventario por Nicho",
      icon: Layers,
      onClick: handleExportNiches,
      targetX: -67,
      targetY: 67,
      originX: -95,
      originY: 0,
      accentColor: "text-amber-500 dark:text-amber-300",
      glowColor: "rgba(245, 158, 11, 0.45)",
      badgeColor: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      borderGlow: "border-amber-400/50 dark:border-amber-400/40",
      bgGradient: "from-amber-500/15 via-white/80 to-amber-50/90 dark:from-amber-950/40 dark:via-[#2b241a] dark:to-[#1f1a14]",
    },
  ];

  return (
    <>
      {/* 1. CINEMATIC FULLSCREEN BACKDROP: Dims page for spotlight focus */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 backdrop-blur-[4px] pointer-events-auto"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 2. RADIAL INTERACTIVE MENU CONTAINER: Exactly 44x44px (w-11 h-11) for Pixel-Perfect Vertical Alignment */}
      <div 
        ref={menuRef} 
        className={`relative inline-flex items-center justify-center w-11 h-11 shrink-0 select-none ${isOpen ? "z-50" : "z-20"}`}
      >
        {/* Liquid Glass Emergence Orbit */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Vibrant ambient light bloom behind bubbles */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.6, opacity: 0.8 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute -inset-12 rounded-full bg-gradient-to-tr from-emerald-500/30 via-emerald-400/20 to-transparent blur-2xl pointer-events-none -z-10"
              />

              {subButtons.map((btn, index) => {
                const Icon = btn.icon;
                const isExporting = activeExport === btn.id;
                const isSuccess = successExport === btn.id;

                return (
                  <motion.div
                    key={btn.id}
                    className="absolute z-50 pointer-events-auto"
                    // Sequential budding: each orb starts at the position of previous orb
                    initial={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scale: 0.1, 
                      opacity: 0,
                      filter: "blur(6px)"
                    }}
                    animate={{ 
                      x: btn.targetX, 
                      y: btn.targetY, 
                      scale: 1, 
                      opacity: 1,
                      filter: "blur(0px)"
                    }}
                    exit={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scale: 0.1, 
                      opacity: 0,
                      filter: "blur(6px)",
                      transition: { 
                        duration: 0.2, 
                        ease: [0.32, 0, 0.67, 0],
                        delay: (2 - index) * 0.04 
                      }
                    }}
                    // Exaggerated liquid spring bounce
                    transition={{
                      type: "spring",
                      stiffness: 230,
                      damping: 10,
                      mass: 0.75,
                      bounce: 0.75,
                      delay: index * 0.08,
                    }}
                  >
                    <div className="relative group flex items-center">
                      {/* Interactive Circular Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          btn.onClick();
                        }}
                        disabled={isExporting}
                        title={btn.label}
                        style={{
                          boxShadow: `0 16px 36px rgba(0,0,0,0.22), inset 0 2px 2px rgba(255,255,255,0.85), inset 0 -2px 2px rgba(0,0,0,0.12), 0 0 24px ${btn.glowColor}`
                        }}
                        className={`relative w-[50px] h-[50px] rounded-full flex items-center justify-center border ${btn.borderGlow} bg-gradient-to-br ${btn.bgGradient} backdrop-blur-2xl hover:scale-115 active:scale-90 transition-all duration-200 cursor-pointer text-gray-800 dark:text-gray-100 overflow-hidden shrink-0`}
                      >
                        {/* Liquid glass glossy top specular highlight */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/20 to-transparent rounded-t-full opacity-90 dark:opacity-40" />

                        {/* Liquid ripple glow on hover */}
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/15 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        {isExporting ? (
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-500 relative z-10" />
                        ) : isSuccess ? (
                          <Check className="w-5 h-5 text-emerald-500 stroke-[3] relative z-10" />
                        ) : (
                          <Icon className={`w-5 h-5 relative z-10 transition-transform duration-200 group-hover:scale-115 ${btn.accentColor}`} />
                        )}
                      </button>

                      {/* Interactive Description Capsule (Always visible on mobile/tablets, hoverable on desktop) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          btn.onClick();
                        }}
                        disabled={isExporting}
                        className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-[#1a1f1c]/95 backdrop-blur-xl border border-white/80 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.15)] text-gray-900 dark:text-white text-xs font-bold tracking-tight whitespace-nowrap cursor-pointer active:scale-95 transition-all duration-200 z-50 flex items-center gap-2 ${
                          isTouchOrMobile 
                            ? "opacity-100 pointer-events-auto translate-x-0 scale-100" 
                            : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto group-hover:-translate-x-0.5"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{btn.label}</span>
                        <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md border ${btn.badgeColor}`}>
                          .xlsx
                        </span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* 3. MAIN CENTRAL LIQUID GLASS TRIGGER BUTTON WITH EXCEL 2025 ICON */}
        {/* Perfectly circular, 100% symmetric, vibrant energetic emerald styling */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Exportar datos a Excel"
          title={isOpen ? "Cerrar menú" : "Exportar reportes a Excel (.xlsx)"}
          style={{
            boxShadow: isOpen 
              ? "0 0 32px rgba(34, 197, 94, 0.5), 0 16px 36px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.9), inset 0 -2px 2px rgba(0,0,0,0.2)"
              : "0 4px 18px rgba(16, 124, 65, 0.3), 0 8px 24px rgba(0,0,0,0.08), inset 0 1.5px 1.5px rgba(255,255,255,0.85), inset 0 -1.5px 1.5px rgba(0,0,0,0.1)"
          }}
          className={`relative z-50 w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer backdrop-blur-3xl overflow-hidden active:scale-95 ${
            isOpen
              ? "border-emerald-400 bg-emerald-600 text-white scale-105"
              : "border-emerald-500/40 dark:border-emerald-400/50 bg-gradient-to-br from-white via-emerald-50/80 to-emerald-100/70 dark:from-[#1b3826] dark:via-[#142c1e] dark:to-[#0f2317] hover:scale-108 hover:border-emerald-500 dark:hover:border-emerald-300"
          }`}
        >
          {/* Liquid glass top specular reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/25 to-transparent rounded-t-full opacity-90 dark:opacity-40" />

          {/* Liquid pulse wave on open */}
          {isOpen && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-400"
            />
          )}

          <motion.div
            animate={{ 
              rotate: isOpen ? 90 : 0, 
              scale: isOpen ? 1.05 : 1 
            }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="relative z-10 flex items-center justify-center"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Excel2025Icon className="w-6 h-6 transition-transform duration-200" />
            )}
          </motion.div>
        </button>
      </div>
    </>
  );
}
