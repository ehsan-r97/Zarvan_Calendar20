import React from 'react';

interface ZarvanLogoProps {
  className?: string;
  size?: number;
}

export const ZarvanLogo: React.FC<ZarvanLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} rounded-xl shadow-xs`}
    >
      <defs>
        {/* Modern Persian Luxury Gradient: Obsidian to Emerald Teal */}
        <linearGradient id="zarvanBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#134e4a" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>

        {/* Golden Solar Radiant Disc */}
        <linearGradient id="zarvanSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="solarGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main Squircle Container */}
      <rect width="100" height="100" rx="22" fill="url(#zarvanBgGrad)" />

      {/* Subtle border highlight */}
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="97"
        rx="20.5"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1.5"
      />

      {/* Calendar Card Sheet */}
      <g transform="translate(18, 16)">
        {/* Sheet Body */}
        <rect
          x="0"
          y="6"
          width="64"
          height="62"
          rx="10"
          fill="#ffffff"
          filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))"
        />

        {/* Calendar Top Banner */}
        <path
          d="M0 16C0 10.4772 4.47715 6 10 6H54C59.5228 6 64 10.4772 64 16V22H0V16Z"
          fill="#10b981"
        />

        {/* Binder Rings */}
        <rect x="14" y="1" width="5" height="10" rx="2.5" fill="#f59e0b" />
        <rect x="45" y="1" width="5" height="10" rx="2.5" fill="#f59e0b" />

        {/* Grid lines inside sheet */}
        <line x1="8" y1="36" x2="56" y2="36" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="8" y1="50" x2="56" y2="50" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="24" y1="28" x2="24" y2="60" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="40" y1="28" x2="40" y2="60" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Radiant Persian Sun (Nowruz / Solar Emblem) */}
        <g transform="translate(32, 44)" filter="url(#solarGlow)">
          {/* Solar Disc Core */}
          <circle cx="0" cy="0" r="8" fill="url(#zarvanSunGrad)" />

          {/* 8 Solar Rays */}
          <g stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round">
            <line x1="0" y1="-12" x2="0" y2="-9.5" />
            <line x1="0" y1="9.5" x2="0" y2="12" />
            <line x1="-12" y1="0" x2="-9.5" y2="0" />
            <line x1="9.5" y1="0" x2="12" y2="0" />
            <line x1="-8.5" y1="-8.5" x2="-6.7" y2="-6.7" />
            <line x1="6.7" y1="6.7" x2="8.5" y2="8.5" />
            <line x1="-8.5" y1="8.5" x2="-6.7" y2="6.7" />
            <line x1="6.7" y1="-6.7" x2="8.5" y2="-8.5" />
          </g>
        </g>
      </g>
    </svg>
  );
};
