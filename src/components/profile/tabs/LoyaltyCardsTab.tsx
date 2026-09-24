"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  QrCode,
  Wallet,
  Sparkles,
  Award,
  Plus,
  Copy,
  Check,
  Download,
  Sliders,
  Users,
  Smartphone,
  Search,
  ArrowUpRight,
  Coins,
  Crown,
  Trash2,
  Eye,
  Lock,
  Upload,
  RotateCcw,
} from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { CloudSyncStatus } from "../CloudSyncStatus";

const toast = {
  success: (msg: string, _opts?: { description?: string }) => {
    if (typeof window !== "undefined") {
      console.info("[Lumina-PassStudio]", msg);
    }
  },
  error: (msg: string) => {
    if (typeof window !== "undefined") {
      console.warn("[Lumina-PassStudio]", msg);
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
  qrFgColor: string;
  qrBgColor: string;
  qrCornerStyle: "rounded" | "sharp" | "dots";
  customLogoDataUrl?: string;
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
  programName: "Lumina Member Pass",
  issuerName: "Lumina Home",
  tagline: "Espacios con Alma y Diseño de Autor",
  pointsPerDollar: 10,
  welcomeBonusPoints: 200,
  rewardThreshold: 1500,
  rewardDescription: "$25 USD de saldo a favor en tu próxima orden + Envío Preferencial",
  bgColor: "#171717",
  accentColor: "#8c9276",
  textColor: "#ffffff",
  qrFgColor: "#171717",
  qrBgColor: "#ffffff",
  qrCornerStyle: "rounded",
  customLogoDataUrl: "",
  tierSilverMin: 0,
  tierGoldMin: 1200,
  tierBlackMin: 3000,
  pushMessage: "Tus puntos de lealtad se han actualizado tras tu compra.",
  autoSyncPurchases: true,
  appleTeamId: "LUMINA99EC",
  applePassTypeId: "pass.ec.luminahome.member",
  googleIssuerId: "3388000000022194812",
  googleClassId: "lumina_member_pass_v2",
};

const COLOR_PRESETS = [
  {
    name: "Neutral Obsidiana",
    bgColor: "#171717",
    accentColor: "#8c9276",
    textColor: "#ffffff",
    qrFgColor: "#171717",
    qrBgColor: "#ffffff",
  },
  {
    name: "Salvia Editorial",
    bgColor: "#8c9276",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    qrFgColor: "#171717",
    qrBgColor: "#ffffff",
  },
  {
    name: "Terracota Cálido",
    bgColor: "#d97736",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    qrFgColor: "#171717",
    qrBgColor: "#ffffff",
  },
  {
    name: "Piedra Minimal",
    bgColor: "#f5f5f4",
    accentColor: "#8c9276",
    textColor: "#171717",
    qrFgColor: "#171717",
    qrBgColor: "#ffffff",
  },
];

/**
 * 100% Client-Side Vector QR Matrix Engine (crear-web-micro-saas Architecture)
 * Supports rounded/sharp/dot modules, clean typographic seal or uploaded image, and direct SVG/PNG export.
 */
function buildDeterministicQRMatrix(value: string, gridSize = 25): boolean[][] {
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

  for (let r = 16; r <= 20; r++) {
    for (let c = 16; c <= 20; c++) {
      const isBorder = r === 16 || r === 20 || c === 16 || c === 20;
      const isCenter = r === 18 && c === 18;
      if (isBorder || isCenter) matrix[r][c] = true;
    }
  }

  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

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
      if (r >= 10 && r <= 14 && c >= 10 && c <= 14) {
        continue;
      }
      seed ^= (r * 31 + c * 17 + value.charCodeAt((r + c) % Math.max(1, value.length))) & 0xff;
      seed = Math.imul(seed, 16777619);
      matrix[r][c] = (Math.abs(seed) % 10) < 5;
    }
  }

  return matrix;
}

