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
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { useUserStore, Order } from "@/lib/userStore";
import { useCatalogStore, CatalogProduct } from "@/lib/catalogStore";
import { DROPI_HEADERS, DROPI_ECUADOR_REFERENCE } from "@/lib/dropiEcuadorData";

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
  const [ordersSubmenuOpen, setOrdersSubmenuOpen] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [successExport, setSuccessExport] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileXOffset, setMobileXOffset] = useState(-130);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCloseMenu = () => {
    setIsOpen(false);
    setOrdersSubmenuOpen(false);
  };

  // Detect mobile viewport and calculate safe X offset so satellites and labels never cut off
  useEffect(() => {
    const updateMobileLayout = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        // Target bubble center at 38px from the left edge of the viewport (left edge at 38 - 25 = 13px)
        // Trigger button center is rect.left + 22px.
        const offset = 38 - (rect.left + 22);
        setMobileXOffset(offset);
      }
    };

    updateMobileLayout();
    window.addEventListener("resize", updateMobileLayout);
    return () => window.removeEventListener("resize", updateMobileLayout);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
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
      if (e.key === "Escape") {
        if (ordersSubmenuOpen) {
          setOrdersSubmenuOpen(false);
        } else {
          handleCloseMenu();
        }
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, ordersSubmenuOpen]);

  // Helper to format current date for filenames
  const getDateSlug = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // 1.A EXPORT ORDERS SPECIFICALLY FOR DROPI ECUADOR (MASSIVE UPLOAD FORMAT)
  const handleExportOrdersDropi = async () => {
    setActiveExport("orders-dropi");
    try {
      let ordersList: Order[] = useUserStore.getState().orders;
      if (ordersList.length === 0) {
        await useUserStore.getState().refreshOrders();
        ordersList = useUserStore.getState().orders;
      }

      const rows: Record<string, string | number>[] = [];

      ordersList.forEach((ord) => {
        const customerName = (ord.customerName || ord.recipient || ord.shippingAddress?.recipient || "Cliente Lumina").trim();
        const nameParts = customerName.split(/\s+/).filter(Boolean);
        let nombres = "Cliente";
        let apellidos = "Lumina";
        if (nameParts.length === 1) {
          nombres = nameParts[0];
          apellidos = "";
        } else if (nameParts.length === 2) {
          nombres = nameParts[0];
          apellidos = nameParts[1];
        } else if (nameParts.length === 3) {
          nombres = `${nameParts[0]} ${nameParts[1]}`;
          apellidos = nameParts[2];
        } else {
          nombres = nameParts.slice(0, 2).join(" ");
          apellidos = nameParts.slice(2).join(" ");
        }

        const direccion = ord.shippingAddress 
          ? `${ord.shippingAddress.street}${ord.shippingAddress.state ? ` (${ord.shippingAddress.state})` : ""}`.trim()
          : "Dirección de Entrega";

        // IMPORTANT (User Requirement): In DEPARTAMENTO column, put the Ciudad!
        const rawCity = (ord.shippingAddress?.city || "Quito").trim();
        const ciudadUpper = rawCity.toUpperCase();
        const departamentoVal = ciudadUpper;
        const ciudadVal = ciudadUpper;

        const rawPhone = ord.customerPhone || ord.shippingAddress?.phone || "";
        const telefono = rawPhone.replace(/\D/g, "") || "0999999999";

        const isContraEntrega = (ord.paymentMethod || "").toLowerCase().includes("contra") || 
                                (ord.paymentMethod || "").toLowerCase().includes("efectivo") || 
                                (ord.paymentMethod || "").toLowerCase().includes("cod");
        const conRecaudo = isContraEntrega ? "SÍ" : "NO";

        const orderNote = ord.id ? `Orden #${ord.id}` : "Entrega Lumina Home";
        const emailVal = ord.customerEmail || ord.shippingAddress?.email || "";
        const postalVal = ord.shippingAddress?.postalCode || "";
        const cedulaVal = ord.customerIdNumber || ord.shippingAddress?.idNumber || "";

        if (ord.items && ord.items.length > 0) {
          ord.items.forEach((it) => {
            const itemPrice = typeof it.product?.price === "number" ? it.product.price : Number(ord.total || 0);
            const itemQty = it.quantity || 1;
            const lineTotal = Math.round(itemPrice * itemQty);
            const variant = [it.color, it.size].filter(Boolean).join(" - ");

            rows.push({
              "NOMBRES": nombres,
              "APELLIDOS": apellidos,
              "DIRECCIÓN Y BARRIO": direccion,
              "DEPARTAMENTO": departamentoVal,
              "CIUDAD": ciudadVal,
              "TELÉFONO": telefono,
              "ID DE PRODUCTO": it.product?.id || it.productId || "PROD-01",
              "CANTIDAD": itemQty,
              "PRECIO TOTAL (SIN PUNTOS NI COMAS)": lineTotal || Math.round(Number(ord.total || 0)),
              "CON RECAUDO": conRecaudo,
              "NOTA": orderNote,
              "EMAIL (OPCIONAL)": emailVal,
              "ID DE VARIABLE (OPCIONAL)": variant,
              "CODIGO POSTAL (OPCIONAL)": postalVal,
              "TRANSPORTADORA (OPCIONAL)": "",
              "CEDULA (OPCIONAL)": cedulaVal,
              "COLONIA (OBLIGATORIO SOLO PARA QUIKEN)": "",
              "SEGURO (SOLO APLICA PARA ENVIA)": "",
            });
          });
        } else {
          rows.push({
            "NOMBRES": nombres,
            "APELLIDOS": apellidos,
            "DIRECCIÓN Y BARRIO": direccion,
            "DEPARTAMENTO": departamentoVal,
            "CIUDAD": ciudadVal,
            "TELÉFONO": telefono,
            "ID DE PRODUCTO": ord.id || "PROD-01",
            "CANTIDAD": 1,
            "PRECIO TOTAL (SIN PUNTOS NI COMAS)": Math.round(Number(ord.total || 0)),
            "CON RECAUDO": conRecaudo,
            "NOTA": orderNote,
            "EMAIL (OPCIONAL)": emailVal,
            "ID DE VARIABLE (OPCIONAL)": "",
            "CODIGO POSTAL (OPCIONAL)": postalVal,
            "TRANSPORTADORA (OPCIONAL)": "",
            "CEDULA (OPCIONAL)": cedulaVal,
            "COLONIA (OBLIGATORIO SOLO PARA QUIKEN)": "",
            "SEGURO (SOLO APLICA PARA ENVIA)": "",
          });
        }
      });

      if (rows.length === 0) {
        rows.push({
          "NOMBRES": "Juan Carlos",
          "APELLIDOS": "Pérez Mero",
          "DIRECCIÓN Y BARRIO": "Av. 6 de Diciembre y Eloy Alfaro, Edificio Lumina",
          "DEPARTAMENTO": "QUITO",
          "CIUDAD": "QUITO",
          "TELÉFONO": "0991234567",
          "ID DE PRODUCTO": "PROD-01",
          "CANTIDAD": 1,
          "PRECIO TOTAL (SIN PUNTOS NI COMAS)": 45,
          "CON RECAUDO": "SÍ",
          "NOTA": "Orden de Prueba Lumina",
          "EMAIL (OPCIONAL)": "cliente@ejemplo.com",
          "ID DE VARIABLE (OPCIONAL)": "",
          "CODIGO POSTAL (OPCIONAL)": "170515",
          "TRANSPORTADORA (OPCIONAL)": "",
          "CEDULA (OPCIONAL)": "1712345678",
          "COLONIA (OBLIGATORIO SOLO PARA QUIKEN)": "",
          "SEGURO (SOLO APLICA PARA ENVIA)": "",
        });
      }

      let wb: XLSX.WorkBook;
      try {
        const res = await fetch("/templates/formato-ordenes-masivas-dropiEC.xlsx");
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          wb = XLSX.read(arrayBuffer, { type: "array" });
        } else {
          throw new Error("Template not found");
        }
      } catch {
        wb = XLSX.utils.book_new();
        const refWs = XLSX.utils.aoa_to_sheet(DROPI_ECUADOR_REFERENCE);
        XLSX.utils.book_append_sheet(wb, refWs, "Ecuador");
      }

      const ws = XLSX.utils.json_to_sheet(rows, { header: DROPI_HEADERS as unknown as string[] });
      ws["!cols"] = DROPI_HEADERS.map(h => ({ wch: Math.max(h.length + 3, 16) }));

      wb.Sheets["Hoja1"] = ws;
      if (!wb.SheetNames.includes("Hoja1")) {
        wb.SheetNames.unshift("Hoja1");
      }

      XLSX.writeFile(wb, `ordenes_masivas_dropi_ec_${getDateSlug()}.xlsx`);

      setSuccessExport("orders-dropi");
      setTimeout(() => {
        setSuccessExport(null);
        handleCloseMenu();
      }, 1600);
    } catch (err) {
      console.error("Error al exportar para Dropi EC:", err);
    } finally {
      setActiveExport(null);
    }
  };

  // 1.B NORMAL ORDERS EXPORT (DETAILED WITH DELIVERY STATUS)
  const handleExportOrdersNormal = async () => {
    setActiveExport("orders-normal");
    try {
      let ordersList: Order[] = useUserStore.getState().orders;
      if (ordersList.length === 0) {
        await useUserStore.getState().refreshOrders();
        ordersList = useUserStore.getState().orders;
      }

      const rows = ordersList.map((ord, idx) => {
        const itemsSummary = (ord.items || [])
          .map(it => `${it.product?.title || 'Producto'} (x${it.quantity || 1})`)
          .join(" | ");

        const totalUnits = (ord.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

        return {
          "Nº": idx + 1,
          "ID Pedido": ord.id,
          "Fecha": ord.date || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("es-ES") : "Reciente"),
          "Hora": ord.time || (ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""),
          "Estado Actual": ord.status, // Procesando / Enviado / Entregado
          "Nº Seguimiento / Guía": ord.trackingNumber || "Pendiente de Despacho",
          "Cliente": ord.customerName || "Cliente",
          "Cédula / RUC": ord.customerIdNumber || ord.shippingAddress?.idNumber || "N/A",
          "Email": ord.customerEmail || ord.shippingAddress?.email || "",
          "Teléfono": ord.customerPhone || ord.shippingAddress?.phone || "N/A",
          "Destinatario": ord.recipient || ord.customerName || "",
          "Ciudad": ord.shippingAddress?.city || "",
          "Provincia / Estado": ord.shippingAddress?.state || "",
          "Dirección de Envío": ord.shippingAddress ? `${ord.shippingAddress.street}, ${ord.shippingAddress.city}, ${ord.shippingAddress.state}` : "No especificada",
          "Método de Pago": ord.paymentMethod || "Tarjeta",
          "Total Piezas": totalUnits,
          "Detalle Productos": itemsSummary || "Sin productos",
          "Total Compra (USD)": Number(ord.total || 0).toFixed(2),
        };
      });

      if (rows.length === 0) {
        rows.push({
          "Nº": 1,
          "ID Pedido": "ORD-SAMPLE-01",
          "Fecha": new Date().toLocaleDateString("es-ES"),
          "Hora": "10:30",
          "Estado Actual": "Procesando",
          "Nº Seguimiento / Guía": "TRK-98234-EC",
          "Cliente": "Cliente de Prueba",
          "Cédula / RUC": "1723456789",
          "Email": "cliente@lumina.com",
          "Teléfono": "0991234567",
          "Destinatario": "Cliente de Prueba",
          "Ciudad": "Quito",
          "Provincia / Estado": "Pichincha",
          "Dirección de Envío": "Av. República y Eloy Alfaro",
          "Método de Pago": "Tarjeta Visa",
          "Total Piezas": 1,
          "Detalle Productos": "Lámpara Eclipse Minimal (x1)",
          "Total Compra (USD)": "120.00",
        });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 3, 16)
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Pedidos Lumina");
      XLSX.writeFile(wb, `pedidos_lumina_normal_${getDateSlug()}.xlsx`);

      setSuccessExport("orders-normal");
      setTimeout(() => {
        setSuccessExport(null);
        handleCloseMenu();
      }, 1600);
    } catch (err) {
      console.error("Error al exportar pedidos en formato normal:", err);
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
      XLSX.writeFile(wb, `catalogo_productos_${getDateSlug()}.xlsx`);

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
        "Nicho / Colección": "TOTAL CATÁLOGO",
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
      XLSX.writeFile(wb, `inventario_por_nicho_${getDateSlug()}.xlsx`);

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
      onClick: () => setOrdersSubmenuOpen(prev => !prev),
      targetX: isMobile ? mobileXOffset : -67,
      targetY: isMobile ? 65 : -67,
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
      onClick: () => {
        setOrdersSubmenuOpen(false);
        handleExportProducts();
      },
      targetX: isMobile ? mobileXOffset : -95,
      targetY: isMobile ? 128 : 0,
      originX: isMobile ? mobileXOffset : -67,
      originY: isMobile ? 65 : -67,
      accentColor: "text-sky-500 dark:text-cyan-300",
      glowColor: "rgba(6, 182, 212, 0.45)",
      badgeColor: "bg-sky-500/20 text-sky-700 dark:text-cyan-300 border-sky-500/30",
      borderGlow: "border-sky-400/50 dark:border-cyan-400/40",
      bgGradient: "from-sky-500/15 via-white/80 to-sky-50/90 dark:from-sky-950/40 dark:via-[#1a232b] dark:to-[#141b22]",
    },
    {
      id: "niches",
      label: "Exportar Inventario por Nicho",
      icon: Layers,
      onClick: () => {
        setOrdersSubmenuOpen(false);
        handleExportNiches();
      },
      targetX: isMobile ? mobileXOffset : -67,
      targetY: isMobile ? 191 : 67,
      originX: isMobile ? mobileXOffset : -95,
      originY: isMobile ? 128 : 0,
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
            onClick={handleCloseMenu}
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
                style={{ willChange: "transform, opacity" }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.6, opacity: 0.8 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute -inset-12 rounded-full bg-gradient-to-tr from-emerald-500/30 via-emerald-400/20 to-transparent blur-2xl pointer-events-none -z-10"
              />

              {subButtons.map((btn, index) => {
                const Icon = btn.icon;
                const isExporting = btn.id === "orders" 
                  ? (activeExport === "orders" || activeExport === "orders-dropi" || activeExport === "orders-normal")
                  : activeExport === btn.id;
                const isSuccess = btn.id === "orders"
                  ? (successExport === "orders" || successExport === "orders-dropi" || successExport === "orders-normal")
                  : successExport === btn.id;
                const isOrdersTrigger = btn.id === "orders";
                const isSubmenuActive = isOrdersTrigger && ordersSubmenuOpen;

                return (
                  <motion.div
                    key={btn.id}
                    className="absolute z-50 pointer-events-auto"
                    style={{ willChange: "transform, opacity" }}
                    initial={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scale: 0.2, 
                      opacity: 0
                    }}
                    animate={{ 
                      x: btn.targetX, 
                      y: btn.targetY, 
                      scale: 1, 
                      opacity: 1
                    }}
                    exit={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scale: 0.2, 
                      opacity: 0,
                      transition: { 
                        duration: 0.16, 
                        ease: [0.32, 0, 0.67, 0],
                        delay: (2 - index) * 0.03 
                      }
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 18,
                      mass: 0.6,
                      delay: index * 0.05,
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
                        className={`relative w-[50px] h-[50px] rounded-full flex items-center justify-center border ${
                          isSubmenuActive ? "border-emerald-400 ring-2 ring-emerald-400/70" : btn.borderGlow
                        } bg-gradient-to-br ${btn.bgGradient} backdrop-blur-2xl hover:scale-115 active:scale-90 transition-all duration-200 cursor-pointer text-gray-800 dark:text-gray-100 overflow-hidden shrink-0`}
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

                      {/* Regular Description Capsule (Shown when submenu is NOT expanded for this button) */}
                      {!isSubmenuActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            btn.onClick();
                          }}
                          disabled={isExporting}
                          className={`absolute ${isMobile ? "left-full ml-3" : "right-full mr-3"} top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-[#1a1f1c]/95 backdrop-blur-xl border border-white/80 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.15)] text-gray-900 dark:text-white text-xs font-bold tracking-tight whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 z-50 flex items-center gap-2 opacity-100 pointer-events-auto`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{btn.label}</span>
                          {isOrdersTrigger ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              2 opciones
                              <ChevronRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            </span>
                          ) : (
                            <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md border ${btn.badgeColor}`}>
                              .xlsx
                            </span>
                          )}
                        </button>
                      )}

                      {/* Orders Submenu Flyout: 2 Exclusive Modalities */}
                      <AnimatePresence>
                        {isSubmenuActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94, x: isMobile ? 0 : 12 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.94, x: isMobile ? 0 : 12 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${
                              isMobile
                                ? "fixed inset-x-4 top-24 max-w-sm mx-auto z-[80]"
                                : "absolute right-full mr-3.5 top-1/2 -translate-y-1/2 w-[360px] z-[60]"
                            } p-3.5 rounded-3xl bg-white/95 dark:bg-[#151c17]/95 backdrop-blur-2xl border border-emerald-500/30 dark:border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.35),0_0_30px_rgba(16,185,129,0.15)] pointer-events-auto text-left`}
                          >
                            {/* Submenu Header */}
                            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/10">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                    Exportar Pedidos
                                  </h4>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Selecciona el destino o formato
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrdersSubmenuOpen(false);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                title="Cerrar opciones"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Options List */}
                            <div className="space-y-2">
                              {/* Option #1: Para Carga masiva de Órdenes - Dropi EC */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportOrdersDropi();
                                }}
                                disabled={activeExport !== null}
                                className="w-full text-left p-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent hover:border-emerald-500/50 hover:bg-emerald-500/15 dark:from-emerald-950/50 dark:to-[#17221b] transition-all group flex items-start gap-3 cursor-pointer"
                              >
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5 group-hover:scale-108 transition-transform shadow-sm">
                                  {activeExport === "orders-dropi" ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                  ) : successExport === "orders-dropi" ? (
                                    <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                                  ) : (
                                    <UploadCloud className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5 mb-1">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                      Para Carga masiva de Órdenes - Dropi EC
                                    </span>
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                                      Dropi EC
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                                    Formato oficial para subir órdenes masivas en Dropi Ecuador (Cantones/Provincias y Ciudad en Departamento).
                                  </p>
                                </div>
                              </button>

                              {/* Option #2: Exportación Normal */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportOrdersNormal();
                                }}
                                disabled={activeExport !== null}
                                className="w-full text-left p-3 rounded-2xl border border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent hover:border-sky-500/50 hover:bg-sky-500/15 dark:from-sky-950/50 dark:to-[#141e24] transition-all group flex items-start gap-3 cursor-pointer"
                              >
                                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-300 shrink-0 mt-0.5 group-hover:scale-108 transition-transform shadow-sm">
                                  {activeExport === "orders-normal" ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                                  ) : successExport === "orders-normal" ? (
                                    <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                                  ) : (
                                    <FileSpreadsheet className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5 mb-1">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                      Exportación Normal
                                    </span>
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 shrink-0">
                                      Estándar
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                                    Reporte detallado con cliente, dirección, ítems y en qué estado va cada pedido (Procesando / Enviado / Entregado).
                                  </p>
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
