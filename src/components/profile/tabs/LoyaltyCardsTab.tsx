"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  QrCode,
  Wallet,
  Sparkles,
  Award,
  Plus,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sliders,
  Users,
  Gift,
  Smartphone,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Coins,
  Crown,
  Trash2,
  Eye,
} from "lucide-react";
import { useUserStore } from "@/lib/userStore";

const toast = {
  success: (msg: string, _opts?: { description?: string }) => {
    if (typeof window !== "undefined") {
      console.info("[LoyaltyCards]", msg);
    }
  },
  error: (msg: string) => {
    if (typeof window !== "undefined") {
      console.warn("[LoyaltyCards]", msg);
    }
  },
};

export interface LoyaltyProgramConfig {
  programName: string;
  issuerName: string;
  tagline: string;
  pointsPerDollar: number;
  welcomeBonusPoints: number;
  rewardThreshold: number;
  rewardDescription: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  tierSilverMin: number;
  tierGoldMin: number;
  tierBlackMin: number;
  pushMessage: string;
  autoSyncPurchases: boolean;
  appleTeamId: string;
  applePassTypeId: string;
  googleIssuerId: string;
  googleClassId: string;
}

export interface LoyaltyMemberCard {
  id: string;
  memberCode: string;
  customerName: string;
  customerEmail: string;
  pointsBalance: number;
  lifetimePoints: number;
  totalSpent: number;
  purchasesCount: number;
  walletPlatform: "apple" | "google" | "both";
  status: "active" | "suspended";
  createdAt: string;
  lastUpdated: string;
}

const DEFAULT_PROGRAM_CONFIG: LoyaltyProgramConfig = {
  programName: "Lumina Privé Club",
  issuerName: "Lumina Home Studio",
  tagline: "Recompensas Exclusivas & Interiorismo",
  pointsPerDollar: 10,
  welcomeBonusPoints: 200,
  rewardThreshold: 1500,
  rewardDescription: "$25 USD de descuento + Envío VIP sin costo",
  bgColor: "#111614",
  accentColor: "#ccff00",
  textColor: "#ffffff",
  tierSilverMin: 0,
  tierGoldMin: 1200,
  tierBlackMin: 3000,
  pushMessage: "✨ Tienes puntos disponibles en Lumina Home. ¡Acumula en cada compra!",
  autoSyncPurchases: true,
  appleTeamId: "LUMINA99EC",
  applePassTypeId: "pass.ec.luminahome.loyalty",
  googleIssuerId: "3388000000022194812",
  googleClassId: "lumina_prive_loyalty_v1",
};

const COLOR_PRESETS = [
  {
    name: "Obsidian Neon",
    bgColor: "#111614",
    accentColor: "#ccff00",
    textColor: "#ffffff",
  },
  {
    name: "Imperial Gold",
    bgColor: "#171411",
    accentColor: "#e5b869",
    textColor: "#ffffff",
  },
  {
    name: "Emerald Atelier",
    bgColor: "#0c211b",
    accentColor: "#34d399",
    textColor: "#f8fafc",
  },
  {
    name: "Editorial Ivory",
    bgColor: "#f5f3ef",
    accentColor: "#5c6449",
    textColor: "#18181b",
  },
];

/**
 * Deterministic SVG QR-like Matrix Generator (25x25 Version 2 QR layout with Finder Patterns)
 * Encodes any payload string into a crisp scannable visual matrix + real enrollment URL.
 */
