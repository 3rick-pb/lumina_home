"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Package, 
  Layers, 
  X, 
  Check, 
  Loader2,
  Sparkles,
  FileSpreadsheet,
  ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { useUserStore, Order } from "@/lib/userStore";
import { useCatalogStore, CatalogProduct } from "@/lib/catalogStore";
import { DROPI_HEADERS, DROPI_ECUADOR_REFERENCE } from "@/lib/dropiEcuadorData";
import { useBrand } from "@/core/hooks/useBrand";
import { exportCatalogToExcel } from "@/lib/exportCatalogExcel";
import { exportNicheToExcel } from "@/lib/exportNicheExcel";

export const NORMAL_ORDER_HEADERS = [
  "Nº",
  "ID Pedido",
  "Fecha",
  "Hora",
  "Estado Actual",
  "Nº Seguimiento / Guía",
  "Cliente",
  "Cédula / RUC",
  "Email",
  "Teléfono",
  "Destinatario",
  "Ciudad",
  "Provincia / Estado",
  "Dirección de Envío",
  "Método de Pago",
  "Total Piezas",
  "Detalle Productos",
  "Total Compra (USD)",
] as const;

export const PRODUCT_CATALOG_HEADERS = [
  "Nº",
  "ID Producto",
  "Título / Nombre",
  "Subtítulo / Resalte",
  "Categoría / Nicho",
  "Precio Actual (USD)",
  "Precio Anterior (USD)",
  "Descuento",
  "Stock Unidades",
  "Estado Stock",
  "Insignia / Badge",
  "Colores",
  "Garantía",
  "Envíos",
  "Dimensiones",
  "Materiales",
  "Descripción",
] as const;

export const NICHE_INVENTORY_HEADERS = [
  "Nº",
  "Nicho / Colección",
  "Variedad Productos",
  "% del Catálogo",
  "Stock Total (Unidades)",
  "Disponibles",
  "Agotados",
  "Precio Promedio (USD)",
  "Valor Total Inventario (USD)",
] as const;

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

/**
 * Official Dropi Isotipo (Iconic Smiling Character)
 * Brand Color: #FF5500 (Dropi Official Vibrant Orange)
 */
