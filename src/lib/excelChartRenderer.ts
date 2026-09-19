/**
 * excelChartRenderer.ts
 * 
 * Renders Chart.js charts on an offscreen canvas, converts them to Base64 PNG,
 * and returns the image data for embedding in ExcelJS workbooks.
 * 
 * Brand palette:
 *  - PayPhone Orange: #FF5900
 *  - Dark/Zinc 900:   #18181b
 *  - Nature Olive:    #8c9276
 *  - Emerald:         #10B981
 *  - Amber:           #F59E0B
 *  - Sky:             #0EA5E9
 *  - Violet:          #8B5CF6
 *  - Rose:            #F43F5E
 *  - Teal:            #14B8A6
 *  - Indigo:          #6366F1
 */

import {
  Chart,
  BarController,
  DoughnutController,
  PieController,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  type ChartConfiguration,
} from "chart.js";

// Register necessary Chart.js components for tree-shaking
Chart.register(
  BarController,
  DoughnutController,
  PieController,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

/** Brand color palette for charts */
export const CHART_COLORS = [
  "#FF5900", // PayPhone Orange
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#0EA5E9", // Sky
  "#8B5CF6", // Violet
  "#F43F5E", // Rose
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#8c9276", // Nature Olive
  "#18181b", // Dark
  "#EC4899", // Pink
  "#84CC16", // Lime
];

/** Softer palette for backgrounds (20% opacity equivalents) */
export const CHART_COLORS_LIGHT = CHART_COLORS.map((c) => c + "33");

/**
 * Renders a Chart.js chart to an offscreen canvas and returns the image as a
 * Base64-encoded PNG string (without the data:image/png;base64, prefix).
 */
export async function renderChartToBase64(
  config: ChartConfiguration,
  width = 720,
  height = 420
): Promise<string> {
  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  // Must be in DOM for Chart.js to measure
  canvas.style.position = "fixed";
  canvas.style.left = "-9999px";
  canvas.style.top = "-9999px";
  canvas.style.opacity = "0";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  // Default chart options for a clean, professional look
  const defaults: ChartConfiguration["options"] = {
    responsive: false,
    animation: false,
    devicePixelRatio: 2, // retina quality
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { family: "system-ui, -apple-system, sans-serif", size: 12, weight: "bold" },
          color: "#18181b",
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 14,
        },
      },
      title: {
        display: !!config.options?.plugins?.title?.text,
        font: { family: "system-ui, -apple-system, sans-serif", size: 16, weight: "bold" },
        color: "#18181b",
        padding: { top: 12, bottom: 20 },
      },
    },
    layout: {
      padding: { top: 16, right: 24, bottom: 16, left: 24 },
    },
  };

  // Deep merge options
  const mergedConfig: ChartConfiguration = {
    ...config,
    options: deepMerge(defaults, config.options || {}),
  };

  const chart = new Chart(canvas, mergedConfig);

  // Wait for render
  await new Promise((r) => setTimeout(r, 100));

  // Get Base64 PNG (strip data URL prefix)
  const dataUrl = canvas.toDataURL("image/png", 1.0);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");

  // Cleanup
  chart.destroy();
  document.body.removeChild(canvas);

  return base64;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}
