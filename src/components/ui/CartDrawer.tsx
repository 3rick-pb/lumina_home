"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
 X, 
 Minus, 
 Plus, 
 ShoppingBag, 
 ArrowRight, 
 ArrowLeft, 
 Truck, 
 Sparkles, 
 CheckCircle2, 
 MapPin, 
 ShieldCheck, 
 Tag, 
 Check, 
 Lock,
 ChevronRight,
 Trash2,
 RotateCcw,
 CreditCard,
 Navigation,
 Loader2,
 AlertTriangle,
 Package
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { clsx } from "clsx";
import { useUserStore, Order, formatCleanName } from "@/lib/userStore";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";

// Official Card & Payment Gateway Logos
function MastercardLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#EB001B" />
      <circle cx="26" cy="12" r="11" fill="#F79E1B" fillOpacity="0.96" />
      <path
        d="M19 4.38a10.96 10.96 0 0 1 4.38 7.62A10.96 10.96 0 0 1 19 19.62a10.96 10.96 0 0 1-4.38-7.62A10.96 10.96 0 0 1 19 4.38z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function VisaLogo({ className = "h-4", fill = "#FFFFFF" }: { className?: string; fill?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.1 1.2L12.6 15.2H8.5L5.3 3.6C5.1 2.8 4.9 2.5 4.3 2.2C3.3 1.6 1.6 1.1 0.2 0.8L0.3 0.4H7C7.9 0.4 8.6 1 8.8 1.9L10.5 10.5L14.6 1.2H19.1ZM35.6 10.5C35.6 6.6 30.1 6.4 30.2 4.7C30.2 4.1 30.7 3.6 31.8 3.4C32.3 3.3 33.9 3.3 35.6 4.1L36.3 1C35.4 0.6 34.2 0.3 32.7 0.3C28.8 0.3 26 2.4 26 5.4C26 7.6 28 8.8 29.5 9.5C31 10.3 31.5 10.8 31.5 11.4C31.5 12.4 30.3 12.9 29.2 12.9C27.2 12.9 26 12.3 25.1 11.9L24.4 15.2C25.3 15.6 27.1 16 28.9 16C33.1 16 35.6 14 35.6 10.5ZM45.9 15.2H49.5L46.4 1.2H43.1C42.3 1.2 41.6 1.7 41.3 2.4L35.3 15.2H39.6L40.5 12.8H45.4L45.9 15.2ZM41.7 9.5L43.6 4.2L44.7 9.5H41.7ZM25.3 1.2L21.9 15.2H18L21.4 1.2H25.3Z"
        fill={fill}
      />
    </svg>
  );
}

function PayPhoneIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="24" fill="#FF5E00" />
      <path d="M32 25h36a7 7 0 017 7v36a7 7 0 01-7 7H32a7 7 0 01-7-7V32a7 7 0 017-7z" fill="#FFFFFF" />
      <path d="M42 38h16a3 3 0 013 3v18a3 3 0 01-3 3H42a3 3 0 01-3-3V41a3 3 0 013-3z" fill="#FF5E00" />
      <circle cx="50" cy="68" r="2.5" fill="#FF5E00" />
      <path d="M46 45h8M46 49h5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function EmvChip({ className = "w-8 h-6" }: { className?: string }) {
  return (
    <div className={`relative rounded-md bg-gradient-to-br from-[#E8D19F] via-[#D8B676] to-[#B8924B] p-0.5 border border-[#c49a3f]/40 shadow-xs flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      <div className="w-full h-full rounded-[3px] border border-black/15 flex flex-col justify-between p-[2px] opacity-80">
        <div className="h-px bg-black/30 w-full" />
        <div className="flex justify-between w-full h-[6px]">
          <div className="w-2 border-r border-black/30" />
          <div className="w-2 border-l border-black/30" />
        </div>
        <div className="h-px bg-black/30 w-full" />
      </div>
    </div>
  );
}

function ContactlessIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 16.5a5 5 0 0 1 0-9" />
      <path d="M12 19a8.5 8.5 0 0 1 0-14" />
      <path d="M15.5 21.5a12 12 0 0 1 0-19" />
    </svg>
  );
}

export function CartDrawer() {
 const { 
 isOpen, 
 setIsOpen, 
 items, 
 removeItem, 
 updateQuantity, 
 getSubtotal, 
 getDiscountAmount,
 getShipping,
 getTotal,
 couponCode,
 discountPercent,
 isFreeShippingCoupon,
 originCoords,
 applyCoupon,
 removeCoupon,
 clearCart 
 } = useCartStore();

 const { 
 user, 
 isAuthenticated, 
 address, 
 addresses,
 setAddress, 
 addAddress,
 addOrder 
 } = useUserStore();

 const { products } = useCatalogStore();
 const router = useRouter();
 const [isMounted, setIsMounted] = useState(false);

 // Multi-step checkout flow state: "bag" | "payment" | "success"
 const [step, setStep] = useState<"bag" | "payment" | "success">("bag");

 // Coupon state
 const [couponInput, setCouponInput] = useState("");
 const [couponFeedback, setCouponFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  // PayPhone Ecuador Exclusive Gateway State (Admin Configured: "box" | "redirect")
  const [payphoneMode, setPayphoneMode] = useState<"box" | "redirect">("box");
  const [isPayphoneConfigured, setIsPayphoneConfigured] = useState(false);
  const [isPayphoneSimulated, setIsPayphoneSimulated] = useState(true);
  const [isBoxScriptLoaded, setIsBoxScriptLoaded] = useState(false);
  const [isBoxRendered, setIsBoxRendered] = useState(false);

  // PayPhone Simulation Modal (Modo Preparación / RUC en trámite)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payphoneSimData, setPayphoneSimData] = useState<any>(null);
  const [isPayPhoneSimOpen, setIsPayPhoneSimOpen] = useState(false);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);
  const [payphoneError, setPayphoneError] = useState<string | null>(null);

  // Quick Address Inline Form
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrIdNumber, setAddrIdNumber] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrEmail, setAddrEmail] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCountry, setAddrCountry] = useState("Ecuador");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

 // Checkout Processing
 const [isProcessing, setIsProcessing] = useState(false);

 const { mode } = useThemeStore();
 const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

 useEffect(() => {
 const update = () => setResolvedTheme(getResolvedTheme(mode));
 update();
 const interval = setInterval(update, 60000);
 return () => clearInterval(interval);
 }, [mode]);
 const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

 // Detect products with the "AGOTADO" badge in the user's cart
 const agotadoItems = useMemo(() => {
 return items.filter(i => {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const itemBadge = (i.product as any)?.badge;
 const liveProduct = products.find(p => p.id === i.productId);
 return isAgotadoBadge(itemBadge) || isAgotadoBadge(liveProduct?.badge);
 });
 }, [items, products]);

 const hasAgotadoItems = agotadoItems.length > 0;

 // Mount on client
 useEffect(() => {
 setIsMounted(true);
 }, []);

  // Initialize defaults from userStore cleanly scoped to the active account
  useEffect(() => {
    const defaultAddr = addresses?.find(a => a.isDefault) || (addresses && addresses.length > 0 ? addresses[0] : null);
    const activeAddr = address || defaultAddr;
    if (activeAddr) {
      setAddrRecipient(activeAddr.recipient || user?.name || "");
      setAddrIdNumber(activeAddr.idNumber || "");
      setAddrPhone(activeAddr.phone || "");
      setAddrEmail(activeAddr.email || user?.email || "");
      setAddrStreet(activeAddr.street);
      setAddrCity(activeAddr.city);
      setAddrPostal(activeAddr.postalCode);
      setAddrState(activeAddr.state || "");
      setAddrCountry(activeAddr.country || "Ecuador");
      if (!address && defaultAddr) {
        setAddress(defaultAddr);
      }
    } else {
      setAddrRecipient(user?.name || "");
      setAddrIdNumber("");
      setAddrPhone("");
      setAddrEmail(user?.email || "");
      setAddrStreet("");
      setAddrCity("");
      setAddrPostal("");
      setAddrState("");
      setAddrCountry("Ecuador");
    }
  }, [user?.id, user?.name, user?.email, address, addresses, setAddress]);

  // Fetch PayPhone configuration and load script for Cajita mode
  useEffect(() => {
    let isMountedLocal = true;
    async function fetchPayphoneConfig() {
      try {
        const res = await fetch("/api/payphone/config");
        if (!res.ok) return;
        const cfg = await res.json();
        if (isMountedLocal) {
          setPayphoneMode(cfg.mode || "box");
          setIsPayphoneConfigured(!!cfg.isConfigured);
          setIsPayphoneSimulated(!!cfg.isSimulated);

          // If mode is box and not simulated, inject PayPhone box CSS & JS once
          if (cfg.mode === "box" && !cfg.isSimulated && typeof window !== "undefined") {
            if (!document.getElementById("payphone-box-css")) {
              const link = document.createElement("link");
              link.id = "payphone-box-css";
              link.rel = "stylesheet";
              link.href = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";
              document.head.appendChild(link);
            }
            if (!document.getElementById("payphone-box-js")) {
              const script = document.createElement("script");
              script.id = "payphone-box-js";
              script.type = "module";
              script.src = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
              script.onload = () => {
                if (isMountedLocal) setIsBoxScriptLoaded(true);
              };
              document.body.appendChild(script);
            } else {
              setIsBoxScriptLoaded(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching PayPhone config:", err);
      }
    }
    fetchPayphoneConfig();
    return () => {
      isMountedLocal = false;
    };
  }, []);

 // Reset step when cart is closed
 useEffect(() => {
 if (!isOpen) {
 const timer = setTimeout(() => {
 if (step === "success") {
 setStep("bag");
 }
 }, 500);
 return () => clearTimeout(timer);
 }
 }, [isOpen, step]);

 // Prevent background catalog scroll when cart modal is open
 useEffect(() => {
 if (isOpen) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [isOpen]);

 const subtotal = getSubtotal();
 const discountAmount = getDiscountAmount();
 const shipping = getShipping();
 const finalTotal = getTotal();

 // Free shipping threshold progress ($100 target)
 const FREE_SHIPPING_TARGET = 100;
 const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_TARGET) * 100));
 const amountToFreeShipping = Math.max(0, FREE_SHIPPING_TARGET - subtotal);
 const hasFreeShipping = subtotal >= FREE_SHIPPING_TARGET || isFreeShippingCoupon;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    setCouponFeedback({ msg: res.message, success: res.success });
    if (res.success) {
      setCouponInput("");
    }
  };

 const handleDetectLocation = () => {
 if (typeof window === "undefined" || !navigator.geolocation) {
 setLocationError("Tu navegador no soporta geolocalización.");
 return;
 }

 setIsDetectingLocation(true);
 setLocationError(null);
 setLocationSuccess(false);

 navigator.geolocation.getCurrentPosition(
 async (pos) => {
 try {
 const { latitude, longitude } = pos.coords;

 const res = await fetch("/api/geocode", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ lat: latitude, lon: longitude })
 });

 const result = await res.json();

 if (result.success && result.data) {
 const { street: detStreet, city: detCity, state: detState, postalCode: detPostal, country: detCountry } = result.data;

 if (detStreet) setAddrStreet(detStreet);
 if (detCity) setAddrCity(detCity);
 if (detState) setAddrState(detState);
 if (detPostal) setAddrPostal(detPostal);
 if (detCountry) setAddrCountry(detCountry);

 if (!addrRecipient.trim() && user?.name) {
 setAddrRecipient(user.name);
 }

 setLocationSuccess(true);
 } else {
 setLocationError(result.error || "No se pudo obtener la información de dirección. Por favor, ingrésala manualmente.");
 }
 } catch {
 setLocationError("Error al procesar la dirección de tu ubicación.");
 } finally {
 setIsDetectingLocation(false);
 }
 },
 (err) => {
 setIsDetectingLocation(false);
 if (err.code === 1) {
 setLocationError("Permiso de ubicación denegado. Habilita el acceso a la ubicación en tu navegador o ingresa los datos manualmente.");
 } else if (err.code === 2) {
 setLocationError("Ubicación no disponible en este dispositivo. Ingresa los datos manualmente.");
 } else if (err.code === 3) {
 setLocationError("Tiempo de espera agotado al obtener la ubicación. Ingresa los datos manualmente.");
 } else {
 setLocationError("No se pudo acceder a la ubicación. Ingresa los datos manualmente.");
 }
 },
 {
 enableHighAccuracy: true,
 timeout: 10000,
 maximumAge: 0
 }
 );
 };

 const handleSaveAddress = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!addrStreet.trim() || !addrCity.trim() || !addrPostal.trim() || !addrState.trim() || !addrCountry.trim()) return;
 if (addresses.length >= 4) {
 setIsEditingAddress(false);
 return;
 }
 await addAddress({
 recipient: addrRecipient.trim() || user?.name || "Destinatario",
 idNumber: addrIdNumber.trim() || undefined,
 phone: addrPhone.trim() || undefined,
 email: addrEmail.trim() || user?.email || undefined,
 street: addrStreet.trim(),
 city: addrCity.trim(),
 state: addrState.trim(),
 postalCode: addrPostal.trim(),
 country: addrCountry.trim(),
 isDefault: addresses.length === 0
 });
 setAddrRecipient(user?.name || "");
 setAddrIdNumber("");
 setAddrPhone("");
 setAddrEmail(user?.email || "");
 setAddrStreet("");
 setAddrCity("");
 setAddrPostal("");
 setAddrState("");
 setAddrCountry("Ecuador");
 setLocationError(null);
 setLocationSuccess(false);
 setIsEditingAddress(false);
 };

 const handleProceedToPayment = () => {
 if (hasAgotadoItems) {
 return;
 }

  if (!isAuthenticated) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("lumina_cart_reopen", "true");
    } catch {}
  }
  setIsOpen(false);
  router.push("/auth/login?redirect=cart");
  return;
  }
 const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;
 if (defaultAddr) {
 setAddress(defaultAddr);
 }
 setStep("payment");
 };

  const handleConfirmOrder = async () => {
    if (!address && (!addresses || addresses.length === 0) && !addrStreet) {
      setIsEditingAddress(true);
      return;
    }
    let shippingAddr = address;
    if (!shippingAddr && addresses && addresses.length > 0) {
      shippingAddr = addresses.find(a => a.isDefault) || addresses[0];
      setAddress(shippingAddr);
    }

    const orderId = `INV_${Math.floor(100000 + Math.random() * 900000)}`;
    const customerName = user?.name || shippingAddr?.recipient || addrRecipient || "Cliente";
    const customerEmail = user?.email || shippingAddr?.email || addrEmail.trim() || "cliente@lumina.com";
    const recipientName = shippingAddr?.recipient || addrRecipient || customerName;

    // PAYPHONE ECUADOR EXCLUSIVE CHECKOUT FLOW (Zero-Trust Recalculation, Live vs Simulated)
    setIsProcessing(true);
    setPayphoneError(null);
    try {
      const res = await fetch("/api/payphone/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.product.price,
            isBundle: i.isBundle,
            bundleCustomPrice: i.bundleCustomPrice,
            product: {
              id: i.product.id,
              title: i.product.title,
              price: i.product.price,
              imageUrl: i.product.imageUrl
            }
          })),
          shippingAddress: {
            recipient: recipientName,
            idNumber: shippingAddr?.idNumber || addrIdNumber.trim() || undefined,
            phone: shippingAddr?.phone || addrPhone.trim() || undefined,
            email: customerEmail,
            street: shippingAddr?.street || addrStreet || "Calle Principal",
            city: shippingAddr?.city || addrCity || "Quito",
            state: shippingAddr?.state || addrState || "Pichincha",
            postalCode: shippingAddr?.postalCode || addrPostal || "170150",
            country: "Ecuador"
          },
          couponCode: couponCode || undefined,
          clientClaimedTotal: finalTotal
        })
      });

      const data = await res.json();
      setIsProcessing(false);

      if (!res.ok || !data.success) {
        setPayphoneError(data.error || "No se pudo preparar la pasarela de pagos de PayPhone.");
        return;
      }

      if (data.isSimulated) {
        // Open interactive test simulator modal (RUC pending)
        setPayphoneSimData({
          paymentId: data.paymentId,
          clientTransactionId: data.clientTransactionId,
          orderId,
          total: data.verifiedTotal || finalTotal,
          shippingAddr,
          customerEmail,
          customerName,
          recipientName,
          items: [...items]
        });
        setIsPayPhoneSimOpen(true);
      } else if (data.mode === "box" && data.token) {
        // Live PayPhone Cajita Widget Initialization
        const win = typeof window !== "undefined" ? (window as unknown as { PPaymentButtonBox: new (opts: Record<string, unknown>) => { render: (id: string) => void } }) : null;
        if (win && win.PPaymentButtonBox) {
          try {
            const ppb = new win.PPaymentButtonBox({
              token: data.token,
              amount: data.amountInCents,
              amountWithoutTax: data.amountWithoutTaxInCents,
              amountWithTax: data.amountWithTaxInCents,
              tax: data.taxInCents,
              service: 0,
              tip: 0,
              reference: data.reference,
              clientTransactionId: data.clientTransactionId,
              email: data.email,
              phoneNumber: data.phoneNumber,
              documentId: data.documentId
            });
            ppb.render("pp-button");
            setIsBoxRendered(true);
          } catch (renderErr) {
            console.error("Error rendering PayPhone Box:", renderErr);
            setPayphoneError("Error al inicializar la Cajita de Pagos PayPhone.");
          }
        } else {
          setPayphoneError("El componente seguro de PayPhone se está cargando. Por favor reintenta en un momento.");
        }
      } else if (data.payUrl) {
        // Live PayPhone redirection
        window.location.href = data.payUrl;
      }
    } catch {
      setIsProcessing(false);
      setPayphoneError("Error de conexión al comunicar con los servidores de PayPhone Ecuador.");
    }
  };

  const handleApprovePayPhoneSimulation = async () => {
    if (!payphoneSimData) return;
    setIsSimulatingApproval(true);
    setPayphoneError(null);
    try {
      const res = await fetch("/api/payphone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payphoneSimData.paymentId,
          clientTxId: payphoneSimData.clientTransactionId,
          orderData: {
            orderId: payphoneSimData.orderId,
            total: payphoneSimData.total,
            items: payphoneSimData.items,
            customerName: payphoneSimData.customerName,
            customerEmail: payphoneSimData.customerEmail,
            recipient: payphoneSimData.recipientName,
            customerIdNumber: payphoneSimData.shippingAddr?.idNumber || addrIdNumber.trim() || undefined,
            customerPhone: payphoneSimData.shippingAddr?.phone || addrPhone.trim() || undefined,
            shippingAddress: payphoneSimData.shippingAddr ? {
              recipient: payphoneSimData.recipientName,
              idNumber: payphoneSimData.shippingAddr.idNumber,
              phone: payphoneSimData.shippingAddr.phone,
              email: payphoneSimData.customerEmail,
              street: payphoneSimData.shippingAddr.street,
              city: payphoneSimData.shippingAddr.city,
              state: payphoneSimData.shippingAddr.state,
              postalCode: payphoneSimData.shippingAddr.postalCode,
              country: payphoneSimData.shippingAddr.country
            } : (addrStreet ? {
              recipient: payphoneSimData.recipientName,
              idNumber: addrIdNumber.trim() || undefined,
              phone: addrPhone.trim() || undefined,
              email: payphoneSimData.customerEmail,
              street: addrStreet,
              city: addrCity,
              state: addrState,
              postalCode: addrPostal,
              country: addrCountry
            } : undefined)
          }
        })
      });

      const data = await res.json();
      setIsSimulatingApproval(false);
      setIsPayPhoneSimOpen(false);

      if (res.ok && data.success && data.order) {
        addOrder(data.order);
        setLastPlacedOrder(data.order);
        clearCart();
        setStep("success");
      } else {
        setPayphoneError(data.error || "No se pudo confirmar la transacción simulada de PayPhone.");
      }
    } catch {
      setIsSimulatingApproval(false);
      setPayphoneError("Error de conexión al confirmar la simulación con PayPhone.");
    }
  };


 // Recommended products for the bottom of the cart page
 const recommendedProducts = useMemo(() => {
 return products.filter(p => !items.some(i => i.productId === p.id)).slice(0, 3);
 }, [products, items]);

 if (!isMounted) return null;

 // Dynamic 3D Book Page Flip / Genie expansion originating exactly from the cart icon
 const startX = originCoords && typeof window !== "undefined" ? originCoords.x - window.innerWidth / 2 : 250;
 const startY = originCoords && typeof window !== "undefined" ? originCoords.y - window.innerHeight / 2 : -250;

 const bookPageVariants: Variants = {
 hidden: {
 opacity: 0,
 scale: 0.04,
 rotateY: -35,
 rotateX: 10,
 x: startX,
 y: startY,
 transition: {
 duration: 0.38,
 ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
 }
 },
 visible: {
 opacity: 1,
 scale: 1,
 rotateY: 0,
 rotateX: 0,
 x: 0,
 y: 0,
 transition: {
 duration: 0.55,
 ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
 }
 },
 exit: {
 opacity: 0,
 scale: 0.04,
 rotateY: -35,
 rotateX: 10,
 x: startX,
 y: startY,
 transition: {
 duration: 0.42,
 ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
 }
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <div className={clsx("fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 perspective-[2000px] overflow-hidden theme-transition", resolvedTheme === 'dark' ? 'dark' : '')}>
 <style>{`
 :where(.theme-transition), :where(.theme-transition *) {
 transition-property: background-color, border-color, color, fill, stroke;
 transition-duration: 1500ms;
 transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
 }
 `}</style>
 
 {/* Backdrop with Deep Soft Blur */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.35 }}
 style={{ willChange: "opacity" }}
 className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl"
 onClick={() => setIsOpen(false)}
 />

 {/* 3D BOOK PAGE / MACBOOK GENIE CANVAS */}
 <motion.div
 variants={bookPageVariants}
 initial="hidden"
 animate="visible"
 exit="exit"
 style={{ transformStyle: "preserve-3d", willChange: "transform, opacity" }}
  className="relative w-full max-w-6xl h-full max-h-[96vh] sm:max-h-[92vh] bg-white dark:bg-[#2a2a2c]/95 backdrop-blur-3xl rounded-3xl sm:rounded-[2.5rem] border border-white/90 shadow-[0_35px_120px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden z-10"
  >

  {/* Top Bar Header */}
  <header className="px-4 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-[#2a2a2c]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 shadow-sm dark:shadow-none">
 
  {/* Brand Logo & Studio Identity (3D Liquid Glass Emblem) */}
  <div className="flex items-center gap-3.5">
    <div className="relative group">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#8c9276] via-[#d4af37] to-[#8c9276] opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />
      <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-b from-stone-900 via-stone-800 to-black dark:from-white dark:via-stone-100 dark:to-stone-200 text-white dark:text-stone-900 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.25)] border border-white/20 dark:border-black/10 transition-transform group-hover:scale-105 duration-300">
        <ShoppingBag className="w-4 h-4 text-white dark:text-stone-900 drop-shadow-sm" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ccff00] ring-2 ring-white dark:ring-stone-900 animate-pulse" />
      </div>
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-display italic font-bold text-xl text-gray-900 dark:text-gray-100 tracking-tight">
          Lumina<span className="text-[#8c9276] dark:text-[#ccff00]">.</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#8c9276]/15 dark:bg-[#ccff00]/15 text-[#676c54] dark:text-[#ccff00] text-[10px] font-extrabold uppercase tracking-widest border border-[#8c9276]/20">
          Studio 3D
        </span>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium hidden sm:block">
        Bolsa de Autor • Pasarela Segura
      </p>
    </div>
  </div>

  {/* Center Step Indicator (2IXO Pill Dock) */}
  <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-full border border-black/[0.04] dark:border-white/10 backdrop-blur-xl">
    <button 
      onClick={() => setStep("bag")}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
        step === "bag" 
          ? "bg-white dark:bg-[#27272a] text-gray-950 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]" 
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      }`}
    >
      1. Bolsa ({items.length})
    </button>
    <button 
      onClick={() => {
        if (items.length > 0) handleProceedToPayment();
      }}
      disabled={items.length === 0}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer ${
        step === "payment" 
          ? "bg-white dark:bg-[#27272a] text-gray-950 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]" 
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      }`}
    >
      2. Pasarela de Pago
    </button>
  </div>

  {/* Right Action: 2IXO Circular Glass Close Button */}
  <div className="flex items-center gap-3">
    <button 
      onClick={() => setIsOpen(false)}
      className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/[0.06] dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-white dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
      title="Cerrar bolsa"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
</header>

 {/* ========================================================================= */}
  {/* MAIN CANVAS SCROLLABLE AREA */}
  {/* ========================================================================= */}
  <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-10 hide-scrollbar space-y-6 sm:space-y-10">

  {/* ======================================================================= */}
  {/* STEP 1: CART PAGE VIEW (Skyrise Decor / Crescendo Spacious Studio) */}
  {/* ======================================================================= */}
  {step === "bag" && (
  <>
   {/* Page Title & 3D Ambient Hero Banner (2IXO Pearl Frosted Aura) */}
   <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-black/[0.05] dark:border-white/10 bg-gradient-to-br from-white/95 via-[#faf8f5]/85 to-[#efebe3]/60 dark:from-[#202023] dark:via-[#1c1c1f] dark:to-[#17171a] shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-all">
    {/* Ambient Champagne Glows */}
    <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/[0.08] dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#8c9276]/[0.08] dark:bg-[#8c9276]/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent pointer-events-none" />

    <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/10 text-gray-700 dark:text-gray-300 text-[11px] font-bold tracking-wider uppercase mb-2 shadow-2xs">
          <Sparkles className="w-3 h-3 text-[#8c9276]" />
          <span>Lumina 3D Studio • Luxury Living</span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-4xl text-gray-950 dark:text-white tracking-tight">
          Bolsa de Compras
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl leading-relaxed">
          Piezas de autor seleccionadas con precisión artesanal, diseño dimensional y confort absoluto para tu espacio.
        </p>
      </div>

      {items.length > 0 && (
        <button 
          onClick={clearCart}
          className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white/80 dark:bg-white/5 hover:bg-white border border-black/[0.06] dark:border-white/10 shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Vaciar Bolsa</span>
        </button>
      )}
    </div>
  </div>

  {/* ALERTA DE PRODUCTOS AGOTADOS */}
  {hasAgotadoItems && (
  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200/80 flex items-start gap-3.5 text-rose-900 shadow-sm dark:shadow-none animate-fade-in transition-all">
  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
  <AlertTriangle className="w-4 h-4" />
  </div>
  <div className="flex-1 text-xs">
  <p className="font-bold text-sm text-rose-900">
  {agotadoItems.length === 1 ? "Producto no disponible en tu bolsa" : "Productos no disponibles en tu bolsa"}
  </p>
  <p className="mt-1 text-rose-700 leading-relaxed font-medium">
  {agotadoItems.length === 1
  ? `El producto "${agotadoItems[0].product.title}" está marcado como AGOTADO. Debes eliminarlo de tu bolsa de compras para poder continuar hacia la pasarela de pago.`
  : `Tienes ${agotadoItems.length} productos marcados como AGOTADOS en tu bolsa. Debes eliminarlos para poder continuar con tu pedido.`}
  </p>
  </div>
  </div>
  )}

  {items.length === 0 ? (
  <div className="relative overflow-hidden my-6 rounded-[2.5rem] p-10 sm:p-14 border border-black/[0.04] dark:border-white/10 bg-gradient-to-b from-white/95 via-[#faf8f4] to-[#f2eee7] dark:from-[#222226] dark:via-[#1c1c1f] dark:to-[#161619] shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl text-center flex flex-col items-center justify-center">
    {/* 3D Radial Champagne Aura */}
    <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/[0.08] via-[#8c9276]/[0.08] to-amber-400/[0.06] blur-3xl pointer-events-none" />
    <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/15 to-transparent pointer-events-none" />

    {/* 3D Floating Bag Pedestal */}
    <div className="relative mb-8 group cursor-default">
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-8 bg-black/[0.06] dark:bg-white/[0.06] rounded-full blur-md" />
      
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-white via-[#faf7f2] to-[#eee8dd] dark:from-[#2a2a2e] dark:via-[#222226] dark:to-[#1a1a1e] border-2 border-white dark:border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.06)] flex items-center justify-center transition-transform duration-500 hover:scale-105">
        <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-800 dark:text-gray-100 stroke-[1.5]" />
      </div>
    </div>

    {/* 2IXO Circular Action Feature Discs (Show PIN / Card Details / Freeze Card) */}
    <div className="grid grid-cols-3 gap-6 sm:gap-10 max-w-xs sm:max-w-sm mx-auto mb-8">
      <div className="flex flex-col items-center group">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Package className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </div>
        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mt-2 text-center">Curaduría</span>
      </div>
      <div className="flex flex-col items-center group">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <Truck className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </div>
        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mt-2 text-center">Despacho</span>
      </div>
      <div className="flex flex-col items-center group">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-800 dark:text-gray-100 group-hover:scale-105 transition-all">
          <ShieldCheck className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </div>
        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mt-2 text-center">Garantía</span>
      </div>
    </div>

    <h3 className="font-display font-bold text-2xl sm:text-3xl text-gray-950 dark:text-white mb-2 tracking-tight">
      Tu bolsa de autor está vacía
    </h3>
    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed mb-8">
      Descubre piezas de diseño lumínico, aromaterapia orgánica y mobiliario minimalista confeccionadas para transformar la energía de tus espacios.
    </p>

    {/* 2IXO Dock Capsule CTA Button */}
    <button 
      onClick={() => { setIsOpen(false); router.push("/shop"); }}
      className="group relative overflow-hidden rounded-full bg-[#18181b] dark:bg-white text-white dark:text-gray-950 pl-3 pr-6 py-3.5 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.15)] hover:bg-black dark:hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center text-white dark:text-gray-950 group-hover:translate-x-0.5 transition-transform shrink-0">
        <ArrowRight className="w-4 h-4" />
      </div>
      <span>Explorar Catálogo Lumina</span>
    </button>
  </div>
  ) : (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
 
 {/* ---------------------------------------------------- */}
 {/* Left Column: Spacious Products Table (7 or 8 cols) */}
 {/* ---------------------------------------------------- */}
 <div className="lg:col-span-8 bg-white dark:bg-[#2a2a2c]/80 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-gray-200 dark:border-white/10/60 p-4 sm:p-8 shadow-sm dark:shadow-none space-y-6">
 {/* Table Column Headers (Directly from Reference Image) */}
 <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-white/5 px-3.5 sm:px-4">
 <span className="col-span-5">Producto</span>
 <span className="col-span-3 text-center">Cantidad</span>
 <span className="col-span-2 text-right pr-6">Subtotal</span>
 <span className="col-span-2 text-right pr-1">Acción</span>
 </div>

 {/* Product Rows with generous breathing room */}
 <div className="space-y-3 pt-1">
 {items.map((item) => {
  if (item.isBundle) {
    const bundleProducts = item.bundleProducts || [
      {
        id: item.productId,
        title: item.product.title,
        category: item.product.category,
        imageUrl: item.product.imageUrl,
        price: item.product.price,
        color: item.color,
        size: item.size,
      },
    ];
    const regularSum = bundleProducts.reduce((acc, bp) => acc + bp.price, 0);
    const originalTotal = regularSum * item.quantity;
    const discountedUnit = item.bundleCustomPrice ?? item.product.price;
    const discountedTotal = discountedUnit * item.quantity;
    const totalSavings = Math.max(0, originalTotal - discountedTotal);

    return (
      <div
        key={item.id}
        className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-[#1e1e20] dark:to-[#1a1a1c] shadow-sm space-y-4 transition-all"
      >
        {/* Bundle Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-base text-gray-950 dark:text-white">
                  {item.bundleName || "Pack Promocional"}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.bundleBadge || `-${item.bundleDiscountPercent || 15}% DTO APLICADO`}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                Descuento de pack aplicado a los productos de este cuadro
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
            {bundleProducts.length} {bundleProducts.length === 1 ? "pieza incluida" : "piezas incluidas"}
          </span>
        </div>

        {/* List of products inside this bundle card */}
        <div className="space-y-2.5">
          {bundleProducts.map((bp, bpIdx) => (
            <div 
              key={`${bp.id}-${bpIdx}`}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-[#252528] border border-gray-100 dark:border-white/5 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-black/5">
                  <Image src={bp.imageUrl} alt={bp.title} fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                    {bp.category || "Pieza Complementaria"}
                  </span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {bp.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    {bp.color && <span>Color: {bp.color}</span>}
                    {bp.size && <span>• Talla: {bp.size}</span>}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <span className="text-xs text-gray-400 line-through block">
                  ${bp.price.toFixed(2)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  Con dto. aplicado
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions Row: Quantity, Subtotal and Delete */}
        <div className="pt-3 border-t border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quantity Stepper for the Bundle */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cantidad de packs:</span>
            <div className="flex items-center bg-white/80 dark:bg-white/10 rounded-full p-1 border border-black/[0.06] dark:border-white/15 shadow-xs backdrop-blur-md">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-full bg-white dark:bg-[#2c2c30] hover:bg-gray-50 text-gray-800 dark:text-gray-200 flex items-center justify-center border border-black/[0.04] dark:border-white/10 shadow-xs active:scale-90 transition-all cursor-pointer"
                title="Disminuir packs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center font-mono font-bold text-xs text-gray-900 dark:text-white">
                {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
              </span>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-full bg-white dark:bg-[#2c2c30] hover:bg-gray-50 text-gray-800 dark:text-gray-200 flex items-center justify-center border border-black/[0.04] dark:border-white/10 shadow-xs active:scale-90 transition-all cursor-pointer"
                title="Aumentar packs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Subtotal with discount display */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-right">
              {totalSavings > 0 && (
                <span className="text-xs text-gray-400 line-through mr-2">
                  ${originalTotal.toFixed(2)}
                </span>
              )}
              <span className="font-extrabold text-base sm:text-lg text-emerald-700 dark:text-emerald-400">
                ${discountedTotal.toFixed(2)} USD
              </span>
              {totalSavings > 0 && (
                <p className="text-[10px] text-emerald-600 font-bold">
                  Ahorro de ${totalSavings.toFixed(2)} USD en este pack
                </p>
              )}
            </div>

            {/* Delete Bundle button */}
            <button 
              onClick={() => removeItem(item.id)}
              className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-rose-200/60 shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-90"
              title="Eliminar este pack"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemBadge = (item.product as any)?.badge;
  const liveProduct = products.find(p => p.id === item.productId);
  const itemIsAgotado = isAgotadoBadge(itemBadge) || isAgotadoBadge(liveProduct?.badge);

  return (
 <div 
 key={item.id} 
 className={`p-3.5 sm:p-4 flex flex-col sm:grid sm:grid-cols-12 gap-4 sm:items-center group transition-all rounded-2xl ${
 itemIsAgotado 
 ? "bg-red-50/40 border border-red-200/80 shadow-xs" 
 : "border border-transparent hover:bg-gray-50 dark:hover:bg-[#151515]/50 hover:border-gray-100 dark:hover:border-white/5/80"
 }`}
 >
 {/* Product Info (5 cols) */}
 <div className="sm:col-span-5 flex items-center gap-4">
 <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#202022]/5 shrink-0 border border-white shadow-sm dark:shadow-none">
 <Image 
 src={item.product.imageUrl} 
 alt={item.product.title} 
 fill 
 sizes="(max-width: 640px) 80px, 96px"
 className="object-cover group-hover:scale-105 transition-transform duration-500" 
 />
 {itemIsAgotado && (
 <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-1">
 <span className="bg-red-50/90 text-red-600 font-bold border border-red-200 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm dark:shadow-none text-center backdrop-blur-md">
 Agotado
 </span>
 </div>
 )}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
 {item.product.category}
 </span>
 {itemIsAgotado && (
 <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[9px] font-bold tracking-wider uppercase">
 Agotado
 </span>
 )}
 </div>
 <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5">
 {item.product.title}
 </h4>
 <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
 {item.color && (
 <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-[#202022]/5 text-[11px]">
 {item.color}
 </span>
 )}
 {item.size && (
 <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-[#202022]/5 text-[11px]">
 Talla: {item.size}
 </span>
 )}
 </div>
 <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 sm:hidden">
 Unitario: ${Number(item.product?.price || 0).toFixed(2)}
 </p>
 </div>
 </div>

  {/* Quantity Capsule with 2IXO Liquid Glass (3 cols) */}
  <div className="sm:col-span-3 flex sm:justify-center items-center">
  <div className="flex items-center bg-white/80 dark:bg-white/10 rounded-full p-1 border border-black/[0.06] dark:border-white/15 shadow-xs backdrop-blur-md">
  <button 
  onClick={() => updateQuantity(item.id, item.quantity - 1)}
  className="w-7 h-7 rounded-full bg-white dark:bg-[#2c2c30] hover:bg-gray-50 text-gray-800 dark:text-gray-200 flex items-center justify-center border border-black/[0.04] dark:border-white/10 shadow-xs active:scale-90 transition-all cursor-pointer"
  title="Disminuir"
  >
  <Minus className="w-3.5 h-3.5" />
  </button>
  <span className="w-10 text-center font-mono font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
  {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
  </span>
  <button 
  disabled={itemIsAgotado}
  onClick={() => updateQuantity(item.id, item.quantity + 1)}
  className={`w-7 h-7 rounded-full flex items-center justify-center border border-black/[0.04] dark:border-white/10 shadow-xs active:scale-90 transition-all cursor-pointer ${
  itemIsAgotado 
  ? "bg-gray-100 dark:bg-[#202022]/10 text-gray-400 dark:text-gray-400 cursor-not-allowed opacity-40" 
  : "bg-white dark:bg-[#2c2c30] hover:bg-gray-50 text-gray-800 dark:text-gray-200"
  }`}
  title={itemIsAgotado ? "Producto sin existencias" : "Aumentar"}
  >
  <Plus className="w-3.5 h-3.5" />
  </button>
  </div>
  </div>

  {/* Subtotal Price (2 cols) */}
  <div className="sm:col-span-2 sm:text-right flex items-center justify-between sm:block pr-6">
  <span className="text-xs text-gray-400 dark:text-gray-400 sm:hidden">Subtotal:</span>
  <span className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-gray-100">
  ${(Number(item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
  </span>
  </div>

  {/* 2IXO CIRCULAR GLASS DELETE BUTTON */}
  <div className="sm:col-span-2 flex justify-end items-center sm:text-right">
  <button 
  onClick={() => removeItem(item.id)}
  className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 hover:bg-rose-50/90 dark:hover:bg-rose-950/30 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 border border-black/[0.06] dark:border-white/15 shadow-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer ml-auto"
  title="Eliminar producto"
  >
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>

  </div>
  );
  })}
  </div>

  {/* Bottom Actions Row */}
  <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
  <button 
  onClick={() => { setIsOpen(false); router.push("/shop"); }}
  className="px-4 py-2 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-950 bg-white/80 dark:bg-white/5 hover:bg-white border border-black/[0.06] dark:border-white/10 shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
  >
  <ArrowLeft className="w-3.5 h-3.5" /> Continuar Comprando
  </button>
  <span className="text-xs text-gray-400 dark:text-gray-400 font-medium">
  {items.length === 1 
  ? "1 producto listo para despacho" 
  : `${items.length} productos listos para despacho`}
  </span>
  </div>

 </div>

 {/* ---------------------------------------------------- */}
 {/* Right Column: Order Summary Card (4 cols - 2IXO Pearl Card) */}
 {/* ---------------------------------------------------- */}
 <div className="lg:col-span-4 bg-white/75 dark:bg-[#202023]/75 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-black/[0.05] dark:border-white/10 p-5 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.03)] space-y-6">
  
  <h3 className="font-display font-bold text-xl text-gray-950 dark:text-white tracking-tight pb-3 border-b border-black/[0.05] dark:border-white/10">
  Resumen del Pedido
  </h3>

  {/* Free Shipping Progress Capsule */}
  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 space-y-2">
  <div className="flex items-center justify-between text-xs font-semibold">
  <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
  <Truck className="w-4 h-4 text-[#8c9276]" />
  {hasFreeShipping ? "¡Envío Gratuito Asegurado!" : `Faltan $${amountToFreeShipping.toFixed(2)}`}
  </span>
  <span className="text-[#8c9276] font-bold">{freeShippingProgress}%</span>
  </div>
  <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden">
  <div 
  className="h-full bg-[#8c9276] rounded-full transition-all duration-500"
  style={{ width: `${freeShippingProgress}%` }}
  />
  </div>
  </div>

  {/* Coupon Code Form with 2IXO Pill Input */}
  <form onSubmit={handleApplyCoupon} className="flex items-center gap-2 p-1 pl-4 rounded-full bg-white/90 dark:bg-white/5 border border-black/[0.06] dark:border-white/15 shadow-xs">
  <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
  <input 
  type="text" 
  value={couponInput}
  onChange={e => setCouponInput(e.target.value)}
  placeholder="Código de descuento"
  className="w-full bg-transparent text-xs font-medium outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
  />
  <button 
  type="submit"
  className="px-5 py-2 rounded-full font-sans font-semibold text-xs text-white dark:text-gray-950 bg-[#18181b] dark:bg-white hover:bg-black dark:hover:bg-gray-100 shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
  >
  Aplicar
  </button>
  </form>

  {couponFeedback && (
  <p className={`text-xs font-semibold ${couponFeedback.success ? "text-emerald-700" : "text-rose-600"}`}>
  {couponFeedback.msg}
  </p>
  )}

  {couponCode && (
  <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-[#8c9276]/10 text-gray-800 dark:text-gray-200 text-xs font-semibold border border-[#8c9276]/20">
  <span className="flex items-center gap-1.5">
  <Sparkles className="w-3.5 h-3.5 text-[#8c9276]" />
  Cupón: <strong>{couponCode}</strong> ({discountPercent}% dto)
  </span>
  <button onClick={removeCoupon} className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
  <X className="w-3.5 h-3.5" />
  </button>
  </div>
  )}

  {/* Breakdown Lines */}
  <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-1">
  <div className="flex justify-between">
  <span>Subtotal</span>
  <span className="font-semibold text-gray-900 dark:text-gray-100">${subtotal.toFixed(2)} USD</span>
  </div>

  {discountAmount > 0 && (
  <div className="flex justify-between text-emerald-700 font-semibold">
  <span>Descuento ({discountPercent}%)</span>
  <span>-${discountAmount.toFixed(2)} USD</span>
  </div>
  )}

  <div className="flex justify-between">
  <span>Gastos de Envío</span>
  <span className="font-semibold">
  {shipping === 0 ? (
  <span className="text-emerald-700 font-bold uppercase text-xs">GRATIS</span>
  ) : (
  `$${shipping.toFixed(2)} USD`
  )}
  </span>
  </div>

  <div className="pt-3 border-t border-black/[0.05] dark:border-white/10 flex justify-between items-baseline">
  <div>
  <span className="text-sm font-bold text-gray-950 dark:text-white">Total</span>
  <span className="text-[10px] text-gray-400 block">Impuestos incluidos</span>
  </div>
  <span className="font-sans font-bold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
  ${finalTotal.toFixed(2)} USD
  </span>
  </div>
  </div>

  {/* Warranty Note from 2IXO Reference */}
  <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-400">
  <ShieldCheck className="w-4 h-4 text-[#8c9276] shrink-0 mt-0.5" />
  <p className="text-[11px] leading-relaxed">
  <strong>Garantía Oficial Lumina de 2 años.</strong> Devolución íntegra sin compromiso en los primeros 30 días.
  </p>
  </div>

  {/* 2IXO FLOATING DOCK ACTION CAPSULE */}
  <div className="p-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/10 backdrop-blur-xl flex items-center gap-2">
    <button 
      onClick={() => { setIsOpen(false); router.push("/shop"); }}
      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-[#27272a] hover:bg-gray-50 dark:hover:bg-[#323236] border border-black/[0.06] dark:border-white/15 shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-200 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
      title="Continuar comprando"
    >
      <ShoppingBag className="w-4 h-4" />
    </button>
    
    <button 
      onClick={handleProceedToPayment}
      disabled={hasAgotadoItems}
      className={`group relative flex-1 h-11 sm:h-12 rounded-full font-sans text-xs sm:text-sm font-semibold pl-2 pr-4 flex items-center justify-between transition-all duration-300 shadow-md cursor-pointer active:scale-[0.99] ${
        hasAgotadoItems
          ? "bg-rose-600 text-white shadow-rose-500/20 opacity-90 cursor-not-allowed"
          : "bg-[#18181b] dark:bg-white text-white dark:text-gray-950 hover:bg-black dark:hover:bg-gray-100 shadow-black/15"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
          hasAgotadoItems ? "bg-white/20 text-white" : "bg-white/15 dark:bg-black/10 text-white dark:text-gray-950"
        }`}>
          {hasAgotadoItems ? <AlertTriangle className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </div>
        <span className="truncate">
          {hasAgotadoItems 
            ? "Elimina agotados" 
            : !isAuthenticated 
            ? "Iniciar Sesión" 
            : "Proceder al Pago"}
        </span>
      </div>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ml-1.5 ${
        hasAgotadoItems ? "bg-white/20 text-white" : "bg-white/15 dark:bg-black/5 text-white dark:text-gray-900"
      }`}>
        ${finalTotal.toFixed(2)}
      </span>
    </button>
  </div>

  {!isAuthenticated && !hasAgotadoItems && (
  <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-2 font-medium">
  Tus productos se guardarán intactos en tu carrito al iniciar sesión o registrarte.
  </p>
  )}

  </div>

 </div>
 )}

 {/* Recommended Pieces Row (Craft Own Furniture Section) */}
 {recommendedProducts.length > 0 && (
 <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-display font-bold text-xl text-gray-900 dark:text-gray-100 ">
 Piezas que complementan tu pedido
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400">Diseñadas para armonizar en iluminación y estética.</p>
 </div>
 <button 
 onClick={() => { setIsOpen(false); router.push("/shop"); }}
 className="text-xs font-semibold text-blue-600 hover:underline"
 >
 Ver catálogo completo &rarr;
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {recommendedProducts.map(prod => (
 <div 
 key={prod.id}
 onClick={() => { setIsOpen(false); router.push(`/product/${prod.id}`); }}
 className="p-4 rounded-2xl bg-white dark:bg-[#2a2a2c]/70 hover:bg-white dark:hover:bg-[#2c2c2e] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all cursor-pointer flex items-center gap-3.5 group"
 >
 <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#202022]/5 shrink-0">
 <Image src={prod.imageUrl} alt={prod.title} fill sizes="64px" className="object-cover group-hover:scale-105 transition-transform" />
 </div>
 <div className="min-w-0">
 <h5 className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors">
 {prod.title}
 </h5>
 <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">{prod.category}</p>
 <span className="font-extrabold text-xs text-gray-900 dark:text-gray-100 mt-1 block">
 ${Number(prod.price || 0).toFixed(2)}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 )}

 {/* ======================================================================= */}
 {/* STEP 2: PAYMENT METHOD & SHIPPING VIEW (Spacious & Interactive) */}
  {/* ======================================================================= */}
  {step === "payment" && (
  <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
  
  <div className="border-b border-black/[0.06] dark:border-white/5 pb-4">
    <button 
      onClick={() => setStep("bag")}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 shadow-2xs hover:shadow-xs transition-all mb-3 cursor-pointer group"
    >
      <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
        <ArrowLeft className="w-3 h-3 text-gray-700 dark:text-gray-300" />
      </div>
      <span>Volver a la Bolsa</span>
    </button>
    <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
      Método de Pago y Entrega
    </h2>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Configura tu dirección y autoriza tu pedido con la pasarela bancaria oficial.
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
  
  {/* Left 7 cols: Address & Card Selector */}
  <div className="lg:col-span-7 space-y-6">
  
  {/* Shipping Address */}
  <div className="p-5 sm:p-7 rounded-[2rem] bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white">
          <MapPin className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Dirección de Entrega</h4>
        {addresses.length > 0 && (
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-black/[0.06] dark:border-white/10">
            {addresses.length}/4
          </span>
        )}
      </div>
      {isEditingAddress ? (
        <button 
          onClick={() => setIsEditingAddress(false)}
          className="px-3.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 transition-all cursor-pointer"
        >
          Cancelar
        </button>
      ) : addresses.length < 4 ? (
        <button 
          onClick={() => {
            setIsEditingAddress(true);
            setAddrRecipient(user?.name || "");
            setAddrStreet("");
            setAddrCity("");
            setAddrPostal("");
            setAddrState("");
            setAddrCountry("Ecuador");
          }}
          className="px-3.5 py-1.5 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-xs font-bold hover:opacity-90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir</span>
        </button>
      ) : (
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
          Límite (4 máx.)
        </span>
      )}
    </div>

    {isEditingAddress ? (
      <form onSubmit={handleSaveAddress} className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/5">
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
            Nueva Dirección de Entrega
          </span>
          <button 
            type="button" 
            onClick={() => {
              setLocationError(null);
              setLocationSuccess(false);
              setIsEditingAddress(false);
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        {/* Geolocation Auto-fill Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2.5 border transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 border-black/[0.08] dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.99]"
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-700 dark:text-gray-300" />
                <span>Detectando ubicación real del dispositivo...</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                </div>
                <span>Autocompletar con mi ubicación actual</span>
              </>
            )}
          </button>

          {locationError && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-2.5 mt-2 leading-tight">
              {locationError}
            </p>
          )}

          {locationSuccess && (
            <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 mt-2 leading-tight flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>¡Ubicación detectada! Revisa los campos y escribe quién recibe.</span>
            </p>
          )}
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-black/[0.06] dark:border-white/10"></div>
          <span className="flex-shrink mx-3 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">o ingresa los datos manualmente</span>
          <div className="flex-grow border-t border-black/[0.06] dark:border-white/10"></div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
            ¿Quién recibe? (Nombre y apellidos)
          </label>
          <input 
            type="text" 
            value={addrRecipient} 
            onChange={e => setAddrRecipient(e.target.value)} 
            placeholder={user?.name || "Ej: Juan Pérez / Nombre del destinatario"}
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Cédula / Identificación
            </label>
            <input 
              type="text" 
              value={addrIdNumber} 
              onChange={e => setAddrIdNumber(e.target.value)} 
              placeholder="Ej: 1712345678"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Número con WhatsApp
            </label>
            <input 
              type="tel" 
              value={addrPhone} 
              onChange={e => setAddrPhone(e.target.value)} 
              placeholder="Ej: +593 99 123 4567"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Correo Electrónico (Facturación & Aviso)
          </label>
          <input 
            type="email" 
            value={addrEmail} 
            onChange={e => setAddrEmail(e.target.value)} 
            placeholder={user?.email || "correo@ejemplo.com"}
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calle y número</label>
          <input 
            type="text" 
            value={addrStreet} 
            onChange={e => setAddrStreet(e.target.value)} 
            placeholder="Av. 12 de Octubre y Lincoln"
            className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
            <input 
              type="text" 
              value={addrCity} 
              onChange={e => setAddrCity(e.target.value)} 
              placeholder="Quito / Guayaquil"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
            <input 
              type="text" 
              value={addrPostal} 
              onChange={e => setAddrPostal(e.target.value)} 
              placeholder="170150"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Provincia/Estado</label>
            <input 
              type="text" 
              value={addrState} 
              onChange={e => setAddrState(e.target.value)} 
              placeholder="Pichincha / Guayas"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">País</label>
            <input 
              type="text" 
              value={addrCountry} 
              onChange={e => setAddrCountry(e.target.value)} 
              placeholder="Ecuador"
              className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 bg-black/[0.02] dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>
        </div>
        <div className="flex gap-2.5 pt-2">
          <button 
            type="button"
            onClick={() => setIsEditingAddress(false)}
            className="w-1/3 py-2.5 px-4 bg-black/[0.04] dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold hover:bg-black/[0.08] dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="w-2/3 py-2.5 px-4 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
          >
            Guardar Dirección
          </button>
        </div>
      </form>
    ) : addresses.length > 0 ? (
      <div className="space-y-3">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Selecciona la dirección para este envío:
        </p>
        <div className="space-y-2.5">
          {addresses.map((addr) => {
            const isSelected = address?.id 
              ? address.id === addr.id 
              : (address?.street === addr.street && address?.postalCode === addr.postalCode) || (addresses.length === 1);

            return (
              <div
                key={addr.id}
                onClick={() => setAddress(addr)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 select-none ${
                  isSelected
                    ? "bg-[#FAF8F5] dark:bg-[#202022] border-black/30 dark:border-white/30 shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                    : "bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.06]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected 
                      ? "border-[#18181b] dark:border-white bg-[#18181b] dark:bg-white text-white dark:text-[#18181b]" 
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2c]"
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#18181b]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                        {formatCleanName(addr.recipient || user?.name || "Destinatario")}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/10 shrink-0">
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">
                      {addr.street}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.postalCode} • {addr.country}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : address ? (
      <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-xs text-gray-900 dark:text-gray-100">
              {formatCleanName(address.recipient || user?.name || "Destinatario")}
            </p>
            {address.isDefault && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/10 shrink-0">
                Predeterminada
              </span>
            )}
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-0.5">{address.street}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {address.city}{address.state ? `, ${address.state}` : ""}, {address.postalCode} • {address.country}
          </p>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-2xs">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
    ) : (
      <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 text-center space-y-3">
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Aún no has configurado tu dirección de entrega.</p>
        <button 
          onClick={() => {
            setIsEditingAddress(true);
            setAddrRecipient(user?.name || "");
            setAddrStreet("");
            setAddrCity("");
            setAddrPostal("");
            setAddrState("");
            setAddrCountry("Ecuador");
          }}
          className="px-4 py-2 bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] rounded-full text-xs font-bold cursor-pointer hover:opacity-90 transition-all shadow-2xs"
        >
          + Añadir Dirección Ahora
        </button>
      </div>
    )}
  </div>

  {/* Pasarela Oficial Exclusiva: PayPhone Ecuador en 2IXO Luxury Card Presentation */}
  <div className="p-6 sm:p-7 rounded-[2rem] bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5 font-sans antialiased">
    
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-gray-100">
            Pasarela Oficial de Pago
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">PayPhone Ecuador • Cobro Cifrado</p>
        </div>
      </div>
      <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tracking-tight uppercase flex items-center gap-1.5 shadow-2xs">
        <Lock className="w-3 h-3" /> SSL 256-Bit
      </span>
    </div>

    {/* 2IXO FINTECH LUXURY CARD CONTAINER */}
    <div className="relative rounded-[2rem] p-6 sm:p-7 bg-gradient-to-br from-[#FAF8F5] via-[#F4EFEB] to-[#EAE3D8] dark:from-[#252422] dark:via-[#1e1d1b] dark:to-[#161514] border border-[#DDD4C7]/80 dark:border-white/10 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08)] overflow-hidden space-y-5">
      
      {/* Specular Liquid Light highlight on top edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#FAF8F5]/80 via-white/40 to-transparent dark:from-white/5 dark:to-transparent blur-2xl pointer-events-none" />

      {/* Card Top Row: Chip, Contactless, & PayPhone Brand Capsule */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EmvChip />
          <ContactlessIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 text-[11px] font-mono font-bold text-gray-800 dark:text-gray-200 border border-black/[0.06] dark:border-white/10 flex items-center gap-1.5 shadow-2xs">
            <PayPhoneIcon className="w-3.5 h-3.5 text-[#FF5E00]" />
            <span>PayPhone</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            PCI-DSS L1
          </span>
        </div>
      </div>

      {/* Card Middle: Title / Card Mode Description */}
      <div className="relative z-10 space-y-1 pt-1">
        <div className="flex items-center gap-2">
          <h5 className="font-sans font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight">
            {payphoneMode === "box" ? "Cajita de Pagos Integrada" : "Pasarela Hosted PayPhone"}
          </h5>
          {isPayphoneConfigured && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
              Enlace Directo
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
          {payphoneMode === "box"
            ? "Procesa tarjetas de crédito/débito directamente en la tienda con tokenización bancaria sin almacenar datos sensibles."
            : "Autoriza tu orden en la pasarela cifrada de PayPhone Ecuador con cualquier tarjeta o desde tu app móvil."}
        </p>
      </div>

      {/* Official PayPhone Box Container (when in box mode) */}
      {payphoneMode === "box" && (
        <div className="relative z-10 w-full bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
          <div id="pp-button" className="w-full min-h-[110px] flex flex-col items-center justify-center text-center p-1">
            {isPayphoneSimulated ? (
              <div className="space-y-2.5 py-2">
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200 flex items-center justify-center mx-auto border border-black/[0.06] dark:border-white/10">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    Cajita de Pagos Activa (Modo Seguro de Pruebas)
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    El contenedor <code className="text-gray-800 dark:text-gray-200 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full font-mono text-[10px]">#pp-button</code> está vinculado. Pulsa el botón inferior para autorizar la transacción.
                  </p>
                </div>
              </div>
            ) : !isBoxRendered ? (
              <div className="space-y-2 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-700 dark:text-gray-300 mx-auto" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {!isBoxScriptLoaded ? "Cargando pasarela cifrada..." : "Inicializando Cajita de Pagos..."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Card Bottom Row: Supported Cards Badges in 2IXO pills */}
      <div className="relative z-10 pt-1 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-2xs">
            <VisaLogo className="h-3" fill="#1A1F71" /> Visa
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-2xs">
            <MastercardLogo className="h-3.5" /> Mastercard
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 shadow-2xs">
            Diners Club
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 shadow-2xs">
            Discover
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 shadow-2xs">
            American Express
          </span>
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-black/30 border border-black/[0.06] dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 shadow-2xs">
            Alia
          </span>
        </div>

        <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" /> Cifrado Bancario End-to-End
          </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            0% comisión al comprador
          </span>
        </div>
      </div>

    </div>

  </div>

  </div>

  {/* Right 5 cols: Order Final Summary & Confirm */}
  <div className="lg:col-span-5 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl p-6 sm:p-7 rounded-[2rem] border border-black/[0.06] dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.05)] space-y-5">
    <h4 className="font-sans font-bold text-base text-gray-900 dark:text-gray-100 border-b border-black/[0.06] dark:border-white/5 pb-3 tracking-tight uppercase">
      Resumen del Pedido
    </h4>

    <div className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-sans">
      <div className="flex justify-between">
        <span>Subtotal ({items.length} artículos)</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">${subtotal.toFixed(2)} USD</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-emerald-700 font-semibold">
          <span>Descuento aplicado</span>
          <span>-${discountAmount.toFixed(2)} USD</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Envío Nacional</span>
        <span className="font-semibold">
          {shipping === 0 ? <span className="text-emerald-700 font-bold">GRATIS</span> : `$${shipping.toFixed(2)} USD`}
        </span>
      </div>
      <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 flex justify-between items-baseline">
        <span className="font-bold text-gray-900 dark:text-gray-100">Total Final</span>
        <span className="font-sans font-extrabold text-2xl text-gray-950 dark:text-white tracking-tight">
          ${finalTotal.toFixed(2)} USD
        </span>
      </div>
    </div>

    <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
      <ShieldCheck className="w-5 h-5 text-gray-700 dark:text-gray-300 shrink-0" />
      <span className="text-[11px] leading-relaxed">
        Pago seguro SSL 256-bit y garantía oficial de satisfacción de 30 días.
      </span>
    </div>

    {payphoneError && (
      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-shake">
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Error al procesar el pago</p>
          <p className="text-[11px] leading-relaxed">{payphoneError}</p>
        </div>
      </div>
    )}

    {/* 2IXO LUXURY FINTECH CAPSULE DOCK: CONFIRM PAYMENT BUTTON */}
    <button 
      onClick={handleConfirmOrder}
      disabled={isProcessing}
      className="group relative overflow-hidden w-full h-15 sm:h-16 rounded-full font-sans font-bold text-white dark:text-[#18181b] bg-[#18181b] dark:bg-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] active:scale-[0.98] transition-all duration-300 border border-black/10 dark:border-white/20 flex items-center justify-between px-3 sm:px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Specular curved liquid rim */}
      <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 dark:via-white/60 to-transparent pointer-events-none" />

      {/* Left: Circular icon badge */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center shrink-0 border border-white/20 dark:border-black/10 shadow-2xs">
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin text-white dark:text-[#18181b]" />
        ) : (
          <PayPhoneIcon className="w-5 h-5 text-white dark:text-[#18181b]" />
        )}
      </div>

      {/* Center: Action Title */}
      <div className="flex-1 px-3 text-left">
        <span className="text-xs sm:text-sm font-bold tracking-tight block leading-tight">
          {isProcessing 
            ? "Conectando con PayPhone..." 
            : payphoneMode === "box" 
              ? "Pagar con Cajita PayPhone" 
              : "Pagar con PayPhone"}
        </span>
        {!isProcessing && (
          <span className="text-[10px] font-normal opacity-70 block">
            Transacción Bancaria Segura
          </span>
        )}
      </div>

      {/* Right: Amount pill + Circular Arrow badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-white/15 dark:bg-black/10 text-white dark:text-[#18181b] border border-white/20 dark:border-black/10">
          ${finalTotal.toFixed(2)}
        </span>
        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#18181b] text-[#18181b] dark:text-white flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
    </button>
  </div>

  </div>

  </div>
  )}

  {/* ======================================================================= */}
  {/* STEP 3: ORDER CONFIRMED CELEBRATION (Receipt View) */}
  {/* ======================================================================= */}
  {step === "success" && lastPlacedOrder && (
  <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
  
  <div className="relative w-20 h-20 rounded-full bg-[#FAF8F5] dark:bg-white/5 border border-black/[0.08] dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-center shadow-md">
    <CheckCircle2 className="w-10 h-10" />
    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] flex items-center justify-center shadow-md">
      <Sparkles className="w-3.5 h-3.5" />
    </div>
  </div>

  <div>
    <h3 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight">¡Pedido Confirmado!</h3>
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
      Tu compra ha sido procesada con éxito. Ya estamos preparando cada pieza con el máximo cuidado artesanal.
    </p>
  </div>

  {/* Receipt Card */}
  <div className="w-full p-6 sm:p-8 rounded-[2rem] bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-sm text-left space-y-4">
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5 text-xs sm:text-sm">
      <span className="text-gray-400 font-medium">Identificador</span>
      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{lastPlacedOrder.id}</span>
    </div>
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5 text-xs sm:text-sm">
      <span className="text-gray-400 font-medium">Nº de Seguimiento</span>
      <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{lastPlacedOrder.trackingNumber}</span>
    </div>
    <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/5 text-xs sm:text-sm">
      <span className="text-gray-400 font-medium">Entrega Estimada</span>
      <span className="font-semibold text-gray-800 dark:text-gray-200">3-5 días laborables</span>
    </div>
    <div className="flex items-center justify-between pt-2 text-xs sm:text-sm">
      <span className="font-bold text-gray-700 dark:text-gray-300">Total Pagado</span>
      <span className="font-sans font-extrabold text-2xl text-gray-950 dark:text-white">
        ${Number(lastPlacedOrder?.total || 0).toFixed(2)} USD
      </span>
    </div>
  </div>

  {/* Action Buttons with 2IXO Capsule Design */}
  <div className="w-full space-y-3 pt-2">
    <button 
      onClick={() => {
        setIsOpen(false);
        router.push("/profile");
      }}
      className="group w-full h-14 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-sm flex items-center justify-between px-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:opacity-95 transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-black/10 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white dark:text-[#18181b]" />
      </div>
      <span>Ver Pedido en mi Perfil</span>
      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#18181b] text-[#18181b] dark:text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </div>
    </button>

    <button 
      onClick={() => {
        setIsOpen(false);
        setStep("bag");
      }}
      className="w-full py-3.5 px-6 rounded-full bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.07] dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-black/[0.06] dark:border-white/10 text-xs sm:text-sm font-bold transition-all cursor-pointer"
    >
      Seguir Explorando Colecciones
    </button>
  </div>

  </div>
  )}

  </div>

  </motion.div>

  {/* ======================================================================= */}
  {/* PAYPHONE ECUADOR SIMULATION MODAL (Modo Preparación / RUC en trámite) */}
  {/* ======================================================================= */}
  {isPayPhoneSimOpen && payphoneSimData && (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.25)] border border-black/[0.08] dark:border-white/10 space-y-5 animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/[0.06] dark:border-white/10">
              <PayPhoneIcon className="w-6 h-6 text-[#FF5E00]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                PayPhone Ecuador <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">Modo Pruebas</span>
              </h3>
              <p className="text-[11px] text-gray-400">Ambiente de Simulación SRI / RUC en trámite</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPayPhoneSimOpen(false)}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Overview inside Modal */}
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 space-y-2 text-xs">
          <div className="flex justify-between font-semibold items-baseline">
            <span className="text-gray-500 dark:text-gray-400">Total a Autorizar:</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">${Number(payphoneSimData.total).toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span className="text-gray-400">Pedido ID:</span>
            <span className="font-mono font-bold">{payphoneSimData.orderId}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span className="text-gray-400">Tx ID (PayPhone):</span>
            <span className="font-mono text-[10px]">{payphoneSimData.clientTransactionId}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span className="text-gray-400">Cliente / Correo:</span>
            <span>{payphoneSimData.customerEmail}</span>
          </div>
          {payphoneSimData.shippingAddr?.idNumber && (
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">Cédula / RUC Comprador:</span>
              <span className="font-mono font-bold">{payphoneSimData.shippingAddr.idNumber}</span>
            </div>
          )}
        </div>

        {/* Status Notice */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/5 text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Arquitectura de Pagos Completada al 100%</span>
          </div>
          <p>
            Tu tienda ya tiene listos los endpoints de cobro, el recálculo zero-trust de montos y el despacho automático de facturas. Como el RUC ante el SRI está en trámite, puedes simular la autorización bancaria con 1 clic para validar todo el flujo de pedidos.
          </p>
        </div>

        {/* Simulated Card Badges */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-[#2c2c2e] text-[11px]">
          <span className="text-gray-500 font-medium">Tarjeta de Prueba:</span>
          <span className="font-mono font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <VisaLogo className="h-2.5" fill="#1A1F71" /> VISA •••• 4242
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleApprovePayPhoneSimulation}
            disabled={isSimulatingApproval}
            className="w-full h-13 rounded-full bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer active:scale-[0.99] hover:opacity-95"
          >
            {isSimulatingApproval ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autorizando transacción...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simular Pago Aprobado (${Number(payphoneSimData.total).toFixed(2)})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPayPhoneSimOpen(false)}
            disabled={isSimulatingApproval}
            className="w-full py-2.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  )}

      </div>
    )}
  </AnimatePresence>
);
}
