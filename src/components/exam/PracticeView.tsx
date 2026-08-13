"use client";
import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, Bookmark, BookmarkCheck, BookOpen } from 'lucide-react';
import { MCQQuestion } from '../../types/mcq';
import { ExamConfig } from './ExamSetup';
import { saveAttemptAnswer, toggleBookmark, finishExamAttempt } from '../../app/actions';

interface PracticeViewProps {
  questions: MCQQuestion[];
  config: ExamConfig;
  attemptId: string;
  onFinish: (answers: Record<string, string>, timeTakenSeconds: number) => void;
  onCancel: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ questions, config, attemptId, onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  // Timer effect for total time
  useEffect(() => {
    const timer = setInterval(() => setTotalTimeTaken(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isAnswered = !!answers[currentQ.id];

  const handleSelectOption = async (optionLabel: string) => {
    if (isAnswered) return; // Lock answer after selection in practice mode

    const timeForThisQ = Math.floor((new Date().getTime() - startTime) / 1000);
    
    setAnswers(prev => ({ ...prev, [currentQ.id]: optionLabel }));
    setTimeSpent(prev => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + timeForThisQ }));
    
    const isCorrect = optionLabel.toUpperCase() === currentQ.correctAnswer.toUpperCase();
    
    // Save to DB in real-time
    await saveAttemptAnswer(attemptId, currentQ.id, optionLabel, isCorrect, timeForThisQ);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
    setStartTime(Date.now()); // Reset start time for next question
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setStartTime(Date.now()); // Reset start time for previous question
  };

  const handleSubmit = async () => {
    await finishExamAttempt(attemptId, totalTimeTaken);
    onFinish(answers, totalTimeTaken);
  };

  const handleToggleBookmark = async () => {
    const isBookmarkedNow = !bookmarked[currentQ.id];
    setBookmarked(prev => ({ ...prev, [currentQ.id]: isBookmarkedNow }));
    await toggleBookmark(currentQ.id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm sticky top-4 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onCancel} className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors">
            Exit Practice
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Question {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        <button 
          onClick={handleToggleBookmark}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {bookmarked[currentQ.id] ? <BookmarkCheck className="w-4 h-4 text-indigo-500" /> : <Bookmark className="w-4 h-4" />}
          <span className="text-xs font-bold hidden sm:inline">Flag</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl transition-colors">
        <div className="flex items-center space-x-2 mb-6">
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">
            {currentQ.difficulty || 'Medium'}
          </span>
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider truncate max-w-[200px]">
            {currentQ.chapter || 'No Chapter'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-8">
          {currentQ.question}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.label;
            const isCorrectAnswer = opt.label.toUpperCase() === currentQ.correctAnswer.toUpperCase();
            
            let buttonClass = 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800';
            let labelClass = 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400';
            
            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonClass = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md';
                labelClass = 'bg-emerald-600 text-white';
              } else if (isSelected) {
                buttonClass = 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-900 dark:text-rose-100 shadow-md';
                labelClass = 'bg-rose-600 text-white';
              } else {
                buttonClass = 'opacity-50 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.label)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 group ${buttonClass}`}
              >
                <span className={`w-8 h-8 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${labelClass}`}>
                  {opt.label}
                </span>
                <span className="text-base font-medium">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Section */}
        {isAnswered && currentQ.explanation && (
          <div className="mt-8 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Explanation
            </h4>
            <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-wrap gap-4 items-center justify-between pt-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Finish Practice</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
            >
              <span>Next Question</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
