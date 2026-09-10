"use client";

import React, { useEffect } from "react";
import { Toaster } from "sileo";
import { useUserStore } from "@/lib/userStore";
import { useAdminAlertStore } from "@/lib/adminAlertStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function AdminCartNotifier() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { config, fireToast } = useAdminAlertStore();
  const router = useRouter();

  const isAdmin = Boolean(isAuthenticated && user && user.role === "ADMIN");

  useEffect(() => {
    if (!isAdmin) return;

    // Listen to the realtime radar channel for cart additions by registered customers
    const channel = supabase.channel("radar:clients", {
      config: { broadcast: { self: false } },
    });

    channel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "cart_item_added" }, ({ payload }: { payload: any }) => {
        if (!payload || !payload.userId) return;

        // Strict Requirement: ONLY notify about registered customers in the store
        const isRegistered = Boolean(
          payload.userId &&
          !payload.userId.startsWith("anon_") &&
          payload.userEmail &&
          payload.userEmail.includes("@")
        );

        if (isRegistered) {
          fireToast(payload, () => {
            router.push("/profile?tab=analytics");
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAdmin, fireToast, router]);

  if (!isAdmin) return null;

  return <Toaster position={config.position} />;
}
