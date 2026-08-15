"use client";
import React, { useState } from 'react';
import { Play, Settings2, BookOpen, Clock, Target, Layers, Zap, SlidersHorizontal, ArrowLeft, ShieldCheck, Database, Lightbulb, BarChart3 } from 'lucide-react';

export interface ExamConfig {
  mode: 'PRACTICE' | 'EXAM';
  chapter: string;
  difficulty: string;
  questionCount: number;
  timeLimitMinutes: number;
  negativeMarking: number;
}

interface ExamSetupProps {
  availableChapters: string[];
  totalAvailable: number;
  onStartExam: (config: ExamConfig) => void;
  prefilledChapter?: string;
  onBack?: () => void;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({ availableChapters, totalAvailable, onStartExam, prefilledChapter, onBack }) => {
  const [mode, setMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [chapter, setChapter] = useState(prefilledChapter || 'All');
  const [difficulty, setDifficulty] = useState('All');
  const [questionCount, setQuestionCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState(15);
  const [negativeMarking, setNegativeMarking] = useState(0.25);

  const handleStart = () => {
    onStartExam({
      mode,
      chapter,
      difficulty,
      questionCount,
      timeLimitMinutes: timeLimit,
      negativeMarking: mode === 'EXAM' ? negativeMarking : 0
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-bold text-white">Configure Your Exam</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Form */}
        <div className="flex-1 bg-[#131627] border border-slate-800/80 rounded-2xl p-8">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5c2dd5] text-white shadow-[0_0_30px_rgba(92,45,213,0.4)] mb-6">
              <Target className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Configure Your Exam</h2>
            <p className="text-sm text-slate-400">Customize your practice session from our pool of <span className="text-indigo-400 font-bold">{totalAvailable.toLocaleString()}</span> questions.</p>
          </div>

          <div className="space-y-8">
            
            {/* Step 1: Mode */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Exam Mode</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('PRACTICE')}
                  className={`flex flex-col items-center justify-center py-6 rounded-xl border transition-all ${
                    mode === 'PRACTICE' 
                    ? 'bg-[#1e1541] border-[#5c2dd5] text-white' 
                    : 'bg-[#0A0C18] border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Zap className={`w-6 h-6 mb-2 ${mode === 'PRACTICE' ? 'text-indigo-400' : ''}`} />
                  <span className="font-bold">Practice</span>
                  <span className="text-[10px] mt-1 opacity-80">(Instant Feedback)</span>
                </button>
                <button
                  onClick={() => setMode('EXAM')}
                  className={`flex flex-col items-center justify-center py-6 rounded-xl border transition-all ${
                    mode === 'EXAM' 
                    ? 'bg-[#1e1541] border-[#5c2dd5] text-white' 
                    : 'bg-[#0A0C18] border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Clock className={`w-6 h-6 mb-2 ${mode === 'EXAM' ? 'text-indigo-400' : ''}`} />
                  <span className="font-bold">Strict Exam</span>
                  <span className="text-[10px] mt-1 opacity-80">(Timed)</span>
                </button>
              </div>
            </div>

            {/* Step 2: Topic */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Topic / Chapter</span>
              </label>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full bg-[#0A0C18] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-200 focus:ring-2 focus:ring-[#5c2dd5] focus:border-transparent transition-all outline-none"
              >
                <option value="All">All Chapters (Mixed)</option>
                {availableChapters.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Difficulty & Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Difficulty Level</span>
                </label>
                <div className="flex bg-[#0A0C18] rounded-xl border border-slate-800 overflow-hidden">
                  {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-3 text-xs font-bold transition-all ${
                        difficulty === diff 
                        ? 'bg-[#2a1758] text-[#9b66ff]' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span>Number of Questions</span>
                </label>
                <div className="flex bg-[#0A0C18] rounded-xl border border-slate-800 overflow-hidden">
                  {[10, 25, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-3 text-xs font-bold transition-all ${
                        questionCount === count 
                        ? 'bg-[#2a1758] text-[#9b66ff]' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Time Limit */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Time Limit <span className="text-[10px] text-slate-500 font-normal ml-1">(for Strict Exam)</span></span>
              </label>
              <div className="flex bg-[#0A0C18] rounded-xl border border-slate-800 overflow-hidden">
                {[5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setTimeLimit(mins)}
                    className={`flex-1 py-3 text-xs font-bold transition-all ${
                      timeLimit === mins
                      ? 'bg-[#2a1758] text-[#9b66ff]' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center space-x-2 bg-[#8c32ff] hover:bg-[#7b24e6] text-white py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(140,50,255,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] mt-8"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Exam Now</span>
            </button>
            <div className="flex justify-center items-center text-[10px] text-slate-500 font-semibold space-x-1.5 mt-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Your progress will be saved automatically</span>
            </div>

          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-[#131627] border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center mb-6">
              <Settings2 className="w-4 h-4 mr-2" /> Exam Summary
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-[#1e1541] text-[#9b66ff] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Mode</p>
                  <p className="text-sm font-bold text-slate-200">{mode === 'PRACTICE' ? 'Practice' : 'Strict Exam'} <span className="text-[10px] text-slate-500 font-normal">{mode === 'PRACTICE' ? '(Instant Feedback)' : '(Timed)'}</span></p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Topic</p>
                  <p className="text-sm font-bold text-slate-200 line-clamp-2">{chapter === 'All' ? 'All Chapters (Mixed)' : chapter}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Difficulty</p>
                  <p className="text-sm font-bold text-slate-200">{difficulty === 'All' ? 'All Levels' : difficulty}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Questions</p>
                  <p className="text-sm font-bold text-slate-200">{questionCount} <span className="text-[10px] text-slate-500 font-normal">Questions</span></p>
                </div>
              </div>

              {mode === 'EXAM' && (
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-amber-900/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1">Time Limit</p>
                    <p className="text-sm font-bold text-slate-200">{timeLimit} <span className="text-[10px] text-slate-500 font-normal">Minutes</span></p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 bg-[#1e1541] rounded-xl p-5 border border-[#3b2476]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">Total Questions Available</p>
                  <p className="text-2xl font-black text-[#a67cff]">{totalAvailable.toLocaleString()}</p>
                </div>
                <Database className="w-8 h-8 text-[#5c2dd5] opacity-50" />
              </div>
            </div>
          </div>

          <div className="bg-[#131627] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center space-x-2 text-amber-400 mb-3">
              <Lightbulb className="w-4 h-4" />
              <h4 className="text-xs font-bold">Tip</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Practice regularly to improve your accuracy and speed. Start with mixed chapters to identify weak areas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
