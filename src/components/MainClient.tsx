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
  };

  const fetchQuestions = async (chapter: string, difficulty: string, limit: number) => {
    return await getQuestionsForExam(chapter, difficulty, limit);
  };

  const renderMainContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard totalQuestions={totalQuestions} chapterStats={chapterStats} onStartExam={handleStartExam} />;
      case 'exam':
      case 'quick-practice':
        return (
          <ExamView 
            availableChapters={chapterStats.map(c => c.name)} 
            totalAvailable={totalQuestions}
            prefilledChapter={prefilledChapter}
            onReturnHome={() => handleNavigate('dashboard')}
            onFetchQuestions={fetchQuestions}
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
        return <PerformanceView />;
      case 'settings':
        return <SettingsView isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
      default:
        return <Dashboard totalQuestions={totalQuestions} chapterStats={chapterStats} onStartExam={handleStartExam} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070914] text-slate-800 dark:text-slate-100 font-sans flex transition-colors duration-200 selection:bg-indigo-500/30">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header */}
        <Header
          isDarkMode={isDarkMode}
          mounted={mounted}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={handleNavigate}
          onStartExam={handleStartExam}
        />

        {/* Page Content */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 flex flex-col">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative bg-[#0A0C18] w-72 h-full shadow-2xl flex flex-col">
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
