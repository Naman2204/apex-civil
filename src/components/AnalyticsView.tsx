"use client";
import React, { useEffect, useState } from "react";
import { BarChart3, Target, BookOpen, Clock, Activity, Crosshair } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { getAnalyticsData } from "../app/actions/analytics";
import { EmptyState } from "./ui/primitives";

/* Glowing metric card (reference treatment) */
function GlowMetric({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "purple" | "blue";
}) {
  const border =
    tone === "purple"
      ? "from-purple-500/70 via-fuchsia-500/40 to-purple-500/70 shadow-[0_0_24px_rgba(168,85,247,0.25)]"
      : "from-sky-500/70 via-cyan-500/40 to-sky-500/70 shadow-[0_0_24px_rgba(56,189,248,0.25)]";
  const valCls = tone === "purple" ? "text-purple-400" : "text-sky-400";
  return (
    <div className={`rounded-2xl p-[1px] bg-gradient-to-r ${border}`}>
      <div className="rounded-[15px] bg-app-card px-5 py-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone === "purple" ? "bg-purple-500/10 text-purple-400" : "bg-sky-500/10 text-sky-400"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-black leading-tight ${valCls}`}>{value}</p>
          <p className="text-[10px] text-app-faint">{sub}</p>
        </div>
      </div>
    </div>
  );
}

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

  const activityData = data?.activityData || [];
  const radarData = data?.radarData || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft/60 text-accent-bright flex items-center justify-center animate-pulse mb-4">
          <BarChart3 className="w-6 h-6" />
        </div>
        <p className="text-sm text-app-muted font-medium">Computing analytics…</p>
      </div>
    );
  }

  const hasData = (data?.totalQuestions ?? 0) > 0;

  return (
    <div className="w-full pb-12 space-y-6">
      {/* Page header — reference placement */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
          Advanced Performance Analytics
        </h1>
        <p className="text-sm text-app-muted mt-1">
          Dive deep into your progress and identify optimization areas.
        </p>
      </div>

      {/* Performance Cockpit */}
      <div className="rounded-2xl border border-indigo-500/25 bg-app-card/40 p-5 sm:p-6 space-y-6">
        <h2 className="text-lg font-extrabold tracking-tight text-app-text">Performance Cockpit</h2>

        {/* Row 1 — glowing metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlowMetric
            icon={Target}
            label="Overall Accuracy"
            value={`${data?.overallAccuracy ?? "0.0"}%`}
            sub="Total Lifetime"
            tone="purple"
          />
          <GlowMetric
            icon={BookOpen}
            label="Total Questions Solved"
            value={`${data?.totalQuestions ?? 0}`}
            sub="Total Lifetime"
            tone="blue"
          />
          <GlowMetric
            icon={Clock}
            label="Avg. Time/Question"
            value={`${data?.avgTimePerQuestion ?? 0}s`}
            sub="Total Lifetime"
            tone="purple"
          />
        </div>

        {/* Row 2 — charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Performance & Accuracy — last 7 days */}
          <div className="lg:col-span-2 rounded-xl bg-app-card border border-app-border p-5">
            <h3 className="text-sm font-bold text-app-text">Performance &amp; Accuracy (Last 7 Days)</h3>
            {hasData ? (
              <div className="h-64 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                        <stop offset="60%" stopColor="#38bdf8" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--app-faint)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--app-faint)" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--app-card)", borderColor: "var(--app-border)", borderRadius: "10px", color: "var(--app-text)" }}
                      itemStyle={{ color: "#a78bfa" }}
                      labelStyle={{ color: "var(--app-muted)" }}
                      formatter={(value: any) => [`${value}%`, "Accuracy"]}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#a78bfa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAccuracy)" dot={{ r: 3, fill: "#fff", stroke: "#a78bfa", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <Activity className="w-9 h-9 text-app-faint mb-3" />
                <p className="text-sm font-bold text-app-text">No activity yet</p>
                <p className="text-xs text-app-muted mt-1">Complete exams in the last 7 days to see your trend here.</p>
              </div>
            )}
          </div>

          {/* Subject Mastery Radar */}
          <div className="rounded-xl bg-app-card border border-app-border p-5 flex flex-col">
            <h3 className="text-sm font-bold text-app-text">Subject Mastery Radar</h3>
            {radarData.length > 0 ? (
              <div className="flex-1 min-h-[240px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--app-faint)", fontSize: 9 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "var(--app-faint)", fontSize: 9 }} />
                    <Radar name="Mastery" dataKey="A" stroke="#34d399" fill="#34d399" fillOpacity={0.22} dot={{ r: 3, fill: "#34d399" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--app-card)", borderColor: "var(--app-border)", borderRadius: "10px", color: "var(--app-text)" }}
                      itemStyle={{ color: "#34d399" }}
                      labelStyle={{ color: "var(--app-muted)" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-center">
                <Crosshair className="w-9 h-9 text-app-faint mb-3" />
                <p className="text-sm font-bold text-app-text">No data yet</p>
                <p className="text-xs text-app-muted max-w-[220px] mt-1">Complete exams to see your subject-by-subject mastery.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
