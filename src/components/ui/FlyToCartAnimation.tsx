"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

export interface FlyParticle {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  imageUrl?: string;
}

type FlyListener = (particle: FlyParticle) => void;
const listeners = new Set<FlyListener>();

/**
 * Triggers a luxury particle / thumbnail animation that flies from the source
 * element or coordinates straight into the navbar shopping bag.
 */
export function flyToCart(
  origin: DOMRect | { x: number; y: number } | Element | null | undefined,
  imageUrl?: string
) {
  if (typeof window === "undefined" || !origin) return;

  let startX = 0;
  let startY = 0;

  if ("getBoundingClientRect" in origin) {
    const rect = origin.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  } else if ("left" in origin && "width" in origin) {
    startX = (origin as DOMRect).left + (origin as DOMRect).width / 2;
    startY = (origin as DOMRect).top + (origin as DOMRect).height / 2;
  } else if ("x" in origin && "y" in origin) {
    startX = (origin as { x: number; y: number }).x;
    startY = (origin as { x: number; y: number }).y;
  }

  // Find navbar shopping bag icon
  const bagButton =
    document.getElementById("header-cart-button") ||
    document.querySelector("[aria-label='Bolsa de Compras']");

  let targetX = window.innerWidth - 50;
  let targetY = 32;

  if (bagButton) {
    const bagRect = bagButton.getBoundingClientRect();
    targetX = bagRect.left + bagRect.width / 2;
    targetY = bagRect.top + bagRect.height / 2;
  }

  const particle: FlyParticle = {
    id: `fly-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    startX,
    startY,
    targetX,
    targetY,
    imageUrl,
  };

  listeners.forEach((listener) => listener(particle));
}

export function FlyToCartContainer() {
  const [particles, setParticles] = useState<FlyParticle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handler: FlyListener = (newParticle) => {
      setParticles((prev) => [...prev, newParticle]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {particles.map((p) => {
          // Calculate apex height for parabolic flight curve
          const apexY =
            Math.min(p.startY, p.targetY) -
            Math.min(180, Math.max(60, Math.abs(p.startX - p.targetX) * 0.22));
          const midX = (p.startX + p.targetX) / 2;

          return (
            <motion.div
              key={p.id}
              initial={{
                x: p.startX - 22,
                y: p.startY - 22,
                scale: 0.7,
                opacity: 0.9,
                rotate: 0,
              }}
              animate={{
                x: [p.startX - 22, midX - 22, p.targetX - 22],
                y: [p.startY - 22, apexY - 22, p.targetY - 22],
                scale: [0.7, 1.25, 0.9, 0.22],
                opacity: [0.95, 1, 1, 0],
                rotate: [0, -18, 14, 0],
              }}
              transition={{
                duration: 0.75,
                times: [0, 0.45, 0.85, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => {
                setParticles((prev) => prev.filter((item) => item.id !== p.id));
                window.dispatchEvent(new CustomEvent("lumina:cart-bounce"));
              }}
              className="absolute top-0 left-0 w-11 h-11 rounded-full p-1 bg-white/95 dark:bg-[#1f1f23]/95 backdrop-blur-md border-2 border-[#8c9276] shadow-[0_12px_32px_rgba(0,0,0,0.35)] flex items-center justify-center overflow-hidden"
            >
              {p.imageUrl ? (
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-[#8c9276] flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
