"use client";
import React, { useEffect, useState } from 'react';
import { Play, BookOpen, Target, Flame, Calendar, AlertTriangle, ChevronRight, Zap, Settings2, BarChart3, Infinity, Clock, ArrowRight } from 'lucide-react';
import { getDashboardStats } from '../app/actions/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  totalQuestions: number;
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter?: string) => void;
  onNavigate: (page: 'settings' | 'topics' | 'weak-topics') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ totalQuestions, chapterStats, onStartExam, onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const goalData = stats?.dailyGoal ? [
    { name: 'Completed', value: stats.dailyGoal.completedQuestions },
    { name: 'Remaining', value: Math.max(0, stats.dailyGoal.targetQuestions - stats.dailyGoal.completedQuestions) }
  ] : [];
  const COLORS = ['#22c55e', '#1e293b']; // Emerald for completed, dark for remaining

  // Map icons and colors to specific chapters for the mockup look
  const getChapterStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('railway')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center"><TrainIcon /></div>, color: 'bg-[#2563eb]' };
    if (n.includes('hydro')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#3b82f6] text-white flex items-center justify-center"><DropletsIcon /></div>, color: 'bg-[#3b82f6]' };
    if (n.includes('highway')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#16a34a] text-white flex items-center justify-center"><HighwayIcon /></div>, color: 'bg-[#16a34a]' };
    if (n.includes('geo')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#ea580c] text-white flex items-center justify-center"><HammerIcon /></div>, color: 'bg-[#ea580c]' };
    if (n.includes('estimation')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#a855f7] text-white flex items-center justify-center"><CalculatorIcon /></div>, color: 'bg-[#a855f7]' };
    if (n.includes('environ')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#65a30d] text-white flex items-center justify-center"><LeafIcon /></div>, color: 'bg-[#65a30d]' };
    if (n.includes('structure')) return { icon: <div className="w-8 h-8 rounded-lg bg-[#ec4899] text-white flex items-center justify-center"><BuildingIcon /></div>, color: 'bg-[#ec4899]' };
    
    // Default
    return { icon: <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>, color: 'bg-indigo-500' };
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2913e8] via-[#4f34f7] to-[#804dee] rounded-2xl p-8 sm:p-10 shadow-lg">
        {/* Abstract Bridge Illustration / Vectors */}
        <div className="absolute right-0 bottom-0 opacity-40 pointer-events-none w-1/2 h-full flex justify-end">
           {/* Placeholder for the bridge illustration in the mockup */}
           <svg viewBox="0 0 800 400" className="w-full h-full object-cover origin-bottom-right scale-110">
              <path d="M100 400 L300 100 L350 100 L550 400 Z" fill="rgba(255,255,255,0.1)" />
              <path d="M400 400 L600 150 L650 150 L850 400 Z" fill="rgba(255,255,255,0.15)" />
              <path d="M0 380 L800 380 L800 400 L0 400 Z" fill="rgba(255,255,255,0.2)" />
              <path d="M100 400 L100 150 M150 400 L150 200 M200 400 L200 250 M250 400 L250 300" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <path d="M600 400 L600 200 M650 400 L650 250 M700 400 L700 300 M750 400 L750 350" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
           </svg>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">YOUR LEARNING HUB</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Master Civil Engineering
          </h2>
          <p className="text-sm text-indigo-100 mb-8 font-medium max-w-md">
            Access {totalQuestions.toLocaleString()} meticulously categorized questions. Build your customized exam or jump into a quick practice session.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onStartExam()}
              className="inline-flex items-center space-x-2 bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Quick Practice</span>
            </button>
            <button
              onClick={() => onStartExam()}
              className="inline-flex items-center space-x-2 bg-transparent border border-white/30 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span>Configure Exam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - 4 Columns */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-[#131627] rounded-2xl"></div>)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Goal */}
          <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
                <Target className="w-4 h-4" />
                <h3 className="text-xs font-semibold">Daily Goal</h3>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {stats.dailyGoal?.completedQuestions} / {stats.dailyGoal?.targetQuestions} Questions
              </p>
              <p className="text-[10px] text-slate-500">Keep going to reach your target!</p>
              <button onClick={() => onNavigate('settings')} className="text-[10px] text-indigo-500 font-semibold flex items-center mt-2 hover:text-indigo-400">
                <span className="mr-1">✎</span> Edit Goal
              </button>
            </div>
            <div className="w-16 h-16 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={goalData} cx="50%" cy="50%" innerRadius={22} outerRadius={32} stroke="none" dataKey="value">
                    {goalData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-white">
                {stats.dailyGoal?.targetQuestions > 0 ? Math.round((stats.dailyGoal.completedQuestions / stats.dailyGoal.targetQuestions) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-semibold">Current Streak</h3>
            </div>
            <div className="flex items-baseline space-x-1 mb-1">
              <span className="text-3xl font-black text-orange-500">{stats.streak?.currentStreak}</span>
              <span className="text-sm font-bold text-slate-400">Days</span>
            </div>
            <p className="text-[10px] text-slate-500">Longest streak: {stats.streak?.longestStreak} days</p>
            {/* Tiny sparkline placeholder */}
            <div className="mt-3 h-6 w-full flex items-end space-x-1">
               {[2,4,3,6,5,8,7].map((h, i) => (
                 <div key={i} className="flex-1 bg-orange-500/20 rounded-t-sm" style={{ height: `${h*10}%` }}></div>
               ))}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
                <BarChart3 className="w-4 h-4" />
                <h3 className="text-xs font-semibold">Overall Progress</h3>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {stats.totalAnswered || 0} / {totalQuestions.toLocaleString()} Questions
              </p>
              {stats.totalAnswered > 0 ? (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Keep going — {Math.round(((stats.totalAnswered || 0) / Math.max(1, totalQuestions)) * 100)}% of the bank explored!</p>
              ) : (
                <p className="text-[10px] text-slate-500">Start practicing to see progress!</p>
              )}
              {/* Wave line placeholder */}
              <div className="mt-3 h-4 w-full text-indigo-500/50">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full stroke-current fill-none" strokeWidth="2">
                  <path d="M0 10 Q 25 0 50 10 T 100 10" />
                </svg>
              </div>
            </div>
            <div className="w-12 h-12 relative shrink-0 rounded-full border-4 border-slate-800 flex items-center justify-center ml-2">
               <span className="text-[10px] font-bold">{stats.totalAnswered > 0 ? Math.round(((stats.totalAnswered || 0) / Math.max(1, totalQuestions)) * 100) : 0}%</span>
            </div>
          </div>

          {/* Exam Countdown */}
          <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <h3 className="text-xs font-semibold">Exam Countdown</h3>
            </div>
            {stats.examTargetDate && stats.daysRemaining !== null ? (
              <>
                <div className="flex items-baseline space-x-1 mb-1">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-500">{Math.max(0, stats.daysRemaining)}</span>
                  <span className="text-sm font-bold text-slate-400">Days</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-3">Target Date: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(stats.examTargetDate))}</p>
                <button onClick={() => onNavigate('settings')} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-4 py-1.5 rounded-lg transition-colors">
                  Edit Target
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No exam date set.</p>
                <p className="text-[10px] text-slate-500 mb-3">Set your target date and stay on track.</p>
                <button onClick={() => onNavigate('settings')} className="bg-[#5c2dd5] hover:bg-[#4b22b6] text-white text-[11px] font-bold px-4 py-1.5 rounded-lg transition-colors">
                  Set Target Date
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Explore Topics (Col span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <h3 className="text-base font-bold text-slate-200">Explore Topics</h3>
            </div>
            <button onClick={() => onNavigate('topics')} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
              View All Topics <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chapterStats.slice(0, 7).map((chapter) => {
              const style = getChapterStyle(chapter.name);
              const answered = stats?.answeredByChapter?.[chapter.name] || 0;
              const pct = chapter.count > 0 ? Math.round((answered / chapter.count) * 100) : 0;
              return (
                <button
                  key={chapter.name}
                  onClick={() => onStartExam(chapter.name)}
                  className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group flex items-start space-x-4 shadow-sm dark:shadow-none cursor-pointer"
                >
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-white mb-1 transition-colors">{chapter.name}</h4>
                    <p className="text-[10px] text-slate-500 mb-3">{chapter.count} Questions</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-100 dark:bg-[#0A0C18] rounded-full h-1">
                        <div className={`h-1 rounded-full ${style.color}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">{pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {/* View All Card */}
            <button
              onClick={() => onNavigate('topics')}
              className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex items-center justify-center space-x-3 shadow-sm dark:shadow-none"
            >
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded bg-indigo-500/10 dark:bg-indigo-500/20"></div>
                <div className="w-4 h-4 rounded bg-blue-500/10 dark:bg-blue-500/20"></div>
                <div className="w-4 h-4 rounded bg-emerald-500/10 dark:bg-emerald-500/20"></div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors">View All Topics</h4>
                <p className="text-[10px] text-slate-500">{chapterStats.length} Topics Available</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </button>
          </div>
        </div>

        {/* Right Sidebar (Weak Topics & Simulate Exam) */}
        <div className="space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 transition-colors">Weak Topics</h3>
            </div>
            <button onClick={() => onNavigate('weak-topics')} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">View All →</button>
          </div>
          
          {stats?.weakTopics && stats.weakTopics.length > 0 ? (
            <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm dark:shadow-none transition-colors overflow-hidden">
              {stats.weakTopics.map((topic: any, idx: number) => (
                <div
                  key={topic.topic}
                  role="button"
                  tabIndex={0}
                  onClick={() => onStartExam(topic.topic)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStartExam(topic.topic); }}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors ${idx !== stats.weakTopics.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}
                >
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 truncate">{topic.topic}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-100 dark:bg-[#0A0C18] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-rose-500" style={{ width: `${topic.accuracy}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-rose-500">{topic.accuracy}%</span>
                    </div>
                  </div>
                  <span className="shrink-0 p-2 text-slate-400 group-hover:text-indigo-500 rounded-lg transition-colors">
                    <Play className="w-4 h-4" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[200px] shadow-sm dark:shadow-none transition-colors">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-3 transition-colors">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-1 transition-colors">No Data Yet</h4>
              <p className="text-xs text-slate-500 px-4">Complete more practice exams to identify your weak areas.</p>
              <div className="flex items-end space-x-1 mt-4 opacity-20">
                <div className="w-2 h-4 bg-slate-400 rounded-sm"></div>
                <div className="w-2 h-8 bg-slate-400 rounded-sm"></div>
                <div className="w-2 h-6 bg-slate-400 rounded-sm"></div>
                <div className="w-2 h-10 bg-slate-400 rounded-sm"></div>
                <div className="w-2 h-5 bg-slate-400 rounded-sm"></div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-[#1b1e36] to-[#0A0C18] border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Clock className="w-32 h-32 transform translate-x-8 translate-y-8" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2 text-indigo-400">
                <Target className="w-4 h-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Simulate Exam</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5 max-w-[200px]">Test your limits with a strict timed exam and negative marking.</p>
              <button 
                onClick={() => onStartExam()}
                className="bg-[#5c2dd5] hover:bg-[#4b22b6] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-indigo-500/20"
              >
                <Play className="w-3 h-3 mr-1.5 fill-current" />
                Start Simulation
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Summary Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
        <div className="bg-white dark:bg-[#131627] rounded-xl p-4 flex items-center space-x-4 border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none transition-colors">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <LayersIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{totalQuestions.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">Total Questions</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#131627] rounded-xl p-4 flex items-center space-x-4 border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{chapterStats.length}</div>
            <div className="text-[10px] text-slate-500">Major Topics</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#131627] rounded-xl p-4 flex items-center space-x-4 border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">4</div>
            <div className="text-[10px] text-slate-500">Practice Modes</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#131627] rounded-xl p-4 flex items-center space-x-4 border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none transition-colors">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400">
            <Infinity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">∞</div>
            <div className="text-[10px] text-slate-500">Possibilities</div>
          </div>
        </div>
      </div>

    </div>
  );
};

// SVG Icons
function LayersIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}
function TrainIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>;
}
function DropletsIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 6.3 7 6.3s-2.15 1.83-3.29 2.76S2 11.09 2 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>;
}
function HighwayIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 22 8 2"/><path d="M22 22 14 2"/><path d="M2 22l8-20"/><path d="M14 22 6 2"/></svg>;
}
function HammerIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16 4.6V3.86a2.92 2.92 0 0 0-.86-2.25L13.89.36l-4.26 4.26A2 2 0 0 0 9 6.03l-.4.4a2 2 0 0 0 0 2.83l2.54 2.54a2 2 0 0 0 2.83 0l.4-.4a2 2 0 0 0 1.42-.59L20.05 6.55z"/></svg>;
}
function CalculatorIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>;
}
function LeafIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
}
function BuildingIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
}
