"use client";

import { useEffect, Suspense, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCatalogStore } from "@/lib/catalogStore";
import { useUserStore, hydrateStoreFromClient } from "@/lib/userStore";
import { useRadarStore } from "@/lib/radarStore";
import { useCartStore } from "@/lib/store";
import { useThemeStore, getResolvedTheme } from "@/lib/themeStore";
import { useBrand } from "@/core/hooks/useBrand";
import { initSilentAudioEngine } from "@/lib/soundUtils";

// Ensure 60-144 FPS animations always run on performance OS builds (e.g. WinterOS) where Windows disables OS desktop animations
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const origMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query: string): MediaQueryList => {
    if (query && query.includes("prefers-reduced-motion")) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    }
    return origMatchMedia(query);
  };
}

function getOrCreateSessionId(userId?: string): string {
  if (typeof window === "undefined") return `sess_${userId || "anon"}_init`;
  try {
    const key = userId ? `lumina_radar_sess_${userId}` : "lumina_radar_anon_sess";
    let sId = sessionStorage.getItem(key);
    if (!sId) {
      sId = `sess_${userId ? `${userId}_` : "anon_"}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, sId);
    }
    return sId;
  } catch {
    return `sess_${userId ? `${userId}_` : "anon_"}${Date.now()}`;
  }
}

function ActivityTracker() {
  const brand = useBrand();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const cartItems = useCartStore((state) => state.items);
  const products = useCatalogStore((state) => state.products);
  const themeMode = useThemeStore((state) => state.mode);

  // Never apply .dark to <html> so storefront routes (/shop, /, Header, Footer) never flash black.
  // Dark Mode is strictly scoped inside Mi Perfil (/profile) and CartDrawer via their own .dark root containers.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  }, [pathname, themeMode]);

  const exactGeoRef = useRef<{ lat?: number; lng?: number; exactAddress?: string; city?: string }>({});

  // Resolve real street-level or GPS coordinates inside Quito / Ecuador (cached in localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const resolvePreciseLocation = async () => {
      const currentAddress = useUserStore.getState().address || useUserStore.getState().addresses?.[0];
      const streetPart = currentAddress?.street?.trim() || "";
      const refPart = currentAddress?.reference?.trim() || "";
      const cityPart = currentAddress?.city?.trim() || "";
      const statePart = currentAddress?.state?.trim() || "";
      const fullAddressQuery = [streetPart, refPart, cityPart, statePart, "Ecuador"]
        .filter(Boolean)
        .join(", ");

      // 1. If user has a street/sector address, geocode it via OpenStreetMap Nominatim (cached)
      if (streetPart || refPart || cityPart) {
        const cacheKey = `lumina_geo_v2_${fullAddressQuery.toLowerCase()}`;
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
              exactGeoRef.current = {
                lat: parsed.lat,
                lng: parsed.lng,
                exactAddress: [streetPart, refPart, cityPart].filter(Boolean).join(", ") || cityPart,
                city: cityPart || parsed.city,
              };
              return;
            }
          }
        } catch {}

        try {
          const q = encodeURIComponent(fullAddressQuery);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ec,co,ar,pe,mx,cl&q=${q}`,
            { headers: { "Accept-Language": "es" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (!cancelled && Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              if (!isNaN(lat) && !isNaN(lng)) {
                const displayAddr = [streetPart, refPart, cityPart].filter(Boolean).join(", ") || cityPart;
                exactGeoRef.current = {
                  lat,
                  lng,
                  exactAddress: displayAddr,
                  city: cityPart || "Quito",
                };
                try {
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({ lat, lng, city: cityPart || "Quito" })
                  );
                } catch {}
                return;
              }
            }
          }
        } catch {}
      }

      // 2. Check cached coordinates if previously saved by address form
      try {
        const cachedGps = localStorage.getItem("lumina_precise_browser_gps_v1");
        if (cachedGps) {
          const parsed = JSON.parse(cachedGps);
          if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
            exactGeoRef.current = {
              lat: parsed.lat,
              lng: parsed.lng,
              exactAddress: parsed.exactAddress || cityPart || parsed.city || "Quito",
              city: cityPart || parsed.city || "Quito",
            };
          }
        }
      } catch {}
    };

    resolvePreciseLocation();
    return () => {
      cancelled = true;
    };
  }, [user?.id, pathname]);

  // Compute readable user location/activity
  let currentSection = "Explorando Tienda";

  if (!pathname || pathname.startsWith("/auth/")) {
    currentSection = "";
  } else if (isCartOpen) {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    currentSection = count > 0 ? `Revisando Bolsa (${count} prod.)` : "Bolsa de Compras (Vacía)";
  } else if (pathname === "/shop") {
    const category = searchParams?.get("category");
    const search = searchParams?.get("search");
    if (category) {
      currentSection = `Catálogo: ${(category.charAt(0) || '').toUpperCase() + category.slice(1)}`;
    } else if (search) {
      currentSection = `Buscando: "${search.slice(0, 18)}"`;
    } else {
      currentSection = "Catálogo General";
    }
  } else if (pathname.startsWith("/product/")) {
    const prodId = pathname.replace("/product/", "").split("/")[0].trim();
    const product = products.find((p) => String(p.id) === prodId);
    currentSection = product?.title ? `Viendo: ${product.title.slice(0, 22)}` : "Viendo Producto";
  } else if (pathname === "/profile" || pathname === "/admin") {
    if (user?.role === "ADMIN") {
      currentSection = "Mi Perfil / Mapa";
    } else {
      const tab = searchParams?.get("tab");
      if (tab === "orders") currentSection = "Mi Perfil / Pedidos";
      else if (tab === "cards") currentSection = "Mi Perfil / Tarjetas";
      else if (tab === "favorites") currentSection = "Mi Perfil / Favoritos";
      else if (tab === "settings") currentSection = "Mi Perfil / Ajustes";
      else currentSection = "Mi Perfil / Resumen";
    }
  } else if (pathname === "/checkout") {
    currentSection = "En Proceso de Pago";
  } else if (pathname === "/") {
    currentSection = `Inicio • ${brand.name}`;
  } else {
    currentSection = "Explorando Tienda";
  }

  const sessionIdRef = useRef<string>("");

  // Sends active presence heartbeat via pure Supabase Realtime Presence
  const sendHeartbeat = useCallback((sectionOverride?: string) => {
    if (!pathname || pathname.startsWith("/auth/")) return;

    const currentUser = useUserStore.getState().user;
    const sId = sessionIdRef.current || getOrCreateSessionId(currentUser?.id);
    sessionIdRef.current = sId;

    const targetSection = sectionOverride || currentSection;
    if (!targetSection) return;

    const currentCartItems = useCartStore.getState().items;
    const currentCartOpen = useCartStore.getState().isOpen;
    const cartItemsCount = currentCartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const hasCart = currentCartOpen || cartItemsCount > 0;

    if (currentUser?.id) {
      // Authenticated User
      const currentOrders = useUserStore.getState().orders;
      const currentAddress = useUserStore.getState().address;
      const currentAddresses = useUserStore.getState().addresses;
      const purchasesCount = currentOrders?.length || 0;
      const totalSpent = currentOrders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
      const activeAddr = currentAddress || currentAddresses?.[0];
      const userCity = activeAddr?.city || exactGeoRef.current.city || "";
      const fullExactAddress = [
        activeAddr?.street?.trim(),
        activeAddr?.reference?.trim(),
        userCity,
      ]
        .filter(Boolean)
        .join(", ");

      useRadarStore.getState().trackActivity(
        currentUser,
        userCity,
        totalSpent,
        purchasesCount,
        targetSection,
        hasCart,
        cartItemsCount,
        true,
        sId,
        false,
        {
          lat: exactGeoRef.current.lat,
          lng: exactGeoRef.current.lng,
          exactAddress: fullExactAddress || exactGeoRef.current.exactAddress || userCity,
        }
      );
    } else {
      // Anonymous Visitor
      useRadarStore.getState().trackActivity(
        null,
        exactGeoRef.current.city || "",
        0,
        0,
        targetSection,
        hasCart,
        cartItemsCount,
        true,
        sId,
        false,
        {
          lat: exactGeoRef.current.lat,
          lng: exactGeoRef.current.lng,
          exactAddress: exactGeoRef.current.exactAddress,
        }
      );
    }
  }, [pathname, currentSection]);

  // Connect to real-time radar channel upon mount or user change (excluding /auth/*)
  useEffect(() => {
    if (!pathname || pathname.startsWith("/auth/")) {
      // Excluded: untrack presence if currently on login/register screens
      const chan = useRadarStore.getState().channel;
      if (chan) {
        chan.untrack().catch(() => {});
      }
      return;
    }

    sessionIdRef.current = getOrCreateSessionId(user?.id);
    useRadarStore.getState().initRadar(user, sessionIdRef.current);
    sendHeartbeat();
  }, [user, pathname, currentSection, sendHeartbeat]);

  // Tab Close / Unload: Report close for this specific tab session cleanly
  useEffect(() => {
    const handleClose = () => {
      const activeUser = useUserStore.getState().user;
      const sId = sessionIdRef.current;
      const clientId = activeUser?.id || `anon_${sId}`;
      const chan = useRadarStore.getState().channel;
      if (chan && sId) {
        try {
          chan.send({
            type: "broadcast",
            event: "offline",
            payload: { id: clientId, sessionId: sId, allSessions: false },
          }).catch(() => {});
          chan.untrack().catch(() => {});
        } catch {}
      }
    };

    window.addEventListener("beforeunload", handleClose);
    window.addEventListener("pagehide", handleClose);
    return () => {
      window.removeEventListener("beforeunload", handleClose);
      window.removeEventListener("pagehide", handleClose);
    };
  }, []);

  // Exploration Navigation Tracker: immediately dispatches section change
  const lastNavDispatchRef = useRef<number>(0);
  useEffect(() => {
    // Purge legacy guest tokens
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("lumina_guest_id");
        localStorage.removeItem("lumina_guest_id");
      } catch {}
    }

    if (!pathname || pathname.startsWith("/auth/") || !currentSection) return;

    const now = Date.now();
    // Immediate dispatch on navigation, throttled to 1.5s for fast consecutive clicks
    if (now - lastNavDispatchRef.current > 1500) {
      lastNavDispatchRef.current = now;
      sendHeartbeat(currentSection);
    } else {
      const timeout = setTimeout(() => {
        lastNavDispatchRef.current = Date.now();
        sendHeartbeat(currentSection);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams, isCartOpen, cartItems.length, currentSection, sendHeartbeat]);

  // Tab Visibility Tracker: Wake up and send instant heartbeat when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sendHeartbeat]);

  return null;
}

