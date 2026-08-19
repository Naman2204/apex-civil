"use client";
import React, { useEffect, useState } from "react";
// Force HMR update
import { Brain, ArrowRight, Layers, Target, Lightbulb, ClipboardList, TrendingUp } from "lucide-react";
import { getWeakTopics } from "../app/actions/analytics";
import { getDashboardStats } from "../app/actions/dashboard";

interface WeakTopicsViewProps {
  onStartExam: (chapter?: string) => void;
}

/* ── Civil Engineering isometric illustrations ── */
function BridgeIllustration({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" style={{ opacity }}>
      <defs>
        <linearGradient id="bridgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Road deck */}
      <rect x="10" y="70" width="140" height="8" rx="1" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.5)" strokeWidth="1" />
      {/* Main towers */}
      <rect x="40" y="30" width="8" height="48" rx="1" fill="url(#bridgeGrad)" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' }} />
      <rect x="112" y="30" width="8" height="48" rx="1" fill="url(#bridgeGrad)" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' }} />
      {/* Tower crossbars */}
      <rect x="36" y="40" width="16" height="3" rx="1" fill="rgba(168,85,247,0.6)" />
      <rect x="108" y="40" width="16" height="3" rx="1" fill="rgba(168,85,247,0.6)" />
      <rect x="36" y="52" width="16" height="3" rx="1" fill="rgba(168,85,247,0.5)" />
      <rect x="108" y="52" width="16" height="3" rx="1" fill="rgba(168,85,247,0.5)" />
      {/* Suspension cables */}
      <path d="M 44 32 Q 80 58 116 32" stroke="rgba(168,85,247,0.7)" strokeWidth="1.5" fill="none" />
      <path d="M 44 32 Q 80 65 116 32" stroke="rgba(168,85,247,0.4)" strokeWidth="1" fill="none" />
      {/* Vertical cables */}
      {[55, 65, 75, 85, 95, 105].map((x, i) => (
        <line key={i} x1={x} y1={50 + Math.abs(i - 2.5) * 2} x2={x} y2="70" stroke="rgba(168,85,247,0.4)" strokeWidth="0.8" />
      ))}
      {/* Foundation */}
      <rect x="30" y="78" width="20" height="6" rx="1" fill="rgba(168,85,247,0.3)" />
      <rect x="110" y="78" width="20" height="6" rx="1" fill="rgba(168,85,247,0.3)" />
      {/* Glow base */}
      <ellipse cx="80" cy="88" rx="60" ry="6" fill="rgba(168,85,247,0.12)" />
    </svg>
  );
}

function BuildingIllustration({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" style={{ opacity }}>
      <defs>
        <linearGradient id="buildGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#065f46" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="buildSide" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Main tower - front face (isometric) */}
      <path d="M 50 25 L 80 10 L 110 25 L 110 85 L 80 100 L 50 85 Z" fill="url(#buildGrad)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
      <path d="M 80 10 L 110 25 L 110 85 L 80 70 Z" fill="url(#buildSide)" stroke="rgba(16,185,129,0.3)" strokeWidth="0.8" />
      {/* Windows grid */}
      {[30, 42, 54, 66, 78].map((y, row) =>
        [58, 68, 78].map((x, col) => (
          <rect key={`${row}-${col}`} x={x} y={y} width="6" height="7" rx="0.5"
            fill="rgba(16,185,129,0.4)" stroke="rgba(16,185,129,0.3)" strokeWidth="0.5" />
        ))
      )}
      {/* Side windows */}
      {[35, 47, 59, 71].map((y, row) => (
        <rect key={row} x={93} y={y} width="10" height="7" rx="0.5"
          fill="rgba(16,185,129,0.25)" stroke="rgba(16,185,129,0.2)" strokeWidth="0.5" />
      ))}
      {/* Base grid */}
      <rect x="40" y="85" width="20" height="5" rx="1" fill="rgba(16,185,129,0.3)" />
      <rect x="60" y="83" width="50" height="7" rx="1" fill="rgba(16,185,129,0.2)" />
      {/* Antenna */}
      <line x1="80" y1="10" x2="80" y2="-2" stroke="rgba(16,185,129,0.7)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="-3" r="2" fill="rgba(16,185,129,0.8)" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,1))' }} />
      {/* Glow */}
      <ellipse cx="80" cy="95" rx="50" ry="5" fill="rgba(16,185,129,0.1)" />
    </svg>
  );
}

