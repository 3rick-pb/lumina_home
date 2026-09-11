"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSpreadsheet, 
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

export function ExcelExportRadialMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [successExport, setSuccessExport] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // 3 Liquid Glass sub-buttons:
  // Designed so each emerges sequentially out of the previous one:
  // - Circle 1 starts from Center (0, 0) and blooms to P1 (-58, -26)
  // - Circle 2 starts from P1 (-58, -26) (as if budding off Circle 1) and blooms to P2 (-76, 18)
  // - Circle 3 starts from P2 (-76, 18) (as if budding off Circle 2) and blooms to P3 (-44, 60)
  const subButtons = [
    {
      id: "orders",
      label: "Exportar Pedidos",
      icon: ShoppingBag,
      onClick: handleExportOrders,
      // Target position
      targetX: -58,
      targetY: -26,
      // Origin point when emerging (center trigger)
      originX: 0,
      originY: 0,
      accentColor: "text-[#8c9276] dark:text-[#ccff00]",
      glowColor: "rgba(204, 255, 0, 0.25)",
      badgeBg: "bg-[#8c9276]/20 text-[#494e37] dark:text-[#cbd1b2]",
    },
    {
      id: "products",
      label: "Exportar Catálogo",
      icon: Package,
      onClick: handleExportProducts,
      // Target position
      targetX: -76,
      targetY: 18,
      // Origin point when emerging (emerges directly from Circle 1)
      originX: -58,
      originY: -26,
      accentColor: "text-emerald-600 dark:text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.25)",
      badgeBg: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    },
    {
      id: "niches",
      label: "Inventario por Nicho",
      icon: Layers,
      onClick: handleExportNiches,
      // Target position
      targetX: -44,
      targetY: 60,
      // Origin point when emerging (emerges directly from Circle 2)
      originX: -76,
      originY: 18,
      accentColor: "text-amber-600 dark:text-amber-400",
      glowColor: "rgba(245, 158, 11, 0.25)",
      badgeBg: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    },
  ];

  return (
    <>
      {/* 1. CINEMATIC FULLSCREEN BACKDROP: Dims the page for high-focus spotlight */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 dark:bg-black/65 backdrop-blur-[3.5px] pointer-events-auto"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 2. RADIAL INTERACTIVE MENU CONTAINER */}
      <div 
        ref={menuRef} 
        className={`relative inline-flex items-center justify-center select-none ${isOpen ? "z-50" : "z-20"}`}
      >
        {/* Liquid Glass Emergence Orbit */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Subtle ambient light bloom behind the active glass bubbles */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 0.6 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute -inset-10 rounded-full bg-gradient-to-tr from-[#8c9276]/25 via-[#ccff00]/15 to-transparent blur-2xl pointer-events-none -z-10"
              />

              {subButtons.map((btn, index) => {
                const Icon = btn.icon;
                const isExporting = activeExport === btn.id;
                const isSuccess = successExport === btn.id;

                return (
                  <motion.div
                    key={btn.id}
                    className="absolute z-50 pointer-events-auto"
                    // Sequential budding: each orb starts at the position of the previous orb
                    initial={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scale: 0.15, 
                      opacity: 0,
                      filter: "blur(4px)"
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
                      scale: 0.15, 
                      opacity: 0,
                      filter: "blur(4px)",
                      transition: { 
                        duration: 0.18, 
                        ease: [0.32, 0, 0.67, 0],
                        delay: (2 - index) * 0.04 
                      }
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 270,
                      damping: 14.5,
                      mass: 0.65,
                      bounce: 0.52,
                      delay: index * 0.085, // Fluid sequential extrusion
                    }}
                  >
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          btn.onClick();
                        }}
                        disabled={isExporting}
                        title={btn.label}
                        style={{
                          boxShadow: `0 14px 32px rgba(0,0,0,0.18), inset 0 1.5px 1.5px rgba(255,255,255,0.75), inset 0 -1.5px 2px rgba(0,0,0,0.12), 0 0 20px ${btn.glowColor}`
                        }}
                        className={`relative w-11 h-11 rounded-full flex items-center justify-center border border-white/80 dark:border-white/25 bg-white/60 dark:bg-[#1f1f22]/75 backdrop-blur-2xl hover:scale-115 active:scale-95 transition-all duration-200 cursor-pointer text-gray-800 dark:text-gray-100 overflow-hidden`}
                      >
                        {/* Liquid glass glossy top specular highlight reflection */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 via-white/15 to-transparent rounded-t-full opacity-85 dark:opacity-40" />

                        {/* Liquid ripple gradient glow on hover */}
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        {isExporting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#8c9276] dark:text-[#ccff00] relative z-10" />
                        ) : isSuccess ? (
                          <Check className="w-4 h-4 text-emerald-500 stroke-[3] relative z-10" />
                        ) : (
                          <Icon className={`w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-115 ${btn.accentColor}`} />
                        )}
                      </button>

                      {/* Floating Glass Tooltip Pill */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#1f1f22]/90 backdrop-blur-xl border border-white/70 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-gray-900 dark:text-white text-[11px] font-bold tracking-tight whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-x-0.5 z-50 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#8c9276] dark:text-[#ccff00]" />
                        <span>{btn.label}</span>
                        <span className="text-[9px] font-mono opacity-60 font-normal">.xlsx</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* 3. MAIN CENTRAL LIQUID GLASS TRIGGER BUTTON */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Exportar datos a Excel"
          title={isOpen ? "Cerrar menú" : "Exportar reportes a Excel (.xlsx)"}
          style={{
            boxShadow: isOpen 
              ? "0 0 28px rgba(204, 255, 0, 0.35), 0 14px 34px rgba(0,0,0,0.22), inset 0 2px 2px rgba(255,255,255,0.9), inset 0 -2px 2px rgba(0,0,0,0.15)"
              : "0 8px 24px rgba(0,0,0,0.08), inset 0 1.5px 1.5px rgba(255,255,255,0.85), inset 0 -1.5px 1.5px rgba(0,0,0,0.08)"
          }}
          className={`relative z-50 w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer backdrop-blur-3xl overflow-hidden active:scale-95 ${
            isOpen
              ? "border-[#8c9276] dark:border-[#ccff00] bg-white/80 dark:bg-[#232327]/85 text-[#3b4028] dark:text-[#ccff00] scale-105"
              : "border-white/85 dark:border-white/20 bg-white/60 dark:bg-[#1f1f22]/70 text-gray-700 dark:text-gray-200 hover:scale-108 hover:border-[#8c9276]/60 dark:hover:border-[#ccff00]/40"
          }`}
        >
          {/* Liquid glass top reflection highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 via-white/20 to-transparent rounded-t-full opacity-90 dark:opacity-40" />

          {/* Liquid glow wave on open */}
          {isOpen && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#8c9276] dark:border-[#ccff00]"
            />
          )}

          <motion.div
            animate={{ 
              rotate: isOpen ? 90 : 0, 
              scale: isOpen ? 1.1 : 1 
            }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="relative z-10"
          >
            {isOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
            )}
          </motion.div>

          {/* Green active status indicator pip */}
          {!isOpen && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#8c9276] dark:bg-[#ccff00] border-2 border-white dark:border-[#1f1f22] shadow-xs" />
          )}
        </button>
      </div>
    </>
  );
}
