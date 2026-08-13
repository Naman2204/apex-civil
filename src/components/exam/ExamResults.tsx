"use client";
import React from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, Check, BookOpen } from 'lucide-react';
import { MCQQuestion } from '../../types/mcq';
import { ExamConfig } from './ExamSetup';

interface ExamResultsProps {
  questions: MCQQuestion[];
  answers: Record<string, string>;
  timeTakenSeconds: number;
  config: ExamConfig;
  onRetake: () => void;
  onReturnHome: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({ questions, answers, timeTakenSeconds, config, onRetake, onReturnHome }) => {
  let correctCount = 0;
  let wrongCount = 0;
  
  questions.forEach(q => {
    if (answers[q.id]) {
      if (answers[q.id].toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  });

  let rawScore = correctCount;
  if (config.mode === 'EXAM' && config.negativeMarking) {
    rawScore = correctCount - (wrongCount * config.negativeMarking);
    rawScore = Math.max(0, rawScore);
  }

  const scorePct = questions.length > 0 ? Math.round((rawScore / questions.length) * 100) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
      
      {/* Score Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white rounded-[2rem] p-8 sm:p-12 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 p-32 bg-purple-500/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/20 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10">
          <Award className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Exam Completed</h2>
          
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 my-6 drop-shadow-sm">
            {scorePct}%
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-300">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="text-emerald-400 font-bold">{correctCount}</span> Correct
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="text-rose-400 font-bold">{wrongCount}</span> Incorrect
            </div>
            {config.mode === 'EXAM' && config.negativeMarking > 0 && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <span className="text-amber-400 font-bold">-{wrongCount * config.negativeMarking}</span> Penalty
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="text-slate-400 font-bold">{questions.length - (correctCount + wrongCount)}</span> Skipped
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              ⏱️ {formatTime(timeTakenSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onReturnHome}
          className="inline-flex items-center justify-center w-full sm:w-auto space-x-2 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-slate-100 px-8 py-3 rounded-2xl font-bold shadow-sm transition-all hover:-translate-y-0.5"
        >
          <span>Return to Dashboard</span>
        </button>
        <button
          onClick={onRetake}
          className="inline-flex items-center justify-center w-full sm:w-auto space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Take Another Exam</span>
        </button>
      </div>

      {/* Detailed Review */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Detailed Review
          </h3>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIdx) => {
            const userAns = answers[q.id];
            const isCorrect = userAns && userAns.toUpperCase() === q.correctAnswer.toUpperCase();

            return (
              <div
                key={q.id}
                className={`border-2 rounded-3xl p-6 sm:p-8 space-y-5 transition-colors ${
                  isCorrect
                    ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-rose-100 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Question {qIdx + 1}
                  </span>
                  
                  <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${
                    isCorrect
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt) => {
                    const isUserPick = userAns === opt.label;
                    const isRightOpt = opt.label.toUpperCase() === q.correctAnswer.toUpperCase();

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 sm:p-4 rounded-xl border-2 text-sm flex items-start sm:items-center justify-between gap-2 transition-colors ${
                          isRightOpt
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm'
                            : isUserPick
                            ? 'bg-rose-100 dark:bg-rose-900/60 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-100'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-60'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className={`w-6 h-6 rounded flex items-center justify-center shrink-0 font-bold text-xs ${
                            isRightOpt ? 'bg-emerald-500 text-white' : 
                            isUserPick ? 'bg-rose-500 text-white' : 
                            'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            {opt.label}
                          </span>
                          <span className={isRightOpt || isUserPick ? 'font-semibold' : ''}>{opt.text}</span>
                        </div>
                        {isRightOpt && <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {(!isCorrect && q.explanation) && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                    <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Explanation
                    </h4>
                    <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};
