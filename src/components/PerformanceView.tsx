"use client";
import React, { useEffect, useState } from 'react';
import { Activity, Clock, Target, CheckCircle2, XCircle } from 'lucide-react';
import { getExamHistory } from '../app/actions/analytics';

export const PerformanceView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getExamHistory();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center transition-colors">
            <Activity className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Performance History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">Review your past attempts and track improvements.</p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden transition-colors shadow-sm dark:shadow-none">
        
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-[#0A0C18] border-b border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
          <div className="col-span-4 md:col-span-3">Date</div>
          <div className="col-span-4 md:col-span-3 hidden md:block">Topic</div>
          <div className="col-span-3 md:col-span-2">Mode</div>
          <div className="col-span-3 md:col-span-2 text-center">Score</div>
          <div className="col-span-2 text-right hidden md:block">Time</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {history.map((record) => {
            const percentage = Math.round((record.score / record.total) * 100);
            const isGood = percentage >= 75;
            
            return (
              <div key={record.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors">
                
                {/* Date */}
                <div className="col-span-4 md:col-span-3">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors">{record.date}</div>
                  <div className="text-[10px] text-slate-500 md:hidden mt-0.5">{record.topic}</div>
                </div>
                
                {/* Topic (Desktop) */}
                <div className="col-span-4 md:col-span-3 hidden md:block">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate transition-colors">{record.topic}</div>
                </div>

                {/* Mode */}
                <div className="col-span-3 md:col-span-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                    record.mode === 'Strict Exam' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {record.mode}
                  </span>
                </div>

                {/* Score */}
                <div className="col-span-5 md:col-span-2 text-center flex flex-col items-center">
                  <div className="flex items-center space-x-1.5">
                    {isGood ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Target className="w-4 h-4 text-amber-500" />}
                    <span className={`text-lg font-black transition-colors ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">{record.score} / {record.total}</div>
                </div>

                {/* Time */}
                <div className="col-span-2 text-right hidden md:flex items-center justify-end space-x-1 text-slate-500 dark:text-slate-400 transition-colors">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm">{record.time}</span>
                </div>

                {/* Mobile time */}
                <div className="col-span-12 md:hidden flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{record.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};
