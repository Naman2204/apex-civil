"use client";
import React from "react";
import {
  Play,
  X,
  Layers,
  Clock,
  CircleCheckBig,
  CircleX,
  MinusCircle,
  Info,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { ExamConfig } from "./ExamSetup";

interface ExamInstructionsProps {
  config: ExamConfig;
  questionCount: number;
  onStart: () => void;
  onCancel: () => void;
}

export const ExamInstructions: React.FC<ExamInstructionsProps> = ({
  config,
  questionCount,
  onStart,
  onCancel,
}) => {
  const marking = config.negativeMarking || 0;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors px-3 py-2 rounded-lg hover:brightness-125"
          style={{ color: 'var(--app-muted)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </button>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--app-muted)' }}>
          Apex<span style={{ color: 'var(--accent)' }}>Civil</span> · Exam Portal
        </div>
      </div>

      {/* Main card */}
      <div className="bp-card border rounded-2xl overflow-hidden shadow-2xl shadow-black/30" style={{ borderColor: 'var(--app-border)' }}>
        {/* Header band */}
        <div className="px-6 sm:px-10 pt-10 pb-8 text-center border-b" style={{ borderColor: 'var(--app-border)', background: 'linear-gradient(to bottom, var(--accent-soft), transparent)' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-5" style={{ background: 'var(--primary-start)', boxShadow: '0 0 30px var(--neon-blue)' }}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--app-text)' }}>
            EXAM INSTRUCTIONS
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--app-muted)' }}>
            {config.chapter === "All" ? "All Chapters (Mixed)" : config.chapter}
            {config.difficulty !== "All" && (
              <span className="ml-1.5" style={{ color: 'var(--app-faint)' }}>· {config.difficulty}</span>
            )}
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <SummaryCard icon={<Layers className="w-4 h-4" />} value={String(questionCount)} label="Questions" tint="bg-[var(--accent-soft)] text-[var(--accent)]" />
            <SummaryCard icon={<Clock className="w-4 h-4" />} value={`${config.timeLimitMinutes}`} label="Minutes" tint="bg-[var(--status-warning)]/10 text-[var(--status-warning)]" />
            <SummaryCard icon={<CircleCheckBig className="w-4 h-4" />} value={`+1.0`} label="Correct Answer" tint="bg-[var(--status-success)]/10 text-[var(--status-success)]" />
            <SummaryCard icon={<CircleX className="w-4 h-4" />} value={`-${marking.toFixed(2)}`} label="Incorrect Answer" tint="bg-[var(--status-danger)]/10 text-[var(--status-danger)]" />
            <SummaryCard icon={<MinusCircle className="w-4 h-4" />} value={`0`} label="Skipped" tint="bg-[var(--app-bg)] text-[var(--app-faint)]" />
            <SummaryCard icon={<Info className="w-4 h-4" />} value={String(questionCount)} label="Total Marks" tint="bg-sky-500/10 text-sky-400" />
          </div>

          {/* Rules */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--app-muted)' }}>
              Rules &amp; Guidelines
            </h3>
            <ul className="space-y-3">
              {[
                "You can navigate between questions anytime using the question palette.",
                "You can mark questions for review and return to them before submitting.",
                "Unanswered questions will not be marked — answer carefully.",
                `Negative marking of -${marking.toFixed(2)} is applicable per incorrect answer as configured.`,
                "The exam will be automatically submitted when the timer expires.",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: 'var(--app-muted)' }}>
                  <span className="mt-0.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--app-text)' }}>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Auto-submit notice */}
          <div className="flex items-start gap-3 border rounded-xl p-4" style={{ background: 'var(--status-warning-soft)', borderColor: 'var(--status-warning)' }}>
            <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--status-warning)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--app-text)' }}>
              Time starts as soon as you begin. When the countdown reaches 00:00 your
              exam is submitted automatically with the answers you have selected.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 active:scale-[0.99] text-white py-4 rounded-xl font-bold text-base transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 24px var(--neon-blue)' }}
          >
            <Play className="w-5 h-5 fill-current" />
            Start Simulation
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] mt-4 flex items-center justify-center gap-1.5" style={{ color: 'var(--app-faint)' }}>
        <X className="w-3 h-3" /> Review the instructions above before beginning your exam.
      </p>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; value: string; label: string; tint: string }> = ({
  icon,
  value,
  label,
  tint,
}) => (
  <div className="border rounded-xl p-4 text-center" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)' }}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${tint}`}>
      {icon}
    </div>
    <div className="text-lg font-black leading-none" style={{ color: 'var(--app-text)' }}>{value}</div>
    <div className="text-[10px] font-semibold mt-1 uppercase tracking-wider" style={{ color: 'var(--app-muted)' }}>{label}</div>
  </div>
);