function DamIllustration({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" style={{ opacity }}>
      <defs>
        <linearGradient id="damGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Water body (reservoir) */}
      <path d="M 10 50 Q 60 45 80 50 L 80 90 L 10 90 Z" fill="url(#waterGrad)" />
      {/* Wave lines on water */}
      <path d="M 15 58 Q 35 55 55 58" stroke="rgba(6,182,212,0.5)" strokeWidth="1" fill="none" />
      <path d="M 12 66 Q 40 62 60 66" stroke="rgba(6,182,212,0.4)" strokeWidth="1" fill="none" />
      <path d="M 15 74 Q 38 70 58 74" stroke="rgba(6,182,212,0.3)" strokeWidth="1" fill="none" />
      {/* Dam wall */}
      <path d="M 78 28 L 90 18 L 100 30 L 100 90 L 78 90 Z" fill="url(#damGrad)" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
      {/* Dam face pattern */}
      {[35, 48, 61, 74].map((y, i) => (
        <rect key={i} x={80} y={y} width={8} height={8} rx="0.5"
          fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.5" />
      ))}
      {/* Isometric top */}
      <path d="M 78 28 L 90 18 L 100 30 L 88 40 Z" fill="rgba(6,182,212,0.3)" stroke="rgba(6,182,212,0.4)" strokeWidth="0.8" />
      {/* Spillway */}
      <rect x="100" y="60" width="15" height="30" rx="1" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.8" />
      {/* Water flow from spillway */}
      <path d="M 115 70 Q 125 75 135 80 Q 145 85 150 90" stroke="rgba(6,182,212,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Mountains/terrain */}
      <path d="M 110 65 L 135 40 L 155 65" stroke="rgba(6,182,212,0.25)" strokeWidth="1.5" fill="rgba(6,182,212,0.05)" />
      <path d="M 125 65 L 145 48 L 158 65" stroke="rgba(6,182,212,0.2)" strokeWidth="1" fill="none" />
      {/* Glow */}
      <ellipse cx="80" cy="93" rx="55" ry="5" fill="rgba(6,182,212,0.1)" />
    </svg>
  );
}

function SoilIllustration({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" style={{ opacity }}>
      <defs>
        <linearGradient id="grassGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="dirtSide1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="dirtSide2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Top face (Grass) */}
      <path d="M 80 20 L 110 35 L 80 50 L 50 35 Z" fill="url(#grassGrad)" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
      {/* Grass speckles */}
      <circle cx="80" cy="35" r="1.5" fill="rgba(16,185,129,0.8)" />
      <circle cx="95" cy="30" r="1" fill="rgba(16,185,129,0.6)" />
      <circle cx="65" cy="40" r="1.5" fill="rgba(16,185,129,0.7)" />
      <circle cx="70" cy="28" r="1" fill="rgba(16,185,129,0.7)" />

      {/* Left face (Dirt) */}
      <path d="M 50 35 L 80 50 L 80 85 L 50 70 Z" fill="url(#dirtSide1)" stroke="rgba(180,83,9,0.4)" strokeWidth="1" />
      {/* Right face (Dirt) */}
      <path d="M 80 50 L 110 35 L 110 70 L 80 85 Z" fill="url(#dirtSide2)" stroke="rgba(217,119,6,0.4)" strokeWidth="1" />

      {/* Dirt layers / striations (Left) */}
      <path d="M 50 45 L 80 60" stroke="rgba(180,83,9,0.3)" strokeWidth="1" />
      <path d="M 50 55 L 80 70" stroke="rgba(180,83,9,0.2)" strokeWidth="1" />
      <path d="M 50 65 L 80 80" stroke="rgba(180,83,9,0.15)" strokeWidth="1" />

      {/* Dirt layers / striations (Right) */}
      <path d="M 80 60 L 110 45" stroke="rgba(217,119,6,0.25)" strokeWidth="1" />
      <path d="M 80 70 L 110 55" stroke="rgba(217,119,6,0.15)" strokeWidth="1" />
      <path d="M 80 80 L 110 65" stroke="rgba(217,119,6,0.1)" strokeWidth="1" />

      {/* Glow */}
      <ellipse cx="80" cy="90" rx="45" ry="5" fill="rgba(180,83,9,0.08)" />
    </svg>
  );
}