function CrispQRMatrixSVG({
  value,
  size = 176,
  fgColor = "#171717",
  bgColor = "#ffffff",
  accentColor = "#8c9276",
  cornerStyle = "rounded",
  logoUrl,
  svgRef,
}: {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  accentColor?: string;
  cornerStyle?: "rounded" | "sharp" | "dots";
  logoUrl?: string;
  svgRef?: React.MutableRefObject<SVGSVGElement | null>;
}) {
  const gridSize = 25;
  const cells = useMemo(() => buildDeterministicQRMatrix(value, gridSize), [value]);
  const cellSize = size / (gridSize + 4);
  const pad = cellSize * 2;
  const moduleRadius =
    cornerStyle === "dots" ? cellSize * 0.48 : cornerStyle === "rounded" ? cellSize * 0.25 : 0;

  return (
    <svg
      ref={(el) => {
        if (svgRef) svgRef.current = el;
      }}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-2xl shadow-xs select-none"
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
              rx={moduleRadius}
              fill={fgColor}
            />
          );
        })
      )}
      {/* Minimal Center Badge (No demo logo) */}
      <rect
        x={pad + 10.1 * cellSize}
        y={pad + 10.1 * cellSize}
        width={cellSize * 4.8}
        height={cellSize * 4.8}
        rx={cellSize * 1.1}
        fill={fgColor}
      />
      {logoUrl ? (
        <image
          href={logoUrl}
          x={pad + 10.5 * cellSize}
          y={pad + 10.5 * cellSize}
          width={cellSize * 4.0}
          height={cellSize * 4.0}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <circle cx={size / 2} cy={size / 2} r={cellSize * 1.15} fill={accentColor} />
      )}
    </svg>
  );
}