function DropiIsotipo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="6 1 52 46" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M27.1204 9.15337C24.9081 7.62606 22.3744 6.50662 19.6434 5.89038C18.8366 6.38027 18.2469 6.83691 17.5132 7.41547C20.3084 7.9896 22.9109 9.10238 25.163 10.6496C25.8103 10.0666 26.3423 9.61887 27.1204 9.15558" fill="#FF5500" />
      <path d="M31.7112 19.2527C30.2792 19.3059 29.1863 21.1214 29.2661 23.3092C29.3481 25.4971 30.5718 27.2262 32.0038 27.173C33.4357 27.1198 34.5286 25.3043 34.4488 23.1186C34.3668 20.9307 33.1431 19.2017 31.7112 19.2549" fill="#FF5500" />
      <path d="M48.5137 22.6132C48.4406 20.6159 47.4852 19.0288 46.3857 19.0709C45.2818 19.1108 44.4461 20.7644 44.5214 22.7617C44.5946 24.7589 45.55 26.3461 46.6539 26.3062C47.7534 26.2663 48.5891 24.6126 48.5137 22.6154" fill="#FF5500" />
      <path d="M32.017 9.64112C25.6351 10.3239 23.2899 16.7745 23.0793 17.3907C23.0704 17.4173 23.0615 17.4461 23.0638 17.4749C23.0638 17.4838 23.0638 17.4927 23.066 17.5015C23.0682 17.5193 23.0748 17.5348 23.0815 17.5503C23.097 17.5813 23.1192 17.6057 23.148 17.6257C23.1768 17.6456 23.2123 17.6545 23.2455 17.6567C23.3231 17.6589 23.3896 17.6102 23.4251 17.5437C23.9926 16.4752 25.2539 15.1895 25.2539 15.1895C28.1555 11.9598 32.3362 11.7248 32.3362 11.7248C34.2603 11.6539 34.3822 10.9734 34.3822 10.9734C34.8411 9.11354 32.017 9.6389 32.017 9.6389" fill="#FF5500" />
      <path d="M23.5204 31.981L23.465 31.9323C23.465 31.9323 23.485 31.95 23.5204 31.981Z" fill="#FF5500" />
      <path d="M55.2215 23.347C54.7759 11.3192 44.0648 1.95143 31.3011 2.42359C28.0425 2.54329 24.9613 3.29475 22.1904 4.54719C24.7662 5.3319 27.147 6.54887 29.224 8.12273C30.758 7.51535 32.4936 7.12078 34.431 6.98999C43.9096 6.34936 50.7836 12.5207 52.0006 20.4432C54.1774 34.6323 43.5439 36.4366 35.5549 35.9977C34.9209 35.9623 34.3025 35.9113 33.7017 35.8448C33.6884 35.8448 33.6774 35.8426 33.6641 35.8404C33.0988 35.7761 32.5513 35.6985 32.017 35.6054C31.9173 35.5877 31.8153 35.5699 31.7178 35.55C31.6934 35.5455 31.6712 35.5411 31.6469 35.5367C26.7524 34.5569 23.9394 32.3313 23.5249 31.9855C22.6759 33.1404 21.317 34.1778 19.2466 34.5037C19.2466 34.5037 16.1388 35.0423 13.3391 32.5862C13.2261 32.4865 13.3591 32.2604 13.4987 32.3202C15.3275 33.1448 19.3198 34.4039 22.1771 30.139C22.1815 30.1479 22.3101 29.9373 22.3101 29.9373C22.381 29.8264 22.4498 29.7156 22.5185 29.5981C22.5251 29.5826 22.6803 29.2678 22.7402 29.1459C23.4162 27.6873 23.7776 25.9605 23.7111 24.1207C23.7089 24.032 23.7044 23.9433 23.7 23.8547C23.7 23.8414 23.7 23.8281 23.6956 23.8148C23.6933 23.7749 23.6889 23.735 23.6845 23.6951C23.6756 23.5776 23.6601 23.4645 23.649 23.3492C23.6357 23.2229 23.6268 23.0965 23.6091 22.9746C23.5891 22.8239 23.567 22.6732 23.5404 22.5246C23.5359 22.5003 23.5337 22.4737 23.5271 22.447L23.4805 22.2963L23.5293 22.4493C23.1392 20.3035 22.166 18.4481 20.8493 17.1602C21.4478 15.3713 22.4143 13.5869 23.6047 12.1394C21.2616 10.5434 18.5262 9.44831 15.5846 8.98281C14.2967 10.2375 12.9601 11.9687 12.0202 13.4827L11.998 9.18453C13.4677 8.73232 14.494 7.30698 14.3566 5.68435C14.2103 3.97528 12.7495 2.62309 11.036 2.60757C9.10301 2.59206 7.57126 4.18586 7.6422 6.09444C7.69762 7.62175 8.76607 8.87197 10.1781 9.23108L10.2535 17.0582C9.37788 19.9111 8.88577 22.0946 8.99439 25.0583C9.03429 26.1113 9.15177 27.162 9.35128 28.1972C9.54635 29.2146 9.819 30.2188 10.1648 31.1941C10.5062 32.1584 10.9207 33.0983 11.3995 34.0027C11.8761 34.9027 12.4192 35.7694 13.0199 36.5918C13.6229 37.4164 14.2812 38.1989 14.9928 38.9304C15.7066 39.6686 16.4735 40.3558 17.2804 40.9898C18.0962 41.6282 18.9562 42.2134 19.8496 42.7365C20.7562 43.2663 21.6961 43.7362 22.6648 44.1419C23.649 44.5542 24.6598 44.8978 25.6906 45.1749C26.7435 45.4564 27.8142 45.667 28.8937 45.8044C29.4279 45.8731 29.9622 45.9219 30.4986 45.9552C30.9575 45.984 31.4318 46.0483 31.8973 45.9995C32.3917 45.9485 32.8151 45.7158 33.2495 45.4919C33.7416 45.237 34.2227 44.9599 34.6793 44.6429C35.3687 44.1641 36.0115 43.5899 36.4815 42.8895C36.5147 42.8385 36.5413 42.7919 36.5635 42.7365C35.9517 42.69 35.2822 42.5725 34.5906 42.3597C34.584 42.3575 34.5751 42.3552 34.5663 42.353C34.564 42.353 34.5596 42.353 34.5552 42.3464C34.4599 42.302 34.369 42.2222 34.3645 42.1092C34.3601 42.0072 34.4133 41.9185 34.4909 41.8587C34.4909 41.8587 36.8051 40.1873 38.3635 38.4006L38.3901 38.4051C38.4543 38.3541 38.5275 38.3208 38.6073 38.3386C38.6805 38.3541 38.7403 38.4073 38.7891 38.4627C38.7891 38.4627 40.8329 40.6439 41.4358 41.0984C41.5023 41.1494 41.5489 41.2247 41.5511 41.3156C41.5511 41.3245 41.5466 41.3333 41.5466 41.3444C41.5466 41.3511 41.5511 41.3577 41.5533 41.3644C41.5577 41.4397 41.5112 41.4996 41.4469 41.5528C41.4136 41.5794 41.376 41.606 41.3405 41.6282C41.3316 41.6348 41.3205 41.6392 41.3117 41.6459C41.0612 41.8055 40.4782 42.1402 39.6359 42.404C39.1881 43.6875 38.9442 44.4323 38.5053 45.0064C38.962 44.9022 39.4652 44.787 40.0371 44.654C49.1898 41.4708 55.5806 33.0229 55.2215 23.3515M10.9695 24.4399C10.8276 20.6116 13.1241 17.4174 16.0967 17.3065C19.0693 17.1957 21.5963 20.2104 21.7382 24.0409C21.8801 27.8691 19.5836 31.0634 16.611 31.1742C13.6362 31.285 11.1113 28.2703 10.9695 24.4399Z" fill="#FF5500" />
    </svg>
  );
}

