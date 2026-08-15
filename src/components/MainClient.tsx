"use client";

import React, { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { ExamView } from './exam/ExamView';
import { BookmarksView } from './BookmarksView';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getQuestionsForExam } from '../app/actions';
import { Layers, AlertTriangle, BarChart3, Activity, Settings } from 'lucide-react';

import { TopicsView } from './TopicsView';
import { WeakTopicsView } from './WeakTopicsView';
import { AnalyticsView } from './AnalyticsView';
import { PerformanceView } from './PerformanceView';
import { SettingsView } from './SettingsView';

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
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default dark to match server
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || (!saved && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
        return <WeakTopicsView onStartExam={handleStartExam} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'performance':
        return <PerformanceView onStartExam={() => handleStartExam()} />;
      case 'settings':
        return <SettingsView isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
      default:
        return <Dashboard totalQuestions={totalQuestions} chapterStats={chapterStats} onStartExam={handleStartExam} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-200 selection:bg-accent/30 ${
      inExamSession ? 'bg-app-deep text-app-text' : 'bg-app-bg text-app-text'
    }`}>
      
      {/* Sidebar Navigation — hidden inside a question session */}
      <div className={inExamSession ? 'hidden' : ''}>
        <Sidebar 
          activePage={activePage} 
          onNavigate={handleNavigate} 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header — hidden inside a question session */}
        <div className={inExamSession ? 'hidden' : ''}>
          <Header
            isDarkMode={isDarkMode}
            mounted={mounted}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onNavigate={handleNavigate}
            onStartExam={handleStartExam}
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col">
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
                isDarkMode={isDarkMode} 
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                className="flex w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
