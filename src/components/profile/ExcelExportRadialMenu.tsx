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
  Loader2 
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
      
      // If store is empty, attempt immediate refresh from API
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

      // Fallback sample if no orders yet in DB
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

      // Auto column widths
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

      // Group products by niche / category
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

      // Append Grand Total summary row
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

  // 3 Bouncing sub-buttons around the circular trigger
  const subButtons = [
    {
      id: "orders",
      label: "Exportar Pedidos",
      icon: ShoppingBag,
      onClick: handleExportOrders,
      x: -54,
      y: -28,
      color: "hover:text-[#8c9276] dark:hover:text-[#ccff00]",
      border: "hover:border-[#8c9276] dark:hover:border-[#ccff00]",
    },
    {
      id: "products",
      label: "Exportar Catálogo",
      icon: Package,
      onClick: handleExportProducts,
      x: -68,
      y: 16,
      color: "hover:text-emerald-600 dark:hover:text-emerald-400",
      border: "hover:border-emerald-500",
    },
    {
      id: "niches",
      label: "Inventario por Nicho",
      icon: Layers,
      onClick: handleExportNiches,
      x: -40,
      y: 56,
      color: "hover:text-amber-600 dark:hover:text-amber-400",
      border: "hover:border-amber-500",
    },
  ];

  return (
    <div ref={menuRef} className="relative inline-flex items-center justify-center select-none">
      {/* 3 Bouncing Orbiting Sub-Buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            {subButtons.map((btn, index) => {
              const Icon = btn.icon;
              const isExporting = activeExport === btn.id;
              const isSuccess = successExport === btn.id;

              return (
                <motion.div
                  key={btn.id}
                  className="absolute z-30 pointer-events-auto"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{ 
                    x: btn.x, 
                    y: btn.y, 
                    scale: 1, 
                    opacity: 1 
                  }}
                  exit={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0, 
                    opacity: 0,
                    transition: { duration: 0.16, ease: "easeIn" }
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 340,
                    damping: 14,
                    mass: 0.7,
                    bounce: 0.55,
                    delay: index * 0.05,
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/80 dark:border-white/10 bg-white/95 dark:bg-[#202022]/95 backdrop-blur-xl shadow-lg hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer text-gray-700 dark:text-gray-200 ${btn.color} ${btn.border}`}
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#8c9276] dark:text-[#ccff00]" />
                      ) : isSuccess ? (
                        <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                      ) : (
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      )}
                    </button>

                    {/* Tooltip pill on hover */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2.5 px-2.5 py-1 rounded-xl bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 text-[10px] font-semibold tracking-tight whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md z-40">
                      {btn.label}
                      <span className="text-[9px] opacity-75 font-normal ml-1">(.xlsx)</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main Central Circular Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Exportar datos a Excel"
        title={isOpen ? "Cerrar menú de reportes" : "Exportar reportes a Excel (.xlsx)"}
        className={`relative z-20 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer backdrop-blur-xl shadow-sm hover:shadow-md active:scale-95 ${
          isOpen
            ? "border-[#8c9276] dark:border-[#ccff00] bg-[#8c9276]/15 dark:bg-[#ccff00]/15 text-[#4a5035] dark:text-[#ccff00]"
            : "border-white/80 dark:border-white/10 bg-white/90 dark:bg-[#202022]/90 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20"
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0, scale: isOpen ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
        >
          {isOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
          )}
        </motion.div>

        {/* Small subtle green indicator dot */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#8c9276] dark:bg-[#ccff00] border-2 border-white dark:border-[#202022]" />
        )}
      </button>
    </div>
  );
}
