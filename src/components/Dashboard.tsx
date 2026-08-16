"use client";
import React, { useEffect, useState } from 'react';
import { Play, Target, Flame, AlertTriangle, ClipboardList, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { getDashboardStats } from '../app/actions/dashboard';
import { getExamHistory } from '../app/actions/analytics';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  totalQuestions: number;
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter?: string) => void;
  onNavigate: (page: string) => void;
}

/* ── Semicircle Arc Gauge ── */
function ArcGauge({ pct }: { pct: number }) {
  const W = 300, H = 170;
  const cx = W / 2, cy = H - 10;
  const arcs = [
    { r: 120, color: '#a855f7', width: 12 },
    { r: 98,  color: '#3b82f6', width: 12 },
    { r: 76,  color: '#06b6d4', width: 12 },
  ];
  function arc(r: number, deg: number) {
    const start = -Math.PI;
    const end = start + (Math.PI * Math.min(deg, 179.8) / 180);
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end),   ey = cy + r * Math.sin(end);
    const lg = deg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${lg} 1 ${ex} ${ey}`;
  }
  const degs = [pct * 1.8, pct * 1.5, pct * 1.2];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px]">
      {arcs.map((a, i) => (
        <g key={i}>
          <path d={arc(a.r, 180)} stroke="rgba(255,255,255,0.06)" strokeWidth={a.width} fill="none" strokeLinecap="round" />
          <path d={arc(a.r, degs[i])} stroke={a.color} strokeWidth={a.width} fill="none" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${a.color}88)` }} />
        </g>
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 24} textAnchor="middle" fill="white" fontSize="36" fontWeight="900" fontFamily="system-ui">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="11" fontFamily="system-ui">
        Matt % Completed
      </text>
      {/* Labels */}
      <text x="16" y={cy + 8} fill="rgba(148,163,184,0.5)" fontSize="10">0%</text>
      <text x={W - 85} y={cy + 8} fill="rgba(148,163,184,0.5)" fontSize="10">8,007 Questions</text>
    </svg>
  );
}

/* ── Donut ring for Daily Goal ── */
function GoalRing({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (done / target) * 100) : 0;
  const size = 120, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gGoal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gGoal)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(pct/100)*c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{done}</span>
        <span className="text-xs text-slate-400 font-bold">/{target}</span>
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
          <linearGradient id="gTopic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gTopic)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p/100)*c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white leading-none">{Math.round(p)}%</span>
        <span className="text-xs text-slate-400 font-bold mt-1">Completed</span>
      </div>
    </div>
  );
}

