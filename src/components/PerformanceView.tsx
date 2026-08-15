"use client";
import React, { useEffect, useState } from "react";
import { Activity, CalendarDays, Clock, Layers, Trophy, ChevronDown } from "lucide-react";
import { getExamHistory } from "../app/actions/analytics";
import { EmptyState, Btn } from "./ui/primitives";

interface HistoryRecord {
  id: string;
  date: string;
  mode: string;
  topic: string;
  score: number;
  total: number;
  time: string;
}

/* Radial score ring (reference attempt-card treatment) */
function ScoreRing({ pct, score, total, size = 64, stroke = 5 }: { pct: number; score: number; total: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  const color = p >= 75 ? "#34d399" : p >= 50 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-app-text leading-none">{p}%</span>
        <span className="text-[9px] font-bold text-app-faint mt-0.5">
          {score}/{total}
        </span>
      </div>
    </div>
  );
}

const selectCls =
  "appearance-none bg-app-card/80 border border-app-border rounded-xl pl-4 pr-9 py-2.5 text-sm font-semibold text-app-muted focus:outline-none focus:border-accent/60 transition-colors cursor-pointer";

export const PerformanceView: React.FC<{ onStartExam?: () => void }> = ({ onStartExam }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [subject, setSubject] = useState("All");

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      try {
        const data = await getExamHistory();
        if (!cancelled) setHistory(data as HistoryRecord[]);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft/60 text-accent-bright flex items-center justify-center animate-pulse mb-4">
          <Activity className="w-6 h-6" />
        </div>
        <p className="text-sm text-app-muted font-medium">Loading performance history…</p>
      </div>
    );
  }

  const subjects = [...new Set(history.map(h => h.topic))].sort();
  const filtered = history
    .filter(h => subject === "All" || h.topic === subject)
    .sort((a, b) => {
      const ta = new Date(a.date).getTime() || 0;
      const tb = new Date(b.date).getTime() || 0;
      return sort === "newest" ? tb - ta : ta - tb;
    });

  return (
    <div className="w-full pb-12 space-y-6">
      {/* Header — reference placement */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
          Performance History
        </h1>
        <p className="text-sm text-app-muted mt-1">
          Review your past attempts and track improvements.
        </p>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No attempts recorded"
          message="Complete a practice or strict exam to start building your performance history."
          action={<Btn onClick={onStartExam}>Take an Exam</Btn>}
        />
      ) : (
        <>
          {/* Sort / filter controls (reference placement) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select value={sort} onChange={e => setSort(e.target.value as any)} className={selectCls}>
                <option value="newest">Sort By Date</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-app-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={subject} onChange={e => setSubject(e.target.value)} className={selectCls}>
                <option value="All">Filter By Subject</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-app-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Stacked attempt cards */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No matches"
                message={`No attempts for "${subject}". Try a different subject filter.`}
                action={<Btn variant="secondary" onClick={() => setSubject("All")}>Show All</Btn>}
              />
            ) : (
              filtered.map(record => {
                const percentage = Math.round((record.score / record.total) * 100);
                const strict = record.mode === "Strict Exam";
                return (
                  <div
                    key={record.id}
                    className="rounded-2xl p-[1px] bg-gradient-to-r from-purple-500/50 via-indigo-500/30 to-purple-500/50 shadow-[0_0_18px_rgba(139,92,246,0.14)]"
                  >
                    <div className="rounded-[15px] bg-[#0b0f1d] px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-4">
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <CalendarDays className="w-4 h-4 text-app-faint shrink-0" />
                        <span className="text-sm font-bold text-app-text">{record.date}</span>
                      </div>

                      <ScoreRing pct={percentage} score={record.score} total={record.total} />

                      <div className="flex-1 min-w-[180px]">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                            strict
                              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                              : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {record.mode}
                        </span>
                        <div className="flex items-center gap-2 mt-2 text-sm text-app-muted min-w-0">
                          <Layers className="w-4 h-4 text-app-faint shrink-0" />
                          <span className="truncate">{record.topic}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-app-muted shrink-0">
                        <Clock className="w-4 h-4 text-app-faint" />
                        {record.time}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
