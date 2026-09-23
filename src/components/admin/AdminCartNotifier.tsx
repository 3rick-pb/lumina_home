"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUserStore } from "@/lib/userStore";
import { useAdminAlertStore, hydrateAlertConfigFromClient } from "@/lib/adminAlertStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CartAlertCard } from "./CartAlertCard";

export function AdminCartNotifier() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { 
    config, 
    activeAlert, 
    activeAlerts,
    fireToast, 
    dismissAlert,
    bringToFront,
    onViewDetailsCallback 
  } = useAdminAlertStore();
  const router = useRouter();

  const isAdmin = Boolean(isAuthenticated && user && user.role === "ADMIN");

  useEffect(() => {
    hydrateAlertConfigFromClient();
  }, []);

  const fireToastRef = React.useRef(fireToast);
  useEffect(() => {
    fireToastRef.current = fireToast;
  }, [fireToast]);

  // Realtime Supabase listener
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase.channel("lumina:cart_alerts", {
      config: { broadcast: { self: false } },
    });

    channel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "cart_item_added" }, ({ payload }: { payload: any }) => {
        if (!payload || !payload.userId) return;

        // Strict Requirement: ONLY notify about registered customers
        const isRegistered = Boolean(
          payload.userId &&
          !payload.userId.startsWith("anon_") &&
          payload.userEmail &&
          payload.userEmail.includes("@")
        );

        if (isRegistered) {
          fireToastRef.current(payload);
        }
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [isAdmin]);

  // Auto-dismiss timers per card based on configured duration
  useEffect(() => {
    if (activeAlerts.length === 0) return;

    const timers = activeAlerts.map((item) => {
      const elapsed = Date.now() - item.timestamp;
      const remaining = Math.max(1000, config.duration - elapsed);
      return setTimeout(() => {
        dismissAlert(item.id);
      }, remaining);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [activeAlerts, config.duration, dismissAlert]);

  if (!isAdmin) return null;

  // Determine fixed positioning CSS classes and transform origin
  const position = config?.position || "bottom-right";
  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "bottom-7 left-7 items-start";
      case "top-right":
        return "top-7 right-7 items-end";
      case "top-left":
        return "top-7 left-7 items-start";
      case "bottom-right":
      default:
        return "bottom-7 right-7 items-end";
    }
  };

  const isBottom = typeof position === 'string' && position.startsWith("bottom");
  const isRight = typeof position === 'string' && position.endsWith("right");
  const transformOrigin = `${isBottom ? "bottom" : "top"} ${isRight ? "right" : "left"}`;

  const handleAction = (alertId?: string) => {
    dismissAlert(alertId);
    if (onViewDetailsCallback) {
      onViewDetailsCallback();
    } else {
      router.push("/profile?tab=analytics");
    }
  };

  // Fallback to activeAlert if activeAlerts is empty
  const displayAlerts = activeAlerts.length > 0 
    ? activeAlerts 
    : activeAlert 
      ? [{ id: 'legacy-active', payload: activeAlert, timestamp: Date.now() }] 
      : [];

  return (
    <aside 
      aria-label="Notificaciones de actividad en vivo"
      className={`fixed z-[99999] pointer-events-none flex flex-col ${getPositionClasses()}`}
    >
      {/* CSS Grid stack: All cards share gridArea 1 / 1 / 2 / 2 for zero-thrash, butter-smooth 120fps card stacking */}
      <div className={`relative pointer-events-auto grid grid-cols-1 grid-rows-1 ${isBottom ? "items-end" : "items-start"} ${isRight ? "justify-items-end" : "justify-items-start"} select-none`}>
        <AnimatePresence initial={false}>
          {displayAlerts.map((item, index) => {
            const step = 14;
            const yOffset = isBottom ? index * step : -index * step;
            const xOffset = isRight ? index * step : -index * step;

            // Progressive scale down for cards in the background
            const scale = Math.max(0.78, 1 - index * 0.055);
            // Progressive opacity reduction for background depth
            const opacity = Math.max(0.35, 1 - index * 0.22);
            // Depth order: Front card is highest
            const zIndex = 50 - index * 10;

            return (
              <motion.div
                key={item.id}
                style={{ 
                  gridArea: "1 / 1 / 2 / 2",
                  zIndex,
                  transformOrigin,
                  willChange: "transform, opacity",
                }}
                initial={{
                  opacity: 0,
                  scale: 0.88,
                  y: isBottom ? 28 : -28,
                  x: isRight ? 16 : -16,
                }}
                animate={{
                  opacity,
                  scale,
                  y: yOffset,
                  x: xOffset,
                  zIndex,
                  transition: {
                    type: "spring",
                    stiffness: 420,
                    damping: 30,
                    mass: 0.7,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.88,
                  y: isBottom ? 18 : -18,
                  x: isRight ? 14 : -14,
                  pointerEvents: "none",
                  transition: {
                    duration: 0.16,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                onClick={() => {
                  if (index > 0) {
                    bringToFront(item.id);
                  }
                }}
                className={`transform-gpu ${
                  index > 0 ? "cursor-pointer" : ""
                }`}
              >
                <CartAlertCard
                  payload={item.payload}
                  config={config}
                  onClose={() => dismissAlert(item.id)}
                  onAction={() => handleAction(item.id)}
                  isPreview={false}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
