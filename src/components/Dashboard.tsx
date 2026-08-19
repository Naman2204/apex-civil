"use client";
import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, MoreHorizontal, Bookmark, Clock, Brain } from 'lucide-react';
import { getDashboardStats } from '../app/actions/dashboard';
import { getExamHistory } from '../app/actions/analytics';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { getAnalyticsData } from '../app/actions/analytics';

interface DashboardProps {
  totalQuestions: number;
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter?: string) => void;
  onNavigate: (page: any) => void;
}

/* ── Donut ring for Daily Goal ── */
function GoalRing({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (done / target) * 100) : 0;
  const size = 130, stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0 mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gGoal2" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="var(--status-warning)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--app-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gGoal2)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct/100)*c} ${c}`}
          style={{ filter: 'drop-shadow(0 0 8px var(--neon-gold))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none" style={{ color: 'var(--app-text)' }}>{done}</span>
        <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>/{target}</span>
      </div>
    </div>
  );
}

/* ── Donut ring for Topic Review ── */
function TopicRing({ pct }: { pct: number }) {
  const size = 140, stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0 mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gTopic2" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--status-success)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--app-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gTopic2)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p/100)*c} ${c}`}
          style={{ filter: 'drop-shadow(0 0 8px var(--neon-teal))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none" style={{ color: 'var(--app-text)' }}>{Math.round(p)}%</span>
        <span className="text-xs font-bold mt-1" style={{ color: 'var(--status-success)' }}>Completed</span>
      </div>
    </div>
  );
}

function NeonCard({ children, className = '', color = 'blue' }: { children: React.ReactNode; className?: string; color?: 'purple' | 'blue' | 'cyan' }) {
  // Use Blueprint styles via bp-card and extra neon logic if needed
  return (
    <div className={`bp-card backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

/* ── Score badge ── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : score >= 6 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${color}`}>
      {score * 10}%
    </span>
  );
}

