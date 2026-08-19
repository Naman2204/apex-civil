"use client";
import React, { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { Search, ArrowRight, SlidersHorizontal, Plane } from "lucide-react";
import { getDashboardStats } from "../app/actions/dashboard";
import { EmptyState, Btn } from "./ui/primitives";

interface TopicsViewProps {
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter: string) => void;
}

const TOPIC_PALETTES: Array<{ iconColor: string; bgColor: string }> = [
  { iconColor: "#a78bfa", bgColor: "rgba(167,139,250,0.16)" },
  { iconColor: "#67e8f9", bgColor: "rgba(103,232,249,0.16)" },
  { iconColor: "#c084fc", bgColor: "rgba(192,132,252,0.18)" },
  { iconColor: "#fda4af", bgColor: "rgba(253,164,175,0.17)" },
  { iconColor: "#c4b5fd", bgColor: "rgba(196,181,253,0.16)" },
  { iconColor: "#4ade80", bgColor: "rgba(74,222,128,0.14)" },
  { iconColor: "#f472b6", bgColor: "rgba(244,114,182,0.15)" },
  { iconColor: "#86efac", bgColor: "rgba(134,239,172,0.16)" },
  { iconColor: "#7dd3fc", bgColor: "rgba(125,211,252,0.16)" },
  { iconColor: "#f9a8d4", bgColor: "rgba(249,168,212,0.16)" },
  { iconColor: "#93c5fd", bgColor: "rgba(147,197,253,0.16)" },
  { iconColor: "#818cf8", bgColor: "rgba(99,102,241,0.16)" },
];

const TOPIC_ICONS: Array<() => React.ReactElement> = [
  TrainIcon,
  DropIcon,
  HighwayIcon,
  HammerIcon,
  CalcIcon,
  LeafIcon,
  BuildingIcon,
  CraneIcon,
  BridgeIcon,
  BridgeIcon,
  BookOpenIcon,
  PlaneIcon,
];

function hashTopicName(name: string): number {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const EXACT_MATCHES: Record<string, { iconColor: string; bgColor: string; Icon: () => React.ReactElement }> = {
  "railway": { iconColor: "#a78bfa", bgColor: "rgba(167,139,250,0.16)", Icon: TrainIcon },
  "hydrology": { iconColor: "#38bdf8", bgColor: "rgba(56,189,248,0.16)", Icon: DropIcon },
  "highway": { iconColor: "#f472b6", bgColor: "rgba(244,114,182,0.16)", Icon: HighwayIcon },
  "estimation": { iconColor: "#fbbf24", bgColor: "rgba(251,191,36,0.16)", Icon: CalcIcon },
  "geotechnical": { iconColor: "#fb923c", bgColor: "rgba(251,146,60,0.16)", Icon: HammerIcon },
  "fluid": { iconColor: "#8b5cf6", bgColor: "rgba(139,92,246,0.16)", Icon: DropIcon },
  "irrigation": { iconColor: "#4ade80", bgColor: "rgba(74,222,128,0.16)", Icon: LeafIcon },
  "construction": { iconColor: "#f59e0b", bgColor: "rgba(245,158,11,0.16)", Icon: CraneIcon },
  "airport": { iconColor: "#c084fc", bgColor: "rgba(192,132,252,0.16)", Icon: PlaneIcon },
  "bridge": { iconColor: "#fb7185", bgColor: "rgba(251,113,133,0.16)", Icon: BridgeIcon },
  "tunnel": { iconColor: "#fb7185", bgColor: "rgba(251,113,133,0.16)", Icon: BridgeIcon },
  "environmental": { iconColor: "#2dd4bf", bgColor: "rgba(45,212,191,0.16)", Icon: LeafIcon },
  "structure": { iconColor: "#60a5fa", bgColor: "rgba(96,165,250,0.16)", Icon: BuildingIcon },
  "uncategorized": { iconColor: "#818cf8", bgColor: "rgba(129,140,248,0.16)", Icon: GridIcon }
};

function styleFor(name: string): { iconColor: string; bgColor: string; Icon: () => React.ReactElement } {
  const normalized = (name || "untitled-topic").trim().toLowerCase();
  
  for (const [key, match] of Object.entries(EXACT_MATCHES)) {
    if (normalized.includes(key)) return match;
  }

  const hash = hashTopicName(normalized);
  const palette = TOPIC_PALETTES[hash % TOPIC_PALETTES.length];
  const Icon = TOPIC_ICONS[(hash >>> 8) % TOPIC_ICONS.length];
  return { ...palette, Icon };
}

function MasteryRing({ pct, size = 62 }: { pct: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  const gradientId = `masteryGrad-${size}-${Math.round(p)}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradientId})`}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor={p > 0 ? "#3b82f6" : "#64748b"} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-app-text leading-none">{Math.round(p)}%</span>
      </div>
    </div>
  );
}

function WeightageSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-xs text-app-muted">
        <span>Range</span>
        <span>High</span>
      </div>
      <div className="relative pt-2">
        <div className="absolute left-0 right-0 top-[14px] h-[2px] rounded-full bg-[#404867]" />
        <div
          className="absolute left-0 top-[14px] h-[2px] rounded-full bg-gradient-to-r from-[#6f5cff] to-[#4f8cff]"
          style={{ width: `${value}%` }}
        />
        <div className="absolute left-0 top-[9px] w-4 h-4 rounded-full border border-white/70 bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-4 bg-transparent appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/80
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(124,92,252,0.45)]
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}

export const TopicsView: React.FC<TopicsViewProps> = ({ chapterStats, onStartExam }) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [stats, setStats] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"weightage" | "improved" | "area">("weightage");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [weightage, setWeightage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const s = await getDashboardStats();
        if (!cancelled) setStats(s);
      } catch (err) {
        console.error("Failed to fetch progress", err);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const maxCount = Math.max(...chapterStats.map((c) => c.count), 1);
  const filtered = chapterStats
    .filter((c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .filter((c) => weightage === 0 || ((c.count / maxCount) * 100) >= weightage)
    .sort((a, b) => {
      if (sortBy === "weightage") return b.count - a.count;
      if (sortBy === "improved") {
        const aAnswered = stats?.answeredByChapter?.[a.name] || 0;
        const bAnswered = stats?.answeredByChapter?.[b.name] || 0;
        const aPct = a.count > 0 ? (aAnswered / a.count) * 100 : 0;
        const bPct = b.count > 0 ? (bAnswered / b.count) * 100 : 0;
        return bPct - aPct;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <section className="w-full min-h-[calc(100vh-4rem)] flex rounded-none lg:rounded-2xl overflow-hidden"
      style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 xl:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-[30px] leading-tight font-semibold tracking-[-0.02em]" style={{ color: 'var(--app-text)' }}>
            Topics &amp; Chapters
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-[860px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--accent)' }} />
            <input
              type="text"
              placeholder="Search topics & chapters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:ring-1 transition-all"
              style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', color: 'var(--app-text)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No topics found"
            message={search ? `No topics match "${search}". Try a different search term.` : "No topics available for this filter."}
            action={<Btn variant="secondary" onClick={() => { setSearch(""); setWeightage(0); }}>Clear Filters</Btn>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {filtered.map((chapter) => {
              const { iconColor, bgColor, Icon } = styleFor(chapter.name);
              const answered = stats?.answeredByChapter?.[chapter.name] || 0;
              const pct = chapter.count > 0 ? (answered / chapter.count) * 100 : 0;
              const isHovered = hoveredCard === chapter.name;
              const isActive = isHovered || pct >= 15;

              return (
                <div
                  key={chapter.name}
                  className="group relative flex min-h-52 flex-col rounded-2xl p-5 transition-all duration-300 cursor-pointer"
                  style={{
                    background: isActive ? 'var(--app-card-hover)' : 'var(--app-card)',
                    border: isActive ? '1px solid var(--app-border-focus)' : '1px solid var(--app-border)',
                    boxShadow: isActive ? 'var(--card-shadow)' : '0 0 0 transparent',
                  }}
                  onMouseEnter={() => setHoveredCard(chapter.name)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => onStartExam(chapter.name)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl border border-white/10"
                      style={{ backgroundColor: bgColor, color: iconColor }}
                    >
                      <Icon />
                    </div>
                    <MasteryRing pct={pct} />
                  </div>

                  <h3 className="shrink-0 text-lg md:text-xl font-semibold text-app-text leading-snug line-clamp-2 mb-0.5 tracking-[-0.01em]">
                    {chapter.name}
                  </h3>

                  <p className="shrink-0 text-sm text-[#5d6a8f] dark:text-[#9ca7c6] mb-3">
                    {chapter.count.toLocaleString()} Questions Available
                  </p>

                  <div className={`mt-auto flex justify-end pt-2 transition-all duration-200 ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                  }`}>
                    <button
                      className="flex items-center gap-1.5 px-5 h-8 bg-gradient-to-r from-[#6f5cff] to-[#6c8eff] text-white text-xs font-bold rounded-lg shadow-[0_0_18px_rgba(124,92,252,0.42)] hover:brightness-110 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartExam(chapter.name);
                      }}
                    >
                      Start
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="w-full xl:w-[320px] shrink-0 border-t xl:border-t-0 xl:border-l border-[#d7def0] bg-[#f5f8ff] dark:border-[#303a5b] dark:bg-[#13192d]/88">
        <div className="h-full p-5 sm:p-6 flex flex-col gap-8">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-[#9b8cff]" />
            <h2 className="text-3xl font-semibold text-app-text">Filter Topics</h2>
          </div>

          <div className="space-y-4">
            <label className="text-base font-semibold text-app-muted">Sort By</label>
            <div className="space-y-3.5">
              {[
                { value: "weightage", label: "High Weightage" },
                { value: "improved", label: "Most Improved" },
                { value: "area", label: "Subject Area" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${sortBy === option.value 
                      ? "border-[#7C5CFC]"
                      : "border-[#a9b3d1] group-hover:border-[#5f6ca0] dark:border-[#5d6689] dark:group-hover:border-[#a4acc9]"}`}
                  >
                    {sortBy === option.value && (
                      <div className="w-2.5 h-2.5 bg-[#7C5CFC] rounded-full shadow-[0_0_10px_rgba(124,92,252,0.8)]" />
                    )}
                  </div>
                  <span className={`text-lg transition-colors ${sortBy === option.value ? "text-app-text font-medium" : "text-app-muted group-hover:text-app-text"}`}>
                    {option.label}
                  </span>
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => setSortBy(e.target.value as "weightage" | "improved" | "area")}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#d7def0] dark:bg-[#303a5b]" />

          <div className="space-y-4">
            <label className="text-base font-semibold text-app-muted">Weightage</label>
            <WeightageSlider value={weightage} onChange={setWeightage} />
          </div>
        </div>
      </aside>
    </section>
  );
};

/* ── Neon icon components ────────────────────────────────── */
function BookOpenIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h16v32H8a4 4 0 01-4-4V8zM44 8H28v32h12a4 4 0 004-4V8zM28 8v32M4 8c0-2.2 1.8-4 4-4h16M44 8c0-2.2-1.8-4-4-4H24" />
  </svg>;
}
function GridIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="14" height="14" rx="3" />
    <rect x="28" y="6" width="14" height="14" rx="3" />
    <rect x="6" y="28" width="14" height="14" rx="3" />
    <rect x="28" y="28" width="14" height="14" rx="3" />
  </svg>;
}
function TrainIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="6" width="32" height="28" rx="4" />
    <path d="M8 20h32M24 6v14M16 34l-4 8M32 34l4 8M16 28h0M32 28h0" />
  </svg>;
}
function DropIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 4C24 4 8 18 8 28a16 16 0 0032 0C40 18 24 4 24 4z" />
    <path d="M16 32c0 4.4 3.6 8 8 8" />
  </svg>;
}
function HighwayIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 44L24 4l20 40" /><path d="M4 44L24 4l20 40" strokeDasharray="4 4" />
    <path d="M8 38h32M10 30h28M14 22h20M18 14h12" />
  </svg>;
}
function HammerIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M28 20L13 35a4 4 0 01-5.6-5.6L22 14" />
    <path d="M30 28l8-8" />
    <path d="M38 14l-4-4-10 10 4 4 10-10z" />
  </svg>;
}
function CalcIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="4" width="32" height="40" rx="4" />
    <path d="M16 12h16M32 26v8M16 26h0M24 26h0M16 34h0M24 34h0" />
  </svg>;
}
function LeafIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 40C14 40 6 32 6 24 6 12 18 6 30 4 32 12 32 22 22 30" />
    <path d="M4 44c0-8 6-12 12-14" />
  </svg>;
}
function BuildingIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="40" height="40" rx="2" />
    <path d="M16 44V32h16v12M16 12h0M24 12h0M32 12h0M16 20h0M24 20h0M32 20h0M16 28h0M24 28h0M32 28h0" />
  </svg>;
}
function CraneIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 44V8l32-4M8 8l32 4M20 20h20M36 20v16" />
    <rect x="14" y="28" width="16" height="16" rx="2" />
    <path d="M36 26l4 2v12l-4 2" />
  </svg>;
}
function BridgeIcon() {
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 36h40M8 36V16M40 36V16M8 16C8 16 16 8 24 8s16 8 16 8" />
    <path d="M8 24h8M32 24h8M16 24v12M32 24v12" />
  </svg>;
}
function PlaneIcon() {
  return <Plane width={44} height={44} strokeWidth={1.5} stroke="currentColor" className="opacity-90" />;
}
