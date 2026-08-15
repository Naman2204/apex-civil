"use client";
import React, { useState, useEffect } from "react";
import { Search, Play, BookOpen } from "lucide-react";
import { getDashboardStats } from "../app/actions/dashboard";
import { EmptyState, Btn } from "./ui/primitives";

interface TopicsViewProps {
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter: string) => void;
}

/* ── Per-topic neon styles ───────────────────────────────── */
const STYLES: Record<string, { border: string; glow: string; iconColor: string; Icon: () => React.ReactElement }> = {
  railway:      { border: 'border-cyan-500/40',    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]',      iconColor: '#22d3ee', Icon: TrainIcon },
  hydro:        { border: 'border-sky-500/40',     glow: 'shadow-[0_0_30px_rgba(56,189,248,0.2)]',      iconColor: '#38bdf8', Icon: DropIcon },
  highway:      { border: 'border-emerald-500/40', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.2)]',      iconColor: '#34d399', Icon: HighwayIcon },
  geo:          { border: 'border-orange-500/40',  glow: 'shadow-[0_0_30px_rgba(251,146,60,0.2)]',      iconColor: '#fb923c', Icon: HammerIcon },
  estimation:   { border: 'border-purple-500/40',  glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',      iconColor: '#c084fc', Icon: CalcIcon },
  environ:      { border: 'border-emerald-400/40', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.2)]',      iconColor: '#4ade80', Icon: LeafIcon },
  structure:    { border: 'border-pink-500/40',    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.2)]',      iconColor: '#f472b6', Icon: BuildingIcon },
  irrigation:   { border: 'border-cyan-500/40',    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]',       iconColor: '#22d3ee', Icon: DropIcon },
  fluid:        { border: 'border-purple-500/40',  glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',      iconColor: '#a78bfa', Icon: DropIcon },
  construction: { border: 'border-yellow-500/40',  glow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]',       iconColor: '#facc15', Icon: CraneIcon },
  airport:      { border: 'border-orange-500/40',  glow: 'shadow-[0_0_30px_rgba(251,146,60,0.2)]',      iconColor: '#fb923c', Icon: BridgeIcon },
  management:   { border: 'border-yellow-500/40',  glow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]',       iconColor: '#facc15', Icon: CraneIcon },
};

function styleFor(name: string) {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(STYLES)) if (n.includes(k)) return v;
  return { border: 'border-indigo-500/40', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]', iconColor: '#818cf8', Icon: () => <BookOpen className="w-12 h-12" /> };
}

/* Mastery ring */
function MasteryRing({ pct }: { pct: number }) {
  const size = 80, stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#mGrad)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} />
        <defs>
          <linearGradient id="mGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-white leading-none">{Math.round(p)}%</span>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Mastery</span>
      </div>
    </div>
  );
}

export const TopicsView: React.FC<TopicsViewProps> = ({ chapterStats, onStartExam }) => {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);

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

  const filtered = chapterStats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full pb-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
          ApexCivil Topic Mastery Library
        </h1>
        <div className="relative mt-4 w-full max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search topics & chapters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f111e] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No topics found"
          message={`No topics match "${search}". Try a different search term.`}
          action={<Btn variant="secondary" onClick={() => setSearch("")}>Clear Search</Btn>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((chapter) => {
            const { border, glow, iconColor, Icon } = styleFor(chapter.name);
            const answered = stats?.answeredByChapter?.[chapter.name] || 0;
            const pct = chapter.count > 0 ? (answered / chapter.count) * 100 : 0;
            return (
              <div
                key={chapter.name}
                className={`group relative rounded-2xl bg-[#0f111e] border ${border} ${glow} p-5 transition-all hover:-translate-y-1 hover:brightness-110 cursor-pointer`}
                onClick={() => onStartExam(chapter.name)}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  {/* Large neon icon */}
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center" style={{ color: iconColor, filter: `drop-shadow(0 0 14px ${iconColor}aa)` }}>
                    <Icon />
                  </div>
                  {/* Mastery ring */}
                  <MasteryRing pct={pct} />
                </div>

                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 min-h-[38px]">
                  {chapter.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{chapter.count.toLocaleString()} Questions Available</p>

                {/* Hover "Quick Study" button */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-900 bg-gradient-to-r from-emerald-400 to-cyan-400">
                    <Play className="w-3 h-3 fill-current" />
                    Quick Study
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Neon icon components ────────────────────────────────── */
function TrainIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="6" width="32" height="28" rx="4" />
    <path d="M8 20h32M24 6v14M16 34l-4 8M32 34l4 8M16 28h0M32 28h0" />
  </svg>;
}
function DropIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 4C24 4 8 18 8 28a16 16 0 0032 0C40 18 24 4 24 4z" />
    <path d="M16 32c0 4.4 3.6 8 8 8" />
  </svg>;
}
function HighwayIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 44L24 4l20 40" /><path d="M4 44L24 4l20 40" strokeDasharray="4 4" />
    <path d="M8 38h32M10 30h28M14 22h20M18 14h12" />
  </svg>;
}
function HammerIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M28 20L13 35a4 4 0 01-5.6-5.6L22 14" />
    <path d="M30 28l8-8" />
    <path d="M38 14l-4-4-10 10 4 4 10-10z" />
  </svg>;
}
function CalcIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="4" width="32" height="40" rx="4" />
    <path d="M16 12h16M32 26v8M16 26h0M24 26h0M16 34h0M24 34h0" />
  </svg>;
}
function LeafIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 40C14 40 6 32 6 24 6 12 18 6 30 4 32 12 32 22 22 30" />
    <path d="M4 44c0-8 6-12 12-14" />
  </svg>;
}
function BuildingIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="40" height="40" rx="2" />
    <path d="M16 44V32h16v12M16 12h0M24 12h0M32 12h0M16 20h0M24 20h0M32 20h0M16 28h0M24 28h0M32 28h0" />
  </svg>;
}
function CraneIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 44V8l32-4M8 8l32 4M20 20h20M36 20v16" />
    <rect x="14" y="28" width="16" height="16" rx="2" />
    <path d="M36 26l4 2v12l-4 2" />
  </svg>;
}
function BridgeIcon() {
  return <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 36h40M8 36V16M40 36V16M8 16C8 16 16 8 24 8s16 8 16 8" />
    <path d="M8 24h8M32 24h8M16 24v12M32 24v12" />
  </svg>;
}
