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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/60"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </button>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Apex<span className="text-[#9b66ff]">Civil</span> · Exam Portal
        </div>
      </div>

      {/* Main card */}
      <div className="bg-[#131627] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
        {/* Header band */}
        <div className="px-6 sm:px-10 pt-10 pb-8 text-center border-b border-slate-800/80 bg-gradient-to-b from-[#1e1541]/60 to-transparent">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5c2dd5] text-white shadow-[0_0_30px_rgba(92,45,213,0.45)] mb-5">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            EXAM INSTRUCTIONS
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {config.chapter === "All" ? "All Chapters (Mixed)" : config.chapter}
            {config.difficulty !== "All" && (
              <span className="ml-1.5 text-slate-500">· {config.difficulty}</span>
            )}
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <SummaryCard icon={<Layers className="w-4 h-4" />} value={String(questionCount)} label="Questions" tint="text-[#9b66ff] bg-[#2a1758]" />
            <SummaryCard icon={<Clock className="w-4 h-4" />} value={`${config.timeLimitMinutes}`} label="Minutes" tint="text-amber-400 bg-amber-500/10" />
            <SummaryCard icon={<CircleCheckBig className="w-4 h-4" />} value={`+1.0`} label="Correct Answer" tint="text-emerald-400 bg-emerald-500/10" />
            <SummaryCard icon={<CircleX className="w-4 h-4" />} value={`-${marking.toFixed(2)}`} label="Incorrect Answer" tint="text-rose-400 bg-rose-500/10" />
            <SummaryCard icon={<MinusCircle className="w-4 h-4" />} value={`0`} label="Skipped" tint="text-slate-400 bg-slate-500/10" />
            <SummaryCard icon={<Info className="w-4 h-4" />} value={String(questionCount)} label="Total Marks" tint="text-sky-400 bg-sky-500/10" />
          </div>

          {/* Rules */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
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
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#2a1758] text-[#9b66ff] text-[10px] font-black flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Auto-submit notice */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Time starts as soon as you begin. When the countdown reaches 00:00 your
              exam is submitted automatically with the answers you have selected.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 bg-[#8c32ff] hover:bg-[#7b24e6] active:scale-[0.99] text-white py-4 rounded-xl font-bold text-base shadow-[0_0_24px_rgba(140,50,255,0.4)] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Simulation
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-600 mt-4 flex items-center justify-center gap-1.5">
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
  <div className="bg-[#0A0C18] border border-slate-800 rounded-xl p-4 text-center">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${tint}`}>
      {icon}
    </div>
    <div className="text-lg font-black text-white leading-none">{value}</div>
    <div className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
  </div>
);
