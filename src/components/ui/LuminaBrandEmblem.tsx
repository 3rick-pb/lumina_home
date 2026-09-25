'use client';

import React from 'react';

interface LuminaBrandEmblemProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * Exact vector emblem of the Lumina brand mark (twin interlocking geometric diamond arches),
 * without text and with transparent background.
 * Uses `currentColor` so that Light Mode and Dark Mode cleanly invert the background and logo colors.
 */
export function LuminaBrandEmblem({
  size = 38,
  className = '',
}: LuminaBrandEmblemProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 400 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform-gpu transition-colors duration-300"
      >
        {/* Twin Interlocking Geometric Diamond Arches (Even-Odd XOR creates the signature hollow center diamond) */}
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 157.3 14.7 L 18.5 165.0 C 53.7 217.7, 83.8 270.3, 98.5 323.0 C 96.7 270.3, 69.8 217.7, 53.5 165.0 L 160.4 52.3 L 257.5 165.0 C 244.2 213.0, 216.0 261.0, 211.5 309.0 C 227.9 261.0, 258.5 213.0, 288.5 165.0 Z M 242.7 14.7 L 381.5 165.0 C 346.3 217.7, 316.2 270.3, 301.5 323.0 C 303.3 270.3, 330.2 217.7, 346.5 165.0 L 239.6 52.3 L 142.5 165.0 C 155.8 213.0, 184.0 261.0, 188.5 309.0 C 172.1 261.0, 141.5 213.0, 111.5 165.0 Z"
        />
      </svg>
    </div>
  );
}
