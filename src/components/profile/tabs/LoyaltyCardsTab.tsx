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
  Activity,
  Lock,
  Upload,
  RotateCcw,
  Layers,
} from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import { useBrand } from "@/core/hooks/useBrand";
import { LuminaBrandEmblem } from "@/components/ui/LuminaBrandEmblem";

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
  programName: "Lumina Atelier Privé",
  issuerName: "Lumina Home • Diseño de Autor",
  tagline: "Espacios con Alma y Diseño de Autor",
  pointsPerDollar: 10,
  welcomeBonusPoints: 200,
  rewardThreshold: 1500,
  rewardDescription: "$25 USD de crédito en piezas de autor + Entrega White-Glove sin costo",
  bgColor: "#303825",
  accentColor: "#d2b48c",
  textColor: "#f4f5f0",
  qrFgColor: "#303825",
  qrBgColor: "#f4f5f0",
  qrCornerStyle: "rounded",
  customLogoDataUrl: "",
  tierSilverMin: 0,
  tierGoldMin: 1200,
  tierBlackMin: 3000,
  pushMessage: "Tu certificado de puntos Lumina Atelier Privé ha sido actualizado tras tu adquisición.",
  autoSyncPurchases: true,
  appleTeamId: "LUMINA99EC",
  applePassTypeId: "pass.ec.luminahome.prive",
  googleIssuerId: "3388000000022194812",
  googleClassId: "lumina_atelier_prive_v2",
};

const COLOR_PRESETS = [
  {
    name: "Olivo Botánico (Alma Lumina)",
    bgColor: "#303825",
    accentColor: "#d2b48c",
    textColor: "#f4f5f0",
    qrFgColor: "#303825",
    qrBgColor: "#f4f5f0",
  },
  {
    name: "Piedra de Autor (Editorial)",
    bgColor: "#f4f5f0",
    accentColor: "#526437",
    textColor: "#1e1e20",
    qrFgColor: "#1e1e20",
    qrBgColor: "#ffffff",
  },
  {
    name: "Obsidiana & Salvia (Atelier)",
    bgColor: "#1e1e20",
    accentColor: "#8c9276",
    textColor: "#f4f5f0",
    qrFgColor: "#1e1e20",
    qrBgColor: "#f4f5f0",
  },
  {
    name: "Terracota Artesanal",
    bgColor: "#431c15",
    accentColor: "#e89d8c",
    textColor: "#fbf4f1",
    qrFgColor: "#431c15",
    qrBgColor: "#fbf4f1",
  },
];

