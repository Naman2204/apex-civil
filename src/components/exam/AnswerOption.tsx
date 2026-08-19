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
  let border = "border-[var(--app-border)] bg-[var(--app-bg)] hover:border-[var(--accent)] hover:bg-[var(--app-card)]";
  let badge = "bg-[var(--app-card2)] text-[var(--app-muted)] border border-[var(--app-border)]";
  let badgeText = label;
  let dot = "border-[var(--app-faint)]";

  if (feedback === "correct") {
    border = "border-[var(--status-success)] bg-[var(--status-success)]/10";
    badge = "bg-[var(--status-success)] text-white border-[var(--status-success)]";
    badgeText = label;
    dot = "border-[var(--status-success)]";
  } else if (feedback === "incorrect") {
    border = "border-[var(--status-danger)] bg-[var(--status-danger)]/10";
    badge = "bg-[var(--status-danger)] text-white border-[var(--status-danger)]";
    badgeText = label;
    dot = "border-[var(--status-danger)]";
  } else if (feedback === "muted") {
    border = "border-[var(--app-border)] bg-[var(--app-bg)] opacity-45";
    badge = "bg-[var(--app-bg)] text-[var(--app-faint)] border border-[var(--app-border)]";
    dot = "border-[var(--app-border)]";
  } else if (selected) {
    border = "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/40";
    badge = "bg-[var(--accent)] text-white border-[var(--accent)]";
    badgeText = label;
    dot = "border-[var(--accent)]";
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
      className={`group w-full text-left rounded-xl border transition-all duration-150 flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-3 sm:py-3.5 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-default ${border}`}
    >
      {/* Letter badge */}
      <span
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${badge}`}
      >
        {feedback === "correct" ? <Check className="w-4 h-4" strokeWidth={3} /> : feedback === "incorrect" ? <X className="w-4 h-4" strokeWidth={3} /> : badgeText}
      </span>

      {/* Option text */}
      <span className="flex-1 text-sm sm:text-[15px] leading-snug font-medium" style={{ color: 'var(--app-text)' }}>
        {text}
      </span>

      {/* Radio indicator (non-color cue for selection) */}
      <span
        aria-hidden="true"
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${dot}`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
        {feedback === "correct" && <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />}
        {feedback === "incorrect" && <span className="w-2 h-2 rounded-full bg-[var(--status-danger)]" />}
      </span>
    </button>
  );
};
