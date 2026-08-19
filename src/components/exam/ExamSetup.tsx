"use client";
import React, { useState } from "react";
import { Play, Clock, Zap, Database, ChevronDown } from "lucide-react";

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

/* ── Shared card style ── */
const CARD_STYLE = {
  background: 'var(--app-card)',
  border: '1px solid var(--app-border)',
  borderRadius: '1rem',
  boxShadow: 'var(--card-shadow)',
} as const;

/* ── Pill selector ── */
function PillGroup<T extends string | number>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={String(o.value)} type="button" onClick={() => onChange(o.value)}
            className="h-9 px-4 rounded-xl text-sm font-bold transition-all"
            style={active ? {
              background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))',
              color: '#fff',
              boxShadow: '0 0 16px var(--neon-blue)',
            } : {
              background: 'var(--accent-soft)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-muted)',
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const ModeCard = ({ id, label, desc, icon: Icon, active, onSelect }: { 
  id: "PRACTICE" | "EXAM"; 
  label: string; 
  desc: string; 
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onSelect: (id: "PRACTICE" | "EXAM") => void;
}) => {
  return (
    <button type="button" onClick={() => onSelect(id)}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all min-h-[160px] justify-center text-center"
      style={active ? {
        background: 'linear-gradient(135deg, var(--app-border2), var(--accent-soft))',
        border: '1px solid var(--accent)',
        boxShadow: '0 0 24px var(--neon-blue)',
      } : {
        background: 'var(--app-bg)',
        border: '1px solid var(--app-border)',
      }}>
      <span className="w-14 h-14 flex items-center justify-center rounded-full"
        style={active
          ? { background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 20px var(--neon-blue)' }
          : { background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
        <span style={{ color: active ? '#fff' : 'var(--accent)', display: 'flex' }}>
          <Icon className="w-7 h-7" />
        </span>
      </span>
      <span className="text-lg font-bold" style={{ color: active ? 'var(--app-text)' : 'var(--app-muted)' }}>{label}</span>
      <span className="text-sm leading-snug" style={{ color: active ? 'var(--accent)' : 'var(--app-faint)' }}>{desc}</span>
    </button>
  );
};

export const ExamSetup: React.FC<ExamSetupProps> = ({ availableChapters, totalAvailable, onStartExam, prefilledChapter }) => {
  const [mode, setMode] = useState<"PRACTICE" | "EXAM">("PRACTICE");
  const [chapter, setChapter] = useState(prefilledChapter || "All");
  const [difficulty, setDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState(5);
  const [negativeMarking, setNegativeMarking] = useState(0.25);

  const handleStart = () => {
    onStartExam({ mode, chapter, difficulty, questionCount, timeLimitMinutes: timeLimit, negativeMarking: mode === "EXAM" ? negativeMarking : 0 });
  };


  return (
    <section className="w-full pb-12 space-y-6 font-sans">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--accent)]">Configure Session</p>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[var(--app-text)] leading-tight">Configure Your Exam</h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Customize your practice session from our pool of{' '}
          <span className="font-bold text-[var(--accent)]">{totalAvailable.toLocaleString()}</span> questions.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--app-border2)] bg-[var(--app-card)]/40 p-5 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-8">
        {/* Left panel */}
        <div className="space-y-5 min-w-0">
          {/* Mode selection */}
          <div className="rounded-2xl p-5 bg-app-card border border-app-border" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--app-muted)' }}>Exam Mode</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModeCard id="PRACTICE" label="Practice" desc="Get instant feedback after every question." icon={Zap} active={mode === 'PRACTICE'} onSelect={setMode} />
              <ModeCard id="EXAM" label="Strict Exam" desc="Attempt questions under timed exam conditions." icon={Clock} active={mode === 'EXAM'} onSelect={setMode} />
            </div>
          </div>

          {/* Chapter */}
          <div className="rounded-2xl p-5 bg-app-card border border-app-border" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
            <label className="text-sm font-bold block mb-3" style={{ color: 'var(--app-muted)' }}>Topic / Chapter</label>
            <div className="relative">
              <select value={chapter} onChange={e => setChapter(e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm font-semibold pr-10 focus:outline-none focus:ring-1"
                style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border2)', color: 'var(--app-text)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <option value="All">All Chapters (Mixed)</option>
                {availableChapters.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          {/* Difficulty & Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-5" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
              <p className="text-sm font-bold mb-3" style={{ color: 'var(--app-muted)' }}>Difficulty Level</p>
              <PillGroup options={["All", "Easy", "Medium", "Hard"].map(v => ({ value: v, label: v }))} value={difficulty} onChange={setDifficulty} />
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
              <p className="text-sm font-bold mb-3" style={{ color: 'var(--app-muted)' }}>Number of Questions</p>
              <PillGroup options={[10, 25, 50, 100].map(n => ({ value: n, label: `${n}` }))} value={questionCount} onChange={setQuestionCount} />
            </div>
          </div>

          {/* Time limit — EXAM mode only */}
          {mode === "EXAM" && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
              <p className="text-sm font-bold mb-3" style={{ color: 'var(--app-muted)' }}>Time Limit</p>
              <PillGroup options={[5, 15, 30, 60].map(m => ({ value: m, label: `${m} min` }))} value={timeLimit} onChange={setTimeLimit} />
            </div>
          )}
        </div>

        {/* Right sidebar — Exam Summary */}
        <aside className="space-y-4">
          {/* Summary card */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--app-text)' }}>Exam Summary</h2>
            <div className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
              {[
                { label: 'Mode',       value: mode === 'PRACTICE' ? 'Practice' : 'Strict Exam' },
                { label: 'Topic',      value: chapter === 'All' ? 'All Chapters (Mixed)' : chapter },
                { label: 'Difficulty', value: difficulty === 'All' ? 'All Levels' : difficulty },
                { label: 'Questions',  value: `${questionCount}` },
                ...(mode === 'EXAM' ? [{ label: 'Time', value: `${timeLimit} min` }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm shrink-0" style={{ color: 'var(--app-muted)' }}>{row.label}</p>
                  <p className="text-sm font-bold text-right truncate" style={{ color: 'var(--app-text)' }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total available */}
          <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--app-muted)' }}>Total Questions Available</p>
              <p className="text-4xl font-black leading-none" style={{ color: 'var(--app-text)' }}>{totalAvailable.toLocaleString()}</p>
            </div>
            <Database className="h-10 w-10" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
          </div>

          {/* CTA */}
          <button onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, var(--primary-start) 0%, var(--primary-end) 100%)',
              color: '#fff',
              boxShadow: '0 0 32px var(--neon-blue), 0 0 64px var(--neon-teal)',
            }}>
            <Play className="h-5 w-5 fill-current" />
            Start {mode === "PRACTICE" ? "Practice" : "Exam"} Now
          </button>
        </aside>
        </div>
      </div>
    </section>
  );
};
