"use client";

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Dashboard } from './Dashboard';
import { ExamView } from './exam/ExamView';
import { BookmarksView } from './BookmarksView';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getQuestionsForExam } from '../app/actions';
import { Loader2 } from 'lucide-react';

import { TopicsView } from './TopicsView';
import { SettingsView } from './SettingsView';

// Lazy-load heavy page components to avoid bundling recharts (~400KB)
// and other large dependencies into the initial chunk.
const WeakTopicsView = lazy(() => import('./WeakTopicsView').then(m => ({ default: m.WeakTopicsView })));
const AnalyticsView = lazy(() => import('./AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const PerformanceView = lazy(() => import('./PerformanceView').then(m => ({ default: m.PerformanceView })));

interface MainClientProps {
  totalQuestions: number;
  chapterStats: { name: string; count: number }[];
}

export type PageView = 'dashboard' | 'exam' | 'bookmarks' | 'quick-practice' | 'topics' | 'weak-topics' | 'analytics' | 'performance' | 'settings';

export function MainClient({ totalQuestions, chapterStats }: MainClientProps) {
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [prefilledChapter, setPrefilledChapter] = useState<string | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Dedicated exam shell: once a question-solving session starts, the normal
  // app chrome (sidebar, header, search, notifications) is hidden so Practice
  // and Simulate Exam feel like their own focused environment.
  const [examSessionMode, setExamSessionMode] = useState(false);
  const inExamSession = (activePage === 'exam' || activePage === 'quick-practice') && examSessionMode;
  
      const isTopicsPage = activePage === 'topics';

  const handleStartExam = (chapter?: string) => {
    setPrefilledChapter(chapter);
    setActivePage('exam');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (page: PageView) => {
    setActivePage(page);
    setPrefilledChapter(undefined);
    setMobileMenuOpen(false);
    setExamSessionMode(false); // leave any in-progress session shell
  };

  const fetchQuestions = async (chapter: string, difficulty: string, limit: number) => {
    return await getQuestionsForExam(chapter, difficulty, limit);
  };

  const PageFallback = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--accent)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--app-muted)' }}>Loading…</p>
    </div>
  );

  const renderMainContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard totalQuestions={totalQuestions} chapterStats={chapterStats} onStartExam={handleStartExam} onNavigate={handleNavigate} />;
      case 'exam':
      case 'quick-practice':
        return (
          <ExamView 
            availableChapters={chapterStats.map(c => c.name)} 
            totalAvailable={totalQuestions}
            prefilledChapter={prefilledChapter}
            onReturnHome={() => handleNavigate('dashboard')}
            onFetchQuestions={fetchQuestions}
            onExamModeChange={setExamSessionMode}
          />
        );
      case 'bookmarks':
        return <BookmarksView onReturnHome={() => handleNavigate('dashboard')} />;
      case 'topics':
        return <TopicsView chapterStats={chapterStats} onStartExam={handleStartExam} />;
      case 'weak-topics':
        return <Suspense fallback={<PageFallback />}><WeakTopicsView onStartExam={handleStartExam} /></Suspense>;
      case 'analytics':
        return <Suspense fallback={<PageFallback />}><AnalyticsView /></Suspense>;
      case 'performance':
        return <Suspense fallback={<PageFallback />}><PerformanceView onStartExam={() => handleStartExam()} /></Suspense>;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard totalQuestions={totalQuestions} chapterStats={chapterStats} onStartExam={handleStartExam} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen font-sans flex transition-colors duration-200"
      style={{ background: inExamSession ? 'var(--app-deep)' : 'var(--app-bg)', color: 'var(--app-text)' }}>
      
      {/* Sidebar Navigation — hidden inside a question session */}
      <div className={inExamSession ? 'hidden' : ''}>
        <Sidebar 
          activePage={activePage} 
          onNavigate={handleNavigate} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        
        {/* Top Header — hidden inside a question session */}
        <div className={inExamSession ? 'hidden' : ''}>
          <Header
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onNavigate={handleNavigate}
            onStartExam={handleStartExam}
          />
        </div>

        {/* Page Content */}
        <main className={isTopicsPage
          ? 'flex-1 w-full min-h-0 overflow-y-auto'
          : 'flex-1 w-full min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'}>
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && !inExamSession && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative bg-app-sidebar w-72 h-full shadow-2xl flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <Sidebar 
                activePage={activePage} 
                onNavigate={handleNavigate} 
                    className="flex w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