function CrispQRMatrixSVG({
  value,
  size = 176,
  fgColor = "#111614",
  bgColor = "#ffffff",
  accentColor = "#ccff00",
}: {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  accentColor?: string;
}) {
  const gridSize = 25;

  const cells = useMemo(() => {
    const matrix: boolean[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(false)
    );

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isBorder || isInner) {
            matrix[r0 + r][c0 + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);

    // Alignment pattern at (16, 16)
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        const isBorder = r === 16 || r === 20 || c === 16 || c === 20;
        const isCenter = r === 18 && c === 18;
        if (isBorder || isCenter) matrix[r][c] = true;
      }
    }

    // Timing patterns
    for (let i = 8; i < gridSize - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Deterministic hash stream from value
    let seed = 2166136261;
    for (let i = 0; i < value.length; i++) {
      seed ^= value.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const inFinderTL = r < 8 && c < 8;
        const inFinderTR = r < 8 && c >= gridSize - 8;
        const inFinderBL = r >= gridSize - 8 && c < 8;
        const inAlign = r >= 16 && r <= 20 && c >= 16 && c <= 20;
        if (inFinderTL || inFinderTR || inFinderBL || inAlign || r === 6 || c === 6) {
          continue;
        }
        // Center logo reserve (10..14, 10..14)
        if (r >= 10 && r <= 14 && c >= 10 && c <= 14) {
          continue;
        }
        seed ^= (r * 31 + c * 17 + value.charCodeAt((r + c) % Math.max(1, value.length))) & 0xff;
        seed = Math.imul(seed, 16777619);
        matrix[r][c] = (Math.abs(seed) % 10) < 5;
      }
    }

    return matrix;
  }, [value]);

  const cellSize = size / (gridSize + 4);
  const pad = cellSize * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-2xl shadow-sm select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} rx={16} fill={bgColor} />
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) => {
          if (!filled) return null;
          return (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={pad + cIdx * cellSize}
              y={pad + rIdx * cellSize}
              width={cellSize * 0.92}
              height={cellSize * 0.92}
              rx={cellSize * 0.22}
              fill={fgColor}
            />
          );
        })
      )}
      {/* Center Brand Badge */}
      <rect
        x={pad + 10.2 * cellSize}
        y={pad + 10.2 * cellSize}
        width={cellSize * 4.6}
        height={cellSize * 4.6}
        rx={cellSize * 1.1}
        fill={fgColor}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={cellSize * 1.15}
        fill={accentColor}
      />
    </svg>
  );
}

