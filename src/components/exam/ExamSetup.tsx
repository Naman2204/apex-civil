"use client";
import React, { useState } from "react";
import { Play, Clock, Brain, ArrowLeft, ShieldCheck, Database, Lightbulb, ChevronRight } from "lucide-react";
import { GlassCard, SectionHeader, Segmented, Btn } from "../ui/primitives";

export interface ExamConfig {
  mode: "PRACTICE" | "EXAM";
  chapter: string;
  difficulty: string;
  questionCount: number;
  timeLimitMinutes: number;
  negativeMarking: number;
}

interface ExamSetupProps {
  availableChapters: string[];
  totalAvailable: number;
  onStartExam: (config: ExamConfig) => void;
  prefilledChapter?: string;
  onBack?: () => void;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({ availableChapters, totalAvailable, onStartExam, prefilledChapter, onBack }) => {
  const [mode, setMode] = useState<"PRACTICE" | "EXAM">("PRACTICE");
  const [chapter, setChapter] = useState(prefilledChapter || "All");
  const [difficulty, setDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState(5);
  const [negativeMarking, setNegativeMarking] = useState(0.25);

  const handleStart = () => {
    onStartExam({
      mode,
      chapter,
      difficulty,
      questionCount,
      timeLimitMinutes: timeLimit,
      negativeMarking: mode === "EXAM" ? negativeMarking : 0,
    });
  };

  return (
    <div className="w-full pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-xl border border-app-border text-app-muted hover:text-app-text hover:border-app-border2 hover:bg-app-card transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
          Exam Session Configurator
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: config steps */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Step 1: Mode */}
          <GlassCard className="p-5">
            <SectionHeader number="1." title="Exam Mode" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setMode("PRACTICE")}
                className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                  mode === "PRACTICE"
                    ? "bg-accent-soft/50 border-accent/60 shadow-lg shadow-accent/20"
                    : "bg-app-deep border-app-border hover:border-app-border2"
                }`}
              >
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${mode === "PRACTICE" ? "bg-accent text-white" : "bg-app-card2 text-app-muted"}`}>
                  <Brain className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-app-text">Practice</span>
                  <span className="block text-[11px] text-app-muted mt-0.5">Instant Feedback</span>
                </span>
              </button>
              <button
                onClick={() => setMode("EXAM")}
                className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                  mode === "EXAM"
                    ? "bg-accent-soft/50 border-accent/60 shadow-lg shadow-accent/20"
                    : "bg-app-deep border-app-border hover:border-app-border2"
                }`}
              >
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${mode === "EXAM" ? "bg-accent text-white" : "bg-app-card2 text-app-muted"}`}>
                  <Clock className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-app-text">Strict Exam</span>
                  <span className="block text-[11px] text-app-muted mt-0.5">Timed</span>
                </span>
              </button>
            </div>
          </GlassCard>

          {/* Step 2: Topic */}
          <GlassCard className="p-5">
            <SectionHeader number="2." title="Topic / Chapter" />
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="mt-2 w-full bg-app-deep border border-app-border rounded-xl px-4 py-3 text-sm font-semibold text-app-text focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 transition-all appearance-none"
            >
              <option value="All">All Chapters (Mixed)</option>
              {availableChapters.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </GlassCard>

          {/* Step 3: Difficulty */}
          <GlassCard className="p-5">
            <SectionHeader number="3." title="Difficulty Level" />
            <div className="pt-2">
              <Segmented
                options={[
                  { value: "All", label: "All" },
                  { value: "Easy", label: "Easy" },
                  { value: "Medium", label: "Medium" },
                  { value: "Hard", label: "Hard" },
                ]}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </GlassCard>

          {/* Step 4: Number of Questions */}
          <GlassCard className="p-5">
            <SectionHeader number="4." title="Number of Questions" />
            <div className="pt-2">
              <Segmented
                options={[10, 25, 50, 100].map(n => ({ value: n, label: `${n}` }))}
                value={questionCount}
                onChange={setQuestionCount}
              />
            </div>
          </GlassCard>

          {/* Step 5: Time Limit */}
          <GlassCard className="p-5">
            <SectionHeader number="5." title="Time Limit" />
            <div className="pt-2">
              <Segmented
                options={[5, 15, 30, 60].map(m => ({ value: m, label: `${m} min` }))}
                value={timeLimit}
                onChange={setTimeLimit}
              />
            </div>
          </GlassCard>

          {/* Launch Exam */}
          <Btn
            onClick={handleStart}
            className="w-full py-4 text-base bg-gradient-to-r from-accent to-app-blue shadow-lg shadow-accent/30"
          >
            <Play className="w-5 h-5 fill-current" />
            Launch Exam
            <ChevronRight className="w-4 h-4" />
          </Btn>
        </div>

        {/* Right column: summary */}
        <div className="w-full lg:w-96 shrink-0">
          <GlassCard className="p-6 lg:sticky lg:top-24">
            <h3 className="text-base font-bold text-app-text tracking-tight">Exam Summary</h3>

            <div className="mt-5 divide-y divide-app-border">
              <SummaryRow label="Mode:" value={mode === "PRACTICE" ? "Practice" : "Strict Exam"} />
              <SummaryRow label="Topic:" value={chapter === "All" ? "All Chapters" : chapter} />
              <SummaryRow label="Difficulty:" value={difficulty === "All" ? "All" : difficulty} />
              <SummaryRow label="Questions:" value={`${questionCount}`} />
              {mode === "EXAM" && <SummaryRow label="Time Limit:" value={`${timeLimit} Minutes`} />}
              {mode === "EXAM" && <SummaryRow label="Negative Marking:" value={`−${(negativeMarking * 100).toFixed(0)}%`} />}
            </div>

            <div className="mt-6 bg-app-deep rounded-xl p-4 border border-app-border flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] text-app-faint font-bold uppercase tracking-wider mb-1">Total Questions Available:</p>
                <p className="text-2xl font-black text-app-text leading-none">{totalAvailable.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-app-faint shrink-0" />
            </div>

            {/* Tip — inside the summary card, per reference */}
            <div className="mt-6 pt-5 border-t border-app-border">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Lightbulb className="w-4 h-4" />
                <h4 className="text-xs font-bold text-app-text">Tip</h4>
              </div>
              <p className="text-xs text-app-muted leading-relaxed">
                Practice regularly to improve accuracy and speed. Start with mixed chapters to identify weak areas.
              </p>
            </div>

            <div className="flex justify-center items-center text-[10px] text-app-faint font-semibold gap-1.5 mt-5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Your progress will be saved automatically
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <p className="text-sm text-app-muted shrink-0">{label}</p>
      <p className="text-sm font-bold text-app-text text-right truncate">{value}</p>
    </div>
  );
}
