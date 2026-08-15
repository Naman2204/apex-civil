"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { MCQQuestion } from '../../types/mcq';
import { ExamConfig } from './ExamSetup';

interface LiveExamProps {
  questions: MCQQuestion[];
  config: ExamConfig;
  onFinish: (answers: Record<string, string>, timeTakenSeconds: number) => void;
  onCancel: () => void;
}

export const LiveExam: React.FC<LiveExamProps> = ({ questions, config, onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(config.timeLimitMinutes * 60);

  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Timer effect
  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmit = () => {
    // Prevent duplicate submits from rapid clicks or repeated timer expiry.
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const timeTaken = (config.timeLimitMinutes * 60) - timeLeft;
    onFinish(answers, timeTaken);
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, config.timeLimitMinutes, answers, onFinish]); // Added dependencies

  const handleSelectOption = (qId: string, optionLabel: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optionLabel }));
  };

  const toggleMarkForReview = () => {
    const qId = questions[currentIndex].id;
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft < 60; // Less than 1 minute

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto items-start relative">
      
      {/* Mobile Palette Toggle Button */}
      <button 
        onClick={() => setShowMobilePalette(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
      >
        <span className="font-bold text-sm">Q {currentIndex + 1}/{questions.length}</span>
      </button>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 w-full pb-24 lg:pb-0">
        {/* Header / Timer */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm sticky top-4 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={onCancel} className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors">
              End Exam
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Question {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
            isWarning 
            ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 animate-pulse'
            : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-400'
          }`}>
            {isWarning ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span className="font-bold font-mono tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl transition-colors">
          <div className="flex items-center space-x-2 mb-6">
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">
              {currentQ.difficulty || 'Medium'}
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px] sm:max-w-[200px]">
              {currentQ.chapter || 'No Chapter'}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-8">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.label;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ.id, opt.label)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 group ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-md transform scale-[1.01]'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${
                      isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-base font-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap gap-4 items-center justify-between pt-4">
          <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={toggleMarkForReview}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-3 sm:px-5 py-3 border rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                markedForReview[currentQ.id]
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>{markedForReview[currentQ.id] ? 'Unmark' : 'Review'}</span>
            </button>
          </div>

          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitting ? 'Submitting…' : 'Submit Exam'}</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
              >
                <span>Next Question</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Palette Overlay Background */}
      {showMobilePalette && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowMobilePalette(false)}
        />
      )}

      {/* Sidebar Palette */}
      <div className={`
        fixed lg:sticky top-0 right-0 h-[100dvh] lg:h-auto w-[85vw] sm:w-[320px] lg:w-72 shrink-0 
        bg-white dark:bg-slate-900 border-l lg:border border-slate-200 dark:border-slate-800 
        lg:rounded-3xl p-6 shadow-2xl lg:shadow-xl z-50 lg:z-10
        transition-transform duration-300 ease-in-out
        ${showMobilePalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:top-4 overflow-y-auto
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Question Palette
          </h3>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            onClick={() => setShowMobilePalette(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-5 lg:grid-cols-5 gap-2 mb-6">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isMarked = markedForReview[q.id];
            const isCurrent = idx === currentIndex;
            
            let btnClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'; // Default unanswered
            
            if (isMarked) {
              btnClass = 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/60';
            } else if (isAnswered) {
              btnClass = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/60';
            }

            if (isCurrent) {
              btnClass += ' ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900';
            }

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  if (window.innerWidth < 1024) setShowMobilePalette(false);
                }}
                className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700"></div>
            <span>Marked for Review</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div>
            <span>Unanswered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
