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
import { BrandLogo } from "../ui/BrandLogo";

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
      <header className="sticky top-4 z-20 backdrop-blur-xl border rounded-2xl px-4 py-3 shadow-lg shadow-black/25" style={{ background: 'var(--app-bg-alpha)', borderColor: 'var(--app-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Exit practice"
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shrink-0 hover:brightness-125"
              style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <BrandLogo className="[&>svg]:h-7 [&>svg]:w-7 [&>span]:text-base" />
              <div className="mt-1 flex items-center gap-1 text-[11px] truncate" style={{ color: 'var(--app-muted)' }}>
                <span className="font-semibold shrink-0" style={{ color: 'var(--app-text)' }}>Quick Practice</span>
                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--app-faint)' }} />
                <span className="truncate font-medium" style={{ color: 'var(--accent)' }}>{chapterLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}>
              <span style={{ color: 'var(--status-success)' }}>{answeredCount}</span>
              <span style={{ color: 'var(--app-faint)' }}>/</span>
              <span style={{ color: 'var(--app-text)' }}>{questions.length}</span>
              <span>answered</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold font-mono" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-text)' }}>
              <Timer className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              {formatClock(totalTimeTaken)}
            </span>
            <button
              type="button"
              onClick={handleToggleBookmark}
              aria-pressed={!!bookmarked[currentQ.id]}
              aria-label={bookmarked[currentQ.id] ? "Remove bookmark" : "Bookmark this question"}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors`}
              style={bookmarked[currentQ.id] ? {
                background: 'var(--status-warning-soft)', borderColor: 'var(--status-warning)', color: 'var(--status-warning)'
              } : {
                background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-muted)'
              }}
            >
              {bookmarked[currentQ.id] ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress row */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
          <span style={{ color: 'var(--app-muted)' }}>
            Question <span style={{ color: 'var(--app-text)' }}>{currentIndex + 1}</span> / {questions.length}
          </span>
          <span style={{ color: 'var(--accent)' }}>Progress {progressPct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--app-card2)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--primary-start), var(--primary-end))' }}
          />
        </div>
      </header>

      {/* ---------- Workspace: question area + navigator column (desktop) ---------- */}
      <div className="mt-5 flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">
        {/* Main question column */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          {/* Question card */}
          <div className="bp-card border rounded-2xl p-5 sm:p-8 xl:p-10" style={{ borderColor: 'var(--app-border)' }}>
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}>
                Q{currentIndex + 1}
              </span>
              <span className="px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--accent)' }}>
                {currentQ.difficulty || "Medium"}
              </span>
              <span className="px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider truncate max-w-[180px] sm:max-w-[320px]" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}>
                {currentQ.chapter || "General"}
              </span>
              {markedForReview[currentQ.id] && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--status-warning-soft)', borderColor: 'var(--status-warning)', color: 'var(--status-warning)' }}>
                  <Flag className="w-3 h-3" /> Marked
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl xl:text-[22px] font-bold leading-relaxed mb-7" style={{ color: 'var(--app-text)' }}>
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
                  <div className="flex items-start gap-3 border rounded-xl p-4" style={{ background: 'var(--status-success-soft)', borderColor: 'var(--status-success)' }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--status-success)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--status-success)' }}>✓ Correct</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--app-muted)' }}>
                        The correct answer is:{" "}
                        <span className="font-bold" style={{ color: 'var(--status-success)' }}>
                          {correctOption?.label}. {correctOption?.text}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 border rounded-xl p-4" style={{ background: 'var(--status-danger-soft)', borderColor: 'var(--status-danger)' }}>
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--status-danger)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--status-danger)' }}>✗ Incorrect</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--app-muted)' }}>
                        The correct answer is:{" "}
                        <span className="font-bold" style={{ color: 'var(--status-success)' }}>
                          {correctOption?.label}. {correctOption?.text}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {currentQ.explanation && (
                  <div className="mt-3 border rounded-xl p-4" style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)' }}>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                      <BookOpen className="w-3.5 h-3.5" /> Explanation
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--app-text)' }}>{currentQ.explanation}</p>
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
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-colors disabled:opacity-35 min-h-[44px] hover:brightness-125"
                style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                aria-pressed={!!markedForReview[currentQ.id]}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-colors min-h-[44px] hover:brightness-125`}
                style={markedForReview[currentQ.id] ? {
                  background: 'var(--status-warning-soft)', borderColor: 'var(--status-warning)', color: 'var(--status-warning)'
                } : {
                  background: 'var(--app-card2)', borderColor: 'var(--app-border)', color: 'var(--app-text)'
                }}
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
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60 min-h-[44px] hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--status-success), #10b981)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? "Finishing…" : "Finish Practice"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.98] min-h-[44px] hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 20px var(--neon-blue)' }}
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
          <div className="bp-card border rounded-2xl p-5" style={{ borderColor: 'var(--app-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--app-muted)' }}>
                <ListChecks className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Questions
              </h3>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--app-faint)' }}>{answeredCount}/{questions.length}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCur = idx === currentIndex;
                const isAns = !!answers[q.id];
                const isMarked = markedForReview[q.id];
                let bg = 'var(--app-card2)';
                let bc = 'var(--app-border)';
                let c = 'var(--app-muted)';
                let state = "Not answered";

                if (isAns) { bg = 'var(--status-success-soft)'; bc = 'var(--status-success)'; c = 'var(--status-success)'; state = "Answered"; }
                if (isMarked) { bg = 'var(--status-warning-soft)'; bc = 'var(--status-warning)'; c = 'var(--status-warning)'; state = "Marked for review"; }
                if (isCur) { bg = 'var(--accent-soft)'; bc = 'var(--accent)'; c = '#fff'; state = "Current question"; }

                return (
                  <button
                    key={`${q.id}-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Question ${idx + 1}: ${state}`}
                    title={`Q${idx + 1} — ${state}`}
                    className={`relative w-full aspect-square rounded-lg text-xs font-bold border flex items-center justify-center transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2`}
                    style={{ background: bg, borderColor: bc, color: c, '--tw-ring-color': 'var(--accent)' } as any}
                  >
                    {idx + 1}
                    {isMarked && (
                      <Flag aria-hidden="true" fill="currentColor" className="absolute -top-1 -right-1 w-3 h-3 drop-shadow" style={{ color: 'var(--status-warning)' }} />
                    )}
                    {isAns && !isMarked && (
                      <span aria-hidden="true" className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ring-2" style={{ background: 'var(--status-success)', borderColor: 'var(--app-bg)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session summary */}
          <div className="bp-card border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--app-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--app-muted)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Session
            </h3>
            <SessionRow icon={<Layers className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />} label="Chapter" value={chapterLabel} />
            <SessionRow icon={<BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--status-success)' }} />} label="Difficulty" value={config.difficulty === "All" ? "All Levels" : config.difficulty} />
            <SessionRow icon={<ListChecks className="w-3.5 h-3.5" style={{ color: 'var(--status-warning)' }} />} label="Questions" value={`${questions.length}`} />
            <SessionRow icon={<Zap className="w-3.5 h-3.5" style={{ color: 'var(--neon-teal)' }} />} label="Mode" value="Practice · Instant Feedback" />
          </div>
        </aside>
      </div>
    </div>
  );
};

const SessionRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="flex items-center gap-2 font-semibold shrink-0" style={{ color: 'var(--app-muted)' }}>
      {icon}
      {label}
    </span>
    <span className="font-bold truncate text-right" style={{ color: 'var(--app-text)' }}>{value}</span>
  </div>
);
