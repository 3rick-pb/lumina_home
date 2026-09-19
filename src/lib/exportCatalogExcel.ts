/**
 * exportCatalogExcel.ts
 *
 * Generates a professional Excel report for the product catalog with:
 *  - Sheet 1: "Catálogo de Productos" — styled data table
 *  - Sheet 2: "Dashboard Catálogo" — 4 embedded charts as HD images
 */

import ExcelJS from "exceljs";
import { CatalogProduct } from "@/lib/catalogStore";
import { renderChartToBase64, CHART_COLORS } from "@/lib/excelChartRenderer";

// ─── Brand Constants ───────────────────────────────────────────────
const ORANGE = "FFFF5900";
const DARK = "FF18181B";
const WHITE = "FFFFFFFF";
const ZEBRA_LIGHT = "FFFFF7ED";
const GREEN = "FF22C55E";
const RED = "FFEF4444";
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
  { header: "ID Producto", key: "id", width: 18 },
  { header: "Título / Nombre", key: "title", width: 28 },
  { header: "Subtítulo / Resalte", key: "highlight", width: 22 },
  { header: "Categoría / Nicho", key: "category", width: 20 },
  { header: "Precio Actual (USD)", key: "price", width: 18 },
  { header: "Precio Anterior (USD)", key: "oldPrice", width: 20 },
  { header: "Descuento", key: "discount", width: 12 },
  { header: "Stock Unidades", key: "stock", width: 16 },
  { header: "Estado Stock", key: "stockStatus", width: 14 },
  { header: "Insignia / Badge", key: "badge", width: 16 },
  { header: "Colores", key: "colors", width: 18 },
  { header: "Garantía", key: "warranty", width: 14 },
  { header: "Envíos", key: "shipping", width: 14 },
  { header: "Dimensiones", key: "dimensions", width: 20 },
  { header: "Materiales", key: "materials", width: 24 },
  { header: "Descripción", key: "description", width: 36 },
];

// ─── Main Export Function ──────────────────────────────────────────
export async function exportCatalogToExcel(
  products: CatalogProduct[],
  dateSlug: string,
  brandName: string
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = brandName;
  wb.created = new Date();

  // ═══════════════════════════════════════════════════════════════
  // SHEET 1: Data Table
  // ═══════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet("Catálogo de Productos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = COLUMNS;

  // Add data rows
  products.forEach((p, idx) => {
    const stockQty = typeof p.stock === "number" ? p.stock : 10;
    const isOut = stockQty === 0 || (p.badge && p.badge.toUpperCase() === "AGOTADO");
    const colorsList = (p.colors || []).map((c) => c.name).join(", ");

    ws.addRow({
      num: idx + 1,
      id: p.id,
      title: p.title,
      highlight: p.titleHighlight || "",
      category: p.category || "General",
      price: Number(p.price || 0),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      discount: p.discount || "",
      stock: stockQty,
      stockStatus: isOut ? "AGOTADO" : "DISPONIBLE",
      badge: p.badge || "Ninguna",
      colors: colorsList || "Estándar",
      warranty: p.warranty || "1 Año",
      shipping: p.shipping || "Nacional",
      dimensions: p.dimensions || "N/A",
      materials: p.materials || "Acabados de autor",
      description: p.description || "",
    });
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
  for (let i = 2; i <= products.length + 1; i++) {
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

      // Price columns
      if (colNumber === 6 || colNumber === 7) {
        cell.numFmt = '"$"#,##0.00';
      }

      // Stock status coloring
      if (colNumber === 10) {
        const val = String(cell.value || "");
        if (val === "AGOTADO") {
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: RED } };
        } else if (val === "DISPONIBLE") {
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: GREEN } };
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SHEET 2: Dashboard with Charts
  // ═══════════════════════════════════════════════════════════════
  const dash = wb.addWorksheet("Dashboard Catálogo", {
    properties: { showGridLines: false },
  });

  // ── Title ──
  dash.mergeCells("A1:L2");
  const titleCell = dash.getCell("A1");
  titleCell.value = `📊  DASHBOARD — CATÁLOGO ${brandName.toUpperCase()}`;
  titleCell.font = { name: "Calibri", size: 20, bold: true, color: { argb: DARK } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GRAY } };
  dash.getRow(1).height = 24;
  dash.getRow(2).height = 24;

  // ── Subtitle with date ──
  dash.mergeCells("A3:L3");
  const subtitleCell = dash.getCell("A3");
  subtitleCell.value = `Generado el ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  •  ${products.length} productos en catálogo`;
  subtitleCell.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF71717A" } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  dash.getRow(3).height = 22;

  // ── Prepare chart data ──
  const categoryMap = new Map<string, { count: number; stock: number }>();
  let availableCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    const cat = p.category || "General";
    const cur = categoryMap.get(cat) || { count: 0, stock: 0 };
    const stk = typeof p.stock === "number" ? p.stock : 10;
    cur.count += 1;
    cur.stock += stk;
    categoryMap.set(cat, cur);

    if (stk === 0 || (p.badge && p.badge.toUpperCase() === "AGOTADO")) {
      outOfStockCount++;
    } else {
      availableCount++;
    }
  });

  const categories = Array.from(categoryMap.keys());
  const catCounts = categories.map((c) => categoryMap.get(c)!.count);
  const catStocks = categories.map((c) => categoryMap.get(c)!.stock);
  const topProducts = [...products]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 5);

  // ── Chart 1: Products by Category (Bar) ──
  const chart1Base64 = await renderChartToBase64({
    type: "bar",
    data: {
      labels: categories,
      datasets: [{
        label: "Productos",
        data: catCounts,
        backgroundColor: CHART_COLORS.slice(0, categories.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Productos por Categoría" },
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: "#f0f0f0" } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  }, 700, 400);

  // ── Chart 2: Stock Distribution (Doughnut) ──
  const chart2Base64 = await renderChartToBase64({
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [{
        data: catStocks,
        backgroundColor: CHART_COLORS.slice(0, categories.length),
        borderWidth: 2,
        borderColor: "#ffffff",
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Distribución de Stock por Categoría" },
      },
    } as Record<string, unknown>,
  } as Parameters<typeof renderChartToBase64>[0], 700, 400);

  // ── Chart 3: Top 5 Most Expensive (Horizontal Bar) ──
  const chart3Base64 = await renderChartToBase64({
    type: "bar",
    data: {
      labels: topProducts.map((p) => p.title.substring(0, 25)),
      datasets: [{
        label: "Precio (USD)",
        data: topProducts.map((p) => Number(p.price || 0)),
        backgroundColor: ["#FF5900", "#10B981", "#F59E0B", "#0EA5E9", "#8B5CF6"],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",
      plugins: {
        title: { display: true, text: "Top 5 Productos Más Caros" },
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true, ticks: { callback: (v) => `$${v}`, font: { size: 11 } }, grid: { color: "#f0f0f0" } },
        y: { ticks: { font: { size: 11 } }, grid: { display: false } },
      },
    },
  }, 700, 400);

  // ── Chart 4: Inventory Status (Pie) ──
  const chart4Base64 = await renderChartToBase64({
    type: "pie",
    data: {
      labels: ["Disponibles", "Agotados"],
      datasets: [{
        data: [availableCount, outOfStockCount],
        backgroundColor: ["#22C55E", "#EF4444"],
        borderWidth: 2,
        borderColor: "#ffffff",
      }],
    },
    options: {
      plugins: {
        title: { display: true, text: "Estado del Inventario" },
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
  a.download = `catalogo_productos_${dateSlug}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
