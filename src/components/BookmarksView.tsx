"use client";
import React, { useState, useEffect } from 'react';
import { BookmarkMinus, BookOpen, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { getBookmarks, toggleBookmark } from '../app/actions';
import { MCQQuestion } from '../types/mcq';

interface BookmarksViewProps {
  onReturnHome: () => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onReturnHome }) => {
  const [bookmarks, setBookmarks] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await getBookmarks();
      setBookmarks(data as MCQQuestion[]);
    } catch (err) {
      console.error('Failed to load bookmarks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      // Optimistic update
      setBookmarks(prev => prev.filter(b => b.id !== id));
      await toggleBookmark(id);
    } catch (err) {
      console.error('Failed to remove bookmark', err);
      loadBookmarks(); // revert on fail
    }
  };

  const toggleShowAnswer = (id: string) => {
    setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your saved questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BookmarkMinus className="w-8 h-8 text-indigo-500" />
            Bookmarked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Review the questions you flagged during your practice sessions.
          </p>
        </div>
        <button
          onClick={onReturnHome}
          className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Empty State */}
      {bookmarks.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 rounded-full mb-6">
            <BookmarkMinus className="w-10 h-10 text-indigo-400 dark:text-indigo-500 opacity-50" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
            No bookmarks yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium leading-relaxed">
            When you're in Practice Mode, click the flag icon on any question to save it here for later review.
          </p>
          <button
            onClick={onReturnHome}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            <span>Start Practice</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookmarks.map((q, idx) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold uppercase tracking-wider">
                    {q.difficulty || 'Medium'}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded text-xs font-bold uppercase tracking-wider truncate max-w-[200px] sm:max-w-none">
                    {q.chapter || 'No Chapter'}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveBookmark(q.id)}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <BookmarkMinus className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
                <span className="text-slate-400 mr-2">{idx + 1}.</span>
                {q.question}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {q.options.map(opt => (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-xl border-2 text-sm flex items-center space-x-3 transition-colors ${
                      showAnswers[q.id] && opt.label.toUpperCase() === q.correctAnswer.toUpperCase()
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                      showAnswers[q.id] && opt.label.toUpperCase() === q.correctAnswer.toUpperCase()
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600'
                    }`}>
                      {opt.label}
                    </span>
                    <span className={showAnswers[q.id] && opt.label.toUpperCase() === q.correctAnswer.toUpperCase() ? 'font-semibold' : ''}>
                      {opt.text}
                    </span>
                  </div>
                ))}
              </div>

              {showAnswers[q.id] ? (
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Explanation
                  </h4>
                  <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                    {q.explanation || 'No explanation available for this question.'}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => toggleShowAnswer(q.id)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Reveal Answer & Explanation
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