function RoadIllustration({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" style={{ opacity }}>
      <defs>
        <linearGradient id="roadGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Road intersection - isometric */}
      {/* Main horizontal road */}
      <path d="M 10 60 L 50 45 L 110 45 L 150 60 L 110 75 L 50 75 Z" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
      {/* Center line */}
      {[20, 40, 60, 80, 100, 120].map((x, i) => (
        <rect key={i} x={x + 15} y={59} width={10} height={2} rx="1" fill="rgba(251,191,36,0.5)" />
      ))}
      {/* Vertical cross road */}
      <path d="M 65 15 L 95 15 L 110 45 L 110 75 L 95 105 L 65 105 L 50 75 L 50 45 Z" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.25)" strokeWidth="0.8" />
      {/* Lane markings */}
      {[25, 40, 55, 70, 85].map((y, i) => (
        <rect key={i} x={77} y={y} width={6} height={10} rx="1" fill="rgba(251,191,36,0.3)" />
      ))}
      {/* Road signs */}
      <rect x="35" y="28" width="6" height="22" rx="1" fill="rgba(251,191,36,0.4)" />
      <rect x="30" y="26" width="16" height="10" rx="2" fill="rgba(251,191,36,0.5)" stroke="rgba(251,191,36,0.7)" strokeWidth="0.8" />
      <rect x="118" y="30" width="6" height="20" rx="1" fill="rgba(251,191,36,0.4)" />
      <circle cx="121" cy="28" r="6" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.6)" strokeWidth="0.8" />
      {/* Trees */}
      <circle cx="20" cy="42" r="8" fill="rgba(34,197,94,0.3)" />
      <rect x="18.5" y="50" width="3" height="8" rx="1" fill="rgba(34,197,94,0.25)" />
      <circle cx="140" cy="50" r="7" fill="rgba(34,197,94,0.25)" />
      <rect x="138.5" y="57" width="3" height="7" rx="1" fill="rgba(34,197,94,0.2)" />
      {/* Glow */}
      <ellipse cx="80" cy="95" rx="55" ry="4" fill="rgba(251,191,36,0.08)" />
    </svg>
  );
}