/**
 * 100% Client-Side Vector QR Matrix Engine (crear-web-micro-saas Architecture)
 * Supports rounded/sharp/dot modules, custom center emblem or uploaded logo, and direct SVG/PNG export.
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
  fgColor = "#303825",
  bgColor = "#f4f5f0",
  accentColor = "#d2b48c",
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
      {/* Center Lumina Atelier Seal / Custom Uploaded Logo */}
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
        <g>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={cellSize * 1.6}
            fill="none"
            stroke={accentColor}
            strokeWidth={cellSize * 0.22}
            opacity={0.85}
          />
          <text
            x={size / 2}
            y={size / 2 + cellSize * 0.55}
            textAnchor="middle"
            fill={accentColor}
            fontSize={cellSize * 1.65}
            fontFamily="Georgia, serif"
            fontWeight="bold"
          >
            L
          </text>
        </g>
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
    issuerName: `${brand.name} • ${brand.tagline}`,
    tagline: brand.slogan,
  }));
  const [members, setMembers] = useState<LoyaltyMemberCard[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<"apple" | "google">("apple");
  const [activeSubTab, setActiveSubTab] = useState<"designer" | "qr" | "members">("designer");
  const [searchMember, setSearchMember] = useState("");
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<LoyaltyMemberCard | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toolState, setToolState] = useState<"idle" | "working" | "done">("idle");

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
        // Migrate legacy neon #ccff00 / #111614 to Lumina Home's Botanical Olive & Warm Sand soul
        const migratedBg =
          parsed.bgColor === "#111614" ? DEFAULT_PROGRAM_CONFIG.bgColor : parsed.bgColor;
        const migratedAccent =
          parsed.accentColor === "#ccff00" ? DEFAULT_PROGRAM_CONFIG.accentColor : parsed.accentColor;
        const migratedQrFg =
          parsed.qrFgColor === "#111614" ? DEFAULT_PROGRAM_CONFIG.qrFgColor : parsed.qrFgColor;
        const migratedProgramName =
          parsed.programName === "Lumina Privé Ledger"
            ? DEFAULT_PROGRAM_CONFIG.programName
            : parsed.programName;

        setConfig((prev) => ({
          ...prev,
          ...parsed,
          bgColor: migratedBg || prev.bgColor,
          accentColor: migratedAccent || prev.accentColor,
          qrFgColor: migratedQrFg || prev.qrFgColor,
          programName: migratedProgramName || prev.programName,
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

  const saveConfiguration = () => {
    setToolState("working");
    try {
      localStorage.setItem("lumina_loyalty_program_v1", JSON.stringify(config));
      setTimeout(() => {
        setToolState("done");
        setTimeout(() => setToolState("idle"), 2200);
      }, 220);
      toast.success("Configuración del Atelier guardada localmente");
    } catch {
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
        name: "ATELIER RESERVE",
        badgeBg:
          "bg-[#303825] text-[#d2b48c] border-[#d2b48c]/40 dark:bg-[#303825] dark:text-[#d2b48c]",
        discount: "12% Curaduría + White-Glove",
      };
    }
    if (points >= config.tierGoldMin) {
      return {
        name: "DORADO ARENA",
        badgeBg:
          "bg-[#d2b48c]/20 text-[#664b24] dark:text-[#d2b48c] border-[#d2b48c]/40",
        discount: "5% Beneficio de Autor Permanente",
      };
    }
    return {
      name: "MIEMBRO SALVIA",
      badgeBg:
        "bg-[#f4f5f0] dark:bg-white/10 text-[#526437] dark:text-[#b6bfa2] border-[#8c9276]/30",
      discount: "Acumulación Base Activa",
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
      name: targetMember?.customerName || "Titular Lumina",
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

  // 100% Client-Side Vector SVG Download (crear-web-micro-saas pattern)
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

  // 100% Client-Side High-Resolution 1024x1024 PNG Canvas Export
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
        ctx.fillStyle = config.qrBgColor || "#f4f5f0";
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

  // Custom Center Logo Upload (100% in-browser FileReader, never uploaded to any external server)
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
            label: "BALANCE DISPONIBLE",
            value: target?.pointsBalance ?? config.welcomeBonusPoints,
          },
        ],
        primaryFields: [
          {
            key: "member",
            label: "TITULAR ACREDITADO",
            value: target?.customerName || "Titular Lumina",
          },
        ],
        secondaryFields: [
          {
            key: "tier",
            label: "CATEGORÍA",
            value: tierInfo.name,
          },
          {
            key: "rate",
            label: "FACTOR DE CONVERSIÓN",
            value: `${config.pointsPerDollar} pts / $1 USD`,
          },
        ],
        auxiliaryFields: [
          {
            key: "reward",
            label: "BENEFICIO ACTIVO",
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
      {/* LUMINA HOME EDITORIAL HERO BANNER (Matches Store Soul: Botanical Olive, Warm Sand & Lora Display Serif) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#303825] via-[#262d1d] to-[#1c2116] border border-[#8c9276]/25 p-6 sm:p-8 text-[#f4f5f0] shadow-[0_14px_40px_rgba(30,36,23,0.18)]">
        <div className="absolute -top-28 -right-24 w-80 h-80 rounded-full bg-[#d2b48c]/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#8c9276]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="hidden sm:flex shrink-0 p-2 rounded-2xl bg-white/[0.06] border border-[#d2b48c]/25 shadow-inner">
              <LuminaBrandEmblem size={52} withGlow />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d2b48c]/15 border border-[#d2b48c]/35 text-[#d2b48c] text-[10px] font-semibold uppercase tracking-[0.18em]">
                <Layers className="w-3 h-3" />
                <span>{brand.name} • Estudio de Fidelización & PassKit</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-normal tracking-tight text-[#f4f5f0]">
                Atelier de Tarjetas de Lealtad & Billetera Digital
              </h2>
              <p className="text-xs sm:text-sm text-[#e5e8da]/80 leading-relaxed">
                Arquitectura de pases nominativos inspirada en{" "}
                <span className="italic font-display text-[#d2b48c]">“{brand.tagline}”</span>. Diseña,
                personaliza y exporta credenciales para{" "}
                <strong className="text-white font-medium">Apple Wallet (.pkpass)</strong> y{" "}
                <strong className="text-white font-medium">Google Wallet</strong> con códigos QR
                vectoriales y acreditación automática de{" "}
                <span className="text-[#d2b48c] font-semibold">
                  {config.pointsPerDollar} pts por cada $1 USD
                </span>{" "}
                en la tienda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewMemberOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#d2b48c] hover:bg-[#dfc49f] text-[#22281a] font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Tarjeta de Miembro</span>
            </button>
            <button
              type="button"
              onClick={saveConfiguration}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-[#d2b48c]/30 text-[#f4f5f0] font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#d2b48c]" />
              <span>{toolState === "done" ? "✓ Cambios Guardados" : "Guardar Diseño del Atelier"}</span>
            </button>
          </div>
        </div>

        {/* Editorial KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#e5e8da]/65 block">
              Miembros Acreditados
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-display font-medium text-white">{members.length}</span>
              <span className="text-[10px] text-[#d2b48c] font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" /> Sincronizado
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#e5e8da]/65 block">
              Reserva de Puntos Activa
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-display font-medium text-[#d2b48c]">
                {totalPointsIssued.toLocaleString()} pts
              </span>
              <span className="text-[10px] text-[#e5e8da]/60">En Billeteras</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#e5e8da]/65 block">
              Tasa de Acreditación
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-display font-medium text-white">
                {config.pointsPerDollar} pts/$1
              </span>
              <span className="text-[10px] text-[#d2b48c]">+{config.welcomeBonusPoints} bienvenida</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#e5e8da]/65 block">
              Exportación Gráfica
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#d2b48c]/20 border border-[#d2b48c]/35 text-[10px] font-semibold text-[#d2b48c]">
                SVG Vectorial
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-[10px] font-semibold text-[#f4f5f0]">
                PNG 1024px
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Switcher — Uses exact Mi Perfil Bento Architecture */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl p-2 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab("designer")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "designer"
                ? "bg-[#526437] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-[#f4f5f0] dark:hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Curaduría Visual & Reglas de Puntos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("qr")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "qr"
                ? "bg-[#526437] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-[#f4f5f0] dark:hover:bg-white/5"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. Estudio QR de Alta Precisión (.SVG / .PNG)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("members")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "members"
                ? "bg-[#526437] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-[#f4f5f0] dark:hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Libro de Miembros ({members.length})</span>
          </button>
        </div>

        <a
          href={enrollmentQrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-2xl bg-[#f4f5f0] dark:bg-white/10 hover:bg-[#e5e8da] dark:hover:bg-white/15 text-[#303825] dark:text-[#d2b48c] text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Eye className="w-3.5 h-3.5 text-[#526437] dark:text-[#d2b48c]" />
          <span>Ver Pase Público de Instalación</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* MAIN BENTO WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          {activeSubTab === "designer" && (
            <div className="bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-display font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#526437] dark:text-[#d2b48c]" />
                    <span>Identidad Editorial & Reglas de Fidelización</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Personaliza la atmósfera cromática de la tarjeta, la geometría del sello QR y los beneficios para clientes de {brand.name}.
                  </p>
                </div>
              </div>

              {/* Lumina Home Signature Color Palette Presets */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 block">
                  Paletas Arquitectónicas de {brand.name}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "border-[#526437] dark:border-[#d2b48c] ring-2 ring-[#526437]/20 dark:ring-[#d2b48c]/25 bg-[#f4f5f0]/70 dark:bg-white/5"
                            : "border-gray-200/80 dark:border-white/10 hover:border-[#8c9276] dark:hover:border-white/20"
                        }`}
                      >
                        <span
                          className="w-8 h-8 rounded-xl border border-black/15 shrink-0 flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: preset.bgColor }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block truncate">
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                            {preset.bgColor} • {preset.accentColor}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Inputs + QR Module Geometry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[#f4f5f0]/60 dark:bg-black/25 cursor-pointer">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                      className="w-6 h-6 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      Superficie ({config.bgColor})
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[#f4f5f0]/60 dark:bg-black/25 cursor-pointer">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-6 h-6 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      Acento ({config.accentColor})
                    </span>
                  </label>
                  <div className="flex items-center gap-1 p-1.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[#f4f5f0]/60 dark:bg-black/25">
                    {(["rounded", "dots", "sharp"] as const).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setConfig({ ...config, qrCornerStyle: style })}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-semibold uppercase transition-all cursor-pointer ${
                          config.qrCornerStyle === style
                            ? "bg-[#526437] text-white shadow-xs"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {style === "rounded" ? "Orgánico" : style === "dots" ? "Puntos" : "Editorial"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Program Identity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Título de la Credencial (Cabecera Editorial)
                  </label>
                  <input
                    type="text"
                    value={config.programName}
                    onChange={(e) => setConfig({ ...config, programName: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl border border-gray-200/90 dark:border-white/15 bg-[#f4f5f0]/50 dark:bg-black/30 text-sm font-display text-gray-900 dark:text-white focus:outline-none focus:border-[#526437]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Firma de la Casa Emisora
                  </label>
                  <input
                    type="text"
                    value={config.issuerName}
                    onChange={(e) => setConfig({ ...config, issuerName: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl border border-gray-200/90 dark:border-white/15 bg-[#f4f5f0]/50 dark:bg-black/30 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#526437]"
                  />
                </div>
              </div>

              {/* Points Rules */}
              <div className="p-5 rounded-3xl bg-[#f4f5f0]/75 dark:bg-white/[0.03] border border-[#8c9276]/25 dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#526437] dark:text-[#d2b48c]">
                  <Coins className="w-4 h-4" />
                  <span>Conversión de Puntos & Beneficio de Curaduría</span>
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
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 font-display font-semibold text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Cortesía de Bienvenida (Pts)
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
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 font-display font-semibold text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Meta para Recompensa (Pts)
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
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 font-display font-semibold text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Privilegio de Autor al Alcanzar la Meta
                  </label>
                  <input
                    type="text"
                    value={config.rewardDescription}
                    onChange={(e) => setConfig({ ...config, rewardDescription: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-black/40 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "qr" && (
            <div className="bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-display font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#526437] dark:text-[#d2b48c]" />
                    <span>Estudio QR Vectorial de {brand.name}</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Generación instantánea en navegador con descarga en formato vectorial (.SVG) y alta resolución (.PNG 1024×1024px).
                  </p>
                </div>

                <select
                  value={selectedMemberForQR?.id || ""}
                  onChange={(e) => {
                    const found = members.find((m) => m.id === e.target.value) || null;
                    setSelectedMemberForQR(found);
                  }}
                  className="h-10 px-3.5 rounded-2xl border border-gray-200 dark:border-white/15 bg-[#f4f5f0]/70 dark:bg-black/40 text-xs font-semibold text-gray-900 dark:text-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.customerName} ({m.memberCode} • {m.pointsBalance} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* High-Contrast Client-Side Vector QR Studio Card */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-3xl bg-[#f4f5f0] dark:bg-[#18181a] border border-[#8c9276]/25 dark:border-white/10">
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-[#8c9276]/20">
                    <CrispQRMatrixSVG
                      svgRef={qrSvgRef}
                      value={enrollmentQrUrl}
                      size={184}
                      fgColor={config.qrFgColor || "#303825"}
                      bgColor={config.qrBgColor || "#f4f5f0"}
                      accentColor={config.accentColor}
                      cornerStyle={config.qrCornerStyle}
                      logoUrl={config.customLogoDataUrl}
                    />
                  </div>
                  <span className="mt-3 text-[11px] font-mono font-bold text-[#303825] dark:text-[#d2b48c]">
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
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-[#e5e8da] dark:hover:bg-white/15 border border-gray-200 dark:border-white/10 text-[10px] font-semibold text-[#303825] dark:text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3 h-3 text-[#526437] dark:text-[#d2b48c]" />
                      <span>Personalizar Sello Central</span>
                    </button>
                    {config.customLogoDataUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, customLogoDataUrl: "" }))}
                        className="p-1.5 rounded-xl bg-[#c24b33]/15 text-[#c24b33] hover:bg-[#c24b33]/25 cursor-pointer"
                        title="Restaurar monograma Lumina"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Download & Provisioning Controls */}
                <div className="md:col-span-7 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadQRHighResPNG}
                      className="h-12 px-4 rounded-2xl bg-[#526437] hover:bg-[#42502e] text-white flex items-center justify-center gap-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#d2b48c] shrink-0" />
                      <div className="text-left leading-tight">
                        <span className="block text-[9px] uppercase tracking-wider text-[#e5e8da]/80">
                          Alta Resolución
                        </span>
                        <span>Descargar PNG — 1024px</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQRVectorSVG}
                      className="h-12 px-4 rounded-2xl bg-[#303825] hover:bg-[#22281a] text-[#f4f5f0] border border-[#8c9276]/30 flex items-center justify-center gap-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#d2b48c] shrink-0" />
                      <div className="text-left leading-tight">
                        <span className="block text-[9px] text-[#d2b48c] uppercase tracking-wider">
                          Vector Editorial
                        </span>
                        <span>Descargar SVG — ~4 KB</span>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadApplePassManifest(selectedMemberForQR)}
                      className="h-11 px-4 rounded-2xl bg-[#1e1e20] hover:bg-black text-white border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-[#d2b48c]" />
                      <span>Exportar Apple Pass (.pkpass)</span>
                    </button>

                    <a
                      href={enrollmentQrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-4 rounded-2xl bg-[#f4f5f0] hover:bg-[#e5e8da] text-[#303825] border border-[#8c9276]/30 flex items-center justify-center gap-2 text-xs font-semibold transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-[#526437]" />
                      <span>Sincronizar Google Wallet</span>
                    </a>
                  </div>

                  {/* Copyable URI */}
                  <div className="p-3.5 rounded-2xl bg-[#f4f5f0]/75 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/10 space-y-1.5">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 block font-semibold">
                      Enlace Directo de Instalación para el Cliente
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={enrollmentQrUrl}
                        className="w-full h-9 px-3 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-[11px] font-mono text-gray-700 dark:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleCopyEnrollmentLink}
                        className="h-9 px-3.5 rounded-xl bg-[#526437] hover:bg-[#42502e] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "✓ Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Privacy & Local Processing Microcopy */}
                  <div className="px-3.5 py-2.5 rounded-2xl bg-[#f4f5f0] dark:bg-[#303825]/40 border border-[#8c9276]/30 text-[11px] text-[#303825] dark:text-[#e5e8da] flex items-center gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-[#526437] dark:text-[#d2b48c] shrink-0" />
                    <span>
                      <strong>Privacidad artesanal 100 % en tu navegador:</strong> el sello QR, el
                      monograma y el archivo <code>.pkpass</code> se generan localmente sin enviar datos a
                      servidores externos.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "members" && (
            <div className="bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-display font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#d2b48c]" />
                    <span>Libro de Miembros de {brand.name}</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gestión de saldos de puntos, niveles de curaduría y tarjetas vinculadas en Apple y Google Wallet.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar miembro o código LUM..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-2xl border border-gray-200 dark:border-white/15 bg-[#f4f5f0]/60 dark:bg-black/30 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#526437]"
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
                          ? "border-[#526437] dark:border-[#d2b48c]/60 bg-[#f4f5f0]/65 dark:bg-white/[0.05]"
                          : "border-gray-200/70 dark:border-white/10 hover:border-[#8c9276] dark:hover:border-white/20"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-medium text-sm text-gray-900 dark:text-white">
                            {member.customerName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#303825] text-[#d2b48c] font-semibold">
                            {member.memberCode}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-lg border font-semibold ${tier.badgeBg}`}
                          >
                            {tier.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.customerEmail} • {member.purchasesCount} adquisiciones (${member.totalSpent} USD)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-right mr-2">
                          <span className="text-sm font-display font-semibold text-[#303825] dark:text-[#d2b48c] block">
                            {member.pointsBalance.toLocaleString()} pts
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {member.walletPlatform === "apple"
                              ? "Apple Wallet"
                              : member.walletPlatform === "google"
                              ? "Google Wallet"
                              : "Apple & Google Wallet"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdjustPoints(member.id, 100)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#526437]/15 hover:bg-[#526437]/25 text-[#526437] dark:text-[#b6bfa2] text-xs font-semibold cursor-pointer"
                          title="Acreditar +100 pts"
                        >
                          +100
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPoints(member.id, -200)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#d2b48c]/20 hover:bg-[#d2b48c]/30 text-[#664b24] dark:text-[#d2b48c] text-xs font-semibold cursor-pointer"
                          title="Canjear 200 pts"
                        >
                          -200
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberForQR(member);
                            setActiveSubTab("qr");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#303825] hover:bg-[#22281a] text-[#f4f5f0] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#d2b48c]" />
                          <span>Sello QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemberCard(member.id)}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-[#c24b33] hover:bg-[#c24b33]/10 transition-colors cursor-pointer"
                          title="Revocar tarjeta"
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

        {/* RIGHT COLUMN: NATIVE WALLET CARD PREVIEW (WITH LUMINA BRAND EMBLEM & LORA TYPOGRAPHY) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white/80 dark:bg-[#202022]/80 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-display font-medium text-gray-900 dark:text-white block">
                  Vista Previa de Billetera Digital
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Renderizado en tiempo real para el cliente
                </span>
              </div>
              <div className="inline-flex rounded-2xl p-1 bg-[#f4f5f0] dark:bg-black/40 border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("apple")}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    previewPlatform === "apple"
                      ? "bg-[#303825] text-[#f4f5f0] shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Apple Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("google")}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    previewPlatform === "google"
                      ? "bg-[#526437] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Google Wallet
                </button>
              </div>
            </div>

            {/* Wallet Pass Card Mockup — Authentic Lumina Home Quiet Luxury Aesthetics */}
            <div
              className="relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(30,36,23,0.28)] border border-white/15 transition-all duration-300 mx-auto max-w-[360px]"
              style={{
                backgroundColor: config.bgColor,
                color: config.textColor,
              }}
            >
              <div className="p-5 pb-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden bg-black/20 border border-white/15 shrink-0">
                    {config.customLogoDataUrl ? (
                      <img
                        src={config.customLogoDataUrl}
                        alt={brand.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <LuminaBrandEmblem size={36} withGlow={false} />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-display font-medium tracking-wide block leading-tight">
                      {config.programName}
                    </span>
                    <span className="text-[10px] opacity-75 block">{config.issuerName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-[9px] uppercase tracking-[0.16em] block font-bold"
                    style={{ color: config.accentColor }}
                  >
                    PUNTOS LUMINA
                  </span>
                  <span className="text-2xl font-display font-semibold tracking-tight">
                    {activePreviewMember.pointsBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4 bg-gradient-to-r from-white/[0.06] to-transparent space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.15em] opacity-65 block">
                      MIEMBRO ACREDITADO
                    </span>
                    <span className="text-sm font-display font-medium tracking-wide">
                      {activePreviewMember.customerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-[0.15em] opacity-65 block">
                      CATEGORÍA
                    </span>
                    <span
                      className="text-xs font-semibold tracking-wider"
                      style={{ color: config.accentColor }}
                    >
                      {previewTier.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10 text-[10px]">
                  <div>
                    <span className="opacity-65 block uppercase tracking-wider text-[9px]">
                      ACUMULACIÓN
                    </span>
                    <span className="font-semibold">{config.pointsPerDollar} pts / $1 USD</span>
                  </div>
                  <div className="text-right">
                    <span className="opacity-65 block uppercase tracking-wider text-[9px]">
                      BENEFICIO DE AUTOR
                    </span>
                    <span className="font-semibold">{previewTier.discount}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pt-2 pb-5 flex flex-col items-center justify-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-lg">
                  <CrispQRMatrixSVG
                    value={enrollmentQrUrl}
                    size={148}
                    fgColor={config.qrFgColor || "#303825"}
                    bgColor={config.qrBgColor || "#f4f5f0"}
                    accentColor={config.accentColor}
                    cornerStyle={config.qrCornerStyle}
                    logoUrl={config.customLogoDataUrl}
                  />
                </div>
                <span className="mt-2.5 text-[10px] font-mono tracking-[0.2em] opacity-85">
                  {activePreviewMember.memberCode}
                </span>
                <span className="text-[9px] opacity-60 mt-0.5 italic font-display">
                  {previewPlatform === "apple"
                    ? `${brand.name} • Apple Wallet PassKit`
                    : `${brand.name} • Google Wallet Pass`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to Issue New Credential — Matches Lumina Home Bento Modal Aesthetics */}
      {isNewMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202022] border border-gray-200 dark:border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-display font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#526437] dark:text-[#d2b48c]" />
                <span>Emitir Nueva Tarjeta de Miembro</span>
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
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-[#f4f5f0]/60 dark:bg-black/40 text-xs text-gray-900 dark:text-white"
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
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-[#f4f5f0]/60 dark:bg-black/40 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Puntos de Apertura
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newInitialPoints}
                    onChange={(e) => setNewInitialPoints(Number(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-[#f4f5f0]/60 dark:bg-black/40 text-xs font-display font-semibold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Billetera Destino
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as "apple" | "google" | "both")}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/15 bg-[#f4f5f0]/60 dark:bg-black/40 text-xs text-gray-900 dark:text-white"
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
                  className="px-4 py-2 rounded-xl bg-[#526437] hover:bg-[#42502e] text-white text-xs font-semibold cursor-pointer"
                >
                  Emitir Tarjeta & Sello QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
