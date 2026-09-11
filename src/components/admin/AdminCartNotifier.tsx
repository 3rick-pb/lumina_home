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
        return "bottom-6 left-6 items-start";
      case "top-right":
        return "top-6 right-6 items-end";
      case "top-left":
        return "top-6 left-6 items-start";
      case "bottom-right":
      default:
        return "bottom-6 right-6 items-end";
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
        <AnimatePresence mode="popLayout">
          {displayAlerts.map((item, index) => {
            // Directional corner stacking offsets as specified:
            // - bottom-right: stacks up (-Y) and left (-X) towards interior
            // - top-right: stacks down (+Y) and left (-X) towards interior
            // - top-left: stacks down (+Y) and right (+X) towards interior
            // - bottom-left: stacks up (-Y) and right (+X) towards interior
            const step = 14;
            const yOffset = isBottom ? -index * step : index * step;
            const xOffset = isRight ? -index * step : index * step;

            // Progressive scale down for cards in the background
            const scale = Math.max(0.78, 1 - index * 0.055);
            // Progressive opacity reduction for background depth
            const opacity = Math.max(0.35, 1 - index * 0.22);
            // Depth order: Front card is highest
            const zIndex = 50 - index * 10;

            return (
              <motion.div
                key={item.id}
                layout
                style={{ 
                  gridArea: "1 / 1 / 2 / 2",
                  zIndex,
                  transformOrigin,
                }}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: isBottom ? 35 : -35,
                  x: isRight ? 20 : -20,
                }}
                animate={{
                  opacity,
                  scale,
                  y: yOffset,
                  x: xOffset,
                  zIndex,
                  filter: index > 0 ? `brightness(${Math.max(0.85, 1 - index * 0.07)})` : "none",
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 26,
                    mass: 0.8,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.7,
                  y: isBottom ? 20 : -20,
                  x: isRight ? 20 : -20,
                  transition: {
                    duration: 0.22,
                    ease: [0.32, 0, 0.67, 0],
                  },
                }}
                onClick={() => {
                  if (index > 0) {
                    bringToFront(item.id);
                  }
                }}
                className={`filter drop-shadow-2xl transition-all duration-200 ${
                  index > 0 ? "cursor-pointer hover:scale-[0.96] hover:brightness-100" : ""
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
