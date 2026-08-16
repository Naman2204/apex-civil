import React from "react";

export function MasteryRing({ pct, size = 48, className = "" }: { pct: number; size?: number; className?: string }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  
  // Color logic per ApexCivil Spec
  // Red (< 40%), Amber (40-70%), Green (70%+)
  const color = p >= 70 ? "#43A047" : p >= 40 ? "#E0A63D" : "#E24B4A";
  
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} />
        {/* Progress */}
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={r} 
          fill="none" 
          stroke={color} 
          strokeWidth={stroke}
          strokeLinecap="round" 
          strokeDasharray={`${(p/100)*c} ${c}`} 
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black" style={{ color }}>{Math.round(p)}%</span>
      </div>
    </div>
  );
}
