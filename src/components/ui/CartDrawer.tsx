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
  AlertTriangle
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore, Order, PaymentCard } from "@/lib/userStore";
import { useCatalogStore, isAgotadoBadge } from "@/lib/catalogStore";

// High-Ticket Payment Method SVGs & Micro-Components (1:1 Aspect Ratio, Zero Cutoffs)
function AppleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function PayPalIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 100 100" fill="none">
      <path d="M72.2 27.8c-1.4 10.3-9 16.4-19.3 16.4H39.2l-4.5 28.5h-13l9-57.1h25.8c10.4 0 17.5 5.1 15.7 12.2z" fill="#003087" />
      <path d="M79.4 39.8c-1.8 11.2-10 18.2-21.2 18.2H45.8l-3.3 20.8h-12l7.2-45.7h17.9c11.5 0 21.6 0 24 6.7z" fill="#0079C1" />
    </svg>
  );
}

function ApplePayLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 80" fill="currentColor">
      <path d="M45.54 39.46c-.07-9.5 7.74-14.1 8.1-14.33-4.42-6.46-11.29-7.34-13.73-7.44-5.83-.59-11.41 3.44-14.37 3.44-2.99 0-7.56-3.36-12.44-3.26-6.38.1-12.28 3.73-15.58 9.47-6.68 11.59-1.7 28.75 4.8 38.13 3.18 4.6 6.96 9.77 11.93 9.58 4.79-.19 6.6-3.08 12.39-3.08 5.8 0 7.42 3.08 12.45 2.98 5.12-.1 8.37-4.66 11.52-9.28 3.65-5.33 5.15-10.5 5.25-10.77-.12-.05-10.19-3.91-10.32-15.44zM37.94 13.56c2.61-3.17 4.38-7.59 3.9-12.01-3.77.15-8.33 2.51-11.03 5.67-2.39 2.76-4.48 7.25-3.92 11.54 4.21.33 8.44-2.03 11.05-5.2z" />
      <path d="M83.4 5.37h15.48c10.75 0 17.52 6.55 17.52 16.54 0 9.99-6.86 16.59-17.65 16.59h-5.46v24.63H83.4V5.37zm15.15 25.1c5.96 0 9.29-3.32 9.29-8.56 0-5.23-3.33-8.52-9.29-8.52h-7.25v17.08h7.25zm22.42 22.04c0-8.24 6.32-13.52 17.57-14.19l7.08-.43v-3.72c0-4.14-2.88-6.61-7.85-6.61-4.75 0-7.79 2.22-8.39 5.56h-7.39c.65-7.1 6.86-11.83 15.99-11.83 9.4 0 15.63 5.06 15.63 12.87v34.05h-7.61v-7.88c-2.34 5.28-7.78 8.49-14.07 8.49-8.5 0-14.28-5.37-14.28-13.23zm24.65-4.41v-3.98l-6.33.43c-6.17.43-9.45 3.01-9.45 7.42 0 4.41 3.28 6.99 8.28 6.99 6.27 0 10.45-4.25 10.45-10.86zm18.3 27.69l7.85-23.75-13.57-36.21h8.5l9.21 27.18 9.17-27.18h8.37l-19.67 50.15h-8.08z" />
    </svg>
  );
}

