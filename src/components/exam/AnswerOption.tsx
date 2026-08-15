"use client";
import React from "react";
import { Check, X } from "lucide-react";

export interface AnswerOptionProps {
  /** Option letter badge (A, B, C, D…) */
  label: string;
  /** Option text */
  text: string;
  /** Whether this option is currently selected */
  selected: boolean;
  /**
   * Feedback rendering (practice mode after answering):
   * - 'correct': this option is the right answer
   * - 'incorrect': this option was wrongly picked
   * - 'muted': dimmed non-answer option after feedback
   * - null: normal interactive rendering (exam / unanswered practice)
   */
  feedback?: "correct" | "incorrect" | "muted" | null;
  disabled?: boolean;
  onSelect?: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  label,
  text,
  selected,
  feedback = null,
  disabled = false,
  onSelect,
}) => {
  // Interactive (exam / unanswered) styling
  let border = "border-slate-700/80 bg-[#0A0C18] hover:border-[#5c2dd5] hover:bg-[#151028]";
  let badge = "bg-[#1a1c2e] text-slate-400 border border-slate-700";
  let badgeText = label;
  let dot = "border-slate-600";

  if (feedback === "correct") {
    border = "border-emerald-500/70 bg-emerald-500/10";
    badge = "bg-emerald-500 text-white border-emerald-400";
    badgeText = label;
    dot = "border-emerald-500";
  } else if (feedback === "incorrect") {
    border = "border-rose-500/70 bg-rose-500/10";
    badge = "bg-rose-500 text-white border-rose-400";
    badgeText = label;
    dot = "border-rose-500";
  } else if (feedback === "muted") {
    border = "border-slate-800/80 bg-[#0A0C18] opacity-45";
    badge = "bg-[#0A0C18] text-slate-600 border border-slate-800";
    dot = "border-slate-800";
  } else if (selected) {
    border = "border-[#8c32ff] bg-[#2a1758]/50 ring-1 ring-[#8c32ff]/40";
    badge = "bg-[#8c32ff] text-white border-[#8c32ff]";
    badgeText = label;
    dot = "border-[#9b66ff]";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`Option ${label}: ${text}${selected ? " (selected)" : ""}${
        feedback === "correct" ? " — correct answer" : feedback === "incorrect" ? " — your answer, incorrect" : ""
      }`}
      className={`group w-full text-left rounded-xl border transition-all duration-150 flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-3 sm:py-3.5 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b66ff] disabled:cursor-default ${border}`}
    >
      {/* Letter badge */}
      <span
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${badge}`}
      >
        {feedback === "correct" ? <Check className="w-4 h-4" strokeWidth={3} /> : feedback === "incorrect" ? <X className="w-4 h-4" strokeWidth={3} /> : badgeText}
      </span>

      {/* Option text */}
      <span className="flex-1 text-sm sm:text-[15px] leading-snug text-slate-200 font-medium">
        {text}
      </span>

      {/* Radio indicator (non-color cue for selection) */}
      <span
        aria-hidden="true"
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${dot}`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-[#9b66ff]" />}
        {feedback === "correct" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        {feedback === "incorrect" && <span className="w-2 h-2 rounded-full bg-rose-400" />}
      </span>
    </button>
  );
};