export function AppInitializer() {
  const fetchProducts = useCatalogStore((state) => state.fetchProducts);
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    initSilentAudioEngine();
    hydrateStoreFromClient();
    fetchProducts();
    initializeAuth();
  }, [fetchProducts, initializeAuth]);

  // Global Media & Product Image Protection
  // Completely prevents: "Copiar imagen", "Copiar dirección de imagen", "Guardar imagen como...",
  // "Abrir en nueva pestaña", "Buscar en Google Lens", "Crear código QR", drag-to-desktop, etc.
  useEffect(() => {
    const isProtectedTarget = (target: EventTarget | null): boolean => {
      if (!target) return false;
      try {
        // Resolve target safely: if it's a Text node or non-Element, traverse to parent element
        const el = target instanceof Element 
          ? target 
          : (target as Node).parentElement instanceof Element 
          ? (target as Node).parentElement 
          : null;

        if (!el || typeof el.closest !== 'function') return false;

        const tag = el.tagName?.toUpperCase();
        if (tag === "IMG" || tag === "PICTURE" || tag === "VIDEO" || tag === "CANVAS") {
          return true;
        }
        return Boolean(el.closest("img, picture, video, [data-protected-media], .product-image, [role='img']"));
      } catch {
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      try {
        if (isProtectedTarget(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      } catch {}
    };

    const handleDragStart = (e: DragEvent) => {
      try {
        if (isProtectedTarget(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      } catch {}
    };

    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <ActivityTracker />
    </Suspense>
  );
}