const SUBJECT_ILLUSTRATIONS: Record<string, { icon: React.FC<any>; color: string; glow: string; border: string; name: string }> = {
  'Structural Analysis': { icon: BridgeIllustration, color: '#a855f7', glow: 'rgba(168,85,247,0.4)', border: 'rgba(168,85,247,0.3)', name: 'Structural Analysis' },
  'Geotechnical Engineering': { icon: SoilIllustration, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', border: 'rgba(245,158,11,0.3)', name: 'Geotechnical Engineering' },
  'Hydrology & Water Resources': { icon: DamIllustration, color: '#06b6d4', glow: 'rgba(6,182,212,0.4)', border: 'rgba(6,182,212,0.3)', name: 'Hydrology & Water Resources' },
  'Transportation Engineering': { icon: RoadIllustration, color: '#c084fc', glow: 'rgba(192,132,252,0.4)', border: 'rgba(192,132,252,0.3)', name: 'Transportation Engineering' },
};

const FALLBACK_SUBJECTS = [
  { icon: BridgeIllustration, color: '#a855f7', glow: 'rgba(168,85,247,0.4)', border: 'rgba(168,85,247,0.3)' },
  { icon: SoilIllustration, color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', border: 'rgba(245,158,11,0.3)' },
  { icon: DamIllustration, color: '#06b6d4', glow: 'rgba(6,182,212,0.4)', border: 'rgba(6,182,212,0.3)' },
  { icon: RoadIllustration, color: '#c084fc', glow: 'rgba(192,132,252,0.4)', border: 'rgba(192,132,252,0.3)' },
];

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({ onStartExam }) => {
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [chapterStats, setChapterStats] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchTopics() {
      try {
        const [topics, stats] = await Promise.all([
          getWeakTopics(),
          getDashboardStats().catch(() => null),
        ]);
        if (!cancelled) {
          setWeakTopics(topics);
          // Build chapter stats from dashboard data (answeredByChapter + total per chapter)
          if (stats?.answeredByChapter) {
            const chaps = Object.entries(stats.answeredByChapter).map(([name, answered]) => ({
              name,
              count: answered, // This is questions answered; we use it for weight calculation
            }));
            setChapterStats(chaps);
          }
        }
      } catch (err) { console.error("Failed to fetch weak topics:", err); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchTopics();
    return () => { cancelled = true; };
  }, []);

  // Derive exam weight from question count: (topic count / total questions) * 100
  const totalQuestions = chapterStats.reduce((sum, c) => sum + c.count, 0) || 1;
  const examWeightFor = (topicName: string) => {
    const ch = chapterStats.find(c => c.name === topicName);
    return ch ? Math.round((ch.count / totalQuestions) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse"
          style={{ background: 'rgba(168,85,247,0.15)', boxShadow: '0 0 30px rgba(168,85,247,0.3)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <span style={{ color: '#c084fc', filter: 'drop-shadow(0 0 8px #c084fc)', display: 'flex' }}>
            <Brain className="w-8 h-8 stroke-1" />
          </span>
        </div>
        <p className="text-purple-300/60 font-medium">Analyzing your performance…</p>
      </div>
    );
  }

  /* Derive overall mastery from weak topics data */
  const avgAccuracy = weakTopics.length > 0
    ? Math.round(weakTopics.reduce((sum, t) => sum + t.accuracy, 0) / weakTopics.length)
    : 0;
  const improvementPotential = weakTopics.length > 0 ? Math.round((100 - avgAccuracy) * 0.3) : 0;

  /* Map topics to subjects for the Priority grid */
  const priorityTopics = weakTopics.slice(0, 4).map((topic, i) => {
    const match = SUBJECT_ILLUSTRATIONS[topic.name];
    const fallback = FALLBACK_SUBJECTS[i % FALLBACK_SUBJECTS.length];
    return {
      name: topic.name,
      accuracy: topic.accuracy,
      count: topic.count,
      icon: match?.icon || fallback.icon,
      color: match?.color || fallback.color,
      glow: match?.glow || fallback.glow,
      border: match?.border || fallback.border,
      examWeight: examWeightFor(topic.name),
    };
  });

  /* Expert study plan items derived from real data */
  const studyPlanItems = [
    weakTopics[0] && {
      title: `Review ${weakTopics[0].name} Concepts`,
      desc: `Focus on core principles to improve your ${weakTopics[0].accuracy}% accuracy.`,
      icon: Layers,
      color: '#a855f7',
    },
    weakTopics[1] && {
      title: `Focus on ${weakTopics[1].name} Problems`,
      desc: `Deep dive into practice questions to build mastery from ${weakTopics[1].accuracy}%.`,
      icon: Target,
      color: '#06b6d4',
    },
    weakTopics.length >= 3 && {
      title: `Target ${weakTopics[2].name} for Quick Gains`,
      desc: `This topic has ${weakTopics[2].accuracy}% accuracy — focused practice can boost your overall score.`,
      icon: TrendingUp,
      color: '#a855f7',
    },
  ].filter(Boolean) as { title: string; desc: string; icon: any; color: string }[];

  const hasTopics = weakTopics.length > 0;

  return (
    <div className="w-full pb-12 space-y-5">

      {/* ── Diagnostic Overview Hero ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        {/* Main hero card */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            minHeight: 320,
            background: 'var(--app-bg)',
            border: '1px solid var(--app-border)',
            boxShadow: '0 0 50px var(--neon-purple)',
          }}>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 p-7 sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
              {hasTopics ? 'Performance Diagnostics' : 'Diagnostic Overview'}
            </p>
            <h1 className="text-3xl font-black leading-tight mb-6" style={{ color: 'var(--app-text)' }}>
              {hasTopics ? 'Focus Priority Dashboard' : 'Diagnostic Overview'}
            </h1>

            {/* Civil engineering illustration row */}
            <div className="flex items-end justify-center gap-4 sm:gap-8 my-4">
              <div className="w-48 sm:w-64 animate-float" style={{ animationDelay: '0s' }}>
                <BridgeIllustration />
              </div>
              <div className="w-48 sm:w-64 animate-float" style={{ animationDelay: '0.6s' }}>
                <BuildingIllustration />
              </div>
              <div className="w-48 sm:w-64 animate-float hidden sm:block" style={{ animationDelay: '1.2s' }}>
                <DamIllustration />
              </div>
            </div>

            {/* Bottom stats */}
            <div className="flex items-center gap-8 mt-4">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--app-muted)' }}>Overall Mastery:</p>
                <p className="text-3xl font-black" style={{ color: 'var(--app-text)' }}>{hasTopics ? `${avgAccuracy}%` : '—'}</p>
              </div>
              <div className="w-px h-10" style={{ background: 'var(--app-border)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--app-muted)' }}>Improvement Potential:</p>
                <p className="text-3xl font-black" style={{ color: 'var(--accent)' }}>
                  {hasTopics ? `+${improvementPotential} Points` : 'Practice to unlock'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expert Study Plan sidebar */}
        <div className="bp-card rounded-2xl p-5">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--app-text)' }}>
            <Lightbulb className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Expert Study Plan
          </h2>
          <div className="space-y-3">
            {studyPlanItems.length > 0 ? studyPlanItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black mt-0.5"
                  style={{ background: `${item.color}22`, border: `1px solid ${item.color}40`, color: item.color }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--app-text)' }}>{item.title}</p>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--app-faint)' }}>{item.desc}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}40` }}>
                  <item.icon className="w-6 h-6 stroke-1" style={{ color: item.color, filter: `drop-shadow(0 0 8px ${item.color})` }} />
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <Brain className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--app-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--app-faint)' }}>Complete practice sessions to unlock your personalized study plan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Priority Topic Focus grid ── */}
      {priorityTopics.length > 0 ? (
        <>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--app-muted)' }}>Priority Topic Focus</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {priorityTopics.map((topic, i) => {
              const IllustrationComp = topic.icon;
              const mastery = Math.max(5, Math.min(95, topic.accuracy));
              return (
                <div key={i} className="bp-card rounded-2xl p-5 flex flex-col transition-all hover:scale-[1.02]"
                  onClick={() => onStartExam(topic.name)}>
                  {/* Illustration */}
                  <div className="w-full h-32 mb-4">
                    <IllustrationComp opacity={0.9} />
                  </div>

                  <h3 className="text-sm font-black text-center mb-4" style={{ color: 'var(--app-text)' }}>{topic.name}</h3>

                  {/* Stats */}
                  <div className="space-y-3 mt-auto">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span style={{ color: 'var(--app-faint)' }}>Exam Weightage:</span>
                        <span className="font-bold" style={{ color: 'var(--app-text)' }}>{topic.examWeight}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${topic.examWeight * 5}%`, background: topic.color, boxShadow: `0 0 6px ${topic.color}` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span style={{ color: 'var(--app-faint)' }}>Mastery Level:</span>
                        <span className="font-bold" style={{ color: topic.color }}>{topic.accuracy}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${mastery}%`, background: topic.color, boxShadow: `0 0 6px ${topic.color}` }} />
                      </div>
                    </div>
                  </div>

                  <button className="mt-4 w-full h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:brightness-125"
                    style={{ background: `${topic.color}18`, border: `1px solid ${topic.border}`, color: topic.color }}>
                    Practice Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Zero state */
        /* Zero state */
        <div className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}>
          <div className="w-64 mb-6 opacity-60">
            <DamIllustration />
          </div>
          <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--app-text)' }}>No Weak Topics Detected Yet</h3>
          <p className="text-sm max-w-md leading-relaxed mb-6" style={{ color: 'var(--app-muted)' }}>
            There is not enough practice data yet. Start practicing to unlock personalized insights and maximize your score.
          </p>
          <button onClick={() => onStartExam()}
            className="px-8 h-12 rounded-xl font-bold transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{ color: '#fff', background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 24px var(--neon-blue)' }}>
            Start an Exam
          </button>
        </div>
      )}
    </div>
  );
};
