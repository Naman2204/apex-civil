"use client";
import React, { useEffect, useState } from "react";
import { Brain, ArrowRight, Layers, Target, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";
import { getWeakTopics } from "../app/actions/analytics";
import { getDashboardStats } from "../app/actions/dashboard";

interface WeakTopicsViewProps {
  onStartExam: (chapter?: string) => void;
}

/* ── Compact Civil Engineering SVG icons ── */
function BridgeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
      <rect x="8" y="32" width="48" height="4" rx="1" fill="currentColor" opacity="0.25" />
      <rect x="18" y="16" width="4" height="20" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="42" y="16" width="4" height="20" rx="1" fill="currentColor" opacity="0.6" />
      <path d="M 20 18 Q 32 28 44 18" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      {[26, 30, 34, 38].map((x, i) => (
        <line key={i} x1={x} y1={22 + Math.abs(i - 1.5)} x2={x} y2="32" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      ))}
      <rect x="14" y="36" width="10" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="40" y="36" width="10" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function BuildingIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
      <path d="M 24 14 L 32 10 L 40 14 L 40 44 L 32 48 L 24 44 Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M 32 10 L 40 14 L 40 44 L 32 40 Z" fill="currentColor" opacity="0.08" />
      {[18, 24, 30, 36].map((y, i) => (
        <rect key={i} x={27} y={y} width="3" height="3.5" rx="0.3" fill="currentColor" opacity="0.35" />
      ))}
      {[20, 26, 32, 38].map((y, i) => (
        <rect key={i} x={41.5} y={y} width="4.5" height="3.5" rx="0.3" fill="currentColor" opacity="0.2" />
      ))}
      <line x1="32" y1="10" x2="32" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="32" cy="5" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function DamIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
      <path d="M 8 28 Q 24 25 32 28 L 32 48 L 8 48 Z" fill="currentColor" opacity="0.12" />
      <path d="M 32 28 L 40 22 L 48 30 L 48 48 L 32 48 Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35" />
      <path d="M 32 28 L 40 22 L 48 30 L 40 36 Z" fill="currentColor" opacity="0.08" />
      <path d="M 48 38 L 56 42" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M 50 28 L 58 22" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M 52 28 L 58 25" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.15" />
      <rect x="33" y="32" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function SoilIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
      <path d="M 32 18 L 46 26 L 32 34 L 18 26 Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M 18 26 L 32 34 L 32 48 L 18 40 Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" />
      <path d="M 32 34 L 46 26 L 46 40 L 32 48 Z" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.25" />
      <path d="M 18 32 L 32 40" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
      <path d="M 32 40 L 46 32" stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
      <circle cx="32" cy="26" r="1.2" fill="currentColor" opacity="0.5" />
      <circle cx="38" cy="24" r="0.8" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function RoadIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
      <path d="M 8 30 L 24 24 L 56 24 L 56 34 L 24 34 Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" />
      <path d="M 28 14 L 36 14 L 56 24 L 56 34 L 36 50 L 28 50 L 8 34 L 8 24 Z" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.2" />
      {[16, 24, 32, 40, 48].map((x, i) => (
        <rect key={i} x={x} y={28.5} width={4} height={1} rx="0.5" fill="currentColor" opacity="0.35" />
      ))}
      <rect x="14" y="18" width="3" height="14" rx="0.5" fill="currentColor" opacity="0.25" />
      <rect x="12" y="17" width="7" height="4" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/* ── SVG Icon Map ── */
const SUBJECT_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  'Structural Analysis': BridgeIcon,
  'Geotechnical Engineering': SoilIcon,
  'Hydrology & Water Resources': DamIcon,
  'Transportation Engineering': RoadIcon,
};

const FALLBACK_ICONS = [BridgeIcon, BuildingIcon, DamIcon, SoilIcon, RoadIcon];

