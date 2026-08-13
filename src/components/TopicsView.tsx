"use client";
import React, { useState } from 'react';
import { Layers, Search, ArrowRight, BookOpen, Clock, Target } from 'lucide-react';

interface TopicsViewProps {
  chapterStats: { name: string; count: number }[];
  onStartExam: (chapter: string) => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({ chapterStats, onStartExam }) => {
  const [search, setSearch] = useState('');

  const filtered = chapterStats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // SVG Icons
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('railway')) return { bg: 'bg-[#2563eb]', icon: <TrainIcon /> };
    if (n.includes('hydro')) return { bg: 'bg-[#3b82f6]', icon: <DropletsIcon /> };
    if (n.includes('highway')) return { bg: 'bg-[#16a34a]', icon: <HighwayIcon /> };
    if (n.includes('geo')) return { bg: 'bg-[#ea580c]', icon: <HammerIcon /> };
    if (n.includes('estimation')) return { bg: 'bg-[#a855f7]', icon: <CalculatorIcon /> };
    if (n.includes('environ')) return { bg: 'bg-[#65a30d]', icon: <LeafIcon /> };
    if (n.includes('structure')) return { bg: 'bg-[#ec4899]', icon: <BuildingIcon /> };
    return { bg: 'bg-[#5c2dd5]', icon: <BookOpen className="w-4 h-4" /> };
  };

  return (
    <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 dark:from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 mb-4 transition-colors">
              <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Mastery Catalog</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">Topics & Chapters</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md transition-colors">Browse our comprehensive collection of civil engineering topics. Select any chapter to begin a targeted practice session.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search topics..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0A0C18] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(chapter => {
          const style = getIcon(chapter.name);
          return (
            <button
              key={chapter.name}
              onClick={() => onStartExam(chapter.name)}
              className="group text-left bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg ${style.bg}`}>
                  {style.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0A0C18] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1 line-clamp-2 min-h-[40px] group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{chapter.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{chapter.count} Questions Available</p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 transition-colors">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5">
                  <span className="font-bold">Progress</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#0A0C18] rounded-full h-1.5 transition-colors">
                  <div className={`h-1.5 rounded-full ${style.bg}`} style={{ width: '0%' }}></div>
                </div>
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500">No topics found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Icons reused
function TrainIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>; }
function DropletsIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 6.3 7 6.3s-2.15 1.83-3.29 2.76S2 11.09 2 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>; }
function HighwayIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 22 8 2"/><path d="M22 22 14 2"/><path d="M2 22l8-20"/><path d="M14 22 6 2"/></svg>; }
function HammerIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16 4.6V3.86a2.92 2.92 0 0 0-.86-2.25L13.89.36l-4.26 4.26A2 2 0 0 0 9 6.03l-.4.4a2 2 0 0 0 0 2.83l2.54 2.54a2 2 0 0 0 2.83 0l.4-.4a2 2 0 0 0 1.42-.59L20.05 6.55z"/></svg>; }
function CalculatorIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>; }
function LeafIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>; }
function BuildingIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>; }
