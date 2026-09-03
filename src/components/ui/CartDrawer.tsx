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
  PlusCircle
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
      {/* Dimmed Blur Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[70] transition-opacity animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Luxury Glass Slide-over Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[500px] bg-white/75 backdrop-blur-3xl border-l border-white/90 z-[80] shadow-[0_24px_70px_rgba(0,0,0,0.18)] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* ========================================================================= */}
        {/* DRAWER TOP HEADER */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-gray-200/50 flex items-center justify-between bg-white/50 backdrop-blur-md">
          {step === "payment" ? (
            <button 
              onClick={() => setStep("bag")}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a la Bolsa
            </button>
          ) : step === "success" ? (
            <span className="text-xs font-bold uppercase tracking-wider text-[#8c9276]">
              Pedido Confirmado
            </span>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-md shadow-gray-900/10">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-gray-900 leading-tight">
                  Bolsa Lumina
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  {items.length} {items.length === 1 ? "artículo" : "artículos"} seleccionados
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: SHOPPING BAG VIEW */}
        {/* ========================================================================= */}
        {step === "bag" && (
          <>
            {/* Free Shipping Progress Capsule */}
            {items.length > 0 && (
              <div className="px-6 pt-4 pb-2 bg-gradient-to-b from-white/70 to-transparent">
                <div className="p-3.5 rounded-2xl bg-white/60 border border-white/90 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Truck className="w-4 h-4 text-[#8c9276]" />
                      {hasFreeShipping ? (
                        <span className="font-bold text-emerald-800">¡Envío Gratuito Asegurado!</span>
                      ) : (
                        <span>
                          Te faltan <strong className="text-gray-900">${amountToFreeShipping.toFixed(2)}</strong> para Envío Gratis
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#8c9276]">{freeShippingProgress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#8c9276] to-[#a4ab8c] rounded-full transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bag Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 hide-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-20 h-20 rounded-3xl bg-[#8c9276]/10 text-[#8c9276] flex items-center justify-center mb-4 shadow-inner">
                    <ShoppingBag className="w-8 h-8 stroke-1" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900 mb-1">Tu bolsa está vacía</h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-6">
                    Explora nuestra colección y añade piezas de autor a tu bolsa para comenzar tu pedido.
                  </p>
                  <button 
                    onClick={() => { setIsOpen(false); router.push("/shop"); }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-semibold hover:bg-gray-800 transition-all shadow-md"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-3.5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-white">
                      <Image 
                        src={item.product.imageUrl} 
                        alt={item.product.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>

                    {/* Info & Controls */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#8c9276] uppercase tracking-wider block">
                            {item.product.category}
                          </span>
                          <h4 className="font-bold text-xs text-gray-900 line-clamp-1 mt-0.5">
                            {item.product.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.size && <span>• Talla: {item.size}</span>}
                          </div>
                        </div>

                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar de la bolsa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Interactive Capsule Counter (- 01 +) */}
                        <div className="flex items-center bg-gray-100/90 rounded-full px-2 py-1 border border-gray-200/50 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-950 hover:bg-white transition-all"
                            title="Disminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-xs text-gray-900">
                            {item.quantity < 10 ? `0${item.quantity}` : item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-950 hover:bg-white transition-all"
                            title="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] text-gray-400 block">
                              ${item.product.price.toFixed(2)} / ud
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bag Footer & Financial Summary */}
            {items.length > 0 && (
              <div className="p-6 bg-white/70 backdrop-blur-2xl border-t border-gray-200/60 space-y-4 shadow-[0_-8px_30px_rgba(0,0,0,0.03)]">
                
                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                      placeholder="Código de cupón (ej: LUMINA10)"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200/80 bg-white/80 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#8c9276]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shrink-0 shadow-sm"
                  >
                    Aplicar
                  </button>
                </form>

                {/* Coupon feedback or active coupon tag */}
                {couponFeedback && (
                  <p className={`text-xs ${couponFeedback.success ? "text-emerald-700" : "text-red-600"}`}>
                    {couponFeedback.msg}
                  </p>
                )}

                {couponCode && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Cupón activo: <strong>{couponCode}</strong> ({discountPercent}% dto)
                    </span>
                    <button onClick={removeCoupon} className="text-emerald-600 hover:text-emerald-900">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Summary Lines */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Descuento aplicado</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-[11px]">Gratis</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-gray-900">Total a Pagar</span>
                      <span className="text-[10px] text-gray-400 block">Impuestos incluidos</span>
                    </div>
                    <span className="font-display font-bold text-2xl text-gray-900">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Main Action Button */}
                <button 
                  onClick={handleProceedToPayment}
                  className="w-full h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/15 group cursor-pointer"
                >
                  <span>Continuar al Pago</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PAYMENT METHOD & SHIPPING VIEW (Reference Style) */}
        {/* ========================================================================= */}
        {step === "payment" && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 hide-scrollbar">
            
            {/* 1. Shipping To Address Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Dirección de Entrega
                </span>
                <button 
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-semibold text-[#8c9276] hover:underline"
                >
                  {address ? (isEditingAddress ? "Cancelar" : "Editar") : "+ Añadir"}
                </button>
              </div>

              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Calle y número</label>
                    <input 
                      type="text" 
                      value={addrStreet} 
                      onChange={e => setAddrStreet(e.target.value)} 
                      placeholder="Calle Gran Vía 14, 3ºB"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Ciudad</label>
                      <input 
                        type="text" 
                        value={addrCity} 
                        onChange={e => setAddrCity(e.target.value)} 
                        placeholder="Madrid"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
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
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Guardar Dirección
                  </button>
                </form>
              ) : address ? (
                <div className="p-4 rounded-3xl bg-white/80 border border-white/90 shadow-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#8c9276]/15 text-[#8c9276] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900">Domicilio Principal</h4>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{address.street}</p>
                    <p className="text-[11px] text-gray-400">{address.city}, {address.postalCode} • {address.country}</p>
                  </div>
                  <Check className="w-4 h-4 text-[#8c9276] shrink-0" />
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
                  <p className="text-xs text-amber-800 font-medium">Aún no has configurado una dirección de entrega.</p>
                  <button 
                    onClick={() => setIsEditingAddress(true)}
                    className="px-4 py-1.5 bg-amber-900 text-white rounded-xl text-xs font-semibold"
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
              
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "card", label: "Tarjeta", icon: "💳" },
                  { id: "apple", label: "Apple Pay", icon: "" },
                  { id: "google", label: "Google Pay", icon: "G" },
                  { id: "paypal", label: "PayPal", icon: "P" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id as typeof selectedMethod)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === m.id 
                        ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-900/10" 
                        : "bg-white/80 text-gray-700 border-gray-200/80 hover:bg-white"
                    }`}
                  >
                    <span className="text-base leading-none">{m.icon}</span>
                    <span className="text-[10px] font-bold truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Luxury Black Matte Credit Card Preview (Exact Reference Replica) */}
            {selectedMethod === "card" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Tarjeta Seleccionada</span>
                  <button 
                    onClick={() => setIsAddingCard(!isAddingCard)}
                    className="text-xs font-semibold text-[#8c9276] hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {isAddingCard ? "Ver tarjeta" : "Nueva tarjeta"}
                  </button>
                </div>

                {isAddingCard ? (
                  <form onSubmit={handleSaveNewCard} className="p-4 rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-3">
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
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tipo de Red</label>
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
                  <div className="relative aspect-[1.58/1] rounded-3xl p-6 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white shadow-2xl shadow-black/25 flex flex-col justify-between overflow-hidden border border-zinc-700/60 group hover:scale-[1.01] transition-transform">
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
                      <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-100 border border-amber-400/50 shadow-inner flex items-center justify-center">
                        <div className="w-6 h-5 border border-amber-600/40 rounded-sm" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 tracking-wider">LUMINA PRIVILEGE</span>
                    </div>

                    {/* Card Number */}
                    <div className="relative z-10">
                      <p className="font-mono font-bold text-lg sm:text-xl tracking-widest text-zinc-100 drop-shadow">
                        {activeCard.number}
                      </p>
                    </div>

                    {/* Bottom Row: Holder & Expiry */}
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

            {/* 4. Security Seal Card */}
            <div className="p-4 rounded-3xl bg-white/60 border border-white/80 shadow-sm flex items-center gap-3 text-xs text-gray-600">
              <ShieldCheck className="w-5 h-5 text-[#8c9276] shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>Compra Segura Garantizada.</strong> Encriptación bancaria de 256-bit y cobertura Lumina de 2 años de garantía.
              </p>
            </div>

            {/* 5. Total & Confirm Checkout Button */}
            <div className="pt-2 space-y-3">
              <div className="p-4 rounded-2xl bg-white/80 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Total del Cargo</span>
                  <p className="text-xs font-semibold text-gray-700">{items.length} artículos</p>
                </div>
                <span className="font-display font-bold text-2xl text-gray-900">
                  ${finalTotal.toFixed(2)}
                </span>
              </div>

              <button 
                onClick={handleConfirmOrder}
                disabled={isProcessing}
                className="w-full h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Procesando pago seguro...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar Pedido (${finalTotal.toFixed(2)})</span>
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
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
            
            {/* Glowing Success Badge */}
            <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 animate-scale-in" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#8c9276] text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-2xl text-gray-900">¡Pedido Confirmado!</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                Tu compra ha sido procesada con éxito. Ya estamos preparando cada pieza con el máximo cuidado artesanal.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="w-full p-5 rounded-3xl bg-white border border-gray-100 shadow-sm text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                <span className="text-gray-400">Identificador</span>
                <span className="font-mono font-bold text-gray-900">{lastPlacedOrder.id}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                <span className="text-gray-400">Nº de Seguimiento</span>
                <span className="font-mono font-semibold text-[#8c9276]">{lastPlacedOrder.trackingNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                <span className="text-gray-400">Entrega Estimada</span>
                <span className="font-medium text-gray-800">3-5 días laborables</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-bold text-gray-700">Total Pagado</span>
                <span className="font-display font-bold text-lg text-gray-900">
                  ${lastPlacedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  router.push("/profile");
                }}
                className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Ver Pedido en mi Perfil</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setStep("bag");
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-200 transition-colors"
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
