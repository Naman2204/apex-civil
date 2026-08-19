"use client";
import React, { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from "recharts";
import { Target, BookOpen, Clock, Activity, Crosshair, Calendar, Puzzle, Flame, Trophy, Settings, Timer } from "lucide-react";
import { getAnalyticsData } from "../app/actions/analytics";

interface AnalyticsViewProps {
  user?: any;
  data?: any;
}

const StatChip = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
  <div className="bg-[var(--app-card2)] border border-[var(--app-border)] rounded-xl p-3 flex flex-col relative overflow-hidden group">
    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: color }} />
    <div className="flex items-center justify-between mb-2 z-10">
      <div className="drop-shadow-sm" style={{ color }}>{icon}</div>
      <div className="text-xl font-black text-[var(--app-text)] truncate pl-2">{value}</div>
    </div>
    <div className="text-[10px] uppercase font-bold text-[var(--app-muted)] tracking-wider truncate z-10">{label}</div>
  </div>
);

const CommitmentDonut = ({ pct }: { pct: number }) => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-sm">
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--app-border2)" strokeWidth="12" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="url(#donutGradLight)" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - pct/100)} strokeLinecap="round" />
      <defs>
        <linearGradient id="donutGradLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--primary-start)" />
        </linearGradient>
      </defs>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--app-text)]">
       <Settings className="w-6 h-6 text-[var(--accent)] mb-1 opacity-80" />
       <span className="text-2xl font-black tracking-tighter">{pct}%</span>
    </div>
  </div>
);

