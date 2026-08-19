"use client";
import React, { useState, useEffect } from "react";
// Force HMR update
import { Loader2, Trash2, Eye, EyeOff, BookOpen, Bookmark } from "lucide-react";
import { getBookmarks, toggleBookmark } from "../app/actions";
import { MCQQuestion } from "../types/mcq";
import { Badge } from "./ui/primitives";

interface BookmarksViewProps {
  onReturnHome: () => void;
}

const DIFF_TONE: Record<string, any> = {
  Easy: "emerald",
  Medium: "amber",
  Hard: "rose",
};

/* ── 3D Floating Book SVG Illustration ── */
function FloatingBookArt() {
  return (
    <div className="relative w-72 h-72 mx-auto animate-float">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      <svg viewBox="0 0 280 280" className="w-full h-full relative z-10" fill="none">
        <defs>
          <linearGradient id="bookCover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b2070" />
            <stop offset="100%" stopColor="#1a0d3d" />
          </linearGradient>
          <linearGradient id="bookPage" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8e4f0" />
            <stop offset="100%" stopColor="#c8c0d8" />
          </linearGradient>
          <linearGradient id="bookSpine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b2d9e" />
            <stop offset="100%" stopColor="#3b1a6e" />
          </linearGradient>
          <linearGradient id="glowLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(168,85,247,0)" />
            <stop offset="50%" stopColor="rgba(168,85,247,0.8)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
          <filter id="bookGlow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Shadow beneath book */}
        <ellipse cx="140" cy="230" rx="70" ry="12" fill="rgba(168,85,247,0.25)" filter="url(#bookGlow)" />

        {/* Book - back pages (right side) */}
        <rect x="148" y="60" width="88" height="130" rx="4" fill="url(#bookPage)" transform="skewY(-8)" opacity="0.6" />
        <rect x="152" y="56" width="88" height="130" rx="4" fill="#d4cce4" transform="skewY(-8)" opacity="0.5" />

        {/* Book - back pages (left side) */}
        <rect x="44" y="60" width="88" height="130" rx="4" fill="url(#bookPage)" transform="skewY(8)" opacity="0.5" />

        {/* Book spine */}
        <rect x="112" y="55" width="16" height="140" rx="2" fill="url(#bookSpine)" filter="url(#softGlow)" />

        {/* Book cover left */}
        <rect x="40" y="62" width="72" height="136" rx="6" fill="url(#bookCover)" transform="perspective(400) rotateY(15deg)" filter="url(#softGlow)" />
        {/* Book cover right */}
        <rect x="112" y="58" width="84" height="140" rx="6" fill="url(#bookCover)" />

        {/* Book cover decoration */}
        <rect x="118" y="68" width="72" height="2" rx="1" fill="rgba(168,85,247,0.6)" />
        <rect x="118" y="74" width="50" height="1.5" rx="1" fill="rgba(168,85,247,0.4)" />

        {/* Glow line on spine */}
        <rect x="112" y="55" width="16" height="140" rx="2" fill="url(#glowLine)" opacity="0.5" />

        {/* Bookmark tabs floating up */}
        {/* Tab 1 - purple */}
        <rect x="155" y="36" width="18" height="32" rx="3" fill="#a855f7" filter="url(#bookGlow)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.9))' }} />
        <rect x="155" y="36" width="18" height="32" rx="3" fill="rgba(255,255,255,0.15)" />
        {/* Bookmark triangle cutout */}
        <polygon points="155,68 164,60 173,68" fill="#0d0d22" />

        {/* Tab 2 - cyan */}
        <rect x="178" y="28" width="18" height="28" rx="3" fill="#06b6d4"
          style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.9))' }} />
        <polygon points="178,56 187,48 196,56" fill="#0d0d22" />

        {/* Tab 3 - blue */}
        <rect x="200" y="44" width="16" height="24" rx="3" fill="#3b82f6"
          style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.9))' }} />
        <polygon points="200,68 208,61 216,68" fill="#0d0d22" />

        {/* Blueprint/document lines on cover */}
        <rect x="120" y="85" width="60" height="1" rx="0.5" fill="rgba(168,85,247,0.3)" />
        <rect x="120" y="92" width="45" height="1" rx="0.5" fill="rgba(168,85,247,0.2)" />
        <rect x="120" y="99" width="55" height="1" rx="0.5" fill="rgba(168,85,247,0.2)" />
        <rect x="120" y="106" width="40" height="1" rx="0.5" fill="rgba(168,85,247,0.15)" />

        {/* Mini building/structure icon on cover */}
        <g transform="translate(130, 120)" opacity="0.6">
          <rect x="0" y="20" width="40" height="30" rx="2" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" fill="none" />
          <rect x="10" y="10" width="20" height="40" rx="2" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" fill="none" />
          <rect x="15" y="0" width="10" height="50" rx="1" stroke="rgba(168,85,247,0.5)" strokeWidth="1" fill="none" />
        </g>

        {/* Sparkle dots */}
        <circle cx="92" cy="50" r="3" fill="#a855f7" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,1))' }} />
        <circle cx="70" cy="78" r="2" fill="#06b6d4" style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,1))' }} />
        <circle cx="230" cy="95" r="2.5" fill="#3b82f6" style={{ filter: 'drop-shadow(0 0 5px rgba(59,130,246,1))' }} />
        <circle cx="218" cy="160" r="2" fill="#a855f7" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,1))' }} />
      </svg>
    </div>
  );
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ onReturnHome }) => {
  const [bookmarks, setBookmarks] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => { loadBookmarks(); }, []);

  const loadBookmarks = async () => {
    try {
      const data = await getBookmarks();
      setBookmarks(data as MCQQuestion[]);
    } catch (err) { console.error("Failed to load bookmarks", err); }
    finally { setLoading(false); }
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      await toggleBookmark(id);
    } catch (err) { console.error("Failed to remove bookmark", err); loadBookmarks(); }
  };

  const toggleShowAnswer = (id: string) => {
    setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 12px var(--neon-blue))' }} />
        <p className="font-medium" style={{ color: 'var(--app-muted)' }}>Loading your saved questions…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] pb-12 space-y-5">

      {bookmarks.length === 0 ? (
        /* ── Zero state: full-viewport deep card ── */
        <div className="relative rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            minHeight: 'calc(100vh - 160px)',
            background: 'var(--app-bg)',
            border: '1px solid var(--app-border)',
            boxShadow: '0 0 80px var(--neon-blue)',
          }}>
          {/* Animated radial glow center */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 38%, var(--accent-soft) 0%, transparent 60%)', animation: 'pulse-glow 4s ease-in-out infinite' }} />
          </div>
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(var(--app-text) 1px, transparent 1px), linear-gradient(90deg, var(--app-text) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

          <div className="relative z-10 text-center px-8 max-w-2xl mx-auto py-12">
            <FloatingBookArt />

            <h2 className="text-4xl sm:text-5xl font-black mt-4 leading-tight" style={{ color: 'var(--app-text)' }}>
              No Bookmarked<br/>Questions Yet.
            </h2>
            <p className="mt-4 text-base max-w-md mx-auto leading-relaxed" style={{ color: 'var(--app-muted)' }}>
              Review the questions you flagged during your practice sessions to build your knowledge base. Your saved questions will appear here for focused study.
            </p>

            <button
              onClick={onReturnHome}
              className="mt-8 h-14 px-12 rounded-xl font-bold text-base transition-all hover:scale-[1.03] hover:brightness-110"
              style={{
                color: '#fff',
                background: 'linear-gradient(135deg, var(--primary-start) 0%, var(--accent) 60%, var(--primary-end) 100%)',
                boxShadow: '0 0 32px var(--neon-blue), 0 0 64px var(--neon-purple)',
              }}>
              Start Practice
            </button>
          </div>
        </div>
      ) : (
        /* ── Bookmarks list ── */
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)', boxShadow: '0 0 16px var(--neon-blue)' }}>
                <Bookmark className="w-8 h-8 stroke-1" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--accent))' }} />
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--app-text)' }}>Bookmarked Questions</h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--app-faint)' }}>{bookmarks.length} saved questions ready for review</p>
              </div>
            </div>
            <button onClick={onReturnHome}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', color: '#fff', boxShadow: '0 0 20px var(--neon-blue)' }}>
              Start Curated Practice
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
            {/* Question cards */}
            <div className="xl:col-span-2 space-y-3">
              {bookmarks.map(q => {
                const reveal = showAnswers[q.id];
                const correctLabel = q.correctAnswer.toUpperCase();
                return (
                  <div key={q.id}
                    className="bp-card p-5 flex flex-col gap-3 transition-all hover:border-[var(--accent)]">
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => handleRemoveBookmark(q.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold transition-colors" style={{ color: 'var(--status-danger)' }}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove from Bookmarks
                      </button>
                      <Badge tone={DIFF_TONE[String(q.difficulty || "Medium")] || "slate"}>{q.difficulty || "Medium"}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--app-text)' }}>{q.question}</p>
                    {q.chapter && <p className="text-[11px]" style={{ color: 'var(--app-faint)' }}>{q.chapter}</p>}
                    {reveal && (
                      <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
                        <p className="text-[11px]" style={{ color: 'var(--app-muted)' }}>
                          Correct answer: <span className="font-bold" style={{ color: 'var(--status-success)' }}>{correctLabel}</span>
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--app-faint)' }}>
                          {q.explanation || "No explanation available for this question."}
                        </p>
                      </div>
                    )}
                    <button onClick={() => toggleShowAnswer(q.id)}
                      className="inline-flex items-center gap-1.5 self-start text-[11px] font-bold transition-colors" style={{ color: 'var(--accent)' }}>
                      {reveal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {reveal ? "Hide Answer" : "Reveal Answer"}
                      {!reveal && <BookOpen className="w-3.5 h-3.5 ml-1" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div className="bp-card p-5 sticky top-24">
              <p className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>Curated Practice</p>
              <p className="text-xs mt-1" style={{ color: 'var(--app-faint)' }}>{bookmarks.length} saved questions ready for targeted revision.</p>
              <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '1px solid var(--app-border)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Tip</p>
                <p className="text-sm mt-1" style={{ color: 'var(--app-muted)' }}>Reveal answers only after attempting mentally for stronger retention.</p>
              </div>
              <button onClick={onReturnHome}
                className="mt-4 w-full h-12 rounded-xl font-bold transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ color: '#fff', background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', boxShadow: '0 0 24px var(--neon-blue)' }}>
                Start Curated Practice
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