const ACCENT_COLORS: Record<string, { main: string; bg: string; border: string; glow: string }> = {
  purple: { main: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', glow: '0 0 20px rgba(168,85,247,0.15)' },
  cyan:   { main: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)', glow: '0 0 20px rgba(6,182,212,0.15)' },
  amber:  { main: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', glow: '0 0 20px rgba(245,158,11,0.15)' },
  blue:   { main: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', glow: '0 0 20px rgba(59,130,246,0.15)' },
};

const ACCENT_KEYS = Object.keys(ACCENT_COLORS);

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
          if (stats?.answeredByChapter) {
            const chaps = Object.entries(stats.answeredByChapter).map(([name, answered]) => ({
              name,
              count: answered,
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

  const totalQuestions = chapterStats.reduce((sum, c) => sum + c.count, 0) || 1;
  const examWeightFor = (topicName: string) => {
    const ch = chapterStats.find(c => c.name === topicName);
    return ch ? Math.round((ch.count / totalQuestions) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)' }}>
            <Brain className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="absolute -inset-1 rounded-2xl animate-ping opacity-20" style={{ background: 'var(--accent)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--app-muted)' }}>Analyzing your performance…</p>
      </div>
    );
  }

  const avgAccuracy = weakTopics.length > 0
    ? Math.round(weakTopics.reduce((sum, t) => sum + t.accuracy, 0) / weakTopics.length)
    : 0;
  const improvementPotential = weakTopics.length > 0 ? Math.round((100 - avgAccuracy) * 0.3) : 0;
  const hasTopics = weakTopics.length > 0;

  const getAccuracyLevel = (acc: number) => {
    if (acc < 40) return { color: '#ef4444', label: 'Needs Work', badgeBg: 'rgba(239,68,68,0.12)', badgeBorder: 'rgba(239,68,68,0.3)' };
    if (acc <= 60) return { color: '#f59e0b', label: 'Fair', badgeBg: 'rgba(245,158,11,0.12)', badgeBorder: 'rgba(245,158,11,0.3)' };
    return { color: '#22c55e', label: 'Good', badgeBg: 'rgba(34,197,94,0.12)', badgeBorder: 'rgba(34,197,94,0.3)' };
  };

  /* Build topic cards */
  const topicCards = weakTopics.slice(0, 4).map((topic, i) => {
    const accentKey = ACCENT_KEYS[i % ACCENT_KEYS.length];
    const accent = ACCENT_COLORS[accentKey];
    const IconComp = SUBJECT_ICONS[topic.name] || FALLBACK_ICONS[i % FALLBACK_ICONS.length];
    const level = getAccuracyLevel(topic.accuracy);
    return { ...topic, IconComp, accent, level, examWeight: examWeightFor(topic.name) };
  });

  /* Study plan items */
  const studyPlanItems = [
    weakTopics[0] && {
      title: `Review ${weakTopics[0].name}`,
      desc: `Focus on core principles to improve your ${weakTopics[0].accuracy}% accuracy.`,
      icon: Layers,
      accent: ACCENT_COLORS.purple,
    },
    weakTopics[1] && {
      title: `Focus on ${weakTopics[1].name}`,
      desc: `Deep dive into practice questions to build mastery from ${weakTopics[1].accuracy}%.`,
      icon: Target,
      accent: ACCENT_COLORS.cyan,
    },
    weakTopics.length >= 3 && {
      title: `Target ${weakTopics[2].name}`,
      desc: `This topic has ${weakTopics[2].accuracy}% accuracy — focused practice can boost your overall score.`,
      icon: TrendingUp,
      accent: ACCENT_COLORS.blue,
    },
  ].filter(Boolean) as { title: string; desc: string; icon: any; accent: typeof ACCENT_COLORS.purple }[];

  return (
    <div className="w-full pb-12 space-y-6 max-w-[1200px]">

      {/* ── Hero Section ── */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'var(--app-card)',
          border: '1px solid var(--app-border)',
          boxShadow: 'var(--card-shadow)',
        }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />

        {/* Gradient accent top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--primary-start), var(--accent), var(--primary-end))' }} />

        <div className="relative z-10 p-6 sm:p-8">
          {/* Top label */}
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
            style={{ color: 'var(--accent)' }}>
            Performance Diagnostics
          </p>

          {/* Main heading + illustrations row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2"
                style={{ color: 'var(--app-text)' }}>
                Focus Priority Dashboard
              </h1>
              <p className="text-sm max-w-md leading-relaxed" style={{ color: 'var(--app-muted)' }}>
                Identify your weakest areas and prioritize what to study next for maximum improvement.
              </p>
            </div>

            {/* Compact illustration strip */}
            <div className="flex items-center gap-3 shrink-0">
              {[BridgeIcon, BuildingIcon, DamIcon].map((Icon, i) => (
                <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center animate-float"
                  style={{
                    animationDelay: `${i * 0.4}s`,
                    background: 'var(--app-bg)',
                    border: '1px solid var(--app-border)',
                  }}>
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: 'var(--accent)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 mt-6 pt-6"
            style={{ borderTop: '1px solid var(--app-border)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--app-muted)' }}>
                Overall Mastery
              </p>
              <p className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--app-text)' }}>
                {hasTopics ? `${avgAccuracy}%` : '—'}
              </p>
            </div>
            <div className="w-px h-10 hidden sm:block" style={{ background: 'var(--app-border)' }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--app-muted)' }}>
                Improvement Potential
              </p>
              <p className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--accent)' }}>
                {hasTopics ? `+${improvementPotential} pts` : '—'}
              </p>
            </div>
            <div className="w-px h-10 hidden sm:block" style={{ background: 'var(--app-border)' }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--app-muted)' }}>
                Weak Topics
              </p>
              <p className="text-3xl sm:text-4xl font-black" style={{ color: 'var(--app-text)' }}>
                {hasTopics ? weakTopics.length : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content: Topic Cards + Study Plan ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Priority Topic Focus */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--app-muted)' }}>
                Priority Topic Focus
              </p>
              <h2 className="text-lg font-black" style={{ color: 'var(--app-text)' }}>
                Topics to Improve
              </h2>
            </div>
          </div>

          {topicCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topicCards.map((topic, i) => (
                <div key={i}
                  className="group rounded-2xl p-5 flex flex-col transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                  style={{
                    background: 'var(--app-card)',
                    border: '1px solid var(--app-border)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                  onClick={() => onStartExam(topic.name)}>
                  {/* Header with icon + name */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                      style={{ background: topic.accent.bg, border: `1px solid ${topic.accent.border}` }}>
                      <topic.IconComp className="w-6 h-6" style={{ color: topic.accent.main }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black leading-snug truncate" style={{ color: 'var(--app-text)' }}>
                        {topic.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: topic.level.badgeBg, color: topic.level.color, border: `1px solid ${topic.level.badgeBorder}` }}>
                          {topic.level.label}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--app-faint)' }}>
                          {topic.count} questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy section */}
                  <div className="mt-auto">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--app-muted)' }}>Accuracy</span>
                      <span className="text-xl font-black" style={{ color: topic.level.color }}>
                        {topic.accuracy}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--app-bg)' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(topic.accuracy, 3)}%`,
                          background: `linear-gradient(90deg, ${topic.level.color}cc, ${topic.level.color})`,
                          boxShadow: `0 0 8px ${topic.level.color}40`,
                        }} />
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--app-faint)' }}>
                      {topic.level.label === 'Needs Work' ? 'Significant room for improvement' :
                       topic.level.label === 'Fair' ? 'Some concepts need reinforcement' :
                       'Solid foundation — keep building'}
                    </p>
                  </div>

                  {/* CTA */}
                  <button className="mt-4 w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all group-hover:brightness-110"
                    style={{
                      background: topic.accent.bg,
                      border: `1px solid ${topic.accent.border}`,
                      color: topic.accent.main,
                    }}>
                    Practice Now
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Zero state */
            <div className="rounded-2xl p-10 flex flex-col items-center text-center"
              style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--card-shadow)' }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)' }}>
                <AlertTriangle className="w-10 h-10" style={{ color: 'var(--accent)', opacity: 0.6 }} />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: 'var(--app-text)' }}>No Weak Topics Yet</h3>
              <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: 'var(--app-muted)' }}>
                Complete some practice sessions and we'll identify your weak areas to help you improve faster.
              </p>
              <button onClick={() => onStartExam()}
                className="px-8 h-11 rounded-xl font-bold text-sm transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ color: '#fff', background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 4px 20px var(--neon-blue)' }}>
                Start a Practice Session
              </button>
            </div>
          )}
        </div>

        {/* Expert Study Plan Sidebar */}
        <div className="xl:sticky xl:top-8 xl:self-start">
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--card-shadow)' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)' }}>
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-sm font-black" style={{ color: 'var(--app-text)' }}>Expert Study Plan</h2>
            </div>

            <div className="space-y-3">
              {studyPlanItems.length > 0 ? studyPlanItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
                  {/* Step number */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black mt-0.5"
                    style={{ background: item.accent.bg, border: `1px solid ${item.accent.border}`, color: item.accent.main }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-snug" style={{ color: 'var(--app-text)' }}>
                      {item.title}
                    </p>
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--app-muted)' }}>
                      {item.desc}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: item.accent.bg, border: `1px solid ${item.accent.border}` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.accent.main }} />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
                    <Brain className="w-6 h-6" style={{ color: 'var(--app-muted)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--app-muted)' }}>
                    Complete practice sessions to unlock your personalized study plan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
