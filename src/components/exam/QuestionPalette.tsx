"use client";
import React from "react";
import { Flag, Check, ListChecks } from "lucide-react";
import { MCQQuestion } from "../../types/mcq";

export interface QuestionPaletteProps {
  questions: MCQQuestion[];
  currentIndex: number;
  answered: Record<string, string>;
  marked: Record<string, boolean>;
  /** Indices the user has already visited */
  visited: Set<number>;
  onJump: (index: number) => void;
  className?: string;
}

type CellState = "current" | "answered" | "marked" | "answeredMarked" | "unanswered" | "notVisited";

const stateLabel: Record<CellState, string> = {
  current: "Current question",
  answered: "Answered",
  marked: "Marked for review",
  answeredMarked: "Answered and marked for review",
  unanswered: "Visited, not answered",
  notVisited: "Not visited",
};

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  answered,
  marked,
  visited,
  onJump,
  className = "",
}) => {
  const cellState = (idx: number): CellState => {
    const q = questions[idx];
    const isAnswered = !!answered[q.id];
    const isMarked = !!marked[q.id];
    if (idx === currentIndex) return "current";
    if (isAnswered && isMarked) return "answeredMarked";
    if (isAnswered) return "answered";
    if (isMarked) return "marked";
    return visited.has(idx) ? "unanswered" : "notVisited";
  };

  const cellClass: Record<CellState, string> = {
    current: "bg-[#2a1758] border-[#8c32ff] text-white ring-2 ring-[#8c32ff]/50",
    answered: "bg-emerald-500/15 border-emerald-500/60 text-emerald-300",
    marked: "bg-amber-500/15 border-amber-500/60 text-amber-300",
    answeredMarked:
      "bg-gradient-to-br from-emerald-500/15 via-[#1a1c2e] to-amber-500/15 border-amber-500/60 text-amber-200",
    unanswered: "bg-[#1a1c2e] border-slate-600 text-slate-300",
    notVisited: "bg-[#0A0C18] border-slate-800 text-slate-400",
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-[#9b66ff]" />
          Question Palette
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">
          {questions.length} Q
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const st = cellState(idx);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(idx)}
              aria-label={`Question ${idx + 1}: ${stateLabel[st]}`}
              title={`Q${idx + 1} — ${stateLabel[st]}`}
              className={`relative w-full aspect-square rounded-lg text-xs font-bold border flex items-center justify-center transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b66ff] ${cellClass[st]}`}
            >
              {idx + 1}
              {/* Non-color marker: flag for marked */}
              {(st === "marked" || st === "answeredMarked") && (
                <Flag
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-400 drop-shadow"
                  fill="currentColor"
                />
              )}
              {st === "answered" && (
                <Check
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 text-emerald-400 drop-shadow"
                  strokeWidth={3}
                />
              )}
              {st === "current" && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#9b66ff] ring-2 ring-[#0A0C18]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend — swatch + glyph + label, never color-only */}
      <div className="mt-5 space-y-2.5 text-[11px] font-medium text-slate-400 bg-[#0A0C18] border border-slate-800 rounded-xl p-4">
        <LegendRow swatch="bg-emerald-500/15 border-emerald-500/60 text-emerald-300" glyph={<Check className="w-3 h-3" strokeWidth={3} />} label="Answered" />
        <LegendRow swatch="bg-amber-500/15 border-amber-500/60 text-amber-300" glyph={<Flag className="w-3 h-3" fill="currentColor" />} label="Marked for Review" />
        <LegendRow swatch="bg-gradient-to-br from-emerald-500/15 to-amber-500/15 border-amber-500/60 text-amber-200" glyph={<Check className="w-3 h-3" strokeWidth={3} />} label="Answered &amp; Marked" />
        <LegendRow swatch="bg-[#0A0C18] border-slate-800 text-slate-600" glyph={null} label="Not Visited" />
        <LegendRow swatch="bg-[#1a1c2e] border-slate-600 text-slate-300" glyph={<span className="w-1.5 h-1.5 rounded-full bg-slate-400" />} label="Unanswered" />
      </div>
    </div>
  );
};

const LegendRow: React.FC<{ swatch: string; glyph: React.ReactNode; label: string }> = ({
  swatch,
  glyph,
  label,
}) => (
  <div className="flex items-center gap-2.5">
    <span className={`relative w-4 h-4 rounded border flex items-center justify-center shrink-0 ${swatch}`}>
      {glyph}
    </span>
    <span>{label}</span>
  </div>
);
