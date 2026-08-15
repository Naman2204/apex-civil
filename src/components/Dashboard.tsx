"use client";
import React, { useEffect, useState } from 'react';
import { Play, BookOpen, Target, Flame, AlertTriangle, Zap, Settings2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getDashboardStats } from '../app/actions/dashboard';
import { getExamHistory } from '../app/actions/analytics';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  totalQuestions: number;
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter?: string) => void;
  onNavigate: (page: string) => void;
}

/* Semicircle arc progress gauge — "Progress Arcs" from reference */
function ArcGauge({ pct }: { pct: number }) {
  const w = 280, h = 160;
  const cx = w / 2, cy = h - 20;
  const tracks = [
    { r: 110, color: '#7c3aed', width: 10 },
    { r: 90, color: '#06b6d4', width: 10 },
    { r: 70, color: '#10b981', width: 10 },
  ];
  const toArc = (r: number, angleDeg: number) => {
    const start = -Math.PI;
    const end = start + (Math.PI * Math.min(angleDeg, 179.9) / 180);
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);
    const large = angleDeg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };
  const angles = [pct * 1.8, pct * 1.5, pct * 1.2];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px]">
      {tracks.map((t, i) => (
        <g key={i}>
          <path d={toArc(t.r, 180)} stroke="rgba(255,255,255,0.07)" strokeWidth={t.width} fill="none" strokeLinecap="round" />
          <path d={toArc(t.r, angles[i])} stroke={t.color} strokeWidth={t.width} fill="none" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${t.color}aa)` }} />
        </g>
      ))}
      <text x={cx} y={cy - 18} textAnchor="middle" className="fill-white font-black" fontSize="32" fontWeight="900">{Math.round(pct)}%</text>
      <text x={cx} y={cy - 2} textAnchor="middle" fill="rgba(199,210,254,0.7)" fontSize="11">Matt % Completed</text>
      <text x={20} y={cy + 4} fill="rgba(199,210,254,0.5)" fontSize="10">0%</text>
      <text x={w - 40} y={cy + 4} fill="rgba(199,210,254,0.5)" fontSize="10">8,007 Questions</text>
    </svg>
  );
}

/* Streak heatmap calendar grid */
function StreakHeatmap({ currentStreak }: { currentStreak: number }) {
  const weeks = 20;
  const days = ['Sun', 'Mon', 'Tue'];
  const months = ['Mon', 'Tue', 'Wed', 'Thu', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Generate fake heatmap data seeded from streak
  const cells: boolean[][] = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: weeks }, (_, col) => {
      const seed = (row + 1) * (col + 1) * 7919;
      return (seed % 100) < (30 + Math.min(currentStreak, 60));
    })
  );
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-0.5 mb-1 ml-8">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-[9px] text-slate-500 font-bold truncate">{m}</div>
        ))}
      </div>
      {days.map((day, row) => (
        <div key={day} className="flex items-center gap-0.5 mb-0.5">
          <span className="text-[9px] text-slate-500 w-7 shrink-0">{day}</span>
          {cells[row].map((active, col) => (
            <div
              key={col}
              className={`flex-1 rounded-sm ${active ? 'bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.6)]' : 'bg-slate-800/80'}`}
              style={{ height: 10 }}
            />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-3 mt-2 ml-8">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[9px] text-slate-400">Active</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-slate-800" /><span className="text-[9px] text-slate-400">No activity</span></div>
      </div>
    </div>
  );
}

/* Circular donut for daily goal */
function GoalRing({ completed, target }: { completed: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (completed / target) * 100) : 0;
  const size = 100, stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#goalGrad)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
        <defs>
          <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white leading-none">{completed}</span>
        <span className="text-[9px] text-slate-400 font-bold">/{target}</span>
      </div>
    </div>
  );
}

/* Topic review ring */
function TopicRing({ pct }: { pct: number }) {
  const size = 100, stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#topicGrad)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} />
        <defs>
          <linearGradient id="topicGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white leading-none">{Math.round(p)}%</span>
        <span className="text-[9px] text-slate-400 font-bold mt-0.5">Completed</span>
      </div>
    </div>
  );
}

/* Mini sparkline for Recent Activity card */
function MiniSparkline({ color = '#a78bfa' }: { color?: string }) {
  const data = [{ v: 2 }, { v: 5 }, { v: 3 }, { v: 8 }, { v: 6 }, { v: 9 }, { v: 7 }];
  return (
    <ResponsiveContainer width={80} height={30}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const SCORE_COLORS: Record<string, string> = { '8': 'bg-emerald-500', '7': 'bg-sky-500', '6': 'bg-amber-500' };
const SCORE_TEXT: Record<string, string> = { '8': 'text-emerald-400', '7': 'text-sky-400', '6': 'text-amber-400' };

export const Dashboard: React.FC<DashboardProps> = ({ totalQuestions, chapterStats, onStartExam, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [data, history] = await Promise.all([
          getDashboardStats(),
          getExamHistory().catch(() => []),
        ]);
        setStats(data);
        setRecentActivity((history as any[]).slice(0, 8));
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const totalAnswered = stats?.totalAnswered ?? 0;
  const totalAvailable = totalQuestions;
  const overallPct = totalAvailable > 0 ? (totalAnswered / totalAvailable) * 100 : 0;
  const dailyCompleted = stats?.dailyGoal?.completedQuestions ?? 0;
  const dailyTarget = stats?.dailyGoal?.targetQuestions ?? 50;
  const topicReviewPct = chapterStats.length > 0
    ? Math.round((Object.keys(stats?.answeredByChapter || {}).length / chapterStats.length) * 100)
    : 0;

  return (
    <div className="flex gap-6 pb-12 w-full">
      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Hero Banner — Progress Arcs */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0a3a] via-[#0f1a3a] to-[#0a1628] border border-indigo-500/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(99,102,241,0.15)_0%,transparent_60%)]" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Progress Arcs</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                Master Civil Engineering
              </h2>
              <p className="text-sm text-indigo-200/70 mb-5 max-w-sm">
                Master canpleted completed by 8,007 questions toward Master civil Engineering.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onStartExam()}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Learn More
                </button>
                <button
                  onClick={() => onStartExam()}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <Settings2 className="w-4 h-4" />
                  Configure Exam
                </button>
              </div>
              {/* Progress indicator dots */}
              <div className="flex gap-1.5 mt-5">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-6 bg-indigo-400' : 'w-3 bg-white/20'}`} />
                ))}
              </div>
            </div>

            {/* Arc Gauge */}
            <div className="shrink-0 hidden sm:flex flex-col items-center">
              <ArcGauge pct={overallPct} />
            </div>
          </div>
        </div>

        {/* Quick Access header */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Access</h3>
        </div>

        {/* Quick Access Grid — 2×2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Daily Goal card */}
          <div className="rounded-2xl bg-[#0f111e] border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-bold text-white">Daily Goal</h4>
              </div>
              <button className="text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <GoalRing completed={dailyCompleted} target={dailyTarget} />
              <div>
                <p className="text-2xl font-black text-white">{dailyCompleted}<span className="text-slate-500 font-bold text-lg">/{dailyTarget}</span></p>
                <p className="text-xs text-slate-400 mt-1">Questions</p>
                <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all"
                    style={{ width: `${Math.min(100, (dailyCompleted / Math.max(dailyTarget, 1)) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{dailyCompleted}/{dailyTarget}</p>
              </div>
            </div>
          </div>

          {/* Streak card */}
          <div className="rounded-2xl bg-[#0f111e] border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-bold text-white">Streak</h4>
              </div>
              <button className="text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
            </div>
            {loading ? (
              <div className="h-20 animate-pulse bg-slate-800/50 rounded-xl" />
            ) : (
              <StreakHeatmap currentStreak={stats?.streak?.currentStreak ?? 0} />
            )}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-[9px] text-slate-400">Active</span>
              </div>
              <div className="flex items-center gap-1 ml-3">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
                <span className="text-[9px] text-slate-400">No 1day</span>
              </div>
            </div>
          </div>

          {/* Topic Review card */}
          <div className="rounded-2xl bg-[#0f111e] border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-bold text-white">Topic Review</h4>
              </div>
              <button className="text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <TopicRing pct={topicReviewPct} />
              <div className="space-y-2 flex-1">
                {chapterStats.slice(0, 3).map((ch, i) => {
                  const answered = stats?.answeredByChapter?.[ch.name] || 0;
                  const pct = ch.count > 0 ? (answered / ch.count) * 100 : 0;
                  return (
                    <div key={ch.name}>
                      <p className="text-[10px] text-slate-400 truncate mb-0.5">{ch.name.slice(0, 18)}</p>
                      <div className="h-1 bg-slate-800 rounded-full">
                        <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => onNavigate('topics')} className="text-[10px] text-indigo-400 flex items-center gap-1 mt-1">
                  View all topics <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Overall Progress card */}
          <div className="rounded-2xl bg-[#0f111e] border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h4 className="text-sm font-bold text-white">Overall Progress</h4>
              </div>
              <button className="text-slate-600 hover:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
            </div>
            {/* Axes labels */}
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>1,000</span>
            </div>
            {/* Mini sparkline area chart */}
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={[
                { v: 0 }, { v: 20 }, { v: 80 }, { v: 200 }, { v: 350 }, { v: 500 }, { v: Math.max(10, totalAnswered) }
              ]} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2} fill="url(#overallGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>0</span>
              <span>1/0th</span>
              <span>1/Mar</span>
              <span>1/day</span>
              <span>1/2nd</span>
              <span>Time</span>
            </div>
          </div>
        </div>

        {/* Weak Topics + Simulate Exam row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weak Topics shortcut */}
          <div className="rounded-2xl bg-[#0f111e] border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-white">Weak Topics</h4>
              </div>
              <button onClick={() => onNavigate('weak-topics')} className="text-xs text-slate-400 hover:text-slate-200">View All →</button>
            </div>
            {stats?.weakTopics?.length > 0 ? (
              <div className="space-y-2">
                {stats.weakTopics.slice(0, 3).map((t: any) => (
                  <div key={t.topic} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{t.topic}</p>
                      <div className="mt-1 h-1 bg-slate-800 rounded-full">
                        <div className="h-1 rounded-full bg-rose-500" style={{ width: `${t.accuracy}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 shrink-0">{t.accuracy}%</span>
                    <button onClick={() => onStartExam(t.topic)} className="shrink-0 p-1 rounded-lg hover:bg-slate-800 transition-colors">
                      <Play className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Complete more exams to identify weak areas.</p>
            )}
          </div>

          {/* Simulate Exam CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-[#1a1040] to-[#0f0a1e] border border-indigo-500/20 p-5 flex flex-col justify-between">
            <div>
              <Target className="w-5 h-5 text-indigo-400 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Simulate Exam</h4>
              <p className="text-xs text-slate-400">Test your limits with a strict timed exam and negative marking.</p>
            </div>
            <button
              onClick={() => onStartExam()}
              className="mt-4 inline-flex items-center gap-2 bg-[#5c2dd5] hover:bg-[#4b22b6] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 self-start"
            >
              <Play className="w-3 h-3 fill-current" />
              Start Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity right sidebar */}
      <div className="w-72 shrink-0 hidden xl:block">
        <div className="rounded-2xl bg-[#0f111e] border border-slate-800/80 p-4 sticky top-6">
          <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <>
                {/* Placeholder rows when no real data */}
                {[
                  { label: 'Completed Practice Session Review', score: '8', time: '3 hours ago', color: '#a78bfa' },
                  { label: 'Completed Practice Session - Topic Review', score: '8', time: '3 hours ago', color: '#a78bfa' },
                  { label: 'Completed Practice Session Review', score: '7', time: '3 hours ago', color: '#06b6d4' },
                  { label: 'Completed Practice- Topic Review', score: '6', time: '2 minutes ago', color: '#f59e0b' },
                  { label: 'Completed Practice Session Review 1', score: '8', time: '2 minutes ago', color: '#a78bfa' },
                  { label: 'Completed Practice- Topic Review 2', score: '8', time: '2 minutes ago', color: '#a78bfa' },
                  { label: 'Completed Practice Session', score: '8', time: '2 minutes ago', color: '#06b6d4' },
                  { label: 'Completed Practice- Topic Review 1', score: '8', time: '2 minutes ago', color: '#a78bfa' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-800/60 last:border-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-300 leading-tight line-clamp-2">{item.label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{item.time}</p>
                    </div>
                    <MiniSparkline color={item.color} />
                    <span className={`text-[9px] font-bold shrink-0 mt-0.5 ${item.score === '8' ? 'text-emerald-400' : item.score === '7' ? 'text-sky-400' : 'text-amber-400'}`}>
                      Score {item.score}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-800/60 last:border-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-300 leading-tight line-clamp-2">
                      Completed {item.mode} - {item.topic}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <MiniSparkline color={item.score >= 75 ? '#34d399' : item.score >= 50 ? '#fbbf24' : '#fb7185'} />
                  <span className={`text-[9px] font-bold shrink-0 mt-0.5 ${item.score >= 75 ? 'text-emerald-400' : item.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    Score {Math.round(item.score / 12.5)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
