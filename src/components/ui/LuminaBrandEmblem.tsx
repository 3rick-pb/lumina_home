'use client';

import React from 'react';

interface LuminaBrandEmblemProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

/**
 * Ultra-crisp vector emblem for Lumina Home.
 * Features an interlocking luxury serif LH monogram with an organic leaf sprig and metallic gold leaf finishes.
 * Scalable to any viewport without blur, compression artifacts or raster fringing.
 */
export function LuminaBrandEmblem({
  size = 48,
  className = '',
  withGlow = true,
}: LuminaBrandEmblemProps) {
  const gradientId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div className="absolute inset-1 rounded-2xl bg-[#c49a3f]/15 blur-xs pointer-events-none" />
      )}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform-gpu transition-transform duration-300"
      >
        <defs>
          {/* Multi-stop Luxury Metallic Gold Gradient */}
          <linearGradient
            id={`${gradientId}-gold`}
            x1="10"
            y1="8"
            x2="54"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFF2D6" />
            <stop offset="25%" stopColor="#DFBF75" />
            <stop offset="55%" stopColor="#B38728" />
            <stop offset="80%" stopColor="#C99E3D" />
            <stop offset="100%" stopColor="#F5DC9C" />
          </linearGradient>

          {/* Subtle Ambient Gold Sheen */}
          <linearGradient
            id={`${gradientId}-sheen`}
            x1="32"
            y1="4"
            x2="32"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#C49A3F" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#DFC282" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8C6718" stopOpacity="0.4" />
          </linearGradient>

          <filter id={`${gradientId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer Fine Jewel Border Ring */}
        <rect
          x="3.5"
          y="3.5"
          width="57"
          height="57"
          rx="15"
          stroke={`url(#${gradientId}-gold)`}
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />

        {/* Inner Subtle Inset Frame */}
        <rect
          x="7.5"
          y="7.5"
          width="49"
          height="49"
          rx="11"
          stroke={`url(#${gradientId}-sheen)`}
          strokeWidth="0.8"
        />

        {/* The LH Monogram Artwork */}
        <g filter={`url(#${gradientId}-shadow)`}>
          {/* Serif Stem L */}
          <path
            d="M 17 18 
               C 17 16.5, 19 16, 23 16 
               L 23 18.5 
               C 21.2 18.5, 20.2 19.3, 20.2 21.5 
               L 20.2 40.5 
               C 20.2 42.5, 20.8 43.2, 22.8 43.2 
               L 29.5 43.2 
               C 31.8 43.2, 33 42, 33.6 39.8 
               L 34.6 40 
               L 33.4 46 
               L 16 46 
               L 16 43.5 
               C 18 43.5, 19 42.8, 19 40.5 
               L 19 21.5 
               C 19 19.3, 18 18.5, 16 18.5 
               Z"
            fill={`url(#${gradientId}-gold)`}
          />

          {/* Serif Stem H (Right Leg) */}
          <path
            d="M 46 18 
               C 46 16.5, 44 16, 40 16 
               L 40 18.5 
               C 41.8 18.5, 42.8 19.3, 42.8 21.5 
               L 42.8 40.5 
               C 42.8 42.8, 41.8 43.5, 40 43.5 
               L 40 46 
               L 47 46 
               L 47 43.5 
               C 45 43.5, 44 42.8, 44 40.5 
               L 44 21.5 
               C 44 19.3, 45 18.5, 47 18.5 
               Z"
            fill={`url(#${gradientId}-gold)`}
          />

          {/* Stylized Arching Crossbar connecting L and H */}
          <path
            d="M 20.2 32 
               C 24 32, 27 28.5, 32 29.5 
               C 36 30.3, 39 34, 43.5 34.5 
               L 43.5 32.5 
               C 39 32, 36.5 28, 32 27.5 
               C 27.5 27, 24.5 30.5, 20.2 30.5 
               Z"
            fill={`url(#${gradientId}-gold)`}
          />

          {/* Organic Sprout / Botanical Leaf Accent */}
          <path
            d="M 32 27 
               C 32.5 22.5, 36.5 20, 39.5 20.5 
               C 39 24.5, 35.5 27, 32 27 
               Z"
            fill={`url(#${gradientId}-gold)`}
          />
          <path
            d="M 33 26 
               C 35 24, 37.5 22.5, 39 21"
            stroke="#634512"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* Tiny Luxury Diamond/Sparkle Star above */}
          <path
            d="M 32 10 L 32.8 12.2 L 35 13 L 32.8 13.8 L 32 16 L 31.2 13.8 L 29 13 L 31.2 12.2 Z"
            fill={`url(#${gradientId}-gold)`}
            opacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
}
