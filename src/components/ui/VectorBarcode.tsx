"use client";

import React, { useMemo } from "react";

export interface VectorBarcodeProps {
  code: string;
  vertical?: boolean;
  height?: number;
  width?: number | string;
  color?: string;
  className?: string;
}

export function generateBarcodeBars(code: string): { isBar: boolean; width: number }[] {
  const clean = (code || "LUMINA").toUpperCase();
  const result: { isBar: boolean; width: number }[] = [];

  // Guard start bars (Code 128 Start Pattern)
  result.push({ isBar: true, width: 2 });
  result.push({ isBar: false, width: 1 });
  result.push({ isBar: true, width: 1 });
  result.push({ isBar: false, width: 2 });
  result.push({ isBar: true, width: 1 });
  result.push({ isBar: false, width: 3 });

  // Seeded pseudo-deterministic pattern from character codes
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const b1 = ((charCode * 3 + i * 5) % 3) + 1;
    const s1 = ((charCode * 7 + i * 2) % 3) + 1;
    const b2 = ((charCode * 5 + i * 11) % 3) + 1;
    const s2 = ((charCode * 11 + i * 7) % 3) + 1;
    const b3 = ((charCode * 2 + i * 3) % 2) + 1;
    const s3 = ((charCode * 4 + i) % 2) + 1;

    result.push({ isBar: true, width: b1 });
    result.push({ isBar: false, width: s1 });
    result.push({ isBar: true, width: b2 });
    result.push({ isBar: false, width: s2 });
    result.push({ isBar: true, width: b3 });
    result.push({ isBar: false, width: s3 });
  }

  // Stop pattern (Code 128 Stop Pattern)
  result.push({ isBar: true, width: 2 });
  result.push({ isBar: false, width: 3 });
  result.push({ isBar: true, width: 3 });
  result.push({ isBar: false, width: 1 });
  result.push({ isBar: true, width: 1 });
  result.push({ isBar: false, width: 1 });
  result.push({ isBar: true, width: 2 });

  return result;
}

/**
 * Native SVG <g> component for embedding barcodes directly inside ticket SVGs.
 * Never disconnects, scales with the viewBox, and eliminates any HTML absolute overlay overflows.
 */
export function SvgBarcodeGroup({
  code,
  x = 0,
  y = 0,
  width = 100,
  height = 30,
  color = "#000000",
  vertical = false,
}: {
  code: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  vertical?: boolean;
}) {
  const bars = useMemo(() => generateBarcodeBars(code), [code]);
  const totalUnits = useMemo(() => bars.reduce((sum, b) => sum + b.width, 0), [bars]);

  if (vertical) {
    let currentY = 0;
    const unitHeight = height / (totalUnits || 1);
    return (
      <g transform={`translate(${x}, ${y})`}>
        {bars.map((bar, idx) => {
          const barY = currentY;
          const barH = bar.width * unitHeight;
          currentY += barH;
          if (!bar.isBar) return null;
          return (
            <rect
              key={idx}
              x={0}
              y={barY}
              width={width}
              height={Math.max(0.5, barH)}
              fill={color}
              shapeRendering="crispEdges"
            />
          );
        })}
      </g>
    );
  }

  let currentX = 0;
  const unitWidth = width / (totalUnits || 1);
  return (
    <g transform={`translate(${x}, ${y})`}>
      {bars.map((bar, idx) => {
        const barX = currentX;
        const barW = bar.width * unitWidth;
        currentX += barW;
        if (!bar.isBar) return null;
        return (
          <rect
            key={idx}
            x={barX}
            y={0}
            width={Math.max(0.5, barW)}
            height={height}
            fill={color}
            shapeRendering="crispEdges"
          />
        );
      })}
    </g>
  );
}

/**
 * Deterministic, razor-sharp 1D Linear Barcode (Code 128 style) vector component.
 * Renders authentic alternating bars and spaces using SVG without external dependencies.
 */
export function VectorBarcode({
  code,
  vertical = false,
  height = 36,
  width = "100%",
  color = "currentColor",
  className = "",
}: VectorBarcodeProps) {
  const bars = useMemo(() => generateBarcodeBars(code), [code]);
  const totalUnits = useMemo(() => bars.reduce((sum, b) => sum + b.width, 0), [bars]);

  if (vertical) {
    let currentY = 0;
    return (
      <svg
        viewBox={`0 0 100 ${totalUnits}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
        className={`select-none ${className}`}
        shapeRendering="crispEdges"
      >
        {bars.map((bar, idx) => {
          const y = currentY;
          currentY += bar.width;
          if (!bar.isBar) return null;
          return (
            <rect
              key={idx}
              x="0"
              y={y}
              width="100"
              height={bar.width}
              fill={color}
            />
          );
        })}
      </svg>
    );
  }

  let currentX = 0;
  return (
    <svg
      viewBox={`0 0 ${totalUnits} ${height}`}
      preserveAspectRatio="none"
      style={{ width, height: `${height}px` }}
      className={`select-none ${className}`}
      shapeRendering="crispEdges"
    >
      {bars.map((bar, idx) => {
        const x = currentX;
        currentX += bar.width;
        if (!bar.isBar) return null;
        return (
          <rect
            key={idx}
            x={x}
            y="0"
            width={bar.width}
            height={height}
            fill={color}
          />
        );
      })}
    </svg>
  );
}
