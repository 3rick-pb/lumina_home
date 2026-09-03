"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { Percent, Truck, Wrench, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCatalogStore } from "@/lib/catalogStore";

const CATEGORIES = [
  { name: "Aromaterapia", price: "desde $29", img: "https://images.unsplash.com/photo-1608528577891-eb055944f2e1?q=80&w=600&auto=format&fit=crop" },
  { name: "Iluminación", price: "desde $89", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop" },
  { name: "Home Office", price: "desde $49", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop" },
  { name: "Textiles", price: "desde $39", img: "https://images.unsplash.com/photo-1580828343064-fde4cad202d0?q=80&w=600&auto=format&fit=crop" },
  { name: "Gadgets", price: "desde $120", img: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600&auto=format&fit=crop" }
];

export default function Home() {
  const { products } = useCatalogStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    useCatalogStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  const displayProducts = isMounted ? products : [];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-end pb-12 overflow-hidden bg-brand-900">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop" 
            alt="Interior elegante" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 pt-40">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-white mb-6">
              Artículos premium para tu hogar
            </span>
            <h1 className="text-5xl md:text-7xl font-sans font-medium text-white leading-[1.1] tracking-tight">
              Espacios diseñados <br />
              <span className="font-display italic font-bold text-[#d2b48c]">para perdurar</span>
            </h1>
            <p className="mt-6 text-xl text-gray-200 leading-relaxed max-w-lg font-light">
              Soluciones de estética, comodidad y tecnología pensadas para cada rincón que habitas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/shop">
                <Button size="lg" className="rounded-full bg-[#8c9276] hover:bg-[#7a8a66] text-white border-none px-8 flex items-center gap-2">
                  Ver catálogo <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8">
                  Filtrar por categoría
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <div className="bg-[#5c5a52] text-white/90 py-5 border-y border-white/10 relative z-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 text-sm font-light">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#d2b48c]" /> Envíos nacionales</div>
            <div className="hidden sm:flex items-center gap-2"><Wrench className="w-4 h-4 text-[#d2b48c]" /> 2 años de garantía</div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#d2b48c]" /> Devoluciones 30 días</div>
            <div className="hidden md:flex items-center gap-2"><Percent className="w-4 h-4 text-[#d2b48c]" /> Financiación 0%</div>
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#d2b48c]" /> Pagos seguros</div>
          </div>
        </div>
      </div>

      {/* Immersive Background Wrapper for Catalog Sections */}
      <div className="relative overflow-hidden bg-[#fafafa]">
        {/* Soft ambient blobs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#d2b48c] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#8c9276] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-[#e1ad01] rounded-full mix-blend-multiply filter blur-[200px] opacity-[0.08] pointer-events-none" />

        {/* Categories */}
        <section className="py-24 relative z-10">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-sans font-medium text-gray-900 mb-2">
                  Explora el <span className="font-display italic text-accent-700">Catálogo</span>
                </h2>
                <p className="text-gray-500">Encuentra la pieza perfecta para tu rincón favorito.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES.map((cat, idx) => (
                <Link href={`/shop?category=${cat.name.toLowerCase()}`} key={idx} className="group relative h-[320px] rounded-2xl overflow-hidden block shadow-sm border border-black/5">
                  <Image src={cat.img} fill className="object-cover transition-transform duration-700 group-hover:scale-105" alt={cat.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-5 flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-medium text-lg">{cat.name}</h3>
                      <p className="text-white/70 text-sm">{cat.price}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Products */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 gap-6">
              <h2 className="text-3xl font-sans font-medium text-gray-900">
                Productos <span className="font-display italic text-accent-700">Populares</span>
              </h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto hide-scrollbar">
                {["Todos", "Iluminación", "Aromaterapia", "Home Office", "Textiles"].map((filter, i) => (
                  <button 
                    key={i}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      i === 0 
                        ? 'bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-[0_4px_16px_rgba(0,0,0,0.05)]' 
                        : 'bg-white/20 backdrop-blur-md border border-white/30 text-gray-600 hover:bg-white/40 hover:border-white/60'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      </div>

    </>
  );
}
