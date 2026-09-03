"use client";

import React, { useState } from "react";
import { ArrowUpRight, PackageOpen, Users, DollarSign, Activity, Plus, X } from "lucide-react";
import { useCatalogStore, CatalogProduct } from "@/lib/catalogStore";

export default function AdminPage() {
  const { products, addProduct } = useCatalogStore();
  const [showModal, setShowModal] = useState(false);
  
  // Modal State
  const [hasSizes, setHasSizes] = useState(false);
  const [hasColors, setHasColors] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    imageUrl: "",
    description: "",
    sizes: "",
    colors: ""
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: CatalogProduct = {
      id: Math.random().toString(36).substring(7),
      title: formData.title,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800",
      description: formData.description,
      sizes: hasSizes && formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : undefined,
      colors: hasColors && formData.colors ? formData.colors.split(',').map(c => ({ name: c.trim(), hex: "#cccccc" })) : undefined,
    };
    
    addProduct(newProduct);
    setShowModal(false);
    setFormData({ title: "", category: "", price: "", imageUrl: "", description: "", sizes: "", colors: "" });
  };

  const Kpis = [
    { title: "Ingresos Totales", value: "$12,450", change: "+14%", icon: DollarSign },
    { title: "Pedidos Hoy", value: "34", change: "+5%", icon: PackageOpen },
    { title: "Usuarios Registrados", value: "1,204", change: "+2%", icon: Users },
    { title: "Tráfico Activo", value: "48", change: "-1%", icon: Activity },
  ];

  return (
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display italic font-bold text-gray-900 mb-2">Vista General</h1>
          <p className="text-gray-600">Bienvenido al panel de control de tu tienda Lumina.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {Kpis.map((kpi, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900">
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.change} <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{kpi.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden mb-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Inventario Reciente</h2>
          <button className="text-sm font-medium text-[#8c9276] hover:underline">Ver Todo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.slice(0, 8).map((prod) => (
                <tr key={prod.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{prod.title}</td>
                  <td className="px-6 py-4 text-gray-500">{prod.category}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">${prod.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Disponible</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#8c9276] font-medium hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Añadir Nuevo Producto</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none" placeholder="Ej: Lámpara Nórdica" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none" placeholder="99.90" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nicho / Categoría</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none">
                    <option value="">Selecciona un nicho</option>
                    <option value="Iluminación">Iluminación</option>
                    <option value="Aromaterapia">Aromaterapia</option>
                    <option value="Textiles">Textiles</option>
                    <option value="Home Office">Home Office</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Gadgets">Gadgets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                  <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 outline-none" placeholder="https://..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 outline-none resize-none" placeholder="Describe los detalles del artículo..."></textarea>
                </div>

                {/* Toggles Tallas y Colores */}
                <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Atributos Dinámicos</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">¿Tiene tallas o medidas?</p>
                      <p className="text-xs text-gray-500">Actívalo solo si aplica (ej: mantas, estantes)</p>
                    </div>
                    <button type="button" onClick={() => setHasSizes(!hasSizes)} className={`w-12 h-6 rounded-full transition-colors relative ${hasSizes ? 'bg-gray-900' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasSizes ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {hasSizes && (
                    <input type="text" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none" placeholder="Ej: Pequeño, Mediano, Grande (separados por coma)" />
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">¿Tiene opciones de color?</p>
                      <p className="text-xs text-gray-500">Actívalo solo si el cliente debe elegir color</p>
                    </div>
                    <button type="button" onClick={() => setHasColors(!hasColors)} className={`w-12 h-6 rounded-full transition-colors relative ${hasColors ? 'bg-gray-900' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasColors ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {hasColors && (
                    <input type="text" value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none" placeholder="Ej: Blanco Mate, Negro, Roble (separados por coma)" />
                  )}
                </div>

              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-medium shadow-lg hover:bg-gray-800 transition-colors">Publicar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