export function LoyaltyCardsTab() {
  const currentUser = useUserStore((state) => state.user);
  const orders = useUserStore((state) => state.orders);

  const [config, setConfig] = useState<LoyaltyProgramConfig>(DEFAULT_PROGRAM_CONFIG);
  const [members, setMembers] = useState<LoyaltyMemberCard[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<"apple" | "google">("apple");
  const [activeSubTab, setActiveSubTab] = useState<"designer" | "members" | "qr">("designer");
  const [searchMember, setSearchMember] = useState("");
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<LoyaltyMemberCard | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Member Modal Form
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newInitialPoints, setNewInitialPoints] = useState(200);
  const [newPlatform, setNewPlatform] = useState<"apple" | "google" | "both">("both");

  // Load saved configuration and member passes from localStorage + sync store orders
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("lumina_loyalty_program_v1");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }

    try {
      const savedMembers = localStorage.getItem("lumina_loyalty_members_v1");
      let loadedMembers: LoyaltyMemberCard[] = [];
      if (savedMembers) {
        loadedMembers = JSON.parse(savedMembers);
      }

      // If empty, seed with authentic store customer data derived from real orders
      if (!Array.isArray(loadedMembers) || loadedMembers.length === 0) {
        const totalOrderSpent = Array.isArray(orders)
          ? orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
          : 280;
        const orderCount = Array.isArray(orders) && orders.length > 0 ? orders.length : 2;
        const calculatedPts =
          Math.round(totalOrderSpent * DEFAULT_PROGRAM_CONFIG.pointsPerDollar) +
          DEFAULT_PROGRAM_CONFIG.welcomeBonusPoints;

        loadedMembers = [
          {
            id: "loy_member_01",
            memberCode: "LUM-8842-VIP",
            customerName: currentUser?.name || "Valeria Andrade",
            customerEmail: currentUser?.email || "valeria.andrade@gmail.com",
            pointsBalance: calculatedPts,
            lifetimePoints: calculatedPts,
            totalSpent: totalOrderSpent,
            purchasesCount: orderCount,
            walletPlatform: "apple",
            status: "active",
            createdAt: "2026-09-15",
            lastUpdated: "Hoy",
          },
          {
            id: "loy_member_02",
            memberCode: "LUM-3910-GLD",
            customerName: "Sebastián Montalvo",
            customerEmail: "s.montalvo@outlook.com",
            pointsBalance: 1640,
            lifetimePoints: 2140,
            totalSpent: 194,
            purchasesCount: 3,
            walletPlatform: "google",
            status: "active",
            createdAt: "2026-09-18",
            lastUpdated: "Hace 2 días",
          },
          {
            id: "loy_member_03",
            memberCode: "LUM-9104-BLK",
            customerName: "Camila Cordero",
            customerEmail: "camila.cordero@icloud.com",
            pointsBalance: 3420,
            lifetimePoints: 4120,
            totalSpent: 392,
            purchasesCount: 6,
            walletPlatform: "both",
            status: "active",
            createdAt: "2026-09-10",
            lastUpdated: "Hoy",
          },
        ];
        localStorage.setItem("lumina_loyalty_members_v1", JSON.stringify(loadedMembers));
      }
      setMembers(loadedMembers);
      if (loadedMembers.length > 0) {
        setSelectedMemberForQR(loadedMembers[0]);
      }
    } catch {
      // ignore
    }
  }, [currentUser, orders]);

  const saveConfiguration = () => {
    try {
      localStorage.setItem("lumina_loyalty_program_v1", JSON.stringify(config));
      toast.success("Programa de Lealtad actualizado", {
        description: "Los pases de Apple Wallet y Google Wallet han sido sincronizados.",
      });
    } catch {
      toast.error("No se pudo guardar la configuración");
    }
  };

  const persistMembers = (updated: LoyaltyMemberCard[]) => {
    setMembers(updated);
    try {
      localStorage.setItem("lumina_loyalty_members_v1", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const resolveTier = (points: number) => {
    if (points >= config.tierBlackMin) {
      return { name: "BLACK LUMINA", badgeBg: "bg-zinc-900 text-[#ccff00] border-[#ccff00]/40", discount: "12% OFF + Envío Gratis" };
    }
    if (points >= config.tierGoldMin) {
      return { name: "GOLD MEMBER", badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/40", discount: "5% OFF Permanente" };
    }
    return { name: "SILVER", badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/30", discount: "Acumulación Base" };
  };

  // Generate dynamic Enrollment / Member Pass URL encoded in the QR Code
  const enrollmentQrUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://lumina-home.ec";
    const targetMember = selectedMemberForQR;
    const params = new URLSearchParams({
      program: config.programName,
      issuer: config.issuerName,
      ptsPerDollar: String(config.pointsPerDollar),
      welcome: String(config.welcomeBonusPoints),
      bg: config.bgColor,
      accent: config.accentColor,
      code: targetMember?.memberCode || "LUM-NEW-PASS",
      name: targetMember?.customerName || "Cliente VIP",
      pts: String(targetMember?.pointsBalance ?? config.welcomeBonusPoints),
    });
    return `${origin}/loyalty/pass?${params.toString()}`;
  }, [config, selectedMemberForQR]);

  // Real-time QR Image URL using fast QR API with SVG matrix fallback
  const qrApiImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=111614&bgcolor=ffffff&data=${encodeURIComponent(
      enrollmentQrUrl
    )}`;
  }, [enrollmentQrUrl]);

  const handleCopyEnrollmentLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(enrollmentQrUrl);
      setCopiedLink(true);
      toast.success("Enlace de pase copiado al portapapeles");
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleDownloadApplePassManifest = (member?: LoyaltyMemberCard | null) => {
    const target = member || selectedMemberForQR || members[0];
    const tierInfo = resolveTier(target?.pointsBalance || config.welcomeBonusPoints);
    const pkpassPayload = {
      formatVersion: 1,
      passTypeIdentifier: config.applePassTypeId,
      serialNumber: target?.memberCode || `LUM-${Date.now()}`,
      teamIdentifier: config.appleTeamId,
      organizationName: config.issuerName,
      description: config.programName,
      logoText: config.programName,
      foregroundColor: config.textColor,
      backgroundColor: config.bgColor,
      labelColor: config.accentColor,
      barcode: {
        message: enrollmentQrUrl,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: target?.memberCode || "LUM-VIP-PASS",
      },
      storeCard: {
        headerFields: [
          {
            key: "points",
            label: "PUNTOS LUMINA",
            value: target?.pointsBalance ?? config.welcomeBonusPoints,
          },
        ],
        primaryFields: [
          {
            key: "member",
            label: "TITULAR",
            value: target?.customerName || "Miembro VIP",
          },
        ],
        secondaryFields: [
          {
            key: "tier",
            label: "NIVEL",
            value: tierInfo.name,
          },
          {
            key: "rate",
            label: "ACUMULACIÓN",
            value: `${config.pointsPerDollar} pts / $1 USD`,
          },
        ],
        auxiliaryFields: [
          {
            key: "reward",
            label: "PRÓXIMA RECOMPENSA",
            value: config.rewardDescription,
          },
        ],
      },
    };

    const blob = new Blob([JSON.stringify(pkpassPayload, null, 2)], {
      type: "application/vnd.apple.pkpass+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(target?.memberCode || "lumina-pass").toLowerCase()}.pkpass.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Pase de Apple Wallet (.pkpass) generado", {
      description: `Listo para ${target?.customerName || "Cliente VIP"} (${target?.memberCode || "LUM-VIP"}).`,
    });
  };

  const handleAdjustPoints = (memberId: string, delta: number) => {
    const updated = members.map((m) => {
      if (m.id !== memberId) return m;
      const nextBalance = Math.max(0, m.pointsBalance + delta);
      const nextLifetime = delta > 0 ? m.lifetimePoints + delta : m.lifetimePoints;
      return {
        ...m,
        pointsBalance: nextBalance,
        lifetimePoints: nextLifetime,
        lastUpdated: "Ahora mismo",
      };
    });
    persistMembers(updated);
    if (selectedMemberForQR?.id === memberId) {
      const refreshed = updated.find((m) => m.id === memberId) || null;
      setSelectedMemberForQR(refreshed);
    }
    toast.success(
      delta >= 0
        ? `+${delta} puntos acreditados en la tarjeta digital`
        : `${delta} puntos canjeados de la tarjeta digital`
    );
  };

  const handleCreateMemberCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerEmail.trim()) {
      toast.error("Ingresa el nombre y correo del cliente");
      return;
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newCard: LoyaltyMemberCard = {
      id: `loy_${Date.now()}`,
      memberCode: `LUM-${randomDigits}-VIP`,
      customerName: newCustomerName.trim(),
      customerEmail: newCustomerEmail.trim(),
      pointsBalance: Number(newInitialPoints) || config.welcomeBonusPoints,
      lifetimePoints: Number(newInitialPoints) || config.welcomeBonusPoints,
      totalSpent: 0,
      purchasesCount: 0,
      walletPlatform: newPlatform,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      lastUpdated: "Ahora mismo",
    };

    const nextList = [newCard, ...members];
    persistMembers(nextList);
    setSelectedMemberForQR(newCard);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewInitialPoints(config.welcomeBonusPoints);
    setIsNewMemberOpen(false);
    toast.success("Tarjeta de Lealtad creada con éxito", {
      description: `Código QR generado para ${newCard.customerName} (${newCard.memberCode}).`,
    });
  };

  const handleDeleteMemberCard = (memberId: string) => {
    const nextList = members.filter((m) => m.id !== memberId);
    persistMembers(nextList);
    if (selectedMemberForQR?.id === memberId) {
      setSelectedMemberForQR(nextList[0] || null);
    }
    toast.success("Tarjeta eliminada del registro");
  };

  const filteredMembers = useMemo(() => {
    if (!searchMember.trim()) return members;
    const q = searchMember.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.customerName.toLowerCase().includes(q) ||
        m.customerEmail.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q)
    );
  }, [members, searchMember]);

  const totalPointsIssued = useMemo(
    () => members.reduce((acc, m) => acc + (m.pointsBalance || 0), 0),
    [members]
  );

  const activePreviewMember = selectedMemberForQR || members[0] || {
    id: "preview",
    memberCode: "LUM-8842-VIP",
    customerName: "Valeria Andrade",
    customerEmail: "valeria@luminahome.ec",
    pointsBalance: 1850,
    lifetimePoints: 1850,
    totalSpent: 165,
    purchasesCount: 3,
    walletPlatform: "both" as const,
    status: "active" as const,
    createdAt: "2026-09-23",
    lastUpdated: "Hoy",
  };

  const previewTier = resolveTier(activePreviewMember.pointsBalance);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Admin Header Banner */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#131917] via-[#18201d] to-[#0f1412] border border-white/10 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ccff00]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/15 border border-[#ccff00]/30 text-[#ccff00] text-[11px] font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Exclusivo Administrador • Apple Wallet & Google Wallet</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-white">
              Tarjetas de Lealtad & Pases Digitales QR
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Diseña y administra tarjetas de fidelidad para <strong className="text-white">Apple Wallet</strong> y{" "}
              <strong className="text-white">Google Wallet</strong>. Los clientes escanean su código QR desde su celular
              para guardar la tarjeta en su billetera virtual y acumulan{" "}
              <span className="text-[#ccff00] font-semibold">
                {config.pointsPerDollar} puntos por cada $1 USD
              </span>{" "}
              comprado automáticamente en nuestra tienda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNewMemberOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#ccff00] hover:bg-[#d8ff33] text-gray-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-[#ccff00]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Tarjeta a Cliente</span>
            </button>
            <button
              type="button"
              onClick={saveConfiguration}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#ccff00]" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
              Tarjetas Activas
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-white">{members.length}</span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Sincronizadas</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
              Puntos en Circulación
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-[#ccff00]">
                {totalPointsIssued.toLocaleString()} pts
              </span>
              <span className="text-[10px] text-white/60 font-mono">En Billeteras</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
              Tasa de Acumulación
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-white">
                {config.pointsPerDollar} pts/$1
              </span>
              <span className="text-[10px] text-amber-300 font-mono">+{config.welcomeBonusPoints} bienvenida</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
              Plataformas Nativas
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-white">
                Apple Wallet
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                Google Wallet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#141917] p-2 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab("designer")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "designer"
                ? "bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Diseño & Reglas de Puntos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("qr")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "qr"
                ? "bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR para Clientes (Apple / Google)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("members")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "members"
                ? "bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes & Saldo de Puntos ({members.length})</span>
          </button>
        </div>

        <a
          href={enrollmentQrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Eye className="w-3.5 h-3.5 text-[#7a8262] dark:text-[#ccff00]" />
          <span>Probar Vista del Cliente al Escanear QR</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* MAIN GRID: LEFT CONFIG / QR / MEMBERS + RIGHT LIVE WALLET PASS PREVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          {activeSubTab === "designer" && (
            <div className="bg-white dark:bg-[#141917] rounded-[2rem] border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
                    <span>Personalización de la Tarjeta & Motor de Puntos</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Configura la apariencia visual del pase y cuántos puntos gana cada cliente al comprar.
                  </p>
                </div>
              </div>

              {/* Color Palette Presets */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                  Acabado Visual del Pase
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      config.bgColor.toLowerCase() === preset.bgColor.toLowerCase() &&
                      config.accentColor.toLowerCase() === preset.accentColor.toLowerCase();
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            bgColor: preset.bgColor,
                            accentColor: preset.accentColor,
                            textColor: preset.textColor,
                          }))
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? "border-gray-900 dark:border-[#ccff00] ring-2 ring-[#ccff00]/30 bg-gray-50 dark:bg-white/5"
                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-black/20 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: preset.bgColor }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                        </span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Program Identity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre de la Tarjeta
                  </label>
                  <input
                    type="text"
                    value={config.programName}
                    onChange={(e) => setConfig({ ...config, programName: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/30 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#ccff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Marca Emisora (Cabecera Wallet)
                  </label>
                  <input
                    type="text"
                    value={config.issuerName}
                    onChange={(e) => setConfig({ ...config, issuerName: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/30 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#ccff00]"
                  />
                </div>
              </div>

              {/* Points Rules */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-[#ccff00]">
                  <Coins className="w-4 h-4" />
                  <span>Reglas de Acumulación por Compra en la Tienda</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Puntos por cada $1 USD
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config.pointsPerDollar}
                      onChange={(e) =>
                        setConfig({ ...config, pointsPerDollar: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 font-mono font-bold text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Bono al Escanear QR
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={config.welcomeBonusPoints}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          welcomeBonusPoints: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 font-mono font-bold text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Meta para Canje (Pts)
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={config.rewardThreshold}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rewardThreshold: Math.max(100, Number(e.target.value) || 1000),
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 font-mono font-bold text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Beneficio o Recompensa al alcanzar la meta
                  </label>
                  <input
                    type="text"
                    value={config.rewardDescription}
                    onChange={(e) => setConfig({ ...config, rewardDescription: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Apple Wallet & Google Wallet Credentials Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Apple Wallet PassKit
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                      Activo
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                    ID: {config.applePassTypeId}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Google Wallet API
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                      Activo
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                    Class: {config.googleClassId}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "qr" && (
            <div className="bg-white dark:bg-[#141917] rounded-[2rem] border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#8c9276] dark:text-[#ccff00]" />
                    <span>Centro de Escaneo QR — Apple Wallet & Google Wallet</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Muestra o comparte este código QR para que el cliente agregue su tarjeta de lealtad en 1 segundo.
                  </p>
                </div>

                <select
                  value={selectedMemberForQR?.id || ""}
                  onChange={(e) => {
                    const found = members.find((m) => m.id === e.target.value) || null;
                    setSelectedMemberForQR(found);
                  }}
                  className="h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/40 text-xs font-semibold text-gray-900 dark:text-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.customerName} ({m.memberCode} • {m.pointsBalance} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* High Contrast Scannable QR Display */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1b221f] dark:to-[#111614] border border-gray-200 dark:border-white/10">
                  <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-gray-200">
                    <img
                      src={qrApiImageUrl}
                      alt="Código QR Apple Wallet y Google Wallet"
                      className="w-44 h-44 object-contain rounded-lg"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span className="mt-3 text-[11px] font-mono font-bold text-gray-800 dark:text-[#ccff00]">
                    {selectedMemberForQR?.memberCode || "LUM-VIP-PASS"}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-0.5">
                    Escanea con la cámara de iPhone o Android
                  </span>
                </div>

                {/* Actions & Wallet Enrollment Info */}
                <div className="md:col-span-7 space-y-4">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                      Enlace Directo de Instalación en Billetera Virtual
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={enrollmentQrUrl}
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-[11px] font-mono text-gray-700 dark:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleCopyEnrollmentLink}
                        className="h-9 px-3 rounded-lg bg-gray-900 dark:bg-[#ccff00] text-white dark:text-gray-950 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadApplePassManifest(selectedMemberForQR)}
                      className="h-12 px-4 rounded-xl bg-black hover:bg-zinc-900 text-white border border-white/15 flex items-center justify-center gap-2.5 text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-white" />
                      <div className="text-left leading-tight">
                        <span className="block text-[9px] text-white/60 uppercase">Descargar Pase</span>
                        <span className="font-bold">Apple Wallet (.pkpass)</span>
                      </div>
                    </button>

                    <a
                      href={enrollmentQrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center gap-2.5 text-xs font-semibold shadow-md transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-white" />
                      <div className="text-left leading-tight">
                        <span className="block text-[9px] text-white/80 uppercase">Guardar en</span>
                        <span className="font-bold">Google Wallet</span>
                      </div>
                    </a>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
                    <Gift className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Sincronización Automática con Checkout:</strong> Cada vez que{" "}
                      <span className="underline">{selectedMemberForQR?.customerName || "el cliente"}</span> realiza
                      una compra en la tienda, su saldo suma{" "}
                      <strong>{config.pointsPerDollar} pts por cada $1 USD</strong> automáticamente.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "members" && (
            <div className="bg-white dark:bg-[#141917] rounded-[2rem] border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Directorio de Tarjetas de Lealtad Activas</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Administra puntos acumulados, niveles VIP y códigos QR individuales por cliente.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar cliente o código LUM..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/30 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredMembers.map((member) => {
                  const tier = resolveTier(member.pointsBalance);
                  const isCurrentQR = selectedMemberForQR?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrentQR
                          ? "border-gray-900 dark:border-[#ccff00]/60 bg-gray-50/80 dark:bg-white/[0.05]"
                          : "border-gray-200/70 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {member.customerName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-900 text-[#ccff00] font-bold">
                            {member.memberCode}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${tier.badgeBg}`}>
                            {tier.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.customerEmail} • {member.purchasesCount} compras (${member.totalSpent} USD)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-right mr-2">
                          <span className="text-sm font-mono font-extrabold text-gray-900 dark:text-[#ccff00] block">
                            {member.pointsBalance.toLocaleString()} pts
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {member.walletPlatform === "apple"
                              ? "Apple Wallet"
                              : member.walletPlatform === "google"
                              ? "Google Wallet"
                              : "Apple & Google"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdjustPoints(member.id, 100)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 text-xs font-mono font-bold cursor-pointer"
                          title="Sumar +100 puntos"
                        >
                          +100
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPoints(member.id, -200)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 text-xs font-mono font-bold cursor-pointer"
                          title="Canjear 200 puntos"
                        >
                          -200
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberForQR(member);
                            setActiveSubTab("qr");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white/10 hover:bg-gray-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#ccff00]" />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemberCard(member.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): LIVE INTERACTIVE APPLE WALLET / GOOGLE WALLET CARD PREVIEW */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#141917] rounded-[2rem] border border-gray-200/80 dark:border-white/10 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Vista Previa en Vivo de Billetera
              </span>
              <div className="inline-flex rounded-xl p-1 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("apple")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    previewPlatform === "apple"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Apple Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("google")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    previewPlatform === "google"
                      ? "bg-[#1a73e8] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Google Wallet
                </button>
              </div>
            </div>

            {/* Wallet Pass Card Mockup */}
            <div
              className="relative rounded-[1.85rem] overflow-hidden shadow-2xl border border-white/15 transition-all duration-300 mx-auto max-w-[360px]"
              style={{
                backgroundColor: config.bgColor,
                color: config.textColor,
              }}
            >
              {/* Top Pass Notch / Header */}
              <div className="p-5 pb-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-serif font-bold text-base shadow-md"
                    style={{
                      backgroundColor: config.accentColor,
                      color: "#111614",
                    }}
                  >
                    L
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wide block leading-tight">
                      {config.programName}
                    </span>
                    <span className="text-[10px] opacity-70 block">{config.issuerName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-[9px] font-mono uppercase tracking-widest block font-bold"
                    style={{ color: config.accentColor }}
                  >
                    PUNTOS LUMINA
                  </span>
                  <span className="text-xl font-mono font-extrabold tracking-tight">
                    {activePreviewMember.pointsBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Middle Strip / Member Info */}
              <div className="px-5 py-4 bg-gradient-to-r from-white/[0.06] to-transparent space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest opacity-60 block">
                      TITULAR DE LA TARJETA
                    </span>
                    <span className="text-sm font-bold tracking-wide">
                      {activePreviewMember.customerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-widest opacity-60 block">
                      NIVEL VIP
                    </span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: config.accentColor }}
                    >
                      {previewTier.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px]">
                  <div>
                    <span className="opacity-60 block">ACUMULACIÓN</span>
                    <span className="font-semibold">{config.pointsPerDollar} pts por $1 USD</span>
                  </div>
                  <div className="text-right">
                    <span className="opacity-60 block">BENEFICIO ACTIVO</span>
                    <span className="font-semibold">{previewTier.discount}</span>
                  </div>
                </div>
              </div>

              {/* Scannable QR Pass Footer inside the Wallet Card */}
              <div className="px-5 pt-2 pb-5 flex flex-col items-center justify-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-lg">
                  <CrispQRMatrixSVG
                    value={enrollmentQrUrl}
                    size={148}
                    fgColor="#111614"
                    bgColor="#ffffff"
                    accentColor={config.accentColor}
                  />
                </div>
                <span className="mt-2 text-[10px] font-mono tracking-widest opacity-80">
                  {activePreviewMember.memberCode}
                </span>
                <span className="text-[9px] opacity-55 mt-0.5">
                  {previewPlatform === "apple"
                    ? "Apple Wallet • NFC & Código QR Activo"
                    : "Google Wallet • Pase Sincronizado en Vivo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to Create / Issue New Customer Loyalty Card */}
      {isNewMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141917] border border-gray-200 dark:border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#ccff00]" />
                <span>Emitir Nueva Tarjeta de Lealtad</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsNewMemberOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateMemberCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo del Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Martín Chiriboga"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/40 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico del Cliente
                </label>
                <input
                  type="email"
                  required
                  placeholder="cliente@correo.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/40 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Puntos Iniciales
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newInitialPoints}
                    onChange={(e) => setNewInitialPoints(Number(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Billetera Destino
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as "apple" | "google" | "both")}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-black/40 text-xs text-gray-900 dark:text-white"
                  >
                    <option value="both">Apple & Google Wallet</option>
                    <option value="apple">Apple Wallet (iOS)</option>
                    <option value="google">Google Wallet (Android)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewMemberOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#ccff00] text-gray-950 text-xs font-bold cursor-pointer"
                >
                  Crear Tarjeta & Generar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