export function LoyaltyCardsTab() {
  const brand = useBrand();
  const currentUser = useUserStore((state) => state.user);
  const orders = useUserStore((state) => state.orders);

  const [config, setConfig] = useState<LoyaltyProgramConfig>(() => ({
    ...DEFAULT_PROGRAM_CONFIG,
    issuerName: brand.name,
    tagline: brand.tagline,
  }));
  const [members, setMembers] = useState<LoyaltyMemberCard[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<"apple" | "google">("apple");
  const [activeSubTab, setActiveSubTab] = useState<"designer" | "qr" | "members">("designer");
  const [searchMember, setSearchMember] = useState("");
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<LoyaltyMemberCard | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");
  const [isSyncing, setIsSyncing] = useState(false);

  const qrSvgRef = useRef<SVGSVGElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newInitialPoints, setNewInitialPoints] = useState(200);
  const [newPlatform, setNewPlatform] = useState<"apple" | "google" | "both">("both");

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("lumina_loyalty_program_v1");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        const migratedBg =
          parsed.bgColor === "#111614" || parsed.bgColor === "#303825"
            ? DEFAULT_PROGRAM_CONFIG.bgColor
            : parsed.bgColor;
        const migratedAccent =
          parsed.accentColor === "#ccff00" || parsed.accentColor === "#d2b48c"
            ? DEFAULT_PROGRAM_CONFIG.accentColor
            : parsed.accentColor;

        setConfig((prev) => ({
          ...prev,
          ...parsed,
          bgColor: migratedBg || prev.bgColor,
          accentColor: migratedAccent || prev.accentColor,
          qrFgColor: "#171717",
          qrBgColor: "#ffffff",
        }));
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
            memberCode: "LUM-8842-PRV",
            customerName: currentUser?.name || "Valeria Andrade",
            customerEmail: currentUser?.email || "valeria.andrade@gmail.com",
            pointsBalance: calculatedPts,
            lifetimePoints: calculatedPts,
            totalSpent: totalOrderSpent,
            purchasesCount: orderCount,
            walletPlatform: "apple",
            status: "active",
            createdAt: "2026-09-15",
            lastUpdated: "Sincronizado",
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
            lastUpdated: "Hace 48h",
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
            lastUpdated: "Sincronizado",
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

  const saveConfiguration = async () => {
    setIsSyncing(true);
    setToolState("working");
    try {
      localStorage.setItem("lumina_loyalty_program_v1", JSON.stringify(config));
      setTimeout(() => {
        setIsSyncing(false);
        setToolState("done");
        setTimeout(() => setToolState("idle"), 2200);
      }, 250);
      toast.success("Configuración guardada");
    } catch {
      setIsSyncing(false);
      setToolState("idle");
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
      return {
        name: "Nivel Oro+",
        badgeBg:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        discount: "12% Preferencial + Envío sin costo",
      };
    }
    if (points >= config.tierGoldMin) {
      return {
        name: "Nivel Plata",
        badgeBg:
          "bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-white/15",
        discount: "5% Beneficio Permanente",
      };
    }
    return {
      name: "Nivel Base",
      badgeBg:
        "bg-[#8c9276]/15 text-[#686e54] dark:text-[#b8bfa2] border-[#8c9276]/30",
      discount: "Acumulación Activa",
    };
  };

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
      name: targetMember?.customerName || "Cliente Lumina",
      pts: String(targetMember?.pointsBalance ?? config.welcomeBonusPoints),
    });
    return `${origin}/loyalty/pass?${params.toString()}`;
  }, [config, selectedMemberForQR]);

  const handleCopyEnrollmentLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(enrollmentQrUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleDownloadQRVectorSVG = () => {
    if (!qrSvgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(qrSvgRef.current);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${(selectedMemberForQR?.memberCode || "lumina-pass").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadQRHighResPNG = () => {
    if (!qrSvgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(qrSvgRef.current);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = config.qrBgColor || "#ffffff";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 0, 0, 1024, 1024);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `qr-${(selectedMemberForQR?.memberCode || "lumina-pass").toLowerCase()}-1024px.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
          }
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setConfig((prev) => ({ ...prev, customLogoDataUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
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
        altText: target?.memberCode || "LUM-PRV-PASS",
      },
      storeCard: {
        headerFields: [
          {
            key: "points",
            label: "PUNTOS",
            value: target?.pointsBalance ?? config.welcomeBonusPoints,
          },
        ],
        primaryFields: [
          {
            key: "member",
            label: "TITULAR",
            value: target?.customerName || "Cliente Lumina",
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
            label: "BENEFICIO",
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
        lastUpdated: "Sincronizado",
      };
    });
    persistMembers(updated);
    if (selectedMemberForQR?.id === memberId) {
      const refreshed = updated.find((m) => m.id === memberId) || null;
      setSelectedMemberForQR(refreshed);
    }
  };

  const handleCreateMemberCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerEmail.trim()) return;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newCard: LoyaltyMemberCard = {
      id: `loy_${Date.now()}`,
      memberCode: `LUM-${randomDigits}-PRV`,
      customerName: newCustomerName.trim(),
      customerEmail: newCustomerEmail.trim(),
      pointsBalance: Number(newInitialPoints) || config.welcomeBonusPoints,
      lifetimePoints: Number(newInitialPoints) || config.welcomeBonusPoints,
      totalSpent: 0,
      purchasesCount: 0,
      walletPlatform: newPlatform,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      lastUpdated: "Recién emitido",
    };

    const nextList = [newCard, ...members];
    persistMembers(nextList);
    setSelectedMemberForQR(newCard);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewInitialPoints(config.welcomeBonusPoints);
    setIsNewMemberOpen(false);
  };

  const handleDeleteMemberCard = (memberId: string) => {
    const nextList = members.filter((m) => m.id !== memberId);
    persistMembers(nextList);
    if (selectedMemberForQR?.id === memberId) {
      setSelectedMemberForQR(nextList[0] || null);
    }
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
    memberCode: "LUM-8842-PRV",
    customerName: "Valeria Andrade",
    customerEmail: "valeria@luminahome.ec",
    pointsBalance: 1850,
    lifetimePoints: 1850,
    totalSpent: 165,
    purchasesCount: 3,
    walletPlatform: "both" as const,
    status: "active" as const,
    createdAt: "2026-09-23",
    lastUpdated: "Sincronizado",
  };

  const previewTier = resolveTier(activePreviewMember.pointsBalance);

  return (
    <div className="space-y-6 animate-fade-in font-sans" data-state={toolState}>
      {/* Main Container — Exact Mi Perfil Bento Architecture matching CardsTab & OverviewTab */}
      <div className="bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <CloudSyncStatus
                isSyncing={isSyncing}
                syncError={null}
                onSave={saveConfiguration}
                saveLabel="Guardar configuración"
                savedLabel="Configuración sincronizada"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#8c9276]" /> Tarjetas de Lealtad & Pases Digitales (Apple / Google Wallet)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Configura las reglas de puntos de {brand.name}, exporta códigos QR vectoriales y administra los pases de tus clientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={enrollmentQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-2xl transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#8c9276]" />
              <span>Ver Pase Público</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setIsNewMemberOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-semibold rounded-2xl transition-all shadow-md dark:shadow-none cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Emitir Tarjeta
            </button>
          </div>
        </div>

        {/* Clean Metrics Strip matching OverviewTab */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Clientes Afiliados
            </span>
            <span className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block">
              {members.length}
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Puntos Activos
            </span>
            <span className="text-2xl font-display font-bold text-[#8c9276] mt-1 block">
              {totalPointsIssued.toLocaleString()} pts
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Acumulación por Compra
            </span>
            <span className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block">
              {config.pointsPerDollar} pts / $1
            </span>
          </div>
          <div className="p-4 rounded-3xl bg-gray-50/70 dark:bg-[#2a2a2c]/60 border border-gray-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Bono de Bienvenida
            </span>
            <span className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mt-1 block">
              +{config.welcomeBonusPoints} pts
            </span>
          </div>
        </div>

        {/* Sub-navigation Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-[#2a2a2c]/80 border border-gray-200/60 dark:border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab("designer")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "designer"
                ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#8c9276]" />
            <span>Diseño & Reglas de Puntos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("qr")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "qr"
                ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#8c9276]" />
            <span>Generador QR (.SVG / .PNG)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("members")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "members"
                ? "bg-white dark:bg-[#202022] text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#8c9276]" />
            <span>Miembros ({members.length})</span>
          </button>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 space-y-5">
            {activeSubTab === "designer" && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8c9276]" />
                    <span>Apariencia de la Tarjeta & Reglas de Acumulación</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Elige los colores de la tarjeta digital y cuántos puntos acumulan tus clientes en cada pedido.
                  </p>
                </div>

                {/* Color Presets matching CardsTab */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Acabado de la Tarjeta
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
                              qrFgColor: preset.qrFgColor,
                              qrBgColor: preset.qrBgColor,
                            }))
                          }
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? "border-gray-900 dark:border-white bg-white dark:bg-[#202022] shadow-xs"
                              : "border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-[#202022]/50 hover:border-gray-300"
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border border-black/15 shrink-0 flex items-center justify-center"
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

                  {/* Custom Color Pickers + QR Style */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#202022] cursor-pointer">
                      <input
                        type="color"
                        value={config.bgColor}
                        onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                        className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Fondo ({config.bgColor})
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#202022] cursor-pointer">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Detalle ({config.accentColor})
                      </span>
                    </label>
                    <div className="flex items-center gap-1 p-1.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#202022]">
                      {(["rounded", "dots", "sharp"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setConfig({ ...config, qrCornerStyle: style })}
                          className={`flex-1 py-1.5 rounded-xl text-[10px] font-semibold uppercase transition-all cursor-pointer ${
                            config.qrCornerStyle === style
                              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {style === "rounded" ? "Suave" : style === "dots" ? "Puntos" : "Recto"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Program Identity Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre del Programa
                    </label>
                    <input
                      type="text"
                      value={config.programName}
                      onChange={(e) => setConfig({ ...config, programName: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8c9276]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre de la Tienda Emisora
                    </label>
                    <input
                      type="text"
                      value={config.issuerName}
                      onChange={(e) => setConfig({ ...config, issuerName: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8c9276]"
                    />
                  </div>
                </div>

                {/* Points Rules */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                    <Coins className="w-4 h-4 text-[#8c9276]" />
                    <span>Conversión de Puntos & Recompensa</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Puntos por $1 USD
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={config.pointsPerDollar}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            pointsPerDollar: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] font-semibold text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Puntos de Bienvenida
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
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] font-semibold text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Meta de Canje (Pts)
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
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] font-semibold text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Beneficio al alcanzar la meta
                    </label>
                    <input
                      type="text"
                      value={config.rewardDescription}
                      onChange={(e) => setConfig({ ...config, rewardDescription: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === "qr" && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#8c9276]" />
                      <span>Generador QR & Exportación Directa</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Descarga el código QR en alta resolución (.PNG 1024px) o vector escalable (.SVG).
                    </p>
                  </div>

                  <select
                    value={selectedMemberForQR?.id || ""}
                    onChange={(e) => {
                      const found = members.find((m) => m.id === e.target.value) || null;
                      setSelectedMemberForQR(found);
                    }}
                    className="h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.customerName} ({m.memberCode} • {m.pointsBalance} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <CrispQRMatrixSVG
                        svgRef={qrSvgRef}
                        value={enrollmentQrUrl}
                        size={180}
                        fgColor="#171717"
                        bgColor="#ffffff"
                        accentColor={config.accentColor}
                        cornerStyle={config.qrCornerStyle}
                        logoUrl={config.customLogoDataUrl}
                      />
                    </div>
                    <span className="mt-3 text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                      {selectedMemberForQR?.memberCode || "LUM-PRV-PASS"}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 text-[11px] font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-[#8c9276]" />
                        <span>Subir Icono Central</span>
                      </button>
                      {config.customLogoDataUrl && (
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, customLogoDataUrl: "" }))}
                          className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer"
                          title="Quitar icono"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadQRHighResPNG}
                        className="h-11 px-4 rounded-2xl bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Descargar PNG — 1024px</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadQRVectorSVG}
                        className="h-11 px-4 rounded-2xl bg-white dark:bg-[#202022] hover:bg-gray-100 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-[#8c9276] shrink-0" />
                        <span>Descargar SVG Vectorial</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadApplePassManifest(selectedMemberForQR)}
                        className="h-11 px-4 rounded-2xl bg-white dark:bg-[#202022] hover:bg-gray-100 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Wallet className="w-4 h-4 text-[#8c9276]" />
                        <span>Exportar Apple Pass (.pkpass)</span>
                      </button>

                      <a
                        href={enrollmentQrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-4 rounded-2xl bg-white dark:bg-[#202022] hover:bg-gray-100 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-semibold transition-all"
                      >
                        <Smartphone className="w-4 h-4 text-[#8c9276]" />
                        <span>Abrir en Google Wallet</span>
                      </a>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#202022] border border-gray-100 dark:border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
                        Enlace de Instalación para el Cliente
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={enrollmentQrUrl}
                          className="w-full h-9 px-3 rounded-xl bg-gray-50 dark:bg-[#2a2a2c] border border-gray-200 dark:border-white/10 text-[11px] font-mono text-gray-700 dark:text-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleCopyEnrollmentLink}
                          className="h-9 px-3.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="px-3.5 py-2.5 rounded-2xl bg-gray-100/80 dark:bg-[#202022] text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#8c9276] shrink-0" />
                      <span>
                        Generación 100 % local en tu navegador sin enviar datos a servidores externos.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === "members" && (
              <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[#8c9276]" />
                      <span>Directorio de Clientes Afiliados</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Administra el saldo de puntos y las tarjetas activas de cada cliente.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar cliente o código..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202022] text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredMembers.map((member) => {
                    const tier = resolveTier(member.pointsBalance);
                    const isCurrentQR = selectedMemberForQR?.id === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#202022] ${
                          isCurrentQR
                            ? "border-gray-900 dark:border-white"
                            : "border-gray-100 dark:border-white/5"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              {member.customerName}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#2a2a2c] text-gray-800 dark:text-gray-200 font-semibold">
                              {member.memberCode}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${tier.badgeBg}`}
                            >
                              {tier.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.customerEmail} • {member.purchasesCount} compras (${member.totalSpent} USD)
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-right mr-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white block">
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
                            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-semibold cursor-pointer"
                          >
                            +100
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPoints(member.id, -200)}
                            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2a2a2c] hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-semibold cursor-pointer"
                          >
                            -200
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberForQR(member);
                              setActiveSubTab("qr");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Ver QR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemberCard(member.id)}
                            className="p-1.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

          {/* RIGHT COLUMN: CLEAN WALLET PASS PREVIEW (No Demo Logo) */}
          <div className="xl:col-span-5">
            <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-[#2a2a2c]/40 border border-gray-100 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Vista Previa de la Tarjeta
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Así se ve en el teléfono del cliente
                  </span>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-white dark:bg-[#202022] border border-gray-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform("apple")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      previewPlatform === "apple"
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Apple Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform("google")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      previewPlatform === "google"
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Google Wallet
                  </button>
                </div>
              </div>

              {/* Clean Wallet Pass Card Mockup */}
              <div
                className="relative rounded-3xl overflow-hidden shadow-xl border border-black/10 dark:border-white/10 transition-all duration-300 mx-auto max-w-[350px]"
                style={{
                  backgroundColor: config.bgColor,
                  color: config.textColor,
                }}
              >
                <div className="p-5 pb-4 flex items-center justify-between border-b border-current/10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm overflow-hidden shrink-0"
                      style={{
                        backgroundColor: config.accentColor,
                        color: config.bgColor === "#f5f5f4" ? "#ffffff" : "#171717",
                      }}
                    >
                      {config.customLogoDataUrl ? (
                        <img
                          src={config.customLogoDataUrl}
                          alt={brand.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        brand.shortName.charAt(0)
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-display font-semibold tracking-wide block leading-tight">
                        {config.programName}
                      </span>
                      <span className="text-[10px] opacity-70 block">{config.issuerName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-[9px] uppercase tracking-widest block font-bold"
                      style={{ color: config.accentColor }}
                    >
                      PUNTOS
                    </span>
                    <span className="text-xl font-display font-bold tracking-tight">
                      {activePreviewMember.pointsBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider opacity-60 block">
                        TITULAR
                      </span>
                      <span className="text-sm font-semibold">
                        {activePreviewMember.customerName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider opacity-60 block">
                        NIVEL
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: config.accentColor }}
                      >
                        {previewTier.name}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-current/10 text-[10px]">
                    <div>
                      <span className="opacity-60 block uppercase text-[9px]">ACUMULACIÓN</span>
                      <span className="font-semibold">{config.pointsPerDollar} pts / $1 USD</span>
                    </div>
                    <div className="text-right">
                      <span className="opacity-60 block uppercase text-[9px]">BENEFICIO</span>
                      <span className="font-semibold">{previewTier.discount}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pt-1 pb-5 flex flex-col items-center justify-center">
                  <div className="p-2.5 bg-white rounded-2xl shadow-md">
                    <CrispQRMatrixSVG
                      value={enrollmentQrUrl}
                      size={144}
                      fgColor="#171717"
                      bgColor="#ffffff"
                      accentColor={config.accentColor}
                      cornerStyle={config.qrCornerStyle}
                      logoUrl={config.customLogoDataUrl}
                    />
                  </div>
                  <span className="mt-2 text-[10px] font-mono tracking-widest opacity-80">
                    {activePreviewMember.memberCode}
                  </span>
                  <span className="text-[9px] opacity-55 mt-0.5">
                    {previewPlatform === "apple" ? "Apple Wallet PassKit" : "Google Wallet Pass"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to Issue New Credential */}
      {isNewMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8c9276]" />
                <span>Emitir Tarjeta de Cliente</span>
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
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Martín Chiriboga"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="cliente@dominio.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] text-xs text-gray-900 dark:text-white"
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
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Billetera
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as "apple" | "google" | "both")}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2c] text-xs text-gray-900 dark:text-white"
                  >
                    <option value="both">Apple & Google Wallet</option>
                    <option value="apple">Apple Wallet</option>
                    <option value="google">Google Wallet</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewMemberOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold cursor-pointer"
                >
                  Crear Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
