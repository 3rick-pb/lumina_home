/**
 * exportNicheExcel.ts
 *
 * Generates a professional Excel report for inventory grouped by niche with:
 *  - Sheet 1: "Inventario por Nicho" — styled data table with totals
 *  - Sheet 2: "Dashboard Inventario" — 4 embedded charts as HD images
 */

import ExcelJS from "exceljs";
import { CatalogProduct } from "@/lib/catalogStore";
import { renderChartToBase64, CHART_COLORS } from "@/lib/excelChartRenderer";

// ─── Brand Constants ───────────────────────────────────────────────
const ORANGE = "FFFF5900";
const DARK = "FF18181B";
const WHITE = "FFFFFFFF";
const ZEBRA_LIGHT = "FFFFF7ED";
const LIGHT_GRAY = "FFF4F4F5";

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 11,
  bold: true,
  color: { argb: WHITE },
};

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: ORANGE },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE5E5E5" } },
  left: { style: "thin", color: { argb: "FFE5E5E5" } },
  bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
  right: { style: "thin", color: { argb: "FFE5E5E5" } },
};

// ─── Column definitions ────────────────────────────────────────────
const COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: "Nº", key: "num", width: 6 },
  { header: "Nicho / Colección", key: "niche", width: 24 },
  { header: "Variedad Productos", key: "variety", width: 18 },
  { header: "% del Catálogo", key: "percent", width: 14 },
  { header: "Stock Total (Unidades)", key: "totalStock", width: 20 },
  { header: "Disponibles", key: "available", width: 14 },
  { header: "Agotados", key: "outOfStock", width: 12 },
  { header: "Precio Promedio (USD)", key: "avgPrice", width: 20 },
  { header: "Valor Total Inventario (USD)", key: "totalValue", width: 26 },
];

// ─── Niche data aggregation ────────────────────────────────────────
interface NicheData {
  count: number;
  totalStock: number;
  totalValue: number;
  prices: number[];
  inStockCount: number;
  outOfStockCount: number;
}

function aggregateNiches(products: CatalogProduct[]) {
  const nicheMap = new Map<string, NicheData>();

  products.forEach((p) => {
    const cat = p.category || "General";
    const current = nicheMap.get(cat) || {
      count: 0,
      totalStock: 0,
      totalValue: 0,
      prices: [],
      inStockCount: 0,
      outOfStockCount: 0,
    };

    const stock = typeof p.stock === "number" ? p.stock : 10;
    const price = Number(p.price || 0);
    const isOut = stock === 0 || (p.badge && p.badge.toUpperCase() === "AGOTADO");

    current.count += 1;
    current.totalStock += stock;
    current.totalValue += stock * price;
    current.prices.push(price);
    if (isOut) current.outOfStockCount += 1;
    else current.inStockCount += 1;

    nicheMap.set(cat, current);
  });

  return nicheMap;
}

