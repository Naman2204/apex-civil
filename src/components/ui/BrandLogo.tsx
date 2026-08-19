import React from "react";

export function BrandLogo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="ApexCivil">
      <svg viewBox="0 0 42 42" className="h-10 w-10 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="apex-brand" x1="5" y1="37" x2="35" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#45D7F1" />
            <stop offset="0.52" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#D35CFF" />
          </linearGradient>
        </defs>
        <path d="M5 35 18.8 5.5c.7-1.5 2.8-1.5 3.5 0L37 35h-8.4L20.5 17 13 35H5Z" fill="url(#apex-brand)" />
        <path d="m13.1 25.9 5.5-11.2 4.2 8.6-3.2 6.5-2.5-4.9-1.4 2.9h-2.6Z" fill="#0A0D18" />
        <path d="m24.5 20.2 3.5 7.2H22l2.5-7.2Z" fill="#0A0D18" />
      </svg>
      {!compact && (
        <span className="text-2xl font-bold tracking-tight text-app-text leading-none">
          Apex<span className="text-[#9b7dff]">Civil</span>
        </span>
      )}
    </div>
  );
}