/* ── GitHub-style Heatmap (3 rows × 20 weeks) ── */
function StreakHeatmap({ streak }: { streak: number }) {
  const WEEKS = 20, ROWS = 3;
  const rowLabels = ['Sun', 'May', 'Tue'];
  const colLabels = ['Mon','Tue','Wed','Thu','Jul','Aug','Sep','Oct','Nov','Dec'];
  const cells: boolean[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: WEEKS }, (_, c) => {
      const seed = (r * 7 + 1) * (c * 13 + 1) * 997;
      return (seed % 100) < Math.min(70, 25 + streak * 2);
    })
  );
  return (
    <div className="w-full">
      {/* Month labels */}
      <div className="flex gap-[2px] mb-1 pl-8">
        {colLabels.map((m, i) => (
          <div key={i} className="flex-1 text-[9px] text-app-muted font-medium text-center truncate">{m}</div>
        ))}
      </div>
      {cells.map((row, ri) => (
        <div key={ri} className="flex items-center gap-[2px] mb-[2px]">
          <span className="text-[9px] text-app-muted w-7 shrink-0">{rowLabels[ri]}</span>
          {row.map((active, ci) => (
            <div key={ci} className={`flex-1 rounded-[2px] transition-all ${active ? 'bg-[var(--status-success)] shadow-[0_0_4px_rgba(67,160,71,0.7)]' : 'bg-app-bg'}`}
              style={{ height: 12 }} />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-4 mt-2 pl-8">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[2px] bg-[var(--status-success)]" /><span className="text-[9px] text-app-muted">Active</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[2px] bg-app-bg" /><span className="text-[9px] text-app-muted">No 1day</span></div>
      </div>
    </div>
  );
}

/* ── Card wrapper identical to reference ── */
function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-app-card border border-app-border flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-bold text-app-text">{title}</h3>
        <button className="text-app-muted hover:text-app-text transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 px-5 pb-5">{children}</div>
    </div>
  );
}

/* ── Score badge in Recent Activity ── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-[var(--status-success)]' : score >= 6 ? 'bg-[var(--status-info)]' : 'bg-[var(--status-warning)]';
  return (
    <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded ${color}`}>
      Score {score}
    </span>
  );
}

export const Dashboard: React.FC<DashboardProps> = ({ totalQuestions, chapterStats, onStartExam, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [s, h] = await Promise.all([getDashboardStats(), getExamHistory().catch(() => [])]);
        setStats(s);
        setRecentActivity((h as any[]).slice(0, 8));
      } catch (e) { console.error("Failed to fetch stats", e); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const totalAnswered   = stats?.totalAnswered ?? 0;
  const overallPct      = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
  const dailyDone       = stats?.dailyGoal?.completedQuestions ?? 0;
  const dailyTarget     = stats?.dailyGoal?.targetQuestions ?? 50;
  const topicsAnswered  = Object.keys(stats?.answeredByChapter || {}).length;
  const topicsPct       = chapterStats.length > 0 ? (topicsAnswered / chapterStats.length) * 100 : 0;
  const streak          = stats?.streak?.currentStreak ?? 0;

  /* Overall progress chart data */
  const progressData = [
    { t: '1/0th', v: 0 },
    { t: '1/1ar', v: Math.max(0, totalAnswered * 0.15) },
    { t: '1/day', v: Math.max(0, totalAnswered * 0.35) },
    { t: '2/2nd', v: Math.max(0, totalAnswered * 0.6) },
    { t: 'Time',  v: Math.max(0, totalAnswered * 0.8) },
    { t: 'Time',  v: Math.max(0, totalAnswered * 0.9) },
    { t: 'Time',  v: Math.max(0, totalAnswered) },
  ];

  /* Placeholder activity (shown if no real data) */
  const MOCK_ACTIVITY = [
    { label: 'Completed Practice Session Review',         score: 8, time: '3 hours ago' },
    { label: 'Completed Practice Session - Topic Review', score: 8, time: '3 hours ago' },
    { label: 'Completed Practice Session Review',         score: 7, time: '3 hours ago' },
    { label: 'Completed Practice- Topic Review',          score: 6, time: '2 minutes ago' },
    { label: 'Completed Practice Session Review 1',       score: 8, time: '2 minutes ago' },
    { label: 'Completed Practice- Topic Review 2',        score: 8, time: '2 minutes ago' },
    { label: 'Completed Practice- Topic Review',          score: 8, time: '2 minutes ago' },
    { label: 'Completed Practice- Topic Review 1',        score: 8, time: '2 mixues ago' },
  ];

  const activity = recentActivity.length > 0
    ? recentActivity.map((r: any) => ({
        label: `Completed ${r.mode} - ${r.topic}`,
        score: Math.round((r.score / 100) * 10),
        time: r.date,
      }))
    : MOCK_ACTIVITY;

  return (
    <div className="flex gap-5 w-full">

      {/* ─── Main column ─── */}
      <div className="flex-1 min-w-0 space-y-5 min-w-0">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #1a0a3a 0%, #0f1a40 50%, #0a1628 100%)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(99,102,241,0.2)_0%,transparent_55%)]" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7">

            {/* Text side */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-app-muted mb-1">Progress Arcs</p>
              <h2 className="text-2xl font-black text-white leading-tight mb-2">
                Master Civil Engineering
              </h2>
              <p className="text-sm text-app-muted mb-5 max-w-xs">
                Master canpleted completed by 8,007 questions toward Master civil Engineering.
              </p>
              <button
                onClick={() => onStartExam()}
                className="inline-flex items-center gap-2 bg-[#2d4a8a] hover:bg-[#3b5fad] text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all"
              >
                Learn More
              </button>
              {/* Dots indicator */}
              <div className="flex gap-1.5 mt-6">
                <div className="w-6 h-1.5 rounded-full bg-[#3b82f6]" />
                <div className="w-3 h-1.5 rounded-full bg-white/20" />
                <div className="w-3 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>

            {/* Arc gauge */}
            <div className="hidden sm:flex items-center justify-center w-[300px] shrink-0">
              <ArcGauge pct={Math.round(overallPct)} />
            </div>
          </div>
        </div>

        {/* ── "Quick Access" label ── */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-0.5">Quick Access</p>

        {/* ── 2×2 Grid ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Daily Goal */}
          <Card title="Daily Goal">
            <div className="flex items-center gap-5 mt-1">
              <GoalRing done={dailyDone} target={dailyTarget} />
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-black text-white">
                  {dailyDone}<span className="text-xl text-slate-500 font-bold">/{dailyTarget}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Questions</p>
              </div>
            </div>
            {/* Bottom bar */}
            <div className="flex items-center justify-between text-[11px] text-app-muted mt-4">
              <span>Questions</span>
              <span>{dailyDone}/{dailyTarget}</span>
            </div>
            <div className="mt-1.5 w-full h-2 bg-app-bg rounded-full">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] transition-all"
                style={{ width: `${Math.min(100, dailyTarget > 0 ? (dailyDone/dailyTarget)*100 : 0)}%` }} />
            </div>
          </Card>

          {/* Streak */}
          <Card title="Streak">
            <div className="mt-2">
              {loading
                ? <div className="h-20 bg-app-bg rounded-xl animate-pulse" />
                : <StreakHeatmap streak={streak} />
              }
            </div>
          </Card>

          {/* Topic Review */}
          <Card title="Topic Review">
            <div className="flex flex-col items-center mt-1">
              <TopicRing pct={topicsPct} />
            </div>
          </Card>

          {/* Overall Progress */}
          <Card title="Overall Progress">
            <div className="mt-1">
              <div className="text-[10px] text-app-muted mb-1">1,000</div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={progressData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overallFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: 'var(--app-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--app-muted)', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)', borderRadius: 8, color: 'var(--app-text)' }}
                    formatter={(v: any) => [v, 'Questions']}
                  />
                  <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2}
                    fill="url(#overallFill)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-between text-[9px] text-app-muted mt-1">
                <span>0</span><span>1/0th</span><span>1/1ar</span><span>1/day</span><span>1/2nd</span><span>Time</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Recent Activity sidebar ─── */}
      <div className="w-[270px] shrink-0 hidden xl:block min-w-[270px]">
        <div className="rounded-2xl bg-app-card border border-app-border sticky top-[72px]">
          <div className="px-4 py-4 border-b border-app-border">
            <h3 className="text-sm font-bold text-app-text">Recent Activity</h3>
          </div>
          <div className="divide-y divide-app-border max-h-[calc(100vh-120px)] overflow-y-auto">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-app-text leading-tight line-clamp-2">{item.label}</p>
                  <p className="text-[9px] text-app-muted mt-1">{item.time}</p>
                </div>
                <ScoreBadge score={item.score} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
