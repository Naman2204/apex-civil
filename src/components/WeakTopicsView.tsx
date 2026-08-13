"use client";
import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Play, Crosshair } from 'lucide-react';
import { getWeakTopics } from '../app/actions/analytics';

interface WeakTopicsViewProps {
  onStartExam: (chapter?: string) => void;
}

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({ onStartExam }) => {
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const data = await getWeakTopics();
        setWeakTopics(data);
      } catch (err) {
        console.error("Failed to fetch weak topics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  return (
    <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-rose-500/20 rounded-2xl p-8 relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-rose-500/5 dark:from-rose-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-500/20 mb-4 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Needs Improvement</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 transition-colors">Weak Topics Analysis</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md transition-colors">Our AI has identified these areas based on your recent exam performance. Targeted practice here will yield the highest score improvements.</p>
          </div>
          
          <button 
            onClick={() => onStartExam()}
            className="shrink-0 flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5"
          >
            <Crosshair className="w-5 h-5" />
            <span>Target Weaknesses</span>
          </button>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {weakTopics.length > 0 ? (
          weakTopics.map((topic, index) => (
            <div key={topic.name} className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-rose-300 dark:hover:border-rose-500/30 transition-colors shadow-sm dark:shadow-none">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-lg transition-colors">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 transition-colors">{topic.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">Based on {topic.count} attempted questions</p>
                </div>
              </div>
              
              <div className="w-full sm:w-64 flex flex-col space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Accuracy</span>
                  <span className="font-bold text-rose-500">{topic.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#0A0C18] rounded-full h-2 transition-colors">
                  <div className="bg-gradient-to-r from-rose-600 to-orange-500 h-2 rounded-full" style={{ width: `${topic.accuracy}%` }}></div>
                </div>
              </div>

              <button 
                onClick={() => onStartExam(topic.name)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-[#1a1c2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Practice</span>
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-[#1a1c2e] mb-4 transition-colors">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">No Weak Topics Yet!</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 transition-colors">You either haven't taken enough exams yet, or you're absolutely crushing it. Keep practicing to build more data.</p>
            <button 
              onClick={() => onStartExam()}
              className="bg-[#5c2dd5] hover:bg-[#4b22b6] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              Start an Exam
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
