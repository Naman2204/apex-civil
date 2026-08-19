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
      <div className="relative overflow-hidden border rounded-2xl p-8 sm:p-12 text-center shadow-2xl shadow-black/40" style={{ background: 'var(--app-card)', borderColor: 'var(--app-border)' }}>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 blur-[110px] rounded-full pointer-events-none" style={{ background: 'var(--neon-purple)', opacity: 0.15 }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 blur-[90px] rounded-full pointer-events-none" style={{ background: 'var(--neon-teal)', opacity: 0.05 }} />

        <div className="relative z-10">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-white`}
            style={{ background: isPractice ? 'var(--accent)' : 'var(--primary-start)', boxShadow: '0 0 30px var(--neon-blue)' }}
          >
            {isPractice ? <Trophy className="w-8 h-8" /> : <Award className="w-8 h-8" />}
          </div>

          <h2
            ref={titleRef}
            tabIndex={-1}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight focus:outline-none" style={{ color: 'var(--app-text)' }}
          >
            {isPractice ? "Practice Completed! 🎉" : "Exam Completed"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--app-muted)' }}>
            {isPractice ? "Quick Practice" : "Simulated Exam"} ·{" "}
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{chapterLabel}</span>
          </p>

          {/* Score */}
          <div className="mt-7 flex items-end justify-center gap-3">
            <span className="text-6xl sm:text-7xl font-black tracking-tight leading-none" style={{ color: 'var(--app-text)' }}>
              {isPractice ? `${correctCount}` : `${Math.round(rawScore * 100) / 100}`}
            </span>
            <span className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--app-faint)' }}>
              / {questions.length}
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold" style={{ background: 'var(--accent-soft)', borderColor: 'var(--app-border)', color: 'var(--accent)' }}>
            <Gauge className="w-4 h-4" />
            {isPractice ? accuracyPct : scorePct}% {isPractice ? "Accuracy" : "Score"}
          </div>

          {/* Stats grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <StatTile icon={<CheckCircle2 className="w-4 h-4" />} value={String(correctCount)} label="Correct" tint="bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/30" />
            <StatTile icon={<XCircle className="w-4 h-4" />} value={String(wrongCount)} label="Incorrect" tint="bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30" />
            <StatTile icon={<MinusCircle className="w-4 h-4" />} value={String(skippedCount)} label="Skipped" tint="bg-[var(--app-bg)] text-[var(--app-faint)] border-[var(--app-border)]" />
            <StatTile icon={<Timer className="w-4 h-4" />} value={formatClock(timeTakenSeconds)} label="Time Taken" tint="bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--app-border)]" />
          </div>

          {!isPractice && config.negativeMarking > 0 && (
            <p className="mt-4 text-[11px] font-medium" style={{ color: 'var(--app-muted)' }}>
              Penalty applied: -{config.negativeMarking.toFixed(2)} × {wrongCount} incorrect ={" "}
              <span className="font-bold" style={{ color: 'var(--status-danger)' }}>
                -{(wrongCount * config.negativeMarking).toFixed(2)}
              </span>
            </p>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToReview}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl border text-sm font-bold transition-colors min-h-[44px] hover:brightness-110"
              style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
            >
              <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Review Answers
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--app-muted)' }} />
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl text-white text-sm font-bold transition-all min-h-[44px] hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 20px var(--neon-blue)' }}
            >
              <RotateCcw className="w-4 h-4" />
              {isPractice ? "Practice Again" : "Take Another Exam"}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Detailed review ---------- */}
      <div id="exam-review" className="scroll-mt-24">
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--app-border)' }}>
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--app-text)' }}>
            <Target className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            Detailed Review
          </h3>
          <span className="text-xs font-semibold" style={{ color: 'var(--app-muted)' }}>
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
                className={`border rounded-2xl p-5 sm:p-6 space-y-5 transition-colors`}
                style={{
                  background: isCorrect ? 'var(--status-success-soft)' : userAns ? 'var(--status-danger-soft)' : 'var(--app-card2)',
                  borderColor: isCorrect ? 'var(--status-success)' : userAns ? 'var(--status-danger)' : 'var(--app-border)'
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--app-muted)' }}>
                    Question {qIdx + 1} <span style={{ color: 'var(--app-faint)' }}>/ {questions.length}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold`}
                    style={{
                      background: isCorrect ? 'var(--status-success-soft)' : userAns ? 'var(--status-danger-soft)' : 'var(--app-bg)',
                      color: isCorrect ? 'var(--status-success)' : userAns ? 'var(--status-danger)' : 'var(--app-faint)'
                    }}
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

                <p className="text-base font-bold leading-relaxed" style={{ color: 'var(--app-text)' }}>{q.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oIdx) => {
                    const isUserPick = userAns === opt.label;
                    const isRightOpt = opt.label.toUpperCase() === q.correctAnswer.toUpperCase();

                    return (
                      <div
                        key={`${q.id}-${opt.id}-${oIdx}`}
                        className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors`}
                        style={{
                          background: isRightOpt ? 'var(--status-success-soft)' : isUserPick ? 'var(--status-danger-soft)' : 'var(--app-bg)',
                          borderColor: isRightOpt ? 'var(--status-success)' : isUserPick ? 'var(--status-danger)' : 'var(--app-border)',
                          color: isRightOpt ? 'var(--status-success)' : isUserPick ? 'var(--status-danger)' : 'var(--app-muted)'
                        }}
                      >
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs`}
                          style={{
                            background: isRightOpt ? 'var(--status-success)' : isUserPick ? 'var(--status-danger)' : 'var(--app-card2)',
                            color: isRightOpt || isUserPick ? '#fff' : 'var(--app-muted)'
                          }}
                        >
                          {opt.label}
                        </span>
                        <span className={isRightOpt || isUserPick ? "font-semibold" : ""}>{opt.text}</span>
                        {isRightOpt && <Check className="w-4 h-4 shrink-0 ml-auto" style={{ color: 'var(--status-success)' }} />}
                        {isUserPick && !isRightOpt && <X className="w-4 h-4 shrink-0 ml-auto" style={{ color: 'var(--status-danger)' }} />}
                      </div>
                    );
                  })}
                </div>

                {!isCorrect && q.explanation && (
                  <div className="border rounded-xl p-4" style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)' }}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                      <BookOpen className="w-3.5 h-3.5" /> Explanation
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--app-muted)' }}>{q.explanation}</p>
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
  <div className="bp-card border rounded-xl p-3.5" style={{ borderColor: 'var(--app-border)' }}>
    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto mb-1.5 ${tint}`}>{icon}</div>
    <div className="text-lg font-black leading-none" style={{ color: 'var(--app-text)' }}>{value}</div>
    <div className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--app-muted)' }}>{label}</div>
  </div>
);