export const Dashboard: React.FC<DashboardProps> = ({ totalQuestions, chapterStats, onStartExam, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [s, h, a] = await Promise.all([
          getDashboardStats(),
          getExamHistory().catch(() => []),
          getAnalyticsData().catch(() => null)
        ]);
        setStats(s);
        setRecentActivity((h as any[]).slice(0, 10));
        setAnalytics(a);
      } catch (e) { console.error("Failed to fetch stats", e); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const totalAnswered  = stats?.totalAnswered ?? 0;
  const overallPct     = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
  const dailyDone      = stats?.dailyGoal?.completedQuestions ?? 0;
  const dailyTarget    = stats?.dailyGoal?.targetQuestions ?? 50;
  const topicsAnswered = Object.keys(stats?.answeredByChapter || {}).length;
  const topicsPct      = chapterStats.length > 0 ? (topicsAnswered / chapterStats.length) * 100 : 0;
  const radarData      = analytics?.radarData ?? [];

  /* Daily progress chart — last 7 days */
  const progressData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (stats?.dailyProgress) {
      return stats.dailyProgress.map((d: { date: string; count: number }) => {
        const date = new Date(d.date);
        return { t: days[date.getDay()], v: d.count };
      });
    }
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return { t: days[d.getDay()], v: 0 };
    });
  })();

  const activity = recentActivity.map((r: any) => ({
    label: `${r.mode === 'Mock Test' ? 'Completed' : 'Attempted'} '${r.topic}' ${r.mode === 'Mock Test' ? 'Module' : 'Quiz'}`,
    score: r.total > 0 ? Math.round((r.score / r.total) * 10) : 0,
    time: r.time || r.date,
    topic: r.topic,
    mode: r.mode,
  }));

  const activityIcons = [
    { color: 'bg-emerald-500', label: 'completed' },
    { color: 'bg-purple-500', label: 'attempted' },
    { color: 'bg-cyan-500', label: 'viewed' },
  ];

  return (
    <div className="flex gap-4 w-full min-h-full">

      {/* ─── Main column ─── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* ── Hero Banner ── */}
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl"
          style={{ background: 'var(--app-card2)', border: '1px solid var(--app-border)' }}>
          {/* Animated grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(var(--app-text) 1px,transparent 1px),linear-gradient(90deg,var(--app-text) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          {/* Shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--accent), transparent)' }} />

          <div className="relative z-10 flex min-h-[320px] flex-col sm:flex-row items-start sm:items-center gap-6 p-8 sm:p-10">
            {/* Text side */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Progress Arcs</p>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-3" style={{ color: 'var(--app-text)' }}>
                Master Civil<br/>Engineering
              </h2>
              <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: 'var(--app-muted)' }}>
                You've completed {totalAnswered.toLocaleString()} of {totalQuestions.toLocaleString()} questions toward mastering civil engineering.
              </p>
              <button
                onClick={() => onStartExam()}
                className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', color: '#fff', boxShadow: '0 0 30px var(--neon-blue)' }}
              >
                <Play className="w-6 h-6 fill-current" />
                Continue Practice
              </button>
            </div>

            {/* Bridge Banner Illustration */}
            <div className="hidden sm:flex items-center justify-end flex-1 pl-6">
              <img 
                src="/bridge_banner.png" 
                alt="Engineering Mastery" 
                className="w-full max-w-[550px] object-cover rounded-2xl shadow-2xl scale-110 origin-right"
                style={{ boxShadow: '0 0 40px var(--neon-purple, rgba(168,85,247,0.3))' }}
              />
            </div>
          </div>
        </div>

        {/* ── Quick Access label ── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] px-0.5" style={{ color: 'var(--accent)' }}>Quick Access Grid</p>

        {/* ── 2×2 Quick Access Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">

          {/* Subject Mastery */}
          <NeonCard color="purple" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>Subject Mastery</h3>
              <button className="transition-colors" style={{ color: 'var(--app-faint)' }}><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <RadarChart data={radarData.slice(0, 6)}>
                  <PolarGrid stroke="var(--app-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--app-muted)', fontSize: 9 }} />
                  <Radar dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.22}
                    dot={{ r: 3, fill: 'var(--accent-bright)', filter: 'drop-shadow(0 0 4px var(--neon-blue))' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[190px] flex items-center justify-center text-center text-sm" style={{ color: 'var(--app-faint)' }}>
                Complete practice sessions to see subject mastery.
              </div>
            )}
          </NeonCard>

          {/* Daily Goal */}
          <NeonCard color="purple" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>Daily Goal</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)', color: 'var(--status-warning)' }}>
                🔥 Active
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 mt-1">
              <GoalRing done={dailyDone} target={dailyTarget} />
              <div className="text-center">
                <p className="text-3xl font-black" style={{ color: 'var(--app-text)' }}>{dailyDone}<span className="text-xl font-bold" style={{ color: 'var(--app-muted)' }}>/{dailyTarget}</span></p>
                <p className="text-xs mt-1" style={{ color: 'var(--app-faint)' }}>Questions Solved Today</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'var(--app-faint)' }}>
              <span>0</span><span>{dailyTarget}</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--app-border)' }}>
              <div className="h-1.5 rounded-full transition-all"
                style={{ background: 'linear-gradient(to right, var(--status-warning), var(--accent))', width: `${Math.min(100, dailyTarget > 0 ? (dailyDone/dailyTarget)*100 : 0)}%`, boxShadow: '0 0 8px var(--neon-gold)' }} />
            </div>
            <p className="text-[10px] text-center mt-1" style={{ color: 'var(--app-faint)' }}>0 Questions</p>
          </NeonCard>

          {/* Topic Review */}
          <NeonCard color="cyan" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>Topic Review</h3>
              <button className="transition-colors" style={{ color: 'var(--app-faint)' }}><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col items-center gap-3 mt-1">
              <TopicRing pct={topicsPct} />
              <div className="text-center">
                <p className="text-xl font-black" style={{ color: 'var(--app-text)' }}>{topicsAnswered}<span className="text-sm font-bold" style={{ color: 'var(--app-muted)' }}>/{chapterStats.length}</span></p>
                <p className="text-xs mt-1" style={{ color: 'var(--app-faint)' }}>Topics Covered</p>
              </div>
            </div>
          </NeonCard>

          {/* Performance Trends */}
          <NeonCard color="blue" className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>Performance Trends</h3>
              <span className="text-[10px]" style={{ color: 'var(--app-faint)' }}>Questions Solved vs Accuracy %</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressData} margin={{ top: 10, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                    <stop offset="60%" stopColor="var(--status-success)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--status-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: 'var(--app-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--app-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', borderRadius: 8, color: 'var(--app-text)' }}
                  formatter={(v: any) => [v, 'Questions']}
                />
                <Area type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={2.5}
                  fill="url(#perfFill)" dot={{ r: 3, fill: 'var(--accent)', filter: 'drop-shadow(0 0 4px var(--neon-blue))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </NeonCard>
        </div>
      </div>

      {/* ─── Recent Activity sidebar ─── */}
      <div className="w-[280px] shrink-0 hidden xl:block">
        <div className="bp-card sticky top-[72px] backdrop-blur-sm">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--app-border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>Recent Activity</h3>
          </div>
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto" style={{ borderTop: '1px solid var(--app-border)' }}>
            {activity.length === 0 ? (
              <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shrink-0"
                     style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)', boxShadow: '0 0 20px var(--neon-blue)' }}>
                  <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--accent))', display: 'flex' }}>
                    <Brain className="w-8 h-8 stroke-1" />
                  </span>
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--app-muted)' }}>No activity yet.</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--app-faint)' }}>Start practicing!</p>
              </div>
            ) : activity.map((item, i) => {
              const dot = activityIcons[i % activityIcons.length];
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderBottom: '1px solid var(--app-border)' }}>
                  <div className={`w-2 h-2 rounded-full ${dot.color} mt-1.5 shrink-0 shadow-[0_0_6px_currentColor]`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-tight line-clamp-2" style={{ color: 'var(--app-text)' }}>{item.label}</p>
                    <p className="text-[9px] mt-1" style={{ color: 'var(--app-faint)' }}>{item.time}</p>
                  </div>
                  <ScoreBadge score={item.score} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
