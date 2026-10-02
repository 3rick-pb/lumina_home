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
  // Generate deterministic bar widths based on input code
  const bars = useMemo(() => {
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
  }, [code]);

  const totalUnits = useMemo(() => {
    return bars.reduce((sum, b) => sum + b.width, 0);
  }, [bars]);

  if (vertical) {
    // In vertical mode (like Cupones Style 2 left stub), bars are horizontal lines stacked vertically
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

  // Horizontal mode (standard 1D barcode)
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
