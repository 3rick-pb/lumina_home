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

  // Dynamic Island open / close state
  const isDynamicIsland = config.layout !== "split_capsule";
  const [isExpanded, setIsExpanded] = React.useState(!isDynamicIsland);

  // Auto-dismiss and dynamic island open/close schedule based on configured duration
  useEffect(() => {
    if (!activeAlert || !activeAlertKey) return;

    if (!isDynamicIsland) {
      setIsExpanded(true);
      const timer = setTimeout(() => {
        dismissAlert();
      }, config.duration);
      return () => clearTimeout(timer);
    }

    // Dynamic Island sequence:
    // 1. Starts compact
    setIsExpanded(false);

    // 2. Opens smoothly after 220ms
    const openTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 220);

    // 3. Collapses smoothly before dismissal
    const collapseDelay = Math.max(1200, config.duration - 650);
    const closeTimer = setTimeout(() => {
      setIsExpanded(false);
    }, collapseDelay);

    // 4. Final dismissal
    const dismissTimer = setTimeout(() => {
      dismissAlert();
    }, config.duration);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      clearTimeout(dismissTimer);
    };
  }, [activeAlert, activeAlertKey, config.duration, dismissAlert, isDynamicIsland]);

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

  const handleClose = () => {
    if (isDynamicIsland) {
      setIsExpanded(false);
      setTimeout(() => dismissAlert(), 250);
    } else {
      dismissAlert();
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
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              onClose={handleClose}
              onAction={handleAction}
              isPreview={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
