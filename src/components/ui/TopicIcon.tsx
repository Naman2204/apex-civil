import React from "react";

/* ── Topic icon colors mapped by keywords ── */
const ICON_STYLES: Record<string, { bg: string; color: string; svg: string }> = {
  railway:      { bg: "bg-purple-500/15",   color: "#a78bfa", svg: "M2 16 L22 16 M4 16 L4 8 L20 8 L20 16 M8 8 L8 16 M16 8 L16 16 M2 16 L2 18 M22 16 L22 18" },
  hydro:        { bg: "bg-sky-500/15",       color: "#38bdf8", svg: "M12 2 C8 2 4 8 4 12 C4 18 8 22 12 22 C16 22 20 18 20 12 C20 8 16 2 12 2 M6 14 Q8 10 12 14 Q16 10 18 14" },
  highway:      { bg: "bg-emerald-500/15",   color: "#34d399", svg: "M3 18 L21 18 M5 18 L5 6 L9 6 M19 18 L19 6 L15 6 M9 6 L9 10 M15 6 L15 10 M9 10 L15 10" },
  estimation:   { bg: "bg-yellow-500/15",    color: "#fbbf24", svg: "M5 3 H19 V21 H5 Z M9 7 H15 M9 11 H15 M9 15 H12" },
  geo:          { bg: "bg-orange-500/15",    color: "#fb923c", svg: "M12 2 L16 8 L22 9 L17 14 L18 20 L12 17 L6 20 L7 14 L2 9 L8 8 Z" },
  fluid:        { bg: "bg-violet-500/15",    color: "#8b5cf6", svg: "M12 2 C6 2 4 8 4 13 C4 18 7 22 12 22 C17 22 20 18 20 13 C20 8 18 2 12 2" },
  irrigation:   { bg: "bg-cyan-500/15",      color: "#22d3ee", svg: "M12 2 L12 10 M8 6 Q4 10 4 15 C4 19 7 22 12 22 C17 22 20 19 20 15 Q20 10 16 6" },
  construction: { bg: "bg-amber-500/15",     color: "#f59e0b", svg: "M2 20 H22 M4 20 L4 10 L12 4 L20 10 L20 20 M9 20 L9 14 L15 14 L15 20" },
  airport:      { bg: "bg-pink-500/15",      color: "#f472b6", svg: "M21 16 L13 10 L13 4 C13 3.4 12.6 3 12 3 C11.4 3 11 3.4 11 4 L11 10 L3 16 L3 17.5 L11 15.5 L11 19.5 L9 21 L9 22 L12 21 L15 22 L15 21 L13 19.5 L13 15.5 L21 17.5 Z" },
  bridge:       { bg: "bg-rose-500/15",      color: "#fb7185", svg: "M2 12 L22 12 M2 18 L22 18 M6 12 L6 6 M18 12 L18 6 M6 6 Q12 2 18 6 M2 12 L2 18 M22 12 L22 18" },
  environ:      { bg: "bg-green-500/15",     color: "#4ade80", svg: "M12 2 C7 2 4 6 4 10 C4 14 7 17 10 19 L10 22 H14 L14 19 C17 17 20 14 20 10 C20 6 17 2 12 2 M12 10 Q10 8 8 9 M12 10 Q14 8 16 9" },
  structure:    { bg: "bg-blue-500/15",      color: "#60a5fa", svg: "M2 20 L12 4 L22 20 Z M8 20 L8 14 L16 14 L16 20 M12 14 L12 20" },
  tunnel:       { bg: "bg-indigo-500/15",    color: "#818cf8", svg: "M2 20 C2 10 22 10 22 20 M6 20 C6 13 18 13 18 20" },
  management:   { bg: "bg-teal-500/15",      color: "#2dd4bf", svg: "M9 5 H7 C5.9 5 5 5.9 5 7 V19 C5 20.1 5.9 21 7 21 H17 C18.1 21 19 20.1 19 19 V7 C19 5.9 18.1 5 17 5 H15 M9 5 C9 3.9 9.9 3 11 3 H13 C14.1 3 15 3.9 15 5 M9 12 H15 M9 16 H12" },
  uncategorized:{ bg: "bg-slate-500/15",     color: "#94a3b8", svg: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
  none:         { bg: "bg-slate-500/15",     color: "#94a3b8", svg: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
};

function getStyle(name: string) {
  if (!name) return { bg: "bg-slate-500/15", color: "#94a3b8", svg: "M4 6 H20 M4 12 H20 M4 18 H20" };
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(ICON_STYLES)) if (n.includes(k)) return v;
  return { bg: "bg-slate-500/15", color: "#94a3b8", svg: "M4 6 H20 M4 12 H20 M4 18 H20" };
}

export function TopicIcon({ name, title, size = 40, className = "" }: { name?: string; title?: string; size?: number; className?: string }) {
  const s = getStyle(name || title || "");
  return (
    <div className={`flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={s.color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${s.color}60)` }}>
        <path d={s.svg} />
      </svg>
    </div>
  );
}
