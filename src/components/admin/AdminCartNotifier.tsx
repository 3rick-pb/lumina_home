"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUserStore } from "@/lib/userStore";
import { useAdminAlertStore } from "@/lib/adminAlertStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CartAlertCard } from "./CartAlertCard";

export function AdminCartNotifier() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { 
    config, 
    activeAlert, 
    activeAlertKey, 
    fireToast, 
    dismissAlert,
    onViewDetailsCallback 
  } = useAdminAlertStore();
  const router = useRouter();

  const isAdmin = Boolean(isAuthenticated && user && user.role === "ADMIN");

  // Realtime Supabase listener
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase.channel("radar:clients", {
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
          fireToast(payload);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAdmin, fireToast]);

  // Auto-dismiss timer based on configured duration
  useEffect(() => {
    if (!activeAlert || !activeAlertKey) return;

    const timer = setTimeout(() => {
      dismissAlert();
    }, config.duration);

    return () => clearTimeout(timer);
  }, [activeAlert, activeAlertKey, config.duration, dismissAlert]);

  if (!isAdmin) return null;

  // Determine fixed positioning CSS classes and macOS transform origin
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

  const handleAction = () => {
    dismissAlert();
    if (onViewDetailsCallback) {
      onViewDetailsCallback();
    } else {
      router.push("/profile?tab=analytics");
    }
  };

  return (
    <aside 
      aria-label="Notificaciones de actividad en vivo"
      className={`fixed z-[99999] pointer-events-none flex flex-col ${getPositionClasses()}`}
    >
      <AnimatePresence mode="wait">
        {activeAlert && (
          <motion.div
            key={activeAlertKey}
            style={{ transformOrigin }}
            initial={{
              opacity: 0,
              scale: 0.15,
              y: isBottom ? 25 : -25,
              x: isRight ? 25 : -25,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0,
              transition: {
                type: "spring",
                stiffness: 340,
                damping: 26,
                mass: 0.85,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.08,
              y: isBottom ? 20 : -20,
              x: isRight ? 20 : -20,
              transition: {
                duration: 0.24,
                ease: [0.32, 0, 0.67, 0],
              },
            }}
            className="pointer-events-auto filter drop-shadow-2xl"
          >
            <CartAlertCard
              payload={activeAlert}
              config={config}
              onClose={dismissAlert}
              onAction={handleAction}
              isPreview={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
