"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Trash2
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useUserStore, Order, PaymentCard, ShippingAddress } from "@/lib/userStore";

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

  // Rehydrate store on mount to avoid hydration mismatch
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
      setTimeout(() => {
        if (step === "success") {
          setStep("bag");
        }
      }, 400);
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

  return (
    <>
      {/* Dimmed Blur Backdrop with Soft Radial Vignette */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-[70] transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spacious Luxury Canvas Drawer (Width up to 640px for true breathing room) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[560px] md:w-[620px] lg:w-[660px] bg-gradient-to-b from-[#f8fafc]/95 via-white/90 to-[#f1f5f9]/95 backdrop-blur-3xl border-l border-white/90 z-[80] shadow-[0_30px_90px_rgba(0,0,0,0.22)] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* ========================================================================= */}
        {/* DRAWER TOP HEADER */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-7 border-b border-gray-200/60 flex items-center justify-between bg-white/70 backdrop-blur-xl shrink-0 shadow-sm">
          {step === "payment" ? (
            <button 
              onClick={() => setStep("bag")}
              className="relative overflow-hidden group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-xs font-bold text-gray-800 border border-white shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 group-hover:-translate-x-0.5 transition-transform" /> 
              <span>Volver a la Bolsa</span>
            </button>
          ) : step === "success" ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Pedido Confirmado
            </span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25 border border-white/30">
                <ShoppingBag className="w-5 h-5 drop-shadow" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-gray-900 tracking-tight leading-tight">
                  Shopping Cart
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {items.length} {items.length === 1 ? "artículo listo para checkout" : "artículos listos para checkout"}
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-2xl bg-white/80 hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 border border-gray-200/60 shadow-sm transition-all active:scale-95"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: SHOPPING BAG VIEW (Spacious Studio Layout) */}
        {/* ========================================================================= */}
        {step === "bag" && (
          <>
            {/* Free Shipping Progress Capsule */}
            {items.length > 0 && (
              <div className="px-6 sm:px-8 pt-5 pb-2 shrink-0">
                <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-[0_6px_24px_rgba(0,0,0,0.03)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2.5 text-gray-800">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Truck className="w-4 h-4" />
                      </div>
                      {hasFreeShipping ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ¡Envío Nacional Gratuito Asegurado!
                        </span>
                      ) : (
                        <span>
                          Te faltan <strong className="text-blue-600 font-bold">${amountToFreeShipping.toFixed(2)}</strong> para <span className="text-gray-900 font-bold underline decoration-blue-400/50">Envío Gratuito</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {freeShippingProgress}%
                    </span>
                  </div>

                  {/* High Polish Progress Bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-500 shadow-sm shadow-blue-500/30"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bag Items List with Wide Cards and Breathing Room */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-4 hide-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-24 h-24 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shadow-inner border border-blue-100/80">
                    <ShoppingBag className="w-10 h-10 stroke-1" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-gray-900 mb-1.5">Tu bolsa está vacía</h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
                    Añade lámparas de autor, difusores, textiles y gadgets minimalistas para completar tu espacio.
                  </p>
                  <button 
                    onClick={() => { setIsOpen(false); router.push("/shop"); }}
                    className="relative overflow-hidden px-8 py-3.5 rounded-2xl font-bold text-white text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-[0_8px_24px_rgba(37,99,235,0.3)] border border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <span className="relative z-10">Explorar Colecciones</span>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 sm:p-5 rounded-[2rem] bg-white/85 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] transition-all flex flex-col sm:flex-row gap-4 sm:gap-5 group"
                  >
                    {/* Generous Thumbnail */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-white shadow-sm">
                      <Image 
                        src={item.product.imageUrl} 
                        alt={item.product.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    {/* Product Metadata & Controls */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                              {item.product.category}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1 mt-0.5">
                              {item.product.title}
                            </h4>
                          </div>

                          {/* Price Display */}
                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-base text-gray-900 block">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[11px] text-gray-400">
                                ${item.product.price.toFixed(2)} c/u
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Variants pill */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                          {item.color && (
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200/60 text-[11px]">
                              {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200/60 text-[11px]">
                              Talla: {item.size}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Bar: Liquid Glass Counter & Liquid Glass Delete Button */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                        {/* Interactive Liquid Glass Counter */}
                        <div className="flex items-center bg-gray-100/90 rounded-full px-2 py-1 border border-gray-200/70 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center border border-white shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md active:scale-90 transition-all"
                            title="Disminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs sm:text-sm text-gray-900">
                            {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center border border-white shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md active:scale-90 transition-all"
                            title="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* LIQUID GLASS DELETE BUTTON (Requested by user) */}
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="relative overflow-hidden px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/15 border border-red-200/70 backdrop-blur-md shadow-[0_2px_8px_rgba(239,68,68,0.08),inset_0_1px_1px_rgba(255,255,255,0.6)] transition-all flex items-center gap-1.5 group hover:scale-[1.02] active:scale-[0.98]"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                          <span>Eliminar</span>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-xl" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bag Footer & Order Summary Card */}
            {items.length > 0 && (
              <div className="p-6 sm:p-8 bg-white/80 backdrop-blur-2xl border-t border-gray-200/60 space-y-4 shadow-[0_-12px_40px_rgba(0,0,0,0.05)] shrink-0">
                
                {/* Coupon Box with Liquid Glass Button */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                      placeholder="Código de cupón (ej: LUMINA10)"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200/80 bg-white text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="relative overflow-hidden px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-gray-900 to-gray-800 border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:bg-gray-800 transition-all shrink-0 active:scale-95"
                  >
                    <span className="relative z-10">Aplicar</span>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  </button>
                </form>

                {/* Coupon Feedback or Active Tag */}
                {couponFeedback && (
                  <p className={`text-xs font-semibold ${couponFeedback.success ? "text-emerald-700" : "text-red-600"}`}>
                    {couponFeedback.msg}
                  </p>
                )}

                {couponCode && (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Cupón activo: <strong>{couponCode}</strong> ({discountPercent}% dto)
                    </span>
                    <button onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-900 p-0.5">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Summary Lines */}
                <div className="space-y-2 text-xs sm:text-sm pt-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuento aplicado ({discountPercent}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Envío Nacional</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-xs">Gratis</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200/80 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm sm:text-base font-bold text-gray-900">Total a Pagar</span>
                      <span className="text-[10px] text-gray-400 block">Impuestos incluidos</span>
                    </div>
                    <span className="font-display font-bold text-2xl sm:text-3xl text-blue-700">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* LIQUID GLASS VIBRANT CHECKOUT CTA BUTTON (Requested by user) */}
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
                  <span className="relative z-10 tracking-wide">Continuar al Pago</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PAYMENT METHOD & SHIPPING VIEW (Spacious & Vibrant) */}
        {/* ========================================================================= */}
        {step === "payment" && (
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 hide-scrollbar">
            
            {/* 1. Shipping To Address Card */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Dirección de Entrega
                </span>
                <button 
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {address ? (isEditingAddress ? "Cancelar" : "Editar") : "+ Añadir"}
                </button>
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-md space-y-3.5">
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
                  <div className="grid grid-cols-2 gap-2.5">
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
                    className="relative overflow-hidden w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Guardar Dirección
                  </button>
                </form>
              ) : address ? (
                <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-white shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900">Domicilio Principal</h4>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{address.street}</p>
                    <p className="text-[11px] text-gray-400">{address.city}, {address.postalCode} • {address.country}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 text-center space-y-2">
                  <p className="text-xs text-amber-900 font-medium">Aún no has configurado una dirección de entrega.</p>
                  <button 
                    onClick={() => setIsEditingAddress(true)}
                    className="px-5 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold hover:bg-amber-800 shadow-sm"
                  >
                    + Añadir Dirección Ahora
                  </button>
                </div>
              )}
            </div>

            {/* 2. Payment Method Selector Pills */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                Método de Pago
              </span>
              
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { id: "card", label: "Tarjeta", icon: "💳" },
                  { id: "apple", label: "Apple Pay", icon: "" },
                  { id: "google", label: "Google Pay", icon: "G" },
                  { id: "paypal", label: "PayPal", icon: "P" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id as typeof selectedMethod)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      selectedMethod === m.id 
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 scale-[1.02]" 
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg leading-none">{m.icon}</span>
                    <span className="text-[11px] font-bold truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Luxury Black Matte Credit Card Preview */}
            {selectedMethod === "card" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Tarjeta Seleccionada</span>
                  <button 
                    onClick={() => setIsAddingCard(!isAddingCard)}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {isAddingCard ? "Ver tarjeta" : "Nueva tarjeta"}
                  </button>
                </div>

                {isAddingCard ? (
                  <form onSubmit={handleSaveNewCard} className="p-5 rounded-3xl bg-white border border-gray-200/80 shadow-md space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Número de tarjeta</label>
                      <input 
                        type="text" 
                        value={newCardNumber} 
                        onChange={e => setNewCardNumber(e.target.value)} 
                        placeholder="4532 •••• •••• 8921"
                        maxLength={19}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Titular</label>
                        <input 
                          type="text" 
                          value={newCardHolder} 
                          onChange={e => setNewCardHolder(e.target.value)} 
                          placeholder="Nombre y Apellidos"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
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
                      className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      Guardar y Usar Tarjeta
                    </button>
                  </form>
                ) : (
                  <div className="relative aspect-[1.58/1] rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white shadow-2xl shadow-black/30 flex flex-col justify-between overflow-hidden border border-zinc-700/80 group hover:scale-[1.01] transition-transform">
                    {/* Metallic Sheen Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                    {/* Top Row: Type & Chip */}
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                        Credit Card
                      </span>
                      <span className="font-display font-bold italic text-base tracking-wider text-zinc-200">
                        {activeCard.type === "visa" ? "VISA" : "Mastercard"}
                      </span>
                    </div>

                    {/* Chip Illustration */}
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-11 h-9 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-100 border border-amber-400/50 shadow-inner flex items-center justify-center">
                        <div className="w-7 h-5 border border-amber-600/40 rounded-sm" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 tracking-wider">LUMINA PRIVILEGE</span>
                    </div>

                    {/* Card Number */}
                    <div className="relative z-10">
                      <p className="font-mono font-bold text-xl sm:text-2xl tracking-widest text-zinc-100 drop-shadow">
                        {activeCard.number}
                      </p>
                    </div>

                    {/* Bottom Row: Holder & Expiry */}
                    <div className="flex items-center justify-between relative z-10 pt-2.5 border-t border-zinc-800 text-xs">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Titular</span>
                        <p className="font-bold text-zinc-200 tracking-wide truncate max-w-[200px]">
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

            {/* 4. Security Seal Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white/80 border border-white shadow-sm flex items-center gap-3.5 text-xs text-gray-600">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs leading-relaxed">
                <strong>Compra Segura Garantizada.</strong> Encriptación bancaria de 256-bit y cobertura Lumina de 2 años de garantía con devoluciones a 30 días.
              </p>
            </div>

            {/* 5. Total & Confirm Checkout Button (Liquid Glass) */}
            <div className="pt-3 space-y-3.5">
              <div className="p-5 rounded-3xl bg-white/90 border border-gray-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Total del Cargo</span>
                  <p className="text-xs font-bold text-gray-900">{items.length} artículos listos</p>
                </div>
                <span className="font-display font-bold text-2xl sm:text-3xl text-blue-700">
                  ${finalTotal.toFixed(2)}
                </span>
              </div>

              {/* LIQUID GLASS CONFIRM PAYMENT BUTTON (Requested by user) */}
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
        )}

        {/* ========================================================================= */}
        {/* STEP 3: ORDER CONFIRMED CELEBRATION (Receipt View) */}
        {/* ========================================================================= */}
        {step === "success" && lastPlacedOrder && (
          <div className="flex-1 overflow-y-auto p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            
            {/* Glowing Success Badge */}
            <div className="relative w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/15">
              <CheckCircle2 className="w-12 h-12" />
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">¡Pedido Confirmado!</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-sm leading-relaxed">
                Tu compra ha sido procesada con éxito. Ya estamos preparando cada pieza con el máximo cuidado artesanal.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="w-full p-6 rounded-3xl bg-white border border-gray-100 shadow-md text-left space-y-3.5">
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
                <span className="font-display font-bold text-xl sm:text-2xl text-blue-700">
                  ${lastPlacedOrder.total.toFixed(2)}
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
                className="relative overflow-hidden w-full h-12 rounded-2xl font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2
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
                className="w-full py-3 bg-white/80 hover:bg-white text-gray-700 border border-gray-200/80 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
              >
                Seguir Explorando
              </button>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
