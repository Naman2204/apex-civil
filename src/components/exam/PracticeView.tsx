"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronRight,
  X,
  Timer,
  Bookmark,
  BookmarkCheck,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  BookOpen,
  Layers,
  BarChart3,
  ListChecks,
  Zap,
} from "lucide-react";
import { MCQQuestion } from "../../types/mcq";
import { ExamConfig } from "./ExamSetup";
import { AnswerOption } from "./AnswerOption";
import { saveAttemptAnswer, toggleBookmark, finishExamAttempt } from "../../app/actions";

interface PracticeViewProps {
  questions: MCQQuestion[];
  config: ExamConfig;
  attemptId: string;
  onFinish: (answers: Record<string, string>, timeTakenSeconds: number) => void;
  onCancel: () => void;
}

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const PracticeView: React.FC<PracticeViewProps> = ({ questions, config, attemptId, onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Elapsed timer (learning mode — light timer, purely informational)
  useEffect(() => {
    const timer = setInterval(() => setTotalTimeTaken((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isAnswered = !!answers[currentQ.id];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  // After answering, the option buttons become disabled (browser drops their
  // focus), so move keyboard focus to the feedback panel — no focus dead end.
  useEffect(() => {
    if (isAnswered) feedbackRef.current?.focus();
  }, [isAnswered]);

  const correctOption = useMemo(
    () => currentQ.options.find((o) => o.label.toUpperCase() === currentQ.correctAnswer.toUpperCase()),
    [currentQ]
  );

  const handleSelectOption = async (optionLabel: string) => {
    if (isAnswered) return; // Lock answer after selection in practice mode (instant feedback)

    const timeForThisQ = Math.floor((new Date().getTime() - startTime) / 1000);

    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionLabel }));
    setTimeSpent((prev) => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + timeForThisQ }));

    const isCorrect = optionLabel.toUpperCase() === currentQ.correctAnswer.toUpperCase();

    // Save to DB in real-time
    await saveAttemptAnswer(attemptId, currentQ.id, optionLabel, isCorrect, timeForThisQ);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
    setStartTime(Date.now()); // Reset start time for next question
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setStartTime(Date.now()); // Reset start time for previous question
  };

  const handleToggleMarkForReview = () => {
    setMarkedForReview((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmit = async () => {
    if (submitting) return; // prevent double-submit on rapid clicks
    setSubmitting(true);
    try {
      await finishExamAttempt(attemptId, totalTimeTaken);
      onFinish(answers, totalTimeTaken);
    } catch (err) {
      // Surface the failure instead of silently losing the attempt (BUG-07).
      console.error("Failed to finish practice", err);
      alert("Failed to save your practice session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBookmark = async () => {
    const isBookmarkedNow = !bookmarked[currentQ.id];
    setBookmarked((prev) => ({ ...prev, [currentQ.id]: isBookmarkedNow }));
    await toggleBookmark(currentQ.id);
  };

  const chapterLabel = config.chapter === "All" ? "All Chapters" : config.chapter;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="w-full pb-16">
      {/* ---------- Sticky header: brand · breadcrumb · progress · timer ---------- */}
      <header className="sticky top-4 z-20 bg-[#131627]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-4 py-3 shadow-lg shadow-black/25">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Exit practice"
              className="w-8 h-8 rounded-lg bg-[#0A0C18] border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-black text-white leading-none tracking-tight">
                Apex<span className="text-[#9b66ff]">Civil</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate">
                <span className="font-semibold text-slate-300 shrink-0">Quick Practice</span>
                <ChevronRight className="w-3 h-3 shrink-0 text-slate-600" />
                <span className="truncate text-[#9b66ff] font-medium">{chapterLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A0C18] border border-slate-800 text-[11px] font-bold text-slate-400">
              <span className="text-emerald-400">{answeredCount}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">{questions.length}</span>
              <span className="text-slate-400">answered</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A0C18] border border-slate-800 text-slate-300 text-xs font-bold font-mono">
              <Timer className="w-3.5 h-3.5 text-[#9b66ff]" />
              {formatClock(totalTimeTaken)}
            </span>
            <button
              type="button"
              onClick={handleToggleBookmark}
              aria-pressed={!!bookmarked[currentQ.id]}
              aria-label={bookmarked[currentQ.id] ? "Remove bookmark" : "Bookmark this question"}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                bookmarked[currentQ.id]
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                  : "bg-[#0A0C18] border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {bookmarked[currentQ.id] ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress row */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-400">
            Question <span className="text-white">{currentIndex + 1}</span> / {questions.length}
          </span>
          <span className="text-[#9b66ff]">Progress {progressPct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-[#0A0C18] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5c2dd5] to-[#8c32ff] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* ---------- Workspace: question area + navigator column (desktop) ---------- */}
      <div className="mt-5 flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">
        {/* Main question column */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          {/* Question card */}
          <div className="bg-[#131627] border border-slate-800/80 rounded-2xl p-5 sm:p-8 xl:p-10">
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="px-2.5 py-1 rounded-md bg-[#0A0C18] border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Q{currentIndex + 1}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#0A0C18] border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-[#9b66ff]">
                {currentQ.difficulty || "Medium"}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#0A0C18] border border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[180px] sm:max-w-[320px]">
                {currentQ.chapter || "General"}
              </span>
              {markedForReview[currentQ.id] && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Flag className="w-3 h-3" /> Marked
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl xl:text-[22px] font-bold text-white leading-relaxed mb-7">
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="space-y-3" role="radiogroup" aria-label={`Question ${currentIndex + 1} options`}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === opt.label;
                const isCorrectOption = opt.label.toUpperCase() === currentQ.correctAnswer.toUpperCase();
                const feedback = isAnswered
                  ? isCorrectOption
                    ? "correct"
                    : isSelected
                    ? "incorrect"
                    : "muted"
                  : null;

                return (
                  <AnswerOption
                    key={`${currentQ.id}-${opt.id}-${optIdx}`}
                    label={opt.label}
                    text={opt.text}
                    selected={isSelected}
                    feedback={feedback}
                    disabled={isAnswered}
                    onSelect={() => handleSelectOption(opt.label)}
                  />
                );
              })}
            </div>

            {/* ---------- Feedback state ---------- */}
            {isAnswered && (
              <div
                ref={feedbackRef}
                tabIndex={-1}
                role="status"
                className="mt-6 focus:outline-none"
              >
                {answers[currentQ.id].toUpperCase() === currentQ.correctAnswer.toUpperCase() ? (
                  <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-300">✓ Correct</p>
                      <p className="text-xs text-slate-400 mt-1">
                        The correct answer is:{" "}
                        <span className="text-emerald-300 font-bold">
                          {correctOption?.label}. {correctOption?.text}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/40 rounded-xl p-4">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-rose-300">✗ Incorrect</p>
                      <p className="text-xs text-slate-400 mt-1">
                        The correct answer is:{" "}
                        <span className="text-emerald-300 font-bold">
                          {correctOption?.label}. {correctOption?.text}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {currentQ.explanation && (
                  <div className="mt-3 bg-[#0A0C18] border border-slate-800 rounded-xl p-4">
                    <h3 className="text-[10px] font-bold text-[#9b66ff] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Explanation
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---------- Controls ---------- */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0A0C18] border border-slate-700/80 text-slate-300 text-sm font-bold hover:border-[#5c2dd5] hover:text-white transition-colors disabled:opacity-35 disabled:hover:border-slate-700/80 disabled:hover:text-slate-300 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                aria-pressed={!!markedForReview[currentQ.id]}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-colors min-h-[44px] ${
                  markedForReview[currentQ.id]
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-[#0A0C18] border-slate-700/80 text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
                }`}
              >
                <Flag className="w-4 h-4" />
                <span>{markedForReview[currentQ.id] ? "Unmark" : "Mark for Review"}</span>
              </button>
            </div>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60 min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? "Finishing…" : "Finish Practice"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#8c32ff] hover:bg-[#7b24e6] text-white text-sm font-bold shadow-[0_0_20px_rgba(140,50,255,0.35)] transition-all active:scale-[0.98] min-h-[44px]"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ---------- Navigator / context column (desktop) ---------- */}
        <aside aria-label="Question navigator" className="hidden lg:block w-64 xl:w-72 shrink-0 lg:sticky lg:top-4 space-y-5">
          {/* Question navigator */}
          <div className="bg-[#131627] border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#9b66ff]" />
                Questions
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">{answeredCount}/{questions.length}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCur = idx === currentIndex;
                const isAns = !!answers[q.id];
                const isMarked = markedForReview[q.id];
                let cls = "bg-[#0A0C18] border-slate-800 text-slate-400 hover:border-slate-600";
                let state = "Not answered";
                if (isAns) { cls = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"; state = "Answered"; }
                if (isMarked) { cls = "bg-amber-500/10 border-amber-500/50 text-amber-300"; state = "Marked for review"; }
                if (isCur) { cls = "bg-[#2a1758] border-[#8c32ff] text-white ring-2 ring-[#8c32ff]/50"; state = "Current question"; }
                return (
                  <button
                    key={`${q.id}-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Question ${idx + 1}: ${state}`}
                    title={`Q${idx + 1} — ${state}`}
                    className={`relative w-full aspect-square rounded-lg text-xs font-bold border flex items-center justify-center transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b66ff] ${cls}`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <Flag aria-hidden="true" fill="currentColor" className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 drop-shadow" />
                    )}
                    {isAns && !isMarked && (
                      <span aria-hidden="true" className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#131627]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session summary */}
          <div className="bg-[#131627] border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#9b66ff]" />
              Session
            </h3>
            <SessionRow icon={<Layers className="w-3.5 h-3.5 text-[#9b66ff]" />} label="Chapter" value={chapterLabel} />
            <SessionRow icon={<BarChart3 className="w-3.5 h-3.5 text-emerald-400" />} label="Difficulty" value={config.difficulty === "All" ? "All Levels" : config.difficulty} />
            <SessionRow icon={<ListChecks className="w-3.5 h-3.5 text-amber-400" />} label="Questions" value={`${questions.length}`} />
            <SessionRow icon={<Zap className="w-3.5 h-3.5 text-sky-400" />} label="Mode" value="Practice · Instant Feedback" />
          </div>
        </aside>
      </div>
    </div>
  );
};

const SessionRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="flex items-center gap-2 text-slate-400 font-semibold shrink-0">
      {icon}
      {label}
    </span>
    <span className="text-slate-200 font-bold truncate text-right">{value}</span>
  </div>
);
