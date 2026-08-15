"use client";
import React, { useEffect, useRef } from "react";
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  X,
  BookOpen,
  Timer,
  ChevronDown,
  Target,
  Gauge,
  MinusCircle,
} from "lucide-react";
import { MCQQuestion } from "../../types/mcq";
import { ExamConfig } from "./ExamSetup";

interface ExamResultsProps {
  questions: MCQQuestion[];
  answers: Record<string, string>;
  timeTakenSeconds: number;
  config: ExamConfig;
  onRetake: () => void;
  onReturnHome: () => void;
}

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const ExamResults: React.FC<ExamResultsProps> = ({
  questions,
  answers,
  timeTakenSeconds,
  config,
  onRetake,
  onReturnHome,
}) => {
  const isPractice = config.mode === "PRACTICE";

  let correctCount = 0;
  let wrongCount = 0;
  questions.forEach((q) => {
    if (answers[q.id]) {
      if (answers[q.id].toUpperCase() === q.correctAnswer.toUpperCase()) correctCount++;
      else wrongCount++;
    }
  });
  const skippedCount = questions.length - correctCount - wrongCount;

  let rawScore = correctCount;
  if (config.mode === "EXAM" && config.negativeMarking) {
    rawScore = correctCount - wrongCount * config.negativeMarking;
    rawScore = Math.max(0, rawScore);
  }

  const accuracyPct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const scorePct = questions.length > 0 ? Math.round((rawScore / questions.length) * 100) : 0;
  const chapterLabel = config.chapter === "All" ? "All Chapters (Mixed)" : config.chapter;

  const scrollToReview = () => {
    document.getElementById("exam-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const titleRef = useRef<HTMLHeadingElement>(null);
  // Move focus to the results title so keyboard users land somewhere meaningful
  // after Finish/Submit (the button that was focused unmounts with the old stage).
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* ---------- Hero / score banner ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e1541] via-[#131627] to-[#0A0C18] border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center shadow-2xl shadow-black/40">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#8c32ff]/15 blur-[110px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-white shadow-[0_0_30px_rgba(140,50,255,0.4)] ${
              isPractice ? "bg-[#8c32ff]" : "bg-[#5c2dd5]"
            }`}
          >
            {isPractice ? <Trophy className="w-8 h-8" /> : <Award className="w-8 h-8" />}
          </div>

          <h2
            ref={titleRef}
            tabIndex={-1}
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight focus:outline-none"
          >
            {isPractice ? "Practice Completed! 🎉" : "Exam Completed"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isPractice ? "Quick Practice" : "Simulated Exam"} ·{" "}
            <span className="text-[#9b66ff] font-semibold">{chapterLabel}</span>
          </p>

          {/* Score */}
          <div className="mt-7 flex items-end justify-center gap-3">
            <span className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-none">
              {isPractice ? `${correctCount}` : `${Math.round(rawScore * 100) / 100}`}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-500 mb-1">
              / {questions.length}
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a1758] border border-[#5c2dd5]/50 text-[#c4a8ff] text-sm font-bold">
            <Gauge className="w-4 h-4" />
            {isPractice ? accuracyPct : scorePct}% {isPractice ? "Accuracy" : "Score"}
          </div>

          {/* Stats grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <StatTile icon={<CheckCircle2 className="w-4 h-4" />} value={String(correctCount)} label="Correct" tint="text-emerald-400 bg-emerald-500/10 border-emerald-500/30" />
            <StatTile icon={<XCircle className="w-4 h-4" />} value={String(wrongCount)} label="Incorrect" tint="text-rose-400 bg-rose-500/10 border-rose-500/30" />
            <StatTile icon={<MinusCircle className="w-4 h-4" />} value={String(skippedCount)} label="Skipped" tint="text-slate-400 bg-slate-500/10 border-slate-700" />
            <StatTile icon={<Timer className="w-4 h-4" />} value={formatClock(timeTakenSeconds)} label="Time Taken" tint="text-[#9b66ff] bg-[#2a1758] border-[#5c2dd5]/50" />
          </div>

          {!isPractice && config.negativeMarking > 0 && (
            <p className="mt-4 text-[11px] text-slate-500 font-medium">
              Penalty applied: -{config.negativeMarking.toFixed(2)} × {wrongCount} incorrect ={" "}
              <span className="text-rose-400 font-bold">
                -{(wrongCount * config.negativeMarking).toFixed(2)}
              </span>
            </p>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToReview}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0A0C18] border border-slate-700/80 text-slate-300 text-sm font-bold hover:border-[#5c2dd5] hover:text-white transition-colors min-h-[44px]"
            >
              <BookOpen className="w-4 h-4 text-[#9b66ff]" />
              Review Answers
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl bg-[#8c32ff] hover:bg-[#7b24e6] text-white text-sm font-bold shadow-[0_0_20px_rgba(140,50,255,0.35)] transition-all min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              {isPractice ? "Practice Again" : "Take Another Exam"}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Detailed review ---------- */}
      <div id="exam-review" className="scroll-mt-24">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#9b66ff]" />
            Detailed Review
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {correctCount} correct · {wrongCount} incorrect · {skippedCount} skipped
          </span>
        </div>

        <div className="mt-6 space-y-5">
          {questions.map((q, qIdx) => {
            const userAns = answers[q.id];
            const isCorrect = !!userAns && userAns.toUpperCase() === q.correctAnswer.toUpperCase();

            return (
              <div
                key={q.id}
                className={`border rounded-2xl p-5 sm:p-6 space-y-5 transition-colors ${
                  isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                    : userAns
                    ? "border-rose-500/30 bg-rose-500/[0.04]"
                    : "border-slate-800 bg-[#131627]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Question {qIdx + 1} <span className="text-slate-700">/ {questions.length}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                      isCorrect
                        ? "bg-emerald-500/15 text-emerald-300"
                        : userAns
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </>
                    ) : userAns ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </>
                    ) : (
                      <>
                        <MinusCircle className="w-3.5 h-3.5" /> Skipped
                      </>
                    )}
                  </span>
                </div>

                <p className="text-base font-bold text-white leading-relaxed">{q.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oIdx) => {
                    const isUserPick = userAns === opt.label;
                    const isRightOpt = opt.label.toUpperCase() === q.correctAnswer.toUpperCase();

                    return (
                      <div
                        key={`${q.id}-${opt.id}-${oIdx}`}
                        className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                          isRightOpt
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                            : isUserPick
                            ? "border-rose-500/50 bg-rose-500/10 text-rose-100"
                            : "border-slate-800 bg-[#0A0C18] text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs ${
                            isRightOpt
                              ? "bg-emerald-500 text-white"
                              : isUserPick
                              ? "bg-rose-500 text-white"
                              : "bg-[#1a1c2e] text-slate-500"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className={isRightOpt || isUserPick ? "font-semibold" : ""}>{opt.text}</span>
                        {isRightOpt && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-auto" />}
                        {isUserPick && !isRightOpt && <X className="w-4 h-4 text-rose-400 shrink-0 ml-auto" />}
                      </div>
                    );
                  })}
                </div>

                {!isCorrect && q.explanation && (
                  <div className="bg-[#0A0C18] border border-slate-800 rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-[#9b66ff] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Explanation
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; value: string; label: string; tint: string }> = ({
  icon,
  value,
  label,
  tint,
}) => (
  <div className="bg-[#0A0C18]/80 border border-slate-800 rounded-xl p-3.5">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${tint}`}>{icon}</div>
    <div className="text-lg font-black text-white leading-none">{value}</div>
    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
  </div>
);
