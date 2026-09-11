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

  // Determine fixed positioning CSS classes
  const getPositionClasses = () => {
    switch (config.position) {
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

  const isBottom = config.position.startsWith("bottom");

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
            initial={{
              opacity: 0,
              y: isBottom ? 30 : -30,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 380,
                damping: 26,
              },
            }}
            exit={{
              opacity: 0,
              y: isBottom ? 20 : -20,
              scale: 0.92,
              transition: {
                duration: 0.22,
                ease: "easeOut",
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