const CockpitMetricCard = ({ icon: Icon, label, value, sub, tone, sparkData }: any) => {
  const colors = {
    purple: { border: 'border-[var(--app-border-focus)]', shadow: 'shadow-sm', text: 'text-[var(--accent)]', glow: 'var(--accent)' },
    blue: { border: 'border-[var(--app-border)]', shadow: 'shadow-sm', text: 'text-[var(--primary-start)]', glow: 'var(--primary-start)' },
    cyan: { border: 'border-[var(--app-border)]', shadow: 'shadow-sm', text: 'text-[var(--status-info)]', glow: 'var(--status-info)' }
  }[tone as 'purple'|'blue'|'cyan'];

  return (
    <div className={`relative bg-[var(--app-card)] rounded-xl p-5 border ${colors.border} ${colors.shadow} flex flex-col overflow-hidden`}>
      <div className="absolute bottom-0 left-[20%] right-[20%] h-1 rounded-t-md" style={{ background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)` }} />
      <div className="flex items-center gap-4 z-10">
        <div className={`p-0 ${colors.text} shrink-0`}>
          <Icon className="w-12 h-12 drop-shadow-sm" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest truncate">{label}</p>
          <h3 className={`text-3xl mt-1 font-black tracking-tighter ${colors.text} truncate`}>{value}</h3>
          <p className="text-[11px] text-[var(--app-faint)] mt-1 truncate">{sub}</p>
        </div>
      </div>
      <div className="flex-1 mt-4 -mx-5 -mb-5 z-0 h-24">
        {sparkData && sparkData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${tone}-light`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.glow} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={colors.glow} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={colors.glow} strokeWidth={2.5} fill={`url(#spark-${tone}-light)`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const result = await getAnalyticsData();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-transparent">
        <div className="w-12 h-12 rounded-2xl bg-[var(--app-card2)] text-[var(--accent)] flex items-center justify-center animate-pulse mb-4 shadow-sm">
          <Activity className="w-6 h-6" />
        </div>
        <p className="text-sm text-[var(--app-muted)] font-medium">Computing analytics…</p>
      </div>
    );
  }

  const activityData = data?.activityData || [];
  const radarData = data?.radarData || [];
  const avgTime = data?.avgTimePerQuestion ?? 0;
  
  // Real data replacing hardcoded data
  const sparkAccuracy = data?.sparkAccuracy || [];
  const sparkQuestions = data?.sparkQuestions || [];
  const sparkTime = data?.sparkTime || [];
  const pulseData = data?.pulseData || [];
  
  const commitmentPct = data?.commitmentPct || 0;
  const activeDays = data?.activeDays || 0;
  const totalActivityQuestions = data?.totalQuestions || 0;
  const currentStreak = data?.currentStreak || 0;
  const bestStreak = data?.bestStreak || 0;

  return (
    <div className="w-full pb-12 space-y-6 font-sans">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[var(--app-text)] leading-tight">
          Advanced Performance Analytics
        </h1>
        <p className="text-sm text-[var(--app-muted)] mt-1">
          Dive deep into your progress and identify optimization areas.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--app-border2)] bg-[var(--app-card)]/40 p-5 sm:p-6 space-y-6">
        <div className="flex flex-col gap-6">
          
          {/* Top Row */}
          <div className="flex flex-col xl:flex-row gap-6 items-stretch">
            {/* Performance Cockpit */}
            <div className="w-full xl:w-2/3 space-y-4 flex flex-col">
              <h2 className="text-base font-bold text-[var(--app-text)]">Performance Cockpit</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <CockpitMetricCard icon={Target} label="Overall Accuracy" value={`${data?.overallAccuracy ?? "0.0"}%`} sub="Total Lifetime" tone="purple" sparkData={sparkAccuracy} />
                <CockpitMetricCard icon={BookOpen} label="Total Questions Solved" value={`${data?.totalQuestions ?? 0}`} sub="Total Lifetime" tone="blue" sparkData={sparkQuestions} />
                <CockpitMetricCard icon={Timer} label="Avg. Time/Question" value={avgTime >= 60 ? `${Math.floor(avgTime/60)}m ${avgTime%60}s` : `${avgTime}s`} sub="Total Lifetime" tone="cyan" sparkData={sparkTime} />
              </div>
            </div>

            {/* Subject Mastery Radar */}
            <div className="w-full xl:w-1/3 bg-[var(--app-card)] border border-[var(--app-border)] rounded-xl p-5 flex flex-col shadow-sm relative overflow-hidden">
              <h3 className="text-base font-bold text-[var(--app-text)] z-10 relative">Subject Mastery Radar</h3>
              {radarData.length > 0 ? (
                <div className="flex-1 min-h-[220px] mt-2 z-10 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="var(--app-border)" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--app-muted)', fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Mastery" dataKey="A" stroke="var(--accent)" strokeWidth={2} fill="url(#radarGradLight)" fillOpacity={0.4}
                        dot={{ r: 4, fill: '#fff', stroke: 'var(--accent)', strokeWidth: 2 }} />
                      <defs>
                        <linearGradient id="radarGradLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="var(--primary-start)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', borderRadius: 8, color: 'var(--app-text)' }}
                        itemStyle={{ color: 'var(--accent)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-center">
                  <Crosshair className="w-10 h-10 mb-3 text-[var(--app-faint)]" />
                  <p className="text-sm font-bold text-[var(--app-muted)]">No data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col xl:flex-row gap-6 items-stretch">
            {/* Performance & Accuracy — last 7 days */}
            <div className="w-full xl:w-2/3 bg-[var(--app-card)] border border-[var(--app-border)] rounded-xl p-5 flex flex-col shadow-sm">
              <h3 className="text-base font-bold text-[var(--app-text)] mb-2">Performance &amp; Accuracy (Last 7 Days)</h3>
              {activityData.length > 0 ? (
                <div className="flex-1 w-full mt-3 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="perfAreaGradLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                          <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--app-border2)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--app-faint)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--app-faint)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip contentStyle={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', borderRadius: 8, color: 'var(--app-text)' }}
                        itemStyle={{ color: 'var(--accent)' }} labelStyle={{ color: 'var(--app-muted)' }}
                        formatter={(v: any) => [`${v}%`, "Accuracy"]} />
                      <Area type="monotone" dataKey="accuracy" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#perfAreaGradLight)"
                        dot={{ r: 5, fill: 'var(--app-card)', stroke: 'var(--accent)', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[220px]">
                  <Activity className="w-10 h-10 mb-3 text-[var(--app-faint)]" />
                  <p className="text-sm font-bold text-[var(--app-muted)]">No activity yet</p>
                </div>
              )}
            </div>

            {/* Daily Activity panel */}
            <div className="w-full xl:w-1/3 bg-[var(--app-card)] border border-[var(--app-border)] rounded-xl p-5 flex flex-col shadow-sm">
              <h3 className="text-base font-bold text-[var(--app-text)] mb-6">Daily Activity</h3>

              <div className="grid grid-cols-2 gap-4 items-start flex-1">
                {/* Commitment Score donut */}
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs font-semibold text-[var(--app-muted)]">Commitment Score</p>
                  <CommitmentDonut pct={commitmentPct} />
                  <p className="text-xs font-semibold text-[var(--app-muted)] mt-2 text-center">Commitment Score</p>
                </div>

                {/* Pulse wave & Stats */}
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-[var(--app-muted)]">Pulse Wave</p>
                      <p className="text-[10px] text-[var(--app-faint)]">Last 30 days</p>
                    </div>
                    <div className="h-16 w-full">
                      {(pulseData && pulseData.length > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={pulseData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="pulseGradLight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--status-success)" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="var(--status-success)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="var(--status-success)" strokeWidth={2.5} fill="url(#pulseGradLight)"
                              dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-[var(--app-faint)]">
                          No pulse data
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Consistency stats */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--app-muted)] mb-3">Consistency Stats</p>
                    <div className="grid grid-cols-2 gap-3">
                      <StatChip icon={<Calendar className="w-6 h-6" />} label="Active Days" value={activeDays} color="var(--accent)" />
                      <StatChip icon={<Puzzle className="w-6 h-6" />} label="Qs Solved" value={totalActivityQuestions} color="var(--primary-start)" />
                      <StatChip icon={<Flame className="w-6 h-6" />} label="Curr Streak" value={`${currentStreak}d`} color="var(--status-danger)" />
                      <StatChip icon={<Trophy className="w-6 h-6" />} label="Best Streak" value={`${bestStreak}d`} color="var(--status-warning)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
