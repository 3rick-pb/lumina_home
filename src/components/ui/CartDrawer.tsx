"use client";

import React, { useEffect, useState } from "react";
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
  PlusCircle,
  Trash2,
  Maximize2,
  RotateCcw
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore, Order, PaymentCard, ShippingAddress } from "@/lib/userStore";
import { useCatalogStore } from "@/lib/catalogStore";

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
    applyCoupon,
    removeCoupon,
    clearCart 
  } = useCartStore();

  const { 
    user, 
    isAuthenticated, 
    cards, 
    address, 
    setAddress, 
    addCard, 
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

  // Quick Address Inline Form
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrCountry, setAddrCountry] = useState("España");

  // Quick Card Inline Form
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardHolder, setNewCardHolder] = useState("");
  const [newCardExp, setNewCardExp] = useState("");
  const [newCardType, setNewCardType] = useState<"mastercard" | "visa">("mastercard");

  // Checkout Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Rehydrate store on mount
  useEffect(() => {
    useCartStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  // Initialize defaults from userStore
  useEffect(() => {
    if (cards && cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
    if (address) {
      setAddrStreet(address.street);
      setAddrCity(address.city);
      setAddrPostal(address.postalCode);
      setAddrCountry(address.country);
    }
  }, [cards, address, selectedCardId]);

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

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim()) return;
    const newAddr: ShippingAddress = {
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: "Provincia",
      postalCode: addrPostal.trim() || "28001",
      country: addrCountry
    };
    setAddress(newAddr);
    setIsEditingAddress(false);
  };

  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber.trim()) return;
    const cleanNum = newCardNumber.replace(/\s+/g, '');
    const masked = cleanNum.slice(-4) || "8888";
    const cardData: Omit<PaymentCard, 'id'> = {
      number: `•••• •••• •••• ${masked}`,
      holder: newCardHolder.trim() || user?.name || "Titular",
      exp: newCardExp.trim() || "12/28",
      type: newCardType,
      isDefault: true
    };
    addCard(cardData);
    setIsAddingCard(false);
    setNewCardNumber("");
    setNewCardHolder("");
    setNewCardExp("");
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      setIsOpen(false);
      router.push("/auth/login");
      return;
    }
    setStep("payment");
  };

  const handleConfirmOrder = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const orderId = `INV_${Math.floor(100000 + Math.random() * 900000)}`;
      const trackingCode = `LM-${Math.floor(1000000 + Math.random() * 9000000)}`;

      const newOrder: Order = {
        id: orderId,
        date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        status: 'Procesando',
        trackingNumber: trackingCode,
        total: finalTotal,
        items: [...items]
      };

      addOrder(newOrder);
      setLastPlacedOrder(newOrder);
      clearCart();
      setIsProcessing(false);
      setStep("success");
    }, 1200);
  };

  if (!isMounted) return null;

  // Selected card preview object
  const activeCard = cards.find(c => c.id === selectedCardId) || cards[0] || {
    id: "default",
    number: "•••• •••• •••• 4242",
    holder: user?.name || "LUMINA CLIENT",
    exp: "04/28",
    type: "mastercard" as const
  };

  // Recommended products for the bottom of the cart page
  const recommendedProducts = products.filter(p => !items.some(i => i.productId === p.id)).slice(0, 3);

  // 3D Book Page Flip / macOS Genie Window animation variants
  const bookPageVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.12,
      rotateY: -45,
      rotateX: 15,
      x: 350,
      y: -250,
      filter: "blur(14px)",
      transformOrigin: "top right",
      transition: {
        duration: 0.4,
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
      filter: "blur(0px)",
      transformOrigin: "top right",
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number], // macOS springy un-minimize curve
      }
    },
    exit: {
      opacity: 0,
      scale: 0.12,
      rotateY: -45,
      rotateX: 15,
      x: 350,
      y: -250,
      filter: "blur(14px)",
      transformOrigin: "top right",
      transition: {
        duration: 0.45,
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          />

          {/* 3D BOOK PAGE / macOS GENIE UN-MINIMIZE CANVAS (Cart Page Reference) */}
          <motion.div
            variants={bookPageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full max-w-6xl h-full max-h-[92vh] bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/90 shadow-[0_35px_120px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden z-10"
          >

            {/* ========================================================================= */}
            {/* macOS WINDOW TOP BAR & HEADER */}
            {/* ========================================================================= */}
            <header className="px-6 sm:px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm">
              
              {/* macOS Window Controls (Traffic Lights) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:brightness-90 transition-all border border-[#e0443e] shadow-sm flex items-center justify-center group"
                    title="Cerrar ventana"
                  >
                    <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:brightness-90 transition-all border border-[#dea123] shadow-sm flex items-center justify-center group"
                    title="Minimizar ventana"
                  >
                    <Minus className="w-2 h-2 text-amber-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button 
                    className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:brightness-90 transition-all border border-[#1aab29] shadow-sm flex items-center justify-center group"
                    title="Pantalla completa"
                  >
                    <Maximize2 className="w-2 h-2 text-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

                <span className="font-display italic font-bold text-lg text-gray-900 tracking-tight hidden sm:inline">
                  Lumina<span className="text-[#8c9276]">.</span>
                </span>
                <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                  • Libro de Compras & Checkout
                </span>
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
                        Shopping Cart
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
                        <div className="hidden sm:grid grid-cols-12 text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-100">
                          <span className="col-span-6">Producto</span>
                          <span className="col-span-3 text-center">Cantidad</span>
                          <span className="col-span-2 text-right">Subtotal</span>
                          <span className="col-span-1 text-right">Acción</span>
                        </div>

                        {/* Product Rows with generous breathing room */}
                        <div className="divide-y divide-gray-100">
                          {items.map((item) => (
                            <div 
                              key={item.id}
                              className="py-5 first:pt-0 last:pb-0 flex flex-col sm:grid sm:grid-cols-12 gap-4 sm:items-center group"
                            >
                              {/* Product Info (6 cols) */}
                              <div className="sm:col-span-6 flex items-center gap-4">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-white shadow-sm">
                                  <Image 
                                    src={item.product.imageUrl} 
                                    alt={item.product.title} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                                    {item.product.category}
                                  </span>
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
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center border border-white shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md active:scale-90 transition-all"
                                    title="Aumentar"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Subtotal Price (2 cols) */}
                              <div className="sm:col-span-2 sm:text-right flex items-center justify-between sm:block">
                                <span className="text-xs text-gray-400 sm:hidden">Subtotal:</span>
                                <span className="font-extrabold text-base sm:text-lg text-gray-900">
                                  ${(item.product.price * item.quantity).toFixed(2)}
                                </span>
                              </div>

                              {/* Liquid Glass Delete Action Button (1 col) */}
                              <div className="sm:col-span-1 sm:text-right">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="relative overflow-hidden p-2 sm:p-2.5 rounded-xl text-red-600 bg-red-500/10 hover:bg-red-500/15 border border-red-200/70 backdrop-blur-md shadow-[0_2px_8px_rgba(239,68,68,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] transition-all inline-flex items-center justify-center group active:scale-95"
                                  title="Eliminar artículo"
                                >
                                  <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-xl" />
                                </button>
                              </div>

                            </div>
                          ))}
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
                            {items.length} productos listos para despacho
                          </span>
                        </div>

                      </div>

                      {/* ---------------------------------------------------- */}
                      {/* Right Column: Order Summary Card (4 cols) */}
                      {/* ---------------------------------------------------- */}
                      <div className="lg:col-span-4 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-gray-200/70 p-6 sm:p-7 shadow-lg shadow-gray-200/50 space-y-6">
                        
                        <h3 className="font-display font-bold text-xl text-gray-900 tracking-tight pb-3 border-b border-gray-100">
                          Order Summary
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
                            <span>Sub Total</span>
                            <span className="font-semibold text-gray-900">${subtotal.toFixed(2)} USD</span>
                          </div>

                          {discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-700 font-semibold">
                              <span>Discount ({discountPercent}%)</span>
                              <span>-${discountAmount.toFixed(2)} USD</span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span>Delivery fee</span>
                            <span className="font-semibold">
                              {shipping === 0 ? (
                                <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
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

                        {/* LIQUID GLASS CHECKOUT NOW BUTTON */}
                        <button 
                          onClick={handleProceedToPayment}
                          className="relative overflow-hidden w-full h-14 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300
                          bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#1d4ed8]
                          shadow-[0_12px_36px_rgba(37,99,235,0.35),0_2px_8px_rgba(0,0,0,0.1)]
                          border border-white/30
                          hover:shadow-[0_16px_44px_rgba(37,99,235,0.45)] hover:scale-[1.01] active:scale-[0.99]
                          before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:via-white/10 before:to-transparent before:pointer-events-none before:rounded-2xl
                          after:absolute after:inset-x-0 after:top-0 after:h-[1px] after:bg-white/60 cursor-pointer group"
                        >
                          <span className="relative z-10 tracking-wide">Checkout Now</span>
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
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">
                      Método de Pago & Entrega
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
                          <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" /> Dirección de Entrega
                          </h4>
                          <button 
                            onClick={() => setIsEditingAddress(!isEditingAddress)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            {address ? (isEditingAddress ? "Cancelar" : "Modificar") : "+ Añadir"}
                          </button>
                        </div>

                        {isEditingAddress ? (
                          <form onSubmit={handleSaveAddress} className="space-y-3 pt-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Calle y número</label>
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
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Ciudad</label>
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
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Código Postal</label>
                                <input 
                                  type="text" 
                                  value={addrPostal} 
                                  onChange={e => setAddrPostal(e.target.value)} 
                                  placeholder="28001"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <button 
                              type="submit"
                              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                            >
                              Guardar Dirección
                            </button>
                          </form>
                        ) : address ? (
                          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-gray-900">{address.street}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{address.city}, {address.postalCode} • {address.country}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                            <p className="text-xs text-amber-800 font-medium">Aún no has configurado tu dirección.</p>
                            <button 
                              onClick={() => setIsEditingAddress(true)}
                              className="px-4 py-1.5 bg-amber-900 text-white rounded-xl text-xs font-semibold"
                            >
                              + Añadir Dirección Ahora
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Payment Method Selector */}
                      <div className="p-6 rounded-[2rem] bg-white border border-gray-200/70 shadow-sm space-y-4">
                        <h4 className="font-bold text-sm text-gray-900">
                          Selecciona Método de Pago
                        </h4>

                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { id: "card", label: "Tarjeta", icon: "💳" },
                            { id: "apple", label: "Apple Pay", icon: "" },
                            { id: "google", label: "Google Pay", icon: "G" },
                            { id: "paypal", label: "PayPal", icon: "P" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedMethod(m.id as typeof selectedMethod)}
                              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                                selectedMethod === m.id 
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.02]" 
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <span className="text-lg leading-none">{m.icon}</span>
                              <span className="text-[11px] font-bold truncate">{m.label}</span>
                            </button>
                          ))}
                        </div>

                        {selectedMethod === "card" && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-gray-600">Tarjeta Seleccionada</span>
                              <button 
                                onClick={() => setIsAddingCard(!isAddingCard)}
                                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                {isAddingCard ? "Ver tarjeta" : "Nueva tarjeta"}
                              </button>
                            </div>

                            {isAddingCard ? (
                              <form onSubmit={handleSaveNewCard} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Número de tarjeta</label>
                                  <input 
                                    type="text" 
                                    value={newCardNumber} 
                                    onChange={e => setNewCardNumber(e.target.value)} 
                                    placeholder="4532 •••• •••• 8921"
                                    maxLength={19}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono outline-none"
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Titular</label>
                                    <input 
                                      type="text" 
                                      value={newCardHolder} 
                                      onChange={e => setNewCardHolder(e.target.value)} 
                                      placeholder="Nombre y Apellidos"
                                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Expiración</label>
                                    <input 
                                      type="text" 
                                      value={newCardExp} 
                                      onChange={e => setNewCardExp(e.target.value)} 
                                      placeholder="MM/AA"
                                      maxLength={5}
                                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Red de la tarjeta</label>
                                  <div className="flex gap-2">
                                    <button 
                                      type="button"
                                      onClick={() => setNewCardType("mastercard")}
                                      className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all ${newCardType === "mastercard" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}
                                    >
                                      Mastercard
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setNewCardType("visa")}
                                      className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all ${newCardType === "visa" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}
                                    >
                                      Visa
                                    </button>
                                  </div>
                                </div>
                                <button 
                                  type="submit"
                                  className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                  Guardar y Usar Tarjeta
                                </button>
                              </form>
                            ) : (
                              /* Luxury Black Matte Credit Card Preview */
                              <div className="relative aspect-[1.58/1] max-w-sm mx-auto rounded-3xl p-6 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white shadow-2xl shadow-black/25 flex flex-col justify-between overflow-hidden border border-zinc-700/60">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                  <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                                    Credit Card
                                  </span>
                                  <span className="font-display font-bold italic text-base tracking-wider text-zinc-200">
                                    {activeCard.type === "visa" ? "VISA" : "Mastercard"}
                                  </span>
                                </div>
                                <div className="relative z-10 flex items-center gap-3">
                                  <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-100 border border-amber-400/50 shadow-inner flex items-center justify-center">
                                    <div className="w-6 h-5 border border-amber-600/40 rounded-sm" />
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-400 tracking-wider">LUMINA PRIVILEGE</span>
                                </div>
                                <div className="relative z-10">
                                  <p className="font-mono font-bold text-lg sm:text-xl tracking-widest text-zinc-100 drop-shadow">
                                    {activeCard.number}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between relative z-10 pt-2 border-t border-zinc-800 text-[11px]">
                                  <div>
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Titular</span>
                                    <p className="font-bold text-zinc-200 tracking-wide truncate max-w-[180px]">
                                      {activeCard.holder}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Vence</span>
                                    <p className="font-mono font-bold text-zinc-200">
                                      {activeCard.exp}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right 5 cols: Order Final Summary & Confirm */}
                    <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-[2rem] border border-gray-200/70 shadow-lg space-y-5">
                      <h4 className="font-display font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">
                        Resumen del Cargo
                      </h4>

                      <div className="space-y-3 text-xs sm:text-sm text-gray-600">
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
                          <span className="font-display font-bold text-2xl text-blue-700">
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
                        className="relative overflow-hidden w-full h-14 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300
                        bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#1d4ed8]
                        shadow-[0_12px_36px_rgba(37,99,235,0.35),0_2px_8px_rgba(0,0,0,0.1)]
                        border border-white/30
                        hover:shadow-[0_16px_44px_rgba(37,99,235,0.45)] hover:scale-[1.01] active:scale-[0.99]
                        before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/35 before:via-white/10 before:to-transparent before:pointer-events-none before:rounded-2xl
                        after:absolute after:inset-x-0 after:top-0 after:h-[1px] after:bg-white/60 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <span className="relative z-10 flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Procesando pago seguro...</span>
                          </span>
                        ) : (
                          <>
                            <Lock className="relative z-10 w-4 h-4" />
                            <span className="relative z-10 tracking-wide">Confirmar Pedido (${finalTotal.toFixed(2)})</span>
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