export function ExcelExportRadialMenu() {
  const brand = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  const [ordersSubmenuOpen, setOrdersSubmenuOpen] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [successExport, setSuccessExport] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileXOffset, setMobileXOffset] = useState(-130);
  const menuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCloseMenu = () => {
    setIsOpen(false);
    setOrdersSubmenuOpen(false);
  };

  const handleToggleMenu = () => {
    if (isOpen) {
      handleCloseMenu();
    } else {
      setOrdersSubmenuOpen(false);
      setIsOpen(true);
    }
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
      const target = event.target as Node;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        (!modalRef.current || !modalRef.current.contains(target))
      ) {
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
        const customerName = (ord.customerName || ord.recipient || ord.shippingAddress?.recipient || `Cliente ${brand.shortName}`).trim();
        const nameParts = customerName.split(/\s+/).filter(Boolean);
        let nombres = "Cliente";
        let apellidos = brand.shortName;
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

        const orderNote = ord.id ? `Orden #${ord.id}` : `Entrega ${brand.name}`;
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

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows, { header: NORMAL_ORDER_HEADERS as unknown as string[] });
      const colWidths = NORMAL_ORDER_HEADERS.map(key => ({
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

  // 2. EXPORT ALL PRODUCTS TO EXCEL (WITH PROFESSIONAL CHARTS)
  const handleExportProducts = async () => {
    setActiveExport("products");
    try {
      let prods: CatalogProduct[] = useCatalogStore.getState().products;
      if (prods.length === 0) {
        await useCatalogStore.getState().fetchProducts();
        prods = useCatalogStore.getState().products;
      }

      await exportCatalogToExcel(prods, getDateSlug(), brand.name || "Lumina Home");

      setSuccessExport("products");
      setTimeout(() => setSuccessExport(null), 2500);
    } catch (err) {
      console.error("Error al exportar catálogo:", err);
    } finally {
      setActiveExport(null);
    }
  };

  // 3. EXPORT NICHE INVENTORY TO EXCEL (WITH PROFESSIONAL CHARTS)
  const handleExportNiches = async () => {
    setActiveExport("niches");
    try {
      let prods: CatalogProduct[] = useCatalogStore.getState().products;
      if (prods.length === 0) {
        await useCatalogStore.getState().fetchProducts();
        prods = useCatalogStore.getState().products;
      }

      await exportNicheToExcel(prods, getDateSlug(), brand.name || "Lumina Home");

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
      originX: 0,
      originY: 0,
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
      originX: 0,
      originY: 0,
      accentColor: "text-amber-500 dark:text-amber-300",
      glowColor: "rgba(245, 158, 11, 0.45)",
      badgeColor: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      borderGlow: "border-amber-400/50 dark:border-amber-400/40",
      bgGradient: "from-amber-500/15 via-white/80 to-amber-50/90 dark:from-amber-950/40 dark:via-[#2b241a] dark:to-[#1f1a14]",
    },
  ];

  const renderOrdersSubmenuContent = () => (
    <>
      {/* Submenu Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShoppingBag className="w-4 h-4" />
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
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Cerrar opciones"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Options List */}
      <div className="space-y-2.5">
        {/* Option #1: Para Carga masiva de Órdenes - Dropi EC (Branding Naranja Dropi Oficial) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleExportOrdersDropi();
          }}
          disabled={activeExport !== null}
          className="w-full text-left p-3.5 rounded-2xl border border-orange-500/35 bg-gradient-to-r from-orange-500/12 via-orange-500/5 to-transparent hover:border-orange-500/60 hover:bg-orange-500/18 dark:from-orange-950/45 dark:via-orange-900/20 dark:to-[#1a1410] hover:shadow-[0_8px_24px_rgba(255,85,0,0.16)] transition-all group flex items-start gap-3 cursor-pointer relative overflow-hidden active:scale-[0.98]"
        >
          {/* Subtle orange ambient glow on hover */}
          <div className="pointer-events-none absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-orange-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Dropi Official Icon Container */}
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 dark:bg-orange-500/25 border border-orange-500/40 flex items-center justify-center text-orange-500 shrink-0 mt-0.5 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-200 shadow-xs">
            {activeExport === "orders-dropi" ? (
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            ) : successExport === "orders-dropi" ? (
              <Check className="w-5 h-5 text-emerald-500 stroke-[3]" />
            ) : (
              <DropiIsotipo className="w-6 h-6 shrink-0" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
              <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Para Carga masiva de Órdenes - Dropi EC
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/40 shrink-0 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
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
          className="w-full text-left p-3.5 rounded-2xl border border-sky-500/25 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent hover:border-sky-500/50 hover:bg-sky-500/15 dark:from-sky-950/50 dark:to-[#141e24] transition-all group flex items-start gap-3 cursor-pointer active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-300 shrink-0 mt-0.5 group-hover:scale-108 transition-transform shadow-sm">
            {activeExport === "orders-normal" ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
            ) : successExport === "orders-normal" ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
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
    </>
  );

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

      {/* SVG Gooey Filter ("Touching pieces merge like goo and morph like jelly while text stays crisp") */}
      <svg className="sr-only pointer-events-none absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="excel-gooey-jelly" x="-120%" y="-120%" width="340%" height="340%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* 2. RADIAL INTERACTIVE MENU CONTAINER: Exactly 44x44px (w-11 h-11) for Pixel-Perfect Vertical Alignment */}
      <div 
        ref={menuRef} 
        className={`relative inline-flex items-center justify-center w-11 h-11 shrink-0 select-none ${isOpen ? "z-50" : "z-20"}`}
      >
        {/* GOOEY LIQUID LAYER: Merges touching pieces like goo and morphs like jelly while text/icons above stay 100% crisp */}
        <div
          aria-hidden="true"
          style={{ filter: "url(#excel-gooey-jelly)" }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-30 overflow-visible"
        >
          {/* Central Gooey Anchor Blob */}
          <motion.div
            animate={
              isOpen
                ? { scaleX: [1, 1.24, 0.88, 1.04], scaleY: [1, 0.86, 1.18, 1.04] }
                : { scaleX: [1.04, 1.18, 0.92, 1], scaleY: [1.04, 0.88, 1.12, 1] }
            }
            transition={{ duration: 0.48, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-11 h-11 rounded-full bg-emerald-500/85 dark:bg-[#1b3a28]"
          />

          <AnimatePresence>
            {isOpen &&
              subButtons.map((btn, index) => (
                <React.Fragment key={`gooey-blob-${btn.id}`}>
                  {/* Viscous Tendril Droplet that bridges the center hub and the emerging satellite */}
                  <motion.div
                    initial={{ x: 0, y: 0, scale: 0.9 }}
                    animate={{
                      x: [0, btn.targetX * 0.48, btn.targetX],
                      y: [0, btn.targetY * 0.48, btn.targetY],
                      scale: [0.95, 0.72, 0.35],
                    }}
                    exit={{
                      x: [btn.targetX, btn.targetX * 0.42, 0],
                      y: [btn.targetY, btn.targetY * 0.42, 0],
                      scale: [0.4, 0.8, 0.9],
                      transition: {
                        duration: 0.28,
                        ease: [0.4, 0, 0.2, 1],
                        delay: (2 - index) * 0.025,
                      },
                    }}
                    transition={{
                      duration: 0.46,
                      ease: [0.22, 1, 0.36, 1],
                      delay: index * 0.045,
                    }}
                    className="absolute w-9 h-9 rounded-full bg-emerald-500/85 dark:bg-[#1b3a28]"
                  />

                  {/* Satellite Gooey Blob that detaches from the central hub and morphs like jelly */}
                  <motion.div
                    initial={{ x: 0, y: 0, scaleX: 0.45, scaleY: 0.45 }}
                    animate={{
                      x: btn.targetX,
                      y: btn.targetY,
                      scaleX: [0.45, 1.22, 0.9, 1.02, 1],
                      scaleY: [0.45, 0.82, 1.14, 0.97, 1],
                    }}
                    exit={{
                      x: 0,
                      y: 0,
                      scaleX: [1, 1.16, 0.4],
                      scaleY: [1, 0.84, 0.4],
                      transition: {
                        duration: 0.28,
                        ease: [0.4, 0, 0.2, 1],
                        delay: (2 - index) * 0.025,
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 230,
                      damping: 15,
                      mass: 0.75,
                      delay: index * 0.045,
                    }}
                    className="absolute w-[50px] h-[50px] rounded-full bg-emerald-500/85 dark:bg-[#1b3a28]"
                  />
                </React.Fragment>
              ))}
          </AnimatePresence>
        </div>

        {/* Liquid Glass Emergence Orbit (Crisp Foreground Layer) */}
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
                    className={`absolute ${isSubmenuActive ? "z-[70]" : "z-50"} pointer-events-auto`}
                    style={{ willChange: "transform, opacity" }}
                    initial={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scaleX: 0.35,
                      scaleY: 0.35,
                      opacity: 0
                    }}
                    animate={{ 
                      x: btn.targetX, 
                      y: btn.targetY, 
                      scaleX: [0.35, 1.16, 0.92, 1.02, 1],
                      scaleY: [0.35, 0.86, 1.1, 0.98, 1],
                      opacity: 1
                    }}
                    exit={{ 
                      x: btn.originX, 
                      y: btn.originY, 
                      scaleX: 0.3,
                      scaleY: 0.3,
                      opacity: 0,
                      transition: { 
                        duration: 0.26, 
                        ease: [0.4, 0, 0.2, 1],
                        delay: (2 - index) * 0.025 
                      }
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 230,
                      damping: 15,
                      mass: 0.75,
                      delay: index * 0.045,
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
                          isSubmenuActive 
                            ? "border-emerald-400 ring-2 ring-emerald-400/80 scale-105 shadow-[0_0_24px_rgba(16,185,129,0.5)]" 
                            : btn.borderGlow
                        } ${
                          ordersSubmenuOpen && !isOrdersTrigger 
                            ? "opacity-50 hover:opacity-100 hover:scale-110" 
                            : "hover:scale-115"
                        } bg-gradient-to-br ${btn.bgGradient} backdrop-blur-2xl active:scale-90 transition-all duration-200 cursor-pointer text-gray-800 dark:text-gray-100 overflow-hidden shrink-0`}
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

                      {/* Regular Description Capsule (Shown when submenu is NOT open) */}
                      {!ordersSubmenuOpen && (
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

                      {/* Orders Submenu Flyout: Desktop Only (Rendered alongside satellite bubble) */}
                      <AnimatePresence>
                        {isSubmenuActive && !isMobile && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94, x: 12 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.94, x: 12 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-full mr-12 top-1/2 -translate-y-1/2 w-[360px] z-[80] p-4 rounded-3xl bg-white/95 dark:bg-[#151c17]/95 backdrop-blur-2xl border border-emerald-500/30 dark:border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.35),0_0_30px_rgba(16,185,129,0.15)] pointer-events-auto text-left"
                          >
                            {renderOrdersSubmenuContent()}
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
          onClick={handleToggleMenu}
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

      {/* 4. ORDERS SUBMENU FOR MOBILE: Rendered via Portal into document.body to avoid ancestor CSS transform clipping */}
      {mounted && isMobile && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {ordersSubmenuOpen && (
            <div ref={modalRef}>
              {/* Mobile Submenu Backdrop */}
              <motion.div
                key="mobile-orders-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOrdersSubmenuOpen(false)}
                className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm pointer-events-auto"
                aria-hidden="true"
              />

              {/* Mobile Centered Modal Dialog */}
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  key="mobile-orders-card"
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm rounded-3xl bg-white/95 dark:bg-[#151c17]/95 backdrop-blur-2xl border border-emerald-500/30 dark:border-emerald-500/30 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_35px_rgba(16,185,129,0.2)] pointer-events-auto max-h-[85vh] overflow-y-auto text-left"
                >
                  {renderOrdersSubmenuContent()}
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