// ─── Main Export Function ──────────────────────────────────────────
export async function exportNicheToExcel(
  products: CatalogProduct[],
  dateSlug: string,
  brandName: string
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = brandName;
  wb.created = new Date();

  const nicheMap = aggregateNiches(products);
  const totalCatalog = products.length || 1;

  // Sort by total value descending
  const sortedNiches = Array.from(nicheMap.entries()).sort(
    (a, b) => b[1].totalValue - a[1].totalValue
  );

  // ═══════════════════════════════════════════════════════════════
  // SHEET 1: Data Table
  // ═══════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet("Inventario por Nicho", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = COLUMNS;

  let grandTotalStock = 0;
  let grandTotalValue = 0;
  let grandAvailable = 0;
  let grandOutOfStock = 0;

  sortedNiches.forEach(([niche, data], idx) => {
    grandTotalStock += data.totalStock;
    grandTotalValue += data.totalValue;
    grandAvailable += data.inStockCount;
    grandOutOfStock += data.outOfStockCount;

    const avgPrice =
      data.prices.length > 0
        ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length
        : 0;
    const pct = (data.count / totalCatalog) * 100;

    ws.addRow({
      num: idx + 1,
      niche,
      variety: data.count,
      percent: `${pct.toFixed(1)}%`,
      totalStock: data.totalStock,
      available: data.inStockCount,
      outOfStock: data.outOfStockCount,
      avgPrice: Number(avgPrice.toFixed(2)),
      totalValue: Number(data.totalValue.toFixed(2)),
    });
  });

  // TOTAL row
  const totalRow = ws.addRow({
    num: "TOTAL",
    niche: "TOTAL CATÁLOGO",
    variety: products.length,
    percent: "100%",
    totalStock: grandTotalStock,
    available: grandAvailable,
    outOfStock: grandOutOfStock,
    avgPrice: grandTotalStock > 0 ? Number((grandTotalValue / grandTotalStock).toFixed(2)) : 0,
    totalValue: Number(grandTotalValue.toFixed(2)),
  });

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.font = HEADER_FONT;
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.border = THIN_BORDER;
  });

  // Style data rows
  const dataRowCount = sortedNiches.length;
  for (let i = 2; i <= dataRowCount + 1; i++) {
    const row = ws.getRow(i);
    const isZebra = i % 2 === 0;
    row.alignment = { vertical: "middle", wrapText: true };
    row.height = 22;

    row.eachCell((cell, colNumber) => {
      cell.border = THIN_BORDER;
      cell.font = { name: "Calibri", size: 10 };

      if (isZebra) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_LIGHT } };
      }

      // Price & value columns
      if (colNumber === 8 || colNumber === 9) {
        cell.numFmt = '"$"#,##0.00';
      }
    });
  }

  // Style TOTAL row
  totalRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: WHITE } };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  totalRow.alignment = { vertical: "middle", horizontal: "center" };
  totalRow.height = 28;
  totalRow.eachCell((cell, colNumber) => {
    cell.border = THIN_BORDER;
    if (colNumber === 8 || colNumber === 9) {
      cell.numFmt = '"$"#,##0.00';
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SHEET 2: Dashboard with Charts
  // ═══════════════════════════════════════════════════════════════
  const dash = wb.addWorksheet("Dashboard Inventario", {
    properties: { showGridLines: false },
  });

  // ── Title ──
  dash.mergeCells("A1:L2");
  const titleCell = dash.getCell("A1");
  titleCell.value = `📊  DASHBOARD — INVENTARIO ${brandName.toUpperCase()}`;
  titleCell.font = { name: "Calibri", size: 20, bold: true, color: { argb: DARK } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GRAY } };
  dash.getRow(1).height = 24;
  dash.getRow(2).height = 24;

  // ── Subtitle ──
  dash.mergeCells("A3:L3");
  const subtitleCell = dash.getCell("A3");
  subtitleCell.value = `Generado el ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  •  ${sortedNiches.length} nichos  •  ${products.length} productos  •  ${grandTotalStock} unidades en stock`;
  subtitleCell.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF71717A" } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  dash.getRow(3).height = 22;

  // ── Chart Data ──
  const nicheNames = sortedNiches.map(([n]) => n);
  const nicheCounts = sortedNiches.map(([, d]) => d.count);
  const nicheStocks = sortedNiches.map(([, d]) => d.totalStock);
  const nicheValues = sortedNiches.map(([, d]) => Number(d.totalValue.toFixed(2)));

  // ── Chart 1: Catalog Distribution (Doughnut) ──
  const chart1Base64 = await renderChartToBase64({
    type: "doughnut",
    data: {
      labels: nicheNames,
      datasets: [{
        data: nicheCounts,
        backgroundColor: CHART_COLORS.slice(0, nicheNames.length),
        borderWidth: 2,
        borderColor: "#ffffff",
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Distribución del Catálogo por Nicho" },
      },
    } as Record<string, unknown>,
  } as Parameters<typeof renderChartToBase64>[0], 700, 400);

  // ── Chart 2: Total Stock by Niche (Bar) ──
  const chart2Base64 = await renderChartToBase64({
    type: "bar",
    data: {
      labels: nicheNames,
      datasets: [{
        label: "Unidades en Stock",
        data: nicheStocks,
        backgroundColor: CHART_COLORS.slice(0, nicheNames.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Stock Total por Nicho" },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: "#f0f0f0" } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  }, 700, 400);

  // ── Chart 3: Inventory Value by Niche (Bar) ──
  const chart3Base64 = await renderChartToBase64({
    type: "bar",
    data: {
      labels: nicheNames,
      datasets: [{
        label: "Valor (USD)",
        data: nicheValues,
        backgroundColor: CHART_COLORS.slice(0, nicheNames.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Valor de Inventario por Nicho (USD)" },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => `$${v}`, font: { size: 11 } }, grid: { color: "#f0f0f0" } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  }, 700, 400);

  // ── Chart 4: Availability Status (Pie) ──
  const chart4Base64 = await renderChartToBase64({
    type: "pie",
    data: {
      labels: ["Disponibles", "Agotados"],
      datasets: [{
        data: [grandAvailable, grandOutOfStock],
        backgroundColor: ["#22C55E", "#EF4444"],
        borderWidth: 2,
        borderColor: "#ffffff",
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Disponibilidad General" },
      },
    },
  }, 700, 400);

  // ── Insert charts as images ──
  const img1 = wb.addImage({ base64: chart1Base64, extension: "png" });
  const img2 = wb.addImage({ base64: chart2Base64, extension: "png" });
  const img3 = wb.addImage({ base64: chart3Base64, extension: "png" });
  const img4 = wb.addImage({ base64: chart4Base64, extension: "png" });

  // Row 5-22: Chart 1 (left) + Chart 2 (right)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dash.addImage(img1, { tl: { col: 0, row: 4 }, br: { col: 6, row: 22 }, editAs: "oneCell" } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dash.addImage(img2, { tl: { col: 6, row: 4 }, br: { col: 12, row: 22 }, editAs: "oneCell" } as any);

  // Row 24-41: Chart 3 (left) + Chart 4 (right)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dash.addImage(img3, { tl: { col: 0, row: 23 }, br: { col: 6, row: 41 }, editAs: "oneCell" } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dash.addImage(img4, { tl: { col: 6, row: 23 }, br: { col: 12, row: 41 }, editAs: "oneCell" } as any);

  // ── Footer ──
  dash.mergeCells("A43:L43");
  const footerCell = dash.getCell("A43");
  footerCell.value = `© ${new Date().getFullYear()} ${brandName} — Reporte generado automáticamente`;
  footerCell.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF9CA3AF" } };
  footerCell.alignment = { horizontal: "center" };

  // ═══════════════════════════════════════════════════════════════
  // Download
  // ═══════════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario_por_nicho_${dateSlug}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