function GooglePayLogo({ className = "h-4" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 font-sans ${className}`}>
      <GoogleIcon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold text-gray-800 tracking-tight">Pay</span>
    </div>
  );
}

function PayPalLogo({ className = "h-4" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <PayPalIcon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-extrabold italic text-[#003087] tracking-tight">PayPal</span>
    </div>
  );
}

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

function ContactlessIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8.5 16.5a5 5 0 0 1 0-9" />
      <path d="M12 19a8.5 8.5 0 0 1 0-14" />
      <path d="M15.5 21.5a12 12 0 0 1 0-19" />
    </svg>
  );
}

function EmvChip() {
  return (
    <div className="relative w-11 h-8 sm:w-12 sm:h-9 rounded-md bg-gradient-to-br from-[#f3db8a] via-[#dfba56] to-[#9c7923] p-[1.5px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_2px_6px_rgba(0,0,0,0.5)] border border-[#7a5b14]/70 overflow-hidden shrink-0">
      <div className="w-full h-full rounded-[3px] border border-[#6d5111]/45 flex flex-col justify-between p-[2px] bg-gradient-to-b from-transparent via-[#f8e49d]/20 to-transparent">
        <div className="flex justify-between h-2.5 border-b border-[#6d5111]/40">
          <div className="w-2.5 border-r border-[#6d5111]/40" />
          <div className="w-2.5 border-l border-[#6d5111]/40" />
        </div>
        <div className="flex justify-between h-2.5">
          <div className="w-2.5 border-r border-[#6d5111]/40" />
          <div className="w-2.5 border-l border-[#6d5111]/40" />
        </div>
      </div>
      <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent transform -skew-x-12 pointer-events-none" />
    </div>
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
    cards, 
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

  // Payment method selection
  const [selectedMethod, setSelectedMethod] = useState<"card" | "apple" | "google" | "paypal">("card");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [hoveredPaymentMethod, setHoveredPaymentMethod] = useState<string | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Quick Address Inline Form
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCountry, setAddrCountry] = useState("España");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Checkout Processing
  const [isProcessing, setIsProcessing] = useState(false);
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
    setSelectedCardId(cards && cards.length > 0 ? cards[0].id : "");
    const defaultAddr = addresses?.find(a => a.isDefault) || (addresses && addresses.length > 0 ? addresses[0] : null);
    const activeAddr = address || defaultAddr;
    if (activeAddr) {
      setAddrRecipient(activeAddr.recipient || user?.name || "");
      setAddrStreet(activeAddr.street);
      setAddrCity(activeAddr.city);
      setAddrPostal(activeAddr.postalCode);
      setAddrState(activeAddr.state || "");
      setAddrCountry(activeAddr.country || "España");
      if (!address && defaultAddr) {
        setAddress(defaultAddr);
      }
    } else {
      setAddrRecipient(user?.name || "");
      setAddrStreet("");
      setAddrCity("");
      setAddrPostal("");
      setAddrState("");
      setAddrCountry("España");
    }
  }, [user?.id, user?.name, cards, address, addresses, setAddress]);

  // Reset wallet hover if wallet closes
  useEffect(() => {
    if (!isWalletOpen) {
      setHoveredCardId(null);
    }
  }, [isWalletOpen]);

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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
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
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      postalCode: addrPostal.trim(),
      country: addrCountry.trim(),
      isDefault: addresses.length === 0
    });
    setAddrRecipient("");
    setAddrStreet("");
    setAddrCity("");
    setAddrPostal("");
    setAddrState("");
    setAddrCountry("España");
    setLocationError(null);
    setLocationSuccess(false);
    setIsEditingAddress(false);
  };

  const handleProceedToPayment = () => {
    if (hasAgotadoItems) {
      return;
    }

    if (!isAuthenticated) {
      setIsOpen(false);
      router.push("/auth/login");
      return;
    }
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null;
    if (defaultAddr) {
      setAddress(defaultAddr);
    }
    setStep("payment");
  };

  const handleConfirmOrder = () => {
    if (!address && (!addresses || addresses.length === 0) && !addrStreet) {
      setIsEditingAddress(true);
      return;
    }
    let shippingAddr = address;
    if (!shippingAddr && addresses && addresses.length > 0) {
      shippingAddr = addresses.find(a => a.isDefault) || addresses[0];
      setAddress(shippingAddr);
    }
    setIsProcessing(true);

    setTimeout(() => {
      const orderId = `INV_${Math.floor(100000 + Math.random() * 900000)}`;
      const trackingCode = `LM-${Math.floor(1000000 + Math.random() * 9000000)}`;

      const customerName = user?.name || shippingAddr?.recipient || addrRecipient || "Cliente";
      const customerEmail = user?.email || "cliente@lumina.com";
      const recipientName = shippingAddr?.recipient || addrRecipient || customerName;

      const effectiveCards = cards && cards.length > 0 ? cards : DEMO_CARDS;
      const chosenCard = effectiveCards.find(c => c.id === selectedCardId) || effectiveCards[0];
      
      let paymentDesc = "Tarjeta Bancaria";
      if (selectedMethod === "card") {
        paymentDesc = chosenCard ? `${chosenCard.type.toUpperCase()} •••• ${chosenCard.number.slice(-4)}` : "Tarjeta Bancaria";
      } else if (selectedMethod === "apple") {
        paymentDesc = "Apple Pay";
      } else if (selectedMethod === "google") {
        paymentDesc = "Google Pay";
      } else if (selectedMethod === "paypal") {
        paymentDesc = "PayPal";
      }

      const now = new Date();
      const formattedDate = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      const formattedTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const newOrder: Order = {
        id: orderId,
        date: formattedDate,
        time: formattedTime,
        createdAt: now.toISOString(),
        status: 'Procesando',
        trackingNumber: trackingCode,
        total: finalTotal,
        items: [...items],
        customerName,
        customerEmail,
        recipient: recipientName,
        shippingAddress: shippingAddr ? {
          id: shippingAddr.id,
          recipient: recipientName,
          street: shippingAddr.street,
          city: shippingAddr.city,
          state: shippingAddr.state,
          postalCode: shippingAddr.postalCode,
          country: shippingAddr.country,
          isDefault: shippingAddr.isDefault
        } : (addrStreet ? {
          id: "addr-order",
          recipient: recipientName,
          street: addrStreet,
          city: addrCity,
          state: addrState,
          postalCode: addrPostal,
          country: addrCountry,
          isDefault: true
        } : undefined),
        paymentMethod: paymentDesc,
        userId: user?.id,
      };

      addOrder(newOrder);
      setLastPlacedOrder(newOrder);
      clearCart();
      setIsProcessing(false);
      setStep("success");
    }, 1200);
  };

  // Demo cards matching user's video exactly (4120 Sapphire, 4916 Platinum, 0019 Coral)
  const DEMO_CARDS: PaymentCard[] = useMemo(() => [
    {
      id: "card-demo-1",
      number: "•••• •••• •••• 4120",
      holder: user?.name ? user.name.toUpperCase() : "ERICK PÉREZ",
      exp: "09/29",
      type: "visa",
      isDefault: true,
    },
    {
      id: "card-demo-2",
      number: "•••• •••• •••• 4916",
      holder: user?.name ? user.name.toUpperCase() : "ERICK PÉREZ",
      exp: "04/28",
      type: "visa",
      isDefault: false,
    },
    {
      id: "card-demo-3",
      number: "•••• •••• •••• 0019",
      holder: user?.name ? user.name.toUpperCase() : "ERICK PÉREZ",
      exp: "11/27",
      type: "mastercard",
      isDefault: false,
    },
  ], [user?.name]);

  const availableCards = useMemo(() => {
    return cards && cards.length > 0 ? cards : DEMO_CARDS;
  }, [cards, DEMO_CARDS]);

  const effectiveSelectedCardId = selectedCardId || availableCards[0]?.id;
  const activeCard = availableCards.find(c => c.id === effectiveSelectedCardId) || availableCards[0];

  const orderedCards = useMemo(() => {
    const others = availableCards.filter(c => c.id !== activeCard.id);
    return [...others, activeCard];
  }, [availableCards, activeCard]);

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
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 perspective-[2000px] overflow-hidden">
          
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
            className="relative w-full max-w-6xl h-full max-h-[92vh] bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/90 shadow-[0_35px_120px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden z-10"
          >

            {/* Top Bar Header */}
            <header className="px-6 sm:px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm">
              
              {/* Brand Logo & Studio Identity */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-display italic font-bold text-lg text-gray-900 tracking-tight">
                    Lumina<span className="text-[#8c9276]">.</span>
                  </span>
                  <span className="text-xs text-gray-400 font-medium ml-2 hidden sm:inline">
                    • Bolsa de Compras & Pasarela
                  </span>
                </div>
              </div>

              {/* Center Step Indicator */}
              <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl">
                <button 
                  onClick={() => setStep("bag")}
                  className={`px-3.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    step === "bag" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  1. Carrito ({items.length})
                </button>
                <button 
                  onClick={() => {
                    if (items.length > 0) handleProceedToPayment();
                  }}
                  disabled={items.length === 0}
                  className={`px-3.5 py-1 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                    step === "payment" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  2. Pasarela de Pago
                </button>
              </div>

              {/* Right Action: Close Button */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
                >
                  <span>Cerrar</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </header>

            {/* ========================================================================= */}
            {/* MAIN CANVAS SCROLLABLE AREA */}
            {/* ========================================================================= */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 hide-scrollbar space-y-10">

              {/* ======================================================================= */}
              {/* STEP 1: CART PAGE VIEW (Skyrise Decor / Crescendo Spacious Studio) */}
              {/* ======================================================================= */}
              {step === "bag" && (
                <>
                  {/* Page Title & Subtitle */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-1">
                        Estudio de Compra
                      </span>
                      <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight">
                        Bolsa de Compras
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Piezas de autor seleccionadas con precisión artesanal para tu espacio.
                      </p>
                    </div>

                    {items.length > 0 && (
                      <button 
                        onClick={clearCart}
                        className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 self-start sm:self-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Vaciar Bolsa</span>
                      </button>
                    )}
                  </div>

                  {/* ALERTA DE PRODUCTOS AGOTADOS */}
                  {hasAgotadoItems && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3.5 text-red-900 shadow-sm animate-fade-in transition-all">
                      <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-sm text-red-900">
                          {agotadoItems.length === 1 ? "Producto no disponible en tu bolsa" : "Productos no disponibles en tu bolsa"}
                        </p>
                        <p className="mt-1 text-red-700 leading-relaxed font-medium">
                          {agotadoItems.length === 1
                            ? `El producto "${agotadoItems[0].product.title}" está marcado como AGOTADO. Debes eliminarlo de tu bolsa de compras para poder continuar hacia la pasarela de pago.`
                            : `Tienes ${agotadoItems.length} productos marcados como AGOTADOS en tu bolsa. Debes eliminarlos para poder continuar con tu pedido.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-24 h-24 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100 shadow-inner">
                        <ShoppingBag className="w-10 h-10 stroke-1" />
                      </div>
                      <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Tu bolsa de autor está vacía</h3>
                      <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
                        Explora nuestra exclusiva colección de iluminación, aromaterapia, textiles y gadgets minimalistas para llenar tu hogar de calma.
                      </p>
                      <button 
                        onClick={() => { setIsOpen(false); router.push("/shop"); }}
                        className="relative overflow-hidden px-8 py-3.5 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-[0_10px_30px_rgba(37,99,235,0.3)] border border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <span className="relative z-10">Explorar Catálogo Completo</span>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                      
                      {/* ---------------------------------------------------- */}
                      {/* Left Column: Spacious Products Table (7 or 8 cols) */}
                      {/* ---------------------------------------------------- */}
                      <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-200/60 p-6 sm:p-8 shadow-sm space-y-6">
                        {/* Table Column Headers (Directly from Reference Image) */}
                        <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100 px-3.5 sm:px-4">
                          <span className="col-span-5">Producto</span>
                          <span className="col-span-3 text-center">Cantidad</span>
                          <span className="col-span-2 text-right pr-6">Subtotal</span>
                          <span className="col-span-2 text-right pr-1">Acción</span>
                        </div>

                        {/* Product Rows with generous breathing room */}
                        <div className="space-y-3 pt-1">
                          {items.map((item) => {
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
                                    : "border border-transparent hover:bg-gray-50/50 hover:border-gray-100/80"
                                }`}
                              >
                                {/* Product Info (5 cols) */}
                                <div className="sm:col-span-5 flex items-center gap-4">
                                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-white shadow-sm">
                                    <Image 
                                      src={item.product.imageUrl} 
                                      alt={item.product.title} 
                                      fill 
                                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    {itemIsAgotado && (
                                      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-1">
                                        <span className="bg-red-50/90 text-red-600 font-bold border border-red-200 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm text-center backdrop-blur-md">
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
                                    <h4 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1 mt-0.5">
                                      {item.product.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                                      {item.color && (
                                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-[11px]">
                                          {item.color}
                                        </span>
                                      )}
                                      {item.size && (
                                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-[11px]">
                                          Talla: {item.size}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 sm:hidden">
                                      Unitario: ${item.product.price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                {/* Quantity Capsule with Liquid Glass (3 cols) */}
                                <div className="sm:col-span-3 flex sm:justify-center items-center">
                                  <div className="flex items-center bg-gray-100/90 rounded-full px-2.5 py-1.5 border border-gray-200/70 shadow-inner">
                                    <button 
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center border border-white shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md active:scale-90 transition-all"
                                      title="Disminuir"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-10 text-center font-mono font-bold text-xs sm:text-sm text-gray-900">
                                      {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
                                    </span>
                                    <button 
                                      disabled={itemIsAgotado}
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center border border-white shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all ${
                                        itemIsAgotado 
                                          ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-40" 
                                          : "bg-white/90 hover:bg-white text-gray-800 active:scale-90"
                                      }`}
                                      title={itemIsAgotado ? "Producto sin existencias" : "Aumentar"}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                              {/* Subtotal Price (2 cols) */}
                              <div className="sm:col-span-2 sm:text-right flex items-center justify-between sm:block pr-6">
                                <span className="text-xs text-gray-400 sm:hidden">Subtotal:</span>
                                <span className="font-extrabold text-base sm:text-lg text-gray-900">
                                  ${(item.product.price * item.quantity).toFixed(2)}
                                </span>
                              </div>

                              {/* PURE LIQUID GLASS DELETE BUTTON (Matching Diagram Reference) */}
                              <div className="sm:col-span-2 flex justify-end items-center sm:text-right">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="relative overflow-hidden group/del px-4 py-1.5 rounded-full text-xs font-semibold text-rose-600 
                                  bg-white/40 hover:bg-white/65 backdrop-blur-2xl
                                  border border-white/90 
                                  shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(0,0,0,0.04)]
                                  hover:shadow-[0_8px_24px_rgba(225,29,72,0.18),inset_0_2px_3px_rgba(255,255,255,1)]
                                  transition-all duration-300 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-auto"
                                  title="Eliminar producto"
                                >
                                  {/* Specular Highlight Sheen (Top glass edge curve) */}
                                  <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-90" />

                                  {/* Diagonal Glossy Reflection Layer */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-full" />

                                  {/* Caustic Glow Corner Spot */}
                                  <div className="absolute top-1 left-2.5 w-2.5 h-1 bg-white/80 rounded-full blur-[0.5px] pointer-events-none" />

                                  <Trash2 className="relative z-10 w-3.5 h-3.5 text-rose-500 group-hover/del:rotate-12 group-hover/del:text-rose-600 transition-all duration-300" />
                                  <span className="relative z-10 tracking-tight text-rose-600 font-bold text-[11px]">Eliminar</span>
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                        {/* Bottom Actions Row */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                          <button 
                            onClick={() => { setIsOpen(false); router.push("/shop"); }}
                            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> Continuar Comprando
                          </button>
                          <span className="text-xs text-gray-400 font-medium">
                            {items.length === 1 
                              ? "1 producto listo para despacho" 
                              : `${items.length} productos listos para despacho`}
                          </span>
                        </div>

                      </div>

                      {/* ---------------------------------------------------- */}
                      {/* Right Column: Order Summary Card (4 cols) */}
                      {/* ---------------------------------------------------- */}
                      <div className="lg:col-span-4 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-gray-200/70 p-6 sm:p-7 shadow-lg shadow-gray-200/50 space-y-6">
                        
                        <h3 className="font-display font-bold text-xl text-gray-900 tracking-tight pb-3 border-b border-gray-100">
                          Resumen del Pedido
                        </h3>

                        {/* Free Shipping Progress Capsule */}
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-gray-700 flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-blue-600" />
                              {hasFreeShipping ? "¡Envío Gratuito Asegurado!" : `Faltan $${amountToFreeShipping.toFixed(2)}`}
                            </span>
                            <span className="text-blue-600 font-bold">{freeShippingProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${freeShippingProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Coupon Code Form with Liquid Glass Apply */}
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                            <input 
                              type="text" 
                              value={couponInput}
                              onChange={e => setCouponInput(e.target.value)}
                              placeholder="Código (ej: LUMINA10)"
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="relative overflow-hidden px-4 py-2 rounded-xl font-bold text-xs text-white bg-gray-900 hover:bg-gray-800 border border-white/20 shadow-sm transition-all shrink-0 active:scale-95"
                          >
                            <span className="relative z-10">Aplicar</span>
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                          </button>
                        </form>

                        {couponFeedback && (
                          <p className={`text-xs font-semibold ${couponFeedback.success ? "text-emerald-700" : "text-red-600"}`}>
                            {couponFeedback.msg}
                          </p>
                        )}

                        {couponCode && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              Cupón: <strong>{couponCode}</strong> ({discountPercent}% dto)
                            </span>
                            <button onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-900">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Breakdown Lines */}
                        <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 pt-1">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold text-gray-900">${subtotal.toFixed(2)} USD</span>
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

                          <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                            <div>
                              <span className="text-sm font-bold text-gray-900">Total</span>
                              <span className="text-[10px] text-gray-400 block">Impuestos incluidos</span>
                            </div>
                            <span className="font-display font-bold text-2xl sm:text-3xl text-blue-700">
                              ${finalTotal.toFixed(2)} USD
                            </span>
                          </div>
                        </div>

                        {/* Warranty Note from Reference Image */}
                        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-xs text-gray-600">
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed">
                            <strong>Garantía Oficial Lumina de 2 años.</strong> Devolución íntegra sin compromiso en los primeros 30 días.
                          </p>
                        </div>

                        {/* LIQUID GLASS PROCEDER AL PAGO BUTTON */}
                        <button 
                          onClick={handleProceedToPayment}
                          className={`relative overflow-hidden w-full h-14 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300
                          shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-white/30
                          before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:via-white/10 before:to-transparent before:pointer-events-none before:rounded-2xl
                          after:absolute after:inset-x-0 after:top-0 after:h-[1px] after:bg-white/60 cursor-pointer group ${
                            hasAgotadoItems
                              ? "bg-gradient-to-r from-red-600 via-red-700 to-rose-700 shadow-red-500/30 hover:scale-[1.01] active:scale-[0.99]"
                              : "bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#1d4ed8] shadow-[0_12px_36px_rgba(37,99,235,0.35),0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_44px_rgba(37,99,235,0.45)] hover:scale-[1.01] active:scale-[0.99]"
                          }`}
                        >
                          <span className="relative z-10 tracking-wide">
                            {hasAgotadoItems ? "Elimina productos agotados para pagar" : "Proceder al Pago"}
                          </span>
                          <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                      </div>

                    </div>
                  )}

                  {/* Recommended Pieces Row (Craft Own Furniture Section) */}
                  {recommendedProducts.length > 0 && (
                    <div className="pt-8 border-t border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-xl text-gray-900">
                            Piezas que complementan tu pedido
                          </h3>
                          <p className="text-xs text-gray-500">Diseñadas para armonizar en iluminación y estética.</p>
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
                            className="p-4 rounded-2xl bg-white/70 hover:bg-white border border-gray-100 hover:border-gray-200 shadow-sm transition-all cursor-pointer flex items-center gap-3.5 group"
                          >
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              <Image src={prod.imageUrl} alt={prod.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {prod.title}
                              </h5>
                              <p className="text-[11px] text-gray-400 mt-0.5">{prod.category}</p>
                              <span className="font-extrabold text-xs text-gray-900 mt-1 block">
                                ${prod.price.toFixed(2)}
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
                  
                  <div className="border-b border-gray-100 pb-4">
                    <button 
                      onClick={() => setStep("bag")}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mb-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Bolsa
                    </button>
                    <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-gray-950 tracking-tight">
                      Método de Pago y Entrega
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configura tu dirección y selecciona tu método de pago preferido.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left 7 cols: Address & Card Selector */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Shipping Address */}
                      <div className="p-6 rounded-[2rem] bg-white border border-gray-200/70 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <h4 className="font-bold text-sm text-gray-900">Dirección de Entrega</h4>
                            {addresses.length > 0 && (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                {addresses.length}/4
                              </span>
                            )}
                          </div>
                          {isEditingAddress ? (
                            <button 
                              onClick={() => setIsEditingAddress(false)}
                              className="text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
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
                                setAddrCountry("España");
                              }}
                              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              + Añadir
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-400">
                              Límite (4 máx.)
                            </span>
                          )}
                        </div>

                        {isEditingAddress ? (
                          <form onSubmit={handleSaveAddress} className="space-y-3 pt-1">
                            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                              <span className="text-xs font-bold text-gray-800">
                                Nueva Dirección de Entrega
                              </span>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setLocationError(null);
                                  setLocationSuccess(false);
                                  setIsEditingAddress(false);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
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
                                className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed
                                  bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.99]"
                              >
                                {isDetectingLocation ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                    <span>Detectando ubicación real del dispositivo...</span>
                                  </>
                                ) : (
                                  <>
                                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Autocompletar con mi ubicación actual</span>
                                  </>
                                )}
                              </button>

                              {locationError && (
                                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 mt-1.5 leading-tight">
                                  {locationError}
                                </p>
                              )}

                              {locationSuccess && (
                                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2 mt-1.5 leading-tight flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>¡Ubicación detectada! Revisa los campos y escribe quién recibe.</span>
                                </p>
                              )}
                            </div>

                            <div className="relative flex py-0.5 items-center">
                              <div className="flex-grow border-t border-gray-200"></div>
                              <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">o ingresa los datos manualmente</span>
                              <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                ¿Quién recibe? (Nombre y apellidos)
                              </label>
                              <input 
                                type="text" 
                                value={addrRecipient} 
                                onChange={e => setAddrRecipient(e.target.value)} 
                                placeholder={user?.name || "Ej: Juan Pérez / Nombre del destinatario"}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Calle y número</label>
                              <input 
                                type="text" 
                                value={addrStreet} 
                                onChange={e => setAddrStreet(e.target.value)} 
                                placeholder="Calle Gran Vía 14, 3ºB"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ciudad</label>
                                <input 
                                  type="text" 
                                  value={addrCity} 
                                  onChange={e => setAddrCity(e.target.value)} 
                                  placeholder="Madrid"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Código Postal</label>
                                <input 
                                  type="text" 
                                  value={addrPostal} 
                                  onChange={e => setAddrPostal(e.target.value)} 
                                  placeholder="28001"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Provincia/Estado</label>
                                <input 
                                  type="text" 
                                  value={addrState} 
                                  onChange={e => setAddrState(e.target.value)} 
                                  placeholder="Madrid"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">País</label>
                                <input 
                                  type="text" 
                                  value={addrCountry} 
                                  onChange={e => setAddrCountry(e.target.value)} 
                                  placeholder="España"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button 
                                type="button"
                                onClick={() => setIsEditingAddress(false)}
                                className="w-1/3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button 
                                type="submit"
                                className="w-2/3 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                              >
                                Guardar Dirección
                              </button>
                            </div>
                          </form>
                        ) : addresses.length > 0 ? (
                          <div className="space-y-2.5">
                            <p className="text-[11px] text-gray-500">
                              Selecciona la dirección para este envío:
                            </p>
                            <div className="space-y-2">
                              {addresses.map((addr) => {
                                const isSelected = address?.id 
                                  ? address.id === addr.id 
                                  : (address?.street === addr.street && address?.postalCode === addr.postalCode) || (addresses.length === 1);

                                return (
                                  <div
                                    key={addr.id}
                                    onClick={() => setAddress(addr)}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                      isSelected
                                        ? "bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500/20"
                                        : "bg-gray-50/70 hover:bg-gray-50 border-gray-200/80 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected 
                                          ? "border-blue-600 bg-blue-600 text-white" 
                                          : "border-gray-300 bg-white"
                                      }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-xs text-gray-900 truncate">
                                            {addr.recipient || user?.name || "Destinatario"}
                                          </span>
                                          {addr.isDefault && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                              Predeterminada
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-700 font-medium truncate mt-0.5">
                                          {addr.street}
                                        </p>
                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                          {addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.postalCode} • {addr.country}
                                        </p>
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : address ? (
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs text-gray-900">
                                  {address.recipient || user?.name || "Destinatario"}
                                </p>
                                {address.isDefault && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                    Predeterminada
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 font-medium mt-0.5">{address.street}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {address.city}{address.state ? `, ${address.state}` : ""}, {address.postalCode} • {address.country}
                              </p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                            <p className="text-xs text-amber-800 font-medium">Aún no has configurado tu dirección.</p>
                            <button 
                              onClick={() => {
                                setIsEditingAddress(true);
                                setAddrRecipient(user?.name || "");
                                setAddrStreet("");
                                setAddrCity("");
                                setAddrPostal("");
                                setAddrState("");
                                setAddrCountry("España");
                              }}
                              className="px-4 py-1.5 bg-amber-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              + Añadir Dirección Ahora
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Payment Method Selector (Liquid Glass Horizontal Pill with Apple Droplet) */}
                      <div className="p-6 rounded-[2rem] bg-white border border-gray-200/70 shadow-sm space-y-5">
                        <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-900">
                              Método de Pago
                            </h4>
                          </div>
                          <span className="font-mono text-[10px] font-medium text-gray-400 tracking-tight uppercase">
                            Cifrado Seguro SSL 256-Bit
                          </span>
                        </div>

                        {/* LIQUID GLASS PAYMENT SELECTOR (Horizontal-Only Slider - Zero Y Shift) */}
                        {(() => {
                          const PAYMENT_OPTIONS = [
                            { 
                              id: "card" as const, 
                              label: "Tarjeta", 
                              renderIcon: (active: boolean) => (
                                <CreditCard className={`w-4 h-4 transition-colors duration-200 ${active ? "text-gray-900" : "text-gray-500"}`} />
                              ) 
                            },
                            { 
                              id: "apple" as const, 
                              label: "Apple Pay", 
                              renderIcon: (active: boolean) => (
                                <AppleIcon className={`w-4 h-4 transition-colors duration-200 ${active ? "text-gray-900" : "text-gray-500"}`} />
                              ) 
                            },
                            { 
                              id: "google" as const, 
                              label: "Google Pay", 
                              renderIcon: (active: boolean) => (
                                <div className={`transition-all duration-200 ${active ? "opacity-100" : "opacity-60"}`}>
                                  <GoogleIcon className="w-4 h-4" />
                                </div>
                              ) 
                            },
                            { 
                              id: "paypal" as const, 
                              label: "PayPal", 
                              renderIcon: (active: boolean) => (
                                <div className={`transition-all duration-200 ${active ? "opacity-100" : "opacity-60"}`}>
                                  <PayPalIcon className="w-4 h-4" />
                                </div>
                              ) 
                            },
                          ];
                          const activeMethodIndex = Math.max(0, PAYMENT_OPTIONS.findIndex(m => m.id === selectedMethod));
                          const hoveredMethodIndex = hoveredPaymentMethod ? PAYMENT_OPTIONS.findIndex(m => m.id === hoveredPaymentMethod) : null;

                          return (
                            <div 
                              className="relative p-1.5 rounded-full bg-slate-100/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.06)] grid grid-cols-4 max-w-xl mx-auto font-sans overflow-hidden select-none"
                              onMouseLeave={() => setHoveredPaymentMethod(null)}
                            >
                              {/* The Single Sliding Active Liquid Glass Droplet (Strictly Horizontal, Zero Y Movement) */}
                              <motion.div
                                className="absolute top-1.5 bottom-1.5 rounded-full bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1.5px_2px_rgba(255,255,255,1)] border border-white pointer-events-none z-0"
                                style={{
                                  width: "calc((100% - 12px) / 4)",
                                  left: "6px",
                                }}
                                animate={{
                                  x: `${activeMethodIndex * 100}%`,
                                }}
                                transition={{
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 30,
                                  mass: 0.7
                                }}
                              >
                                {/* Specular curved glass highlight rim */}
                                <div className="absolute inset-x-3 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
                                {/* Caustic glass reflection glint in corner */}
                                <div className="absolute top-1 left-3 w-3 h-1 bg-white/90 rounded-full blur-[0.4px]" />
                              </motion.div>

                              {/* Hover Droplet Indicator */}
                              {hoveredMethodIndex !== null && hoveredMethodIndex !== activeMethodIndex && (
                                <motion.div
                                  className="absolute top-1.5 bottom-1.5 rounded-full bg-white/40 pointer-events-none z-0"
                                  style={{
                                    width: "calc((100% - 12px) / 4)",
                                    left: "6px",
                                  }}
                                  initial={{ opacity: 0 }}
                                  animate={{
                                    x: `${hoveredMethodIndex * 100}%`,
                                    opacity: 1,
                                  }}
                                  exit={{ opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 480,
                                    damping: 35,
                                  }}
                                />
                              )}

                              {PAYMENT_OPTIONS.map((m) => {
                                const isActive = selectedMethod === m.id;

                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMethod(m.id)}
                                    onMouseEnter={() => setHoveredPaymentMethod(m.id)}
                                    className={`relative z-10 flex items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-full text-xs font-semibold font-sans tracking-tight outline-none cursor-pointer transition-colors duration-200 ${
                                      isActive ? "text-gray-950 font-bold" : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    <span className="flex items-center justify-center shrink-0">
                                      {m.renderIcon(isActive)}
                                    </span>
                                    <span className="whitespace-nowrap">
                                      {m.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* VIEW 1: CREDIT / DEBIT CARD DETAILS WITH BLUE WALLET SLEEVE */}
                        {selectedMethod === "card" && (
                          <div className="pt-1 space-y-4 font-sans">
                            {/* 1. Sleek Compact Header Bar (Not Bulky, Modern & Refined) */}
                            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/80 border border-slate-200/70 shadow-2xs">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-gray-900 text-white flex items-center justify-center shadow-xs shrink-0">
                                  <CreditCard className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-sans font-bold text-xs text-gray-900 tracking-tight">
                                    Mis Tarjetas
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200 shadow-2xs">
                                    {availableCards.length} disponibles
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  router.push("/profile?tab=cards");
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-[11px] font-semibold transition-all border border-gray-200 shadow-2xs hover:shadow-xs hover:border-gray-300 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-gray-700" />
                                <span>Nueva tarjeta</span>
                              </button>
                            </div>

                            {/* 2. THE BLUE WALLET SLEEVE ("EMPAQUE AZUL / BOLSITA") - 100% CLICK-ONLY */}
                            <div 
                              className="relative w-full max-w-[370px] mx-auto pt-16 pb-2 select-none"
                            >
                              {/* Background Base of Wallet Pocket with bottom-only rounded clipPath */}
                              <div 
                                onClick={() => {
                                  setIsWalletOpen(!isWalletOpen);
                                  setHoveredCardId(null);
                                }}
                                className="relative w-full h-[155px] rounded-3xl bg-gradient-to-b from-[#080e1c] via-[#0b1426] to-[#060a13] border border-slate-800/50 shadow-[0_12px_28px_-6px_rgba(15,23,42,0.18),0_4px_12px_-2px_rgba(15,23,42,0.08)] overflow-visible cursor-pointer"
                                style={{ clipPath: "inset(-350px -12px 0px -12px round 0px 0px 1.5rem 1.5rem)" }}
                              >
                                
                                {/* Inner Shadow & Leather texture depth */}
                                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.25),transparent_70%)] pointer-events-none" />

                                {/* The Layered Cards Rising Upwards with 1-finger separation (approx 24px) */}
                                {orderedCards.map((card, idx) => {
                                  // Assign distinct luxury theme (matching video colors: Blue 4120, White 4916, Coral 0019)
                                  let theme = {
                                    bg: "bg-gradient-to-tr from-[#0a192f] via-[#10316b] to-[#0284c7]",
                                    text: "text-white",
                                    border: "border-blue-400/40",
                                    shadow: "shadow-[0_12px_28px_rgba(2,132,199,0.3)]",
                                    logoColor: "#FFFFFF",
                                    name: "SAPPHIRE"
                                  };

                                  if (card.number.includes("4916")) {
                                    theme = {
                                      bg: "bg-gradient-to-tr from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0]",
                                      text: "text-slate-900",
                                      border: "border-slate-200/90",
                                      shadow: "shadow-[0_12px_28px_rgba(0,0,0,0.12)]",
                                      logoColor: "#0f172a",
                                      name: "PLATINUM"
                                    };
                                  } else if (card.number.includes("0019")) {
                                    theme = {
                                      bg: "bg-gradient-to-tr from-[#ea580c] via-[#f97316] to-[#ec4899]",
                                      text: "text-white",
                                      border: "border-orange-300/40",
                                      shadow: "shadow-[0_12px_28px_rgba(234,88,12,0.3)]",
                                      logoColor: "#FFFFFF",
                                      name: "CORAL"
                                    };
                                  } else if (idx % 2 === 0) {
                                    theme = {
                                      bg: "bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#334155]",
                                      text: "text-white",
                                      border: "border-slate-600/50",
                                      shadow: "shadow-[0_12px_28px_rgba(0,0,0,0.4)]",
                                      logoColor: "#FFFFFF",
                                      name: "OBSIDIAN"
                                    };
                                  }

                                  const isSelected = card.id === activeCard.id;
                                  const isCardHovered = isWalletOpen && hoveredCardId === card.id;

                                  // Calculate vertical offsets for 1-finger upward accordion stacking (24px separation)
                                  const totalCards = orderedCards.length;
                                  const depthFromFront = totalCards - 1 - idx;

                                  // When closed: nested inside pocket
                                  const closedY = 6 - depthFromFront * 5;
                                  const closedScale = 1 - depthFromFront * 0.035;
                                  const closedOpacity = 1 - depthFromFront * 0.12;

                                  // When open: "un dedo de separación" (24px separation step)
                                  const openY = -depthFromFront * 24;
                                  const zIndex = 15 + idx * 5;

                                  return (
                                    <motion.div
                                      key={card.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCardId(card.id);
                                        setIsWalletOpen(false);
                                        setHoveredCardId(null);
                                      }}
                                      onMouseEnter={() => {
                                        if (isWalletOpen) setHoveredCardId(card.id);
                                      }}
                                      onMouseLeave={() => {
                                        if (hoveredCardId === card.id) setHoveredCardId(null);
                                      }}
                                      initial={false}
                                      animate={{
                                        y: isWalletOpen ? openY : closedY,
                                        scale: isWalletOpen ? 1 : closedScale,
                                        opacity: isWalletOpen ? 1 : closedOpacity,
                                        zIndex: zIndex,
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 340,
                                        damping: 28,
                                        mass: 0.7
                                      }}
                                      style={{ transformStyle: "preserve-3d" }}
                                      className={`absolute left-[6%] w-[88%] h-[116px] rounded-2xl p-3 sm:p-3.5 ${theme.bg} ${theme.text} ${theme.shadow} flex flex-col justify-between cursor-pointer select-none border transition-all duration-200 overflow-hidden ${
                                        isCardHovered
                                          ? "border-sky-300 ring-2 ring-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.5),0_8px_24px_rgba(0,0,0,0.3)] brightness-[1.05]"
                                          : `${theme.border} ${isWalletOpen ? "hover:border-sky-300 hover:ring-2 hover:ring-sky-400/70 hover:shadow-[0_0_16px_rgba(56,189,248,0.4)] hover:brightness-[1.04]" : ""}`
                                      }`}
                                    >
                                      {/* Specular curved reflection glint */}
                                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                                      <div className={`absolute inset-[1px] rounded-[15px] border pointer-events-none transition-colors duration-200 ${isCardHovered ? "border-sky-300/50" : "border-white/20"}`} />

                                      {/* Top rim specular highlight on hover */}
                                      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-300 to-transparent transition-opacity duration-200 pointer-events-none ${isCardHovered ? "opacity-100" : "opacity-0"}`} />

                                      {/* Top Row: Network & Status */}
                                      <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-sans text-[10px] font-bold tracking-wider uppercase opacity-90">
                                            {theme.name}
                                          </span>
                                          {isSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <ContactlessIcon className="w-3.5 h-3.5 opacity-70" />
                                          {card.type === "visa" ? (
                                            <VisaLogo className="h-3.5" fill={theme.logoColor} />
                                          ) : (
                                            <MastercardLogo className="h-4" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Card Number */}
                                      <div className="relative z-10 mt-1">
                                        <p className="font-mono font-bold text-sm sm:text-base tracking-[0.2em] drop-shadow-sm opacity-95">
                                          {card.number}
                                        </p>
                                      </div>

                                      {/* Bottom Row: Chip & Holder */}
                                      <div className="flex items-end justify-between relative z-10 pt-1 border-t border-white/15 text-[9px] mt-auto">
                                        <div className="flex items-center gap-2">
                                          <div className="scale-75 origin-left">
                                            <EmvChip />
                                          </div>
                                          <span className="font-mono font-bold uppercase truncate max-w-[130px] opacity-90">
                                            {card.holder}
                                          </span>
                                        </div>
                                        <span className="font-mono font-bold opacity-85">
                                          {card.exp}
                                        </span>
                                      </div>
                                    </motion.div>
                                  );
                                })}

                                {/* Front Flap Overlay of the Blue Wallet Sleeve */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsWalletOpen(!isWalletOpen);
                                    setHoveredCardId(null);
                                  }}
                                  className="absolute bottom-0 inset-x-0 h-[115px] rounded-b-3xl rounded-t-2xl bg-gradient-to-b from-[#0e172a]/95 via-[#0b1324]/98 to-[#060a12] border-t border-sky-400/30 border-x border-b border-slate-800/40 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.18),0_8px_20px_-4px_rgba(15,23,42,0.22)] backdrop-blur-xl p-3.5 flex flex-col justify-between cursor-pointer z-30 transition-all hover:border-sky-400/50 active:scale-[0.99]"
                                >
                                  {/* Top Pocket Arc Lip & Specular Highlight */}
                                  <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-300 to-transparent opacity-80" />
                                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-sky-400/30" />

                                  {/* Wallet Sleeve Brand Label */}
                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
                                        <Lock className="w-3 h-3" />
                                      </div>
                                      <span className="font-mono text-[10px] font-bold text-sky-100 tracking-[0.2em] uppercase">
                                        LUMINA VAULT
                                      </span>
                                    </div>
                                    <span className="font-sans text-[10px] font-semibold text-sky-300/90 bg-sky-950/70 px-2.5 py-0.5 rounded-full border border-sky-800/60 shadow-2xs">
                                      {isWalletOpen ? "Click para cerrar wallet" : "Click para abrir wallet"}
                                    </span>
                                  </div>

                                  {/* Active Card Indicator on Front Flap */}
                                  <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                      <span className="font-mono text-[11px] font-semibold text-white tracking-wider">
                                        {activeCard.number.slice(-9)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {activeCard.type === "visa" ? (
                                        <VisaLogo className="h-3" fill="#7dd3fc" />
                                      ) : (
                                        <MastercardLogo className="h-3.5" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 3. ACTIVE CARD INFORMATION PANEL ("Y ABAJO SALDRÁ PUES LA INFORMACIÓN DE LA TARJETA") */}
                            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3 font-sans">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="font-sans font-bold text-xs text-gray-900">
                                    {activeCard.type === "visa" ? "Tarjeta Visa Seleccionada" : "Tarjeta Mastercard Seleccionada"}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Lista para pagar
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Número</span>
                                  <p className="font-mono font-bold text-gray-900 tracking-wider">
                                    {activeCard.number}
                                  </p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Vencimiento</span>
                                  <p className="font-mono font-bold text-gray-900">
                                    {activeCard.exp}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Titular</span>
                                  <p className="font-sans font-semibold text-gray-800 uppercase truncate">
                                    {activeCard.holder}
                                  </p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">Seguridad</span>
                                  <p className="font-sans font-semibold text-emerald-600 flex items-center justify-end gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SSL Cifrado
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* VIEW 2: APPLE PAY HIGH-TICKET EXPERIENCE */}
                        {selectedMethod === "apple" && (
                          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white shadow-xl flex flex-col items-center justify-center text-center space-y-4 border border-zinc-800">
                            <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-700 flex items-center justify-center shadow-2xl shadow-black/60">
                              <ApplePayLogo className="h-8 text-white" />
                            </div>
                            <div>
                              <h4 className="font-sans font-bold text-base text-white tracking-tight">Apple Pay</h4>
                              <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                                Paga al instante y con total privacidad utilizando Touch ID o Face ID directamente en tu dispositivo Apple.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-300 font-medium px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700/80">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span>Cifrado biométrico de alta seguridad mediante Apple Secure Enclave</span>
                            </div>
                          </div>
                        )}

                        {/* VIEW 3: GOOGLE PAY HIGH-TICKET EXPERIENCE */}
                        {selectedMethod === "google" && (
                          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-inner">
                              <GooglePayLogo className="h-7" />
                            </div>
                            <div>
                              <h4 className="font-sans font-bold text-base text-gray-900 tracking-tight">Google Pay</h4>
                              <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
                                Completa tu compra en un toque utilizando las tarjetas y métodos de pago guardados en tu cuenta de Google.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-700 font-medium px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
                              <ShieldCheck className="w-4 h-4 text-blue-600" />
                              <span>Protección integral contra fraude respaldada por Google Security</span>
                            </div>
                          </div>
                        )}

                        {/* VIEW 4: PAYPAL HIGH-TICKET EXPERIENCE */}
                        {selectedMethod === "paypal" && (
                          <div className="p-6 sm:p-8 rounded-3xl bg-[#f8faff] border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                              <PayPalLogo className="h-7" />
                            </div>
                            <div>
                              <h4 className="font-sans font-bold text-base text-gray-900 tracking-tight">PayPal</h4>
                              <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
                                Paga con tu saldo de PayPal, cuenta bancaria vinculada o financiamiento sin intereses en cómodos plazos.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#003087] font-semibold px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
                              <ShieldCheck className="w-4 h-4 text-[#0079C1]" />
                              <span>Garantía y Protección al Comprador PayPal al 100%</span>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                    {/* Right 5 cols: Order Final Summary & Confirm */}
                    <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-[2rem] border border-gray-200/70 shadow-lg space-y-5">
                      <h4 className="font-sans font-bold text-base text-gray-900 border-b border-gray-100 pb-3 tracking-tight uppercase">
                        Resumen del Pedido
                      </h4>

                      <div className="space-y-3 text-xs sm:text-sm text-gray-600 font-sans">
                        <div className="flex justify-between">
                          <span>Subtotal ({items.length} artículos)</span>
                          <span className="font-semibold text-gray-900">${subtotal.toFixed(2)} USD</span>
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
                        <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                          <span className="font-bold text-gray-900">Total Final</span>
                          <span className="font-sans font-extrabold text-2xl text-gray-950 tracking-tight">
                            ${finalTotal.toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 text-xs text-gray-600">
                        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                        <span className="text-[11px] leading-relaxed">
                          Pago seguro SSL 256-bit y garantía oficial de devolución 30 días.
                        </span>
                      </div>

                      {/* LIQUID GLASS CONFIRM PAYMENT BUTTON */}
                      <button 
                        onClick={handleConfirmOrder}
                        disabled={isProcessing}
                        className="group relative overflow-hidden w-full h-14 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300
                        bg-emerald-600/80 hover:bg-emerald-600/90 active:scale-[0.99]
                        backdrop-blur-xl
                        shadow-[0_12px_28px_-4px_rgba(16,185,129,0.35),0_4px_12px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-1.5px_2px_rgba(0,0,0,0.15)]
                        border border-white/40 hover:border-white/60
                        hover:shadow-[0_16px_36px_-2px_rgba(16,185,129,0.45),inset_0_2px_3px_rgba(255,255,255,0.6)]
                        cursor-pointer disabled:opacity-50"
                      >
                        {/* Specular curved liquid glass rim */}
                        <div className="absolute inset-x-4 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-95 pointer-events-none" />
                        
                        {/* Caustic glass reflection glint */}
                        <div className="absolute top-1.5 left-5 w-8 h-1 bg-white/80 rounded-full blur-[0.4px] pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />

                        {isProcessing ? (
                          <span className="relative z-10 flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Procesando pago seguro...</span>
                          </span>
                        ) : (
                          <>
                            <Lock className="relative z-10 w-4 h-4 text-emerald-100" />
                            <span className="relative z-10 tracking-wide font-sans font-bold">
                              Confirmar Pedido (${finalTotal.toFixed(2)})
                            </span>
                            <ArrowRight className="relative z-10 w-4 h-4 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
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
                  
                  <div className="relative w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/15">
                    <CheckCircle2 className="w-12 h-12" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-3xl sm:text-4xl text-gray-900">¡Pedido Confirmado!</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
                      Tu compra ha sido procesada con éxito. Ya estamos preparando cada pieza con el máximo cuidado artesanal.
                    </p>
                  </div>

                  {/* Receipt Card */}
                  <div className="w-full p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-md text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs sm:text-sm">
                      <span className="text-gray-400 font-medium">Identificador</span>
                      <span className="font-mono font-bold text-gray-900">{lastPlacedOrder.id}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs sm:text-sm">
                      <span className="text-gray-400 font-medium">Nº de Seguimiento</span>
                      <span className="font-mono font-bold text-blue-600">{lastPlacedOrder.trackingNumber}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs sm:text-sm">
                      <span className="text-gray-400 font-medium">Entrega Estimada</span>
                      <span className="font-semibold text-gray-800">3-5 días laborables</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-xs sm:text-sm">
                      <span className="font-bold text-gray-700">Total Pagado</span>
                      <span className="font-display font-bold text-2xl text-blue-700">
                        ${lastPlacedOrder.total.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons with Liquid Glass */}
                  <div className="w-full space-y-3 pt-2">
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/profile");
                      }}
                      className="relative overflow-hidden w-full h-14 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2
                      bg-gradient-to-r from-gray-900 to-gray-800 border border-white/20 shadow-md hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <span>Ver Pedido en mi Perfil</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        setStep("bag");
                      }}
                      className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/80 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                    >
                      Seguir Explorando Colecciones
                    </button>
                  </div>

                </div>
              )}

            </div>

          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
