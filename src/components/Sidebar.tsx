import React from 'react';
import { Database, Home, Zap, Layers, AlertTriangle, BookmarkMinus, BarChart3, Target, Activity, Settings, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: 'dashboard' | 'exam' | 'bookmarks' | 'quick-practice' | 'topics' | 'weak-topics' | 'analytics' | 'performance' | 'settings') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isDarkMode, onToggleDarkMode, className = "hidden lg:flex" }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'quick-practice', label: 'Quick Practice', icon: Zap },
    { id: 'topics', label: 'Topics', icon: Layers },
    { id: 'weak-topics', label: 'Weak Topics', icon: AlertTriangle },
    { id: 'bookmarks', label: 'Bookmarks', icon: BookmarkMinus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const bottomNavItems = [
    { id: 'exam', label: 'Simulate Exam', icon: Target, isPrimary: true },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`${className} flex-col w-[280px] h-screen bg-white dark:bg-[#0A0C18] border-r border-slate-200 dark:border-slate-800/50 sticky top-0 shrink-0 transition-colors`}>
      
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 bg-[#5c2dd5] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(92,45,213,0.5)]">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center transition-colors">
              Apex<span className="text-[#5c2dd5] dark:text-[#9b66ff] transition-colors">Civil</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 transition-colors">Civil Engineering Mastery</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activePage === item.id
                ? 'bg-indigo-50 dark:bg-[#1a1c2e] text-[#5c2dd5]'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activePage === item.id ? 'fill-current opacity-20' : ''}`} />
            <span>{item.label}</span>
          </button>
        ))}

        <div className="pt-4 pb-2">
          <div className="h-px bg-slate-200 dark:bg-slate-800/50 mx-4 transition-colors"></div>
        </div>

        {bottomNavItems.map(item => {
          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all bg-indigo-600 dark:bg-[#5c2dd5] text-white hover:bg-indigo-700 dark:hover:bg-[#4b22b6] shadow-lg shadow-indigo-500/20 mb-4"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          }
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activePage === item.id
                  ? 'bg-indigo-50 dark:bg-[#1a1c2e] text-[#5c2dd5]'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activePage === item.id ? 'fill-current opacity-20' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
};
