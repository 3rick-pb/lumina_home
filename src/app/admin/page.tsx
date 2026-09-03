"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  PackageOpen, 
  Users, 
  Activity, 
  Plus, 
  X, 
  Trash2, 
  AlertTriangle, 
  Tag, 
  Layers,
  Pencil
} from "lucide-react";
import { useCatalogStore, normalizeCategory, CatalogProduct } from "@/lib/catalogStore";

export default function AdminPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useCatalogStore();
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Category management in admin
  const [newCatInput, setNewCatInput] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [titleHighlight, setTitleHighlight] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [oldPrice, setOldPrice] = useState("");
  const [calculatedDiscount, setCalculatedDiscount] = useState("");
  const [badge, setBadge] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [extraImages, setExtraImages] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState("");
  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState("");

  // Recalculate discount whenever prices change
  const handlePriceChange = (newPrice: string, newOldPrice: string, withDiscount: boolean) => {
    setPrice(newPrice);
    setOldPrice(newOldPrice);
    if (withDiscount && newPrice && newOldPrice) {
      const p = parseFloat(newPrice);
      const op = parseFloat(newOldPrice);
      if (op > p && op > 0) {
        const pct = Math.round(((op - p) / op) * 100);
        setCalculatedDiscount(`-${pct}%`);
        return;
      }
    }
    setCalculatedDiscount("");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    const imagesList = [imageUrl.trim()];
    if (extraImages.trim()) {
      const extras = extraImages.split(",").map(u => u.trim()).filter(Boolean);
      imagesList.push(...extras);
    }

    const featuresList = features.trim()
      ? features.split("\n").map(f => f.trim()).filter(Boolean)
      : undefined;

    const sizesList = hasSizes && sizes.trim()
      ? sizes.split(",").map(s => s.trim()).filter(Boolean)
      : undefined;

    const colorsList = hasColors && colors.trim()
      ? colors.split(",").map(c => ({ name: c.trim(), hex: "#94a3b8" }))
      : undefined;

    const res = await addProduct({
      title: title.trim(),
      titleHighlight: titleHighlight.trim() || undefined,
      category: category.trim(),
      price: parseFloat(price) || 0,
      oldPrice: hasDiscount && oldPrice ? parseFloat(oldPrice) : null,
      discount: hasDiscount && calculatedDiscount ? calculatedDiscount : undefined,
      badge: badge.trim() || undefined,
      imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
      images: imagesList,
      description: description.trim(),
      features: featuresList,
      sizes: sizesList,
      colors: colorsList,
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowModal(false);
      // Reset form
      setTitle("");
      setTitleHighlight("");
      setCategory("");
      setPrice("");
      setHasDiscount(false);
      setOldPrice("");
      setCalculatedDiscount("");
      setBadge("");
      setImageUrl("");
      setExtraImages("");
      setDescription("");
      setFeatures("");
      setHasSizes(false);
      setSizes("");
      setHasColors(false);
      setColors("");
    } else {
      setSubmitError(res.error || "Error al registrar el producto");
    }
  };

  // Edit Product State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTitleHighlight, setEditTitleHighlight] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editHasDiscount, setEditHasDiscount] = useState(false);
  const [editOldPrice, setEditOldPrice] = useState("");
  const [editCalculatedDiscount, setEditCalculatedDiscount] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editExtraImages, setEditExtraImages] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFeatures, setEditFeatures] = useState("");
  const [editHasSizes, setEditHasSizes] = useState(false);
  const [editSizes, setEditSizes] = useState("");
  const [editHasColors, setEditHasColors] = useState(false);
  const [editColors, setEditColors] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const handleEditPriceChange = (newPrice: string, newOldPrice: string, withDiscount: boolean) => {
    setEditPrice(newPrice);
    setEditOldPrice(newOldPrice);
    if (withDiscount && newPrice && newOldPrice) {
      const p = parseFloat(newPrice);
      const op = parseFloat(newOldPrice);
      if (op > p && op > 0) {
        const pct = Math.round(((op - p) / op) * 100);
        setEditCalculatedDiscount(`-${pct}%`);
        return;
      }
    }
    setEditCalculatedDiscount("");
  };

  const handleOpenEdit = (prod: CatalogProduct) => {
    setEditingProductId(prod.id);
    setEditTitle(prod.title || "");
    setEditTitleHighlight(prod.titleHighlight || "");
    setEditCategory(prod.category || "");
    setEditPrice(prod.price ? prod.price.toString() : "");
    const withDiscount = Boolean(prod.discount || (prod.oldPrice && prod.oldPrice > prod.price));
    setEditHasDiscount(withDiscount);
    setEditOldPrice(prod.oldPrice ? prod.oldPrice.toString() : "");
    setEditCalculatedDiscount(prod.discount || "");
    setEditBadge(prod.badge || "");
    setEditImageUrl(prod.imageUrl || "");
    setEditExtraImages(prod.images && prod.images.length > 1 ? prod.images.slice(1).join(", ") : "");
    setEditDescription(prod.description || "");
    setEditFeatures(prod.features ? prod.features.join("\n") : "");
    setEditHasSizes(Boolean(prod.sizes && prod.sizes.length > 0));
    setEditSizes(prod.sizes ? prod.sizes.join(", ") : "");
    setEditHasColors(Boolean(prod.colors && prod.colors.length > 0));
    setEditColors(prod.colors ? prod.colors.map(c => c.name).join(", ") : "");
    setEditError("");
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    setEditError("");
    setIsSubmittingEdit(true);

    const imagesList = [editImageUrl.trim()];
    if (editExtraImages.trim()) {
      imagesList.push(...editExtraImages.split(",").map(u => u.trim()).filter(Boolean));
    }

    const res = await updateProduct(editingProductId, {
      id: editingProductId,
      title: editTitle.trim(),
      titleHighlight: editTitleHighlight.trim() || undefined,
      category: editCategory.trim(),
      price: parseFloat(editPrice) || 0,
      oldPrice: editHasDiscount && editOldPrice ? parseFloat(editOldPrice) : null,
      discount: editHasDiscount && editCalculatedDiscount ? editCalculatedDiscount : undefined,
      badge: editBadge.trim() || undefined,
      imageUrl: editImageUrl.trim() || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
      images: imagesList,
      description: editDescription.trim(),
      features: editFeatures.trim() ? editFeatures.split("\n").map(f => f.trim()).filter(Boolean) : undefined,
      sizes: editHasSizes && editSizes.trim() ? editSizes.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      colors: editHasColors && editColors.trim() ? editColors.split(",").map(c => ({ name: c.trim(), hex: "#94a3b8" })) : undefined,
    });

    setIsSubmittingEdit(false);
    if (res.success) {
      setShowEditModal(false);
    } else {
      setEditError(res.error || "Error al actualizar el producto");
    }
  };

  // Find empty categories (niches with 0 products) with normalized comparison
  const emptyCategories = categories.filter(cat => 
    !products.some(p => normalizeCategory(p.category) === normalizeCategory(cat))
  );

  const Kpis = [
    { title: "Catálogo Activo", value: `${products.length} productos`, change: "+100%", icon: PackageOpen },
    { title: "Nichos / Categorías", value: `${categories.length} nichos`, change: `${emptyCategories.length} vacíos`, icon: Layers },
    { title: "Usuarios Registrados", value: "Supabase Live", change: "+100%", icon: Users },
    { title: "Tráfico en Vivo", value: "Activo", change: "100%", icon: Activity },
  ];

  return (
    <div className="relative z-10 pb-20">
      {/* Header and Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display italic font-bold text-gray-900 mb-1">Panel de Control</h1>
          <p className="text-sm text-gray-600">Gestión ejecutiva de catálogo, nichos e inventario de Lumina Home.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCatManager(!showCatManager)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/80 text-gray-800 text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-[#8c9276]" /> {showCatManager ? "Ocultar Nichos" : "Gestionar Nichos"}
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all shadow-md shadow-gray-900/10"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Smart Alert: Empty Categories Recommendation */}
      {emptyCategories.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-amber-50/80 backdrop-blur-md border border-amber-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Aviso Inteligente de Inventario</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Los siguientes nichos no tienen ningún producto activo:{" "}
                <span className="font-semibold">{emptyCategories.join(", ")}</span>.
                Te recomendamos agregar productos o removerlos para que tu catálogo luzca siempre lleno y profesional.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {emptyCategories.map((emptyCat) => (
              <button
                key={emptyCat}
                onClick={() => deleteCategory(emptyCat)}
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-200/60 hover:bg-amber-300/80 text-amber-900 font-medium transition-colors flex items-center gap-1.5"
                title={`Eliminar nicho ${emptyCat}`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar {emptyCat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Management Drawer */}
      {showCatManager && (
        <div className="mb-8 p-6 rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#8c9276]" /> Nichos y Categorías Activas
            </h3>
            <span className="text-xs text-gray-500">{categories.length} categorías disponibles</span>
          </div>

          <div className="flex flex-wrap gap-2.5 mb-5">
            {categories.map((cat) => {
              const count = products.filter(p => normalizeCategory(p.category) === normalizeCategory(cat)).length;
              return (
                <div key={cat} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-800 shadow-sm">
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${count > 0 ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"}`}>
                    {count} prod.
                  </span>
                  <button 
                    onClick={() => deleteCategory(cat)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                    title={`Eliminar categoría ${cat}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Category Input */}
          <div className="flex gap-2 max-w-md">
            <input 
              type="text" 
              value={newCatInput} 
              onChange={e => setNewCatInput(e.target.value)} 
              placeholder="Nombre del nuevo nicho (ej: Jardinería, Cocina)..." 
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-white/80 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900" 
            />
            <button 
              onClick={() => {
                if (newCatInput.trim()) {
                  addCategory(newCatInput.trim());
                  setNewCatInput("");
                }
              }}
              className="px-4 py-2 bg-[#8c9276] hover:bg-[#7a8a66] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Nicho
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {Kpis.map((kpi, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-gray-900 shadow-sm border border-gray-100">
                <kpi.icon className="w-5 h-5 text-[#8c9276]" />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {kpi.change}
              </span>
            </div>
            <div>
              <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{kpi.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Catálogo de Productos</h2>
            <p className="text-xs text-gray-500">Sincronizado en tiempo real con Supabase</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            {products.length} artículos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/60 text-gray-500 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Artículo</th>
                <th className="px-6 py-4">Nicho</th>
                <th className="px-6 py-4">Precio Final</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4">Badge</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        <Image 
                          src={prod.imageUrl || "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop"} 
                          alt={prod.title} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{prod.title}</p>
                        {prod.titleHighlight && (
                          <p className="text-xs text-[#8c9276] italic font-display">{prod.titleHighlight}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {prod.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ${prod.price.toFixed(2)}
                    {prod.oldPrice && (
                      <span className="ml-1.5 text-xs text-gray-400 font-normal line-through">
                        ${prod.oldPrice.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {prod.discount ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                        {prod.discount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {prod.badge ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#8c9276]/10 text-[#8c9276] border border-[#8c9276]/20">
                        {prod.badge}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(prod)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar producto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`¿Seguro que deseas eliminar "${prod.title}"?`)) {
                            deleteProduct(prod.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extended Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Producto</h2>
                <p className="text-xs text-gray-500">Los datos se estructurarán automáticamente con el branding de la tienda.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 overflow-y-auto flex-1 space-y-6">
              {submitError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                  {submitError}
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Identidad del Producto</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre Principal *</label>
                    <input 
                      required 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none" 
                      placeholder="Ej: Lámpara de Pie" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subtítulo Destacado (Itálica)</label>
                    <input 
                      type="text" 
                      value={titleHighlight} 
                      onChange={e => setTitleHighlight(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none" 
                      placeholder="Ej: Nova LED, Nórdica, Cerámica" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nicho / Categoría *</label>
                    <select 
                      required 
                      value={category} 
                      onChange={e => setCategory(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none bg-white"
                    >
                      <option value="">Selecciona un nicho</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Badge de Marketing (Opcional)</label>
                    <select 
                      value={badge} 
                      onChange={e => setBadge(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none bg-white"
                    >
                      <option value="">Sin badge</option>
                      <option value="Más Vendido">Más Vendido</option>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Bestseller">Bestseller</option>
                      <option value="Tendencia">Tendencia</option>
                      <option value="Oferta Especial">Oferta Especial</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Discounts */}
              <div className="space-y-4 p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Precios y Descuentos</h3>
                    <p className="text-xs text-gray-500">Configura si este artículo tiene rebaja activa.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">¿Tiene descuento?</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const next = !hasDiscount;
                        setHasDiscount(next);
                        handlePriceChange(price, oldPrice, next);
                      }} 
                      className={`w-11 h-6 rounded-full transition-colors relative ${hasDiscount ? 'bg-gray-900' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasDiscount ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {hasDiscount ? "Precio con Descuento ($) *" : "Precio Regular ($) *"}
                    </label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={price} 
                      onChange={e => handlePriceChange(e.target.value, oldPrice, hasDiscount)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="89.90" 
                    />
                  </div>

                  {hasDiscount && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio Original / Antes ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={oldPrice} 
                          onChange={e => handlePriceChange(price, e.target.value, hasDiscount)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                          placeholder="119.90" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">% Descuento Calculado</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={calculatedDiscount} 
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-100 text-red-600 font-bold outline-none" 
                          placeholder="-25%" 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Images */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Fotografía y Galería</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">URL de Imagen Principal *</label>
                  <input 
                    required 
                    type="url" 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                    placeholder="https://images.unsplash.com/photo-..." 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">URLs de Galería Adicional (Opcional)</label>
                  <input 
                    type="text" 
                    value={extraImages} 
                    onChange={e => setExtraImages(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                    placeholder="Separa varias URLs con coma: https://..., https://..." 
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Permite a los compradores ver diferentes ángulos o detalles del producto.</p>
                </div>
              </div>

              {/* Section 4: Description & Features */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Descripción y Especificaciones</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción Completa *</label>
                  <textarea 
                    required 
                    rows={3} 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none resize-none" 
                    placeholder="Explica la historia, diseño, materiales y calidez del producto..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Puntos Clave / Características Técnicas (1 por línea)</label>
                  <textarea 
                    rows={3} 
                    value={features} 
                    onChange={e => setFeatures(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none resize-none" 
                    placeholder="Ejemplo:&#10;Luz LED 3000K cálida regulable&#10;Aluminio aeroespacial anodizado&#10;Carga inalámbrica Qi integrada"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">La página web convertirá automáticamente cada línea en un bullet elegante con icono en la ficha del producto.</p>
                </div>
              </div>

              {/* Section 5: Dynamic Variants */}
              <div className="p-4 bg-gray-50/70 rounded-2xl space-y-4 border border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Variantes Adaptativas</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">¿Tiene tallas, tamaños o medidas?</p>
                    <p className="text-xs text-gray-500">Solo si aplica (ej: mantas, estantes, organizadores)</p>
                  </div>
                  <button type="button" onClick={() => setHasSizes(!hasSizes)} className={`w-11 h-6 rounded-full transition-colors relative ${hasSizes ? 'bg-gray-900' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasSizes ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {hasSizes && (
                  <input type="text" value={sizes} onChange={e => setSizes(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none" placeholder="Ej: Individual (120x150), Queen (160x200) (separadas por coma)" />
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">¿Tiene opciones de color?</p>
                    <p className="text-xs text-gray-500">Permite al comprador elegir tono o acabado</p>
                  </div>
                  <button type="button" onClick={() => setHasColors(!hasColors)} className={`w-11 h-6 rounded-full transition-colors relative ${hasColors ? 'bg-gray-900' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasColors ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {hasColors && (
                  <input type="text" value={colors} onChange={e => setColors(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none" placeholder="Ej: Blanco Cerámica, Negro Mate, Roble Natural (separados por coma)" />
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-medium shadow-lg hover:bg-gray-800 transition-all text-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Publicando en Supabase..." : "Publicar en Tienda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Editar Producto</h2>
                  <p className="text-xs text-gray-500">Actualiza la información en la base de datos sin necesidad de eliminarlo.</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-6 overflow-y-auto flex-1 space-y-6">
              {editError && (
                <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
                  {editError}
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Datos Principales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre del Producto *</label>
                    <input 
                      required 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="Ej: Lámpara de Escritorio" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subtítulo / Highlight</label>
                    <input 
                      type="text" 
                      value={editTitleHighlight} 
                      onChange={e => setEditTitleHighlight(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none font-display italic" 
                      placeholder="Ej: Orbit, Nordic, Minimal" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nicho / Categoría *</label>
                    <select 
                      required 
                      value={editCategory} 
                      onChange={e => setEditCategory(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none bg-white"
                    >
                      <option value="">Selecciona un nicho...</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Badge de Marketing</label>
                    <input 
                      type="text" 
                      value={editBadge} 
                      onChange={e => setEditBadge(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="Ej: Más Vendido, Bestseller, Nuevo" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción Completa *</label>
                  <textarea 
                    required 
                    rows={3} 
                    value={editDescription} 
                    onChange={e => setEditDescription(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none resize-none" 
                    placeholder="Describe los beneficios, materiales y propuesta de valor..." 
                  />
                </div>
              </div>

              {/* Section 2: Pricing & Discounts */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Precios y Rebajas</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">¿Tiene descuento?</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        const next = !editHasDiscount;
                        setEditHasDiscount(next);
                        handleEditPriceChange(editPrice, editOldPrice, next);
                      }} 
                      className={`w-11 h-6 rounded-full transition-colors relative ${editHasDiscount ? 'bg-gray-900' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editHasDiscount ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {editHasDiscount ? "Precio con Descuento ($) *" : "Precio Normal ($) *"}
                    </label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={editPrice} 
                      onChange={e => handleEditPriceChange(e.target.value, editOldPrice, editHasDiscount)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="89.90" 
                    />
                  </div>
                  {editHasDiscount && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio Original Anterior ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={editOldPrice} 
                          onChange={e => handleEditPriceChange(editPrice, e.target.value, editHasDiscount)} 
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                          placeholder="119.90" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">% Descuento Calculado</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={editCalculatedDiscount} 
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-100 text-red-600 font-bold outline-none" 
                          placeholder="-25%" 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Images */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Fotografía y Galería</h3>
                
                <div className="flex gap-4 items-start">
                  {editImageUrl && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <Image src={editImageUrl} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">URL de Imagen Principal *</label>
                    <input 
                      required 
                      type="url" 
                      value={editImageUrl} 
                      onChange={e => setEditImageUrl(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="https://images.unsplash.com/photo-..." 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">URLs de Galería Adicional (Opcional)</label>
                  <input 
                    type="text" 
                    value={editExtraImages} 
                    onChange={e => setEditExtraImages(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                    placeholder="https://... , https://... (separadas por coma)" 
                  />
                </div>
              </div>

              {/* Section 4: Specifications */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Especificaciones & Opciones</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Características Clave (una por línea)</label>
                  <textarea 
                    rows={3} 
                    value={editFeatures} 
                    onChange={e => setEditFeatures(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none resize-none" 
                    placeholder="Material: Aluminio aeroespacial&#10;Garantía de por vida" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tallas / Tamaños (separadas por coma)</label>
                    <input 
                      type="text" 
                      value={editSizes} 
                      onChange={e => { setEditSizes(e.target.value); setEditHasSizes(!!e.target.value.trim()); }} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="Ej: Individual, Queen, King" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Colores (nombres separados por coma)</label>
                    <input 
                      type="text" 
                      value={editColors} 
                      onChange={e => { setEditColors(e.target.value); setEditHasColors(!!e.target.value.trim()); }} 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-900 outline-none" 
                      placeholder="Ej: Nogal, Roble, Blanco" 
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-700 transition-all text-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" />
                  {isSubmittingEdit ? "Guardando cambios..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
