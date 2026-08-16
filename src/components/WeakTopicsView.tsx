"use client";
import React, { useEffect, useState } from "react";
import { TrendingUp, Play, Brain, Target, Zap } from "lucide-react";
import { getWeakTopics } from "../app/actions/analytics";
import { EmptyState, Btn } from "./ui/primitives";

interface WeakTopicsViewProps {
  onStartExam: (chapter?: string) => void;
}

const DIFFICULTY_COLORS: Record<string, { text: string; bg: string; bar: string }> = {
  High:   { text: 'text-rose-400',   bg: 'bg-rose-500/15 border-rose-500/30',   bar: 'from-rose-500 to-rose-400' },
  Medium: { text: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30', bar: 'from-amber-500 to-amber-400' },
  Low:    { text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', bar: 'from-emerald-500 to-emerald-400' },
};

function getDifficulty(accuracy: number): string {
  if (accuracy < 40) return 'High';
  if (accuracy < 65) return 'Medium';
  return 'Low';
}

function getWeightage(count: number): number {
  // Estimate weightage based on question count (higher count = higher weightage)
  if (count >= 500) return 15;
  if (count >= 300) return 12;
  if (count >= 200) return 10;
  if (count >= 100) return 8;
  return 5;
}

/* Neon icon for each topic */
function TopicIcon({ name, index }: { name: string; index: number }) {
  const colors = ['text-rose-400', 'text-purple-400', 'text-amber-400', 'text-cyan-400', 'text-emerald-400', 'text-sky-400'];
  const color = colors[index % colors.length];
  return (
    <div className={`w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${color}`}>
      {index === 0 ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10M12 21V3M3 7l9-4 9 4M3 17l9 4 9-4M3 12l9 4 9-4" /></svg>
       : index === 1 ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
       : index === 2 ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 18L3 12l5-6M16 6l5 6-5 6M11 4l2 16" /></svg>
       : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
      }
    </div>
  );
}

/* Glowing brain hero graphic */
function BrainHero() {
  return (
    <div className="relative w-36 h-36 shrink-0 hidden sm:block">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-fuchsia-500/20 blur-2xl" />
      {/* Gear ring */}
      <svg className="absolute inset-0 w-full h-full text-purple-400/20" viewBox="0 0 144 144" fill="none">
        <circle cx="72" cy="72" r="68" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="72" cy="72" r="55" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <div className="absolute inset-[20px] rounded-full bg-gradient-to-br from-[#1a0a3a] to-[#0a1628] border border-cyan-400/30 shadow-[0_0_40px_rgba(99,102,241,0.4),inset_0_0_30px_rgba(139,92,246,0.2)] flex items-center justify-center">
        <Brain className="w-14 h-14 text-cyan-300" style={{ filter: 'drop-shadow(0 0 12px rgba(103,232,249,0.8))' }} />
      </div>
      {/* Neon node dots */}
      {[
        { top: '2px', left: '30px', color: '#22d3ee' },
        { top: '10px', right: '8px', color: '#c084fc' },
        { bottom: '4px', left: '50px', color: '#34d399' },
        { top: '50px', left: '-2px', color: '#38bdf8' },
        { top: '20px', left: '10px', color: '#a78bfa' },
      ].map((dot, i) => (
        <span key={i} className="absolute w-2 h-2 rounded-full" style={{
          ...dot,
          background: dot.color,
          boxShadow: `0 0 8px ${dot.color}`,
        }} />
      ))}
    </div>
  );
}

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({ onStartExam }) => {
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchTopics() {
      try {
        const data = await getWeakTopics();
        if (!cancelled) setWeakTopics(data);
      } catch (err) {
        console.error("Failed to fetch weak topics:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTopics();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-pulse mb-4">
          <Brain className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Analyzing your performance…</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 space-y-6">
      {/* HERO banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f1a3a] via-[#1a0a3a] to-[#0f1a3a] border border-indigo-500/20 px-6 py-8 sm:px-10 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.2)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(6,182,212,0.1)_0%,transparent_60%)]" />
        <BrainHero />
        <div className="flex-1 min-w-0 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ApexCivil AI Weak Topic Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">AI-driven insight dashboard</p>
        </div>
        <button
          onClick={() => onStartExam()}
          className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold shadow-[0_0_24px_rgba(244,63,94,0.5)] hover:shadow-[0_0_32px_rgba(244,63,94,0.6)] transition-all shrink-0"
        >
          <Target className="w-4 h-4" />
          Target Weaknesses
        </button>
      </div>

      {weakTopics.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          tone="emerald"
          title="No weak topics detected"
          message="Complete more practice exams to build richer AI analysis of your performance."
          action={<Btn onClick={() => onStartExam()}>Start an Exam</Btn>}
        />
      ) : (
        <>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">AI Recommendation</h2>
            <p className="text-sm text-slate-400 mt-1">
              Focus on these specific sub-topics for maximum score improvement.
            </p>
          </div>

          <div className="space-y-3">
            {weakTopics.map((topic, index) => {
              const difficulty = getDifficulty(topic.accuracy);
              const weightage = getWeightage(topic.count);
              const style = DIFFICULTY_COLORS[difficulty];
              return (
                <div
                  key={topic.name}
                  className="rounded-2xl bg-[#0f111e] border border-slate-800/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-700 transition-colors"
                >
                  <TopicIcon name={topic.name} index={index} />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-white truncate mb-2">{topic.name}</h3>
                    {/* Progress bar with % bubble */}
                    <div className="relative w-full h-2 bg-slate-800 rounded-full">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${style.bar} transition-all`}
                        style={{ width: `${topic.accuracy}%` }}
                      />
                      <span className="absolute -top-5 text-[10px] font-bold text-white bg-slate-700 px-1.5 py-0.5 rounded"
                        style={{ left: `${Math.min(topic.accuracy, 92)}%`, transform: 'translateX(-50%)' }}>
                        {topic.accuracy}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Difficulty:</p>
                      <p className={`text-sm font-bold ${style.text}`}>{difficulty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Weightage:</p>
                      <p className="text-sm font-bold text-slate-300">{weightage}%</p>
                    </div>
                    <button
                      onClick={() => onStartExam(topic.name)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-bold transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      Practice Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
