"use client";
import React, { useState, useEffect } from "react";
import { BookMarked, Loader2, Trash2, Flag, Eye, EyeOff, BookOpen } from "lucide-react";
import { getBookmarks, toggleBookmark } from "../app/actions";
import { MCQQuestion } from "../types/mcq";
import { Badge, EmptyState, Btn } from "./ui/primitives";

interface BookmarksViewProps {
  onReturnHome: () => void;
}

const DIFF_TONE: Record<string, any> = {
  Easy: "emerald",
  Medium: "amber",
  Hard: "rose",
};

/* Glowing vault/book icon from the reference featured panel */
function VaultIcon() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/40 via-fuchsia-500/30 to-indigo-500/40 blur-lg" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/25 to-indigo-500/25 border border-purple-400/40 shadow-[0_0_30px_rgba(168,85,247,0.35),inset_0_0_18px_rgba(139,92,246,0.3)] flex items-center justify-center">
        <BookMarked className="w-10 h-10 text-purple-300" />
      </div>
    </div>
  );
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
      console.error("Failed to load bookmarks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      await toggleBookmark(id);
    } catch (err) {
      console.error("Failed to remove bookmark", err);
      loadBookmarks();
    }
  };

  const toggleShowAnswer = (id: string) => {
    setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-accent-bright animate-spin mb-4" />
        <p className="text-app-muted font-medium">Loading your saved questions…</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 space-y-6">
      {/* Header — reference placement */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
          Question Vault
        </h1>
        <p className="text-sm text-app-muted mt-1">
          Your personal collection of challenging questions for focused review.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No bookmarks yet"
          message="When you're in Practice Mode, click the flag icon on any question to save it here for later review."
          action={<Btn onClick={onReturnHome}>Start Practice</Btn>}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 items-start">
          {/* Featured panel */}
          <div className="xl:sticky xl:top-24 rounded-2xl bg-app-card/70 border border-app-border p-6 flex flex-col items-center text-center gap-4">
            <VaultIcon />
            <div>
              <p className="text-sm font-bold text-app-text">Curated Practice</p>
              <p className="text-[11px] text-app-faint mt-1">
                <span className="font-bold text-accent-bright">{bookmarks.length}</span> saved question
                {bookmarks.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              onClick={onReturnHome}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-[0_0_18px_rgba(139,92,246,0.4)] hover:shadow-[0_0_26px_rgba(139,92,246,0.55)] transition-all"
            >
              Start Curated Practice
            </button>
          </div>

          {/* Masonry of question cards */}
          <div className="xl:col-span-3 columns-1 sm:columns-2 2xl:columns-3 gap-5 [column-fill:_balance]">
            {bookmarks.map(q => {
              const reveal = showAnswers[q.id];
              const correctLabel = q.correctAnswer.toUpperCase();
              return (
                <div
                  key={q.id}
                  className="break-inside-avoid mb-5 rounded-xl bg-app-card/70 border border-app-border p-4 flex flex-col gap-3 hover:border-app-border-hover transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleRemoveBookmark(q.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400/90 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove from Bookmarks
                    </button>
                    <Badge tone={DIFF_TONE[String(q.difficulty || "Medium")] || "slate"}>
                      {q.difficulty || "Medium"}
                    </Badge>
                  </div>

                  <p className="text-sm text-app-text leading-relaxed line-clamp-4">{q.question}</p>

                  {q.chapter ? (
                    <p className="text-[11px] text-app-faint">{q.chapter}</p>
                  ) : null}

                  {reveal ? (
                    <div className="p-3 rounded-lg bg-accent-soft/40 border border-accent/20 space-y-2">
                      <p className="text-[11px] text-app-muted">
                        Correct answer: <span className="font-bold text-emerald-400">{correctLabel}</span>
                      </p>
                      <p className="text-xs text-app-text leading-relaxed">
                        {q.explanation || "No explanation available for this question."}
                      </p>
                    </div>
                  ) : null}

                  <button
                    onClick={() => toggleShowAnswer(q.id)}
                    className="inline-flex items-center gap-1.5 self-start text-[11px] font-bold text-accent-bright hover:text-accent transition-colors"
                  >
                    {reveal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {reveal ? "Hide Answer" : "Reveal Answer"}
                    {!reveal ? <BookOpen className="w-3.5 h-3.5 ml-1" /> : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
