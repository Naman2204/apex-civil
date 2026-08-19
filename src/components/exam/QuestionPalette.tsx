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
    current: "bg-[var(--accent-soft)] border-[var(--accent)] text-white ring-2 ring-[var(--accent)]/50",
    answered: "bg-[var(--status-success)]/15 border-[var(--status-success)]/60 text-[var(--status-success)]",
    marked: "bg-[var(--status-warning)]/15 border-[var(--status-warning)]/60 text-[var(--status-warning)]",
    answeredMarked:
      "bg-gradient-to-br from-[var(--status-success)]/15 via-[var(--app-bg)] to-[var(--status-warning)]/15 border-[var(--status-warning)]/60 text-[var(--status-warning)]",
    unanswered: "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-text)]",
    notVisited: "bg-[var(--app-card2)] border-[var(--app-border)] text-[var(--app-muted)]",
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--app-muted)' }}>
          <ListChecks className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          Question Palette
        </h3>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--app-faint)' }}>
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
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 drop-shadow"
                  style={{ color: 'var(--status-warning)' }}
                  fill="currentColor"
                />
              )}
              {st === "answered" && (
                <Check
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 drop-shadow"
                  style={{ color: 'var(--status-success)' }}
                  strokeWidth={3}
                />
              )}
              {st === "current" && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2"
                  style={{ background: 'var(--accent)', borderColor: 'var(--app-bg)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend — swatch + glyph + label, never color-only */}
      <div className="mt-5 space-y-2.5 text-[11px] font-medium border rounded-xl p-4" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}>
        <LegendRow swatch="bg-[var(--status-success)]/15 border-[var(--status-success)]/60 text-[var(--status-success)]" glyph={<Check className="w-3 h-3" strokeWidth={3} />} label="Answered" />
        <LegendRow swatch="bg-[var(--status-warning)]/15 border-[var(--status-warning)]/60 text-[var(--status-warning)]" glyph={<Flag className="w-3 h-3" fill="currentColor" />} label="Marked for Review" />
        <LegendRow swatch="bg-gradient-to-br from-[var(--status-success)]/15 to-[var(--status-warning)]/15 border-[var(--status-warning)]/60 text-[var(--status-warning)]" glyph={<Check className="w-3 h-3" strokeWidth={3} />} label="Answered &amp; Marked" />
        <LegendRow swatch="bg-[var(--app-card2)] border-[var(--app-border)] text-[var(--app-faint)]" glyph={null} label="Not Visited" />
        <LegendRow swatch="bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-text)]" glyph={<span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--app-muted)' }} />} label="Unanswered" />
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
