"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Eraser,
  Flag,
  LayoutGrid,
  ChevronLeft,
  ShieldAlert,
} from "lucide-react";
import { MCQQuestion } from "../../types/mcq";
import { ExamConfig } from "./ExamSetup";
import { AnswerOption } from "./AnswerOption";
import { QuestionPalette } from "./QuestionPalette";

interface LiveExamProps {
  questions: MCQQuestion[];
  config: ExamConfig;
  onFinish: (answers: Record<string, string>, timeTakenSeconds: number) => void;
  onCancel: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const LiveExam: React.FC<LiveExamProps> = ({ questions, config, onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(config.timeLimitMinutes * 60);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const questionsBtnRef = useRef<HTMLButtonElement>(null);

  // Dialog keyboard handling: Escape closes the palette drawer, and opening it
  // moves focus inside (close button); jumping from the drawer returns focus to
  // the Questions control so keyboard users are never left at BODY.
  useEffect(() => {
    if (!showMobilePalette) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMobilePalette(false);
    };
    window.addEventListener("keydown", onKey);
    drawerCloseRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [showMobilePalette]);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isWarning = timeLeft < 60; // Less than 1 minute
  const marking = config.negativeMarking || 0;

  const handleSubmit = () => {
    // Prevent duplicate submits from rapid clicks or repeated timer expiry.
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const timeTaken = config.timeLimitMinutes * 60 - timeLeft;
    onFinish(answers, timeTaken);
  };

  // Real countdown timer — auto-submits when it expires (existing behavior).
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, answers]);

  // Track visited questions for the palette's "Not Visited" state.
  useEffect(() => {
    setVisited((prev) => (prev.has(currentIndex) ? prev : new Set(prev).add(currentIndex)));
  }, [currentIndex]);

