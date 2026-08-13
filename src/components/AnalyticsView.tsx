"use client";
import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Activity, Crosshair, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getAnalyticsData } from '../app/actions/analytics';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getAnalyticsData();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activityData = data?.activityData || [];
  
  // Note: Radar chart needs detailed subject breakdown.
  // For now we'll use placeholder radar data since we only compute accuracy globally in getAnalyticsData.
  const radarData = [
    { subject: 'Structure', A: 120, fullMark: 150 },
    { subject: 'Geo', A: 98, fullMark: 150 },
    { subject: 'Water', A: 86, fullMark: 150 },
    { subject: 'Env', A: 99, fullMark: 150 },
    { subject: 'Transpo', A: 85, fullMark: 150 },
    { subject: 'Survey', A: 65, fullMark: 150 },
  ];

  return (
    <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-colors">
          <BarChart3 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Detailed Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">Track your progress and identify patterns.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 transition-colors shadow-sm dark:shadow-none">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2 transition-colors">
            <Target className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase">Overall Accuracy</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{data?.overallAccuracy || '0.0'}%</div>
          <div className="text-xs text-slate-500 mt-2 transition-colors">Total Lifetime</div>
        </div>
        <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 transition-colors shadow-sm dark:shadow-none">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2 transition-colors">
            <Activity className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase">Questions Solved</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{data?.totalQuestions || 0}</div>
          <div className="text-xs text-slate-500 mt-2 transition-colors">Total Lifetime</div>
        </div>
        <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 transition-colors shadow-sm dark:shadow-none">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2 transition-colors">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase">Avg Time/Question</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{data?.avgTimePerQuestion || 0}s</div>
          <div className="text-xs text-slate-500 mt-2 transition-colors">Total Lifetime</div>
        </div>
        <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 transition-colors shadow-sm dark:shadow-none">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2 transition-colors">
            <Award className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-bold uppercase">Activity</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white leading-tight mt-1 transition-colors">Last 7 Days</div>
          <div className="text-xs text-slate-500 mt-2 transition-colors">Keep practicing!</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 transition-colors shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 transition-colors">Activity & Accuracy (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5c2dd5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5c2dd5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-prose-body, #0A0C18)', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#9b66ff' }}
                />
                <Area type="monotone" dataKey="questions" stroke="#5c2dd5" strokeWidth={3} fillOpacity={1} fill="url(#colorQuestions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col transition-colors shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 transition-colors">Subject Mastery Radar</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" className="dark:stroke-slate-800" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Mastery" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--tw-prose-body, #0A0C18)', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

// Quick Icons for missing ones
function Target(props: any) { return <Crosshair {...props} />; }
function Clock(props: any) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