  const handleSelectOption = (qId: string, optionLabel: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionLabel }));
  };

  const handleClearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  };

  const toggleMarkForReview = () => {
    const qId = questions[currentIndex].id;
    setMarkedForReview((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const jumpTo = (idx: number) => {
    setCurrentIndex(idx);
    if (window.innerWidth < 1024) {
      setShowMobilePalette(false);
      // Return focus to the Questions control after the drawer closes.
      requestAnimationFrame(() => questionsBtnRef.current?.focus());
    }
  };

  const chapterLabel = config.chapter === "All" ? "All Chapters" : config.chapter;

  const palettePanel = (
    <div className="space-y-5">
      <QuestionPalette
        questions={questions}
        currentIndex={currentIndex}
        answered={answers}
        marked={markedForReview}
        visited={visited}
        onJump={jumpTo}
      />
      {/* Auto-submit notice */}
      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/90 leading-relaxed">
          The exam will be <span className="font-bold">automatically submitted</span> when the
          timer expires.
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full pb-28 lg:pb-0">
      <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start">
        {/* ================= Main column ================= */}
        <div className="flex-1 w-full space-y-5 min-w-0">
          {/* ---------- Sticky header: brand · timer · scoring · end ---------- */}
          <header className="sticky top-4 z-20 bp-card px-4 py-3 shadow-lg shadow-black/25">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label="End exam"
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shrink-0"
                  style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
                >
                  <X className="w-4 h-4 hover:text-[var(--status-danger)]" />
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--app-text)' }}>
                    Apex<span style={{ color: 'var(--accent)' }}>Civil</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] truncate" style={{ color: 'var(--app-faint)' }}>
                    <span className="font-semibold shrink-0" style={{ color: 'var(--app-muted)' }}>Simulated Exam</span>
                    <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--app-faint)' }} />
                    <span className="truncate font-medium" style={{ color: 'var(--accent)' }}>{chapterLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Scoring rules chip */}
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold"
                  style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}>
                  <span style={{ color: 'var(--status-success)' }}>+1.0</span>
                  <span style={{ color: 'var(--app-faint)' }}>/</span>
                  <span style={{ color: 'var(--status-danger)' }}>-{marking.toFixed(2)}</span>
                </span>

                {/* Time remaining */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold ${
                    isWarning
                      ? "bg-rose-500/15 border-rose-500/50 text-rose-300 animate-pulse"
                      : ""
                  }`}
                  style={!isWarning ? { background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-text)' } : {}}
                  role="timer"
                  aria-label={`Time remaining ${formatTime(timeLeft)}`}
                >
                  {isWarning ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                  <span>{formatTime(timeLeft)}</span>
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-500/25 transition-colors"
                >
                  End Exam
                </button>
              </div>
            </div>
          </header>

          {/* ---------- Question card ---------- */}
          <div className="bp-card p-5 sm:p-8 xl:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-faint)' }}>
                Question {currentIndex + 1} / {questions.length}
              </span>
              <span className="px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--accent)' }}>
                {currentQ.difficulty || "Medium"}
              </span>
              <span className="px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px] sm:max-w-[240px]" style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-faint)' }}>
                {currentQ.chapter || "General"}
              </span>
              {markedForReview[currentQ.id] && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--status-warning)', color: '#fff', opacity: 0.9 }}>
                  <Flag className="w-3 h-3" /> Marked
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl xl:text-2xl font-bold leading-relaxed mb-7" style={{ color: 'var(--app-text)' }}>
              {currentQ.question}
            </h2>

            <div className="space-y-3" role="radiogroup" aria-label={`Question ${currentIndex + 1} options`}>
              {currentQ.options.map((opt, optIdx) => (
                <AnswerOption
                  key={`${currentQ.id}-${opt.id}-${optIdx}`}
                  label={opt.label}
                  text={opt.text}
                  selected={answers[currentQ.id] === opt.label}
                  onSelect={() => handleSelectOption(currentQ.id, opt.label)}
                />
              ))}
            </div>

            {/* Clear Response · Mark for Review */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: 'var(--app-border)' }}>
              <button
                type="button"
                onClick={handleClearResponse}
                disabled={!answers[currentQ.id]}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-colors disabled:opacity-35 min-h-[40px] hover:brightness-110"
                style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear Response
              </button>
              <button
                type="button"
                onClick={toggleMarkForReview}
                aria-pressed={!!markedForReview[currentQ.id]}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-colors min-h-[40px] hover:brightness-110`}
                style={markedForReview[currentQ.id] ? { background: 'var(--status-warning)', borderColor: 'var(--status-warning)', color: '#fff' } : { background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
              >
                <Flag className="w-3.5 h-3.5" />
                {markedForReview[currentQ.id] ? "Unmark for Review" : "Mark for Review"}
              </button>
            </div>
          </div>

          {/* ---------- Desktop bottom controls (lg+; below lg the sticky bar handles this) ---------- */}
          <div className="hidden lg:flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-colors disabled:opacity-35 min-h-[44px] hover:brightness-110"
              style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60 min-h-[44px]"
                style={{ background: 'var(--status-success)', boxShadow: '0 0 20px var(--neon-teal)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? "Submitting…" : "Submit Exam"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.98] min-h-[44px]"
                style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 20px var(--neon-blue)' }}
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ================= Palette sidebar (desktop) ================= */}
        <aside aria-label="Question palette" className="hidden lg:block w-72 xl:w-80 shrink-0 lg:sticky lg:top-4">
          {palettePanel}
        </aside>
      </div>

      {/* ================= Mobile/tablet: sticky bottom nav (< lg) ================= */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t p-3 grid grid-cols-3 gap-2 backdrop-blur-xl" style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)' }}>
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="inline-flex items-center justify-center gap-1 rounded-xl border text-xs font-bold py-3 disabled:opacity-35 min-h-[44px]"
          style={{ background: 'var(--app-card)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <button
          ref={questionsBtnRef}
          type="button"
          onClick={() => setShowMobilePalette(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold py-3 min-h-[44px]"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          <LayoutGrid className="w-4 h-4" />
          Questions
        </button>
        {isLastQuestion ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl text-white text-xs font-bold py-3 disabled:opacity-60 min-h-[44px]"
            style={{ background: 'var(--status-success)' }}
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="inline-flex items-center justify-center gap-1 rounded-xl text-white text-xs font-bold py-3 min-h-[44px]"
            style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))' }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ================= Mobile/tablet palette drawer (< lg) ================= */}
      {showMobilePalette && (
        <div role="dialog" aria-modal="true" aria-label="Question palette" className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobilePalette(false)} />
          <div className="absolute right-0 top-0 h-full w-[85vw] max-w-[340px] border-l shadow-2xl overflow-y-auto p-5 flex flex-col"
            style={{ background: 'var(--app-card2)', borderColor: 'var(--app-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold" style={{ color: 'var(--app-text)' }} id="palette-drawer-title">Questions</h2>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setShowMobilePalette(false)}
                aria-label="Close question palette"
                className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:brightness-110"
                style={{ background: 'var(--app-bg)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {palettePanel}
          </div>
        </div>
      )}
    </div>
  );
};
