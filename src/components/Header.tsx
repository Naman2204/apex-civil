"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Moon, Sun, Menu, Loader2, ArrowRight } from 'lucide-react';
import { UserButton, useUser } from "@clerk/nextjs";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../app/actions/notifications';
import { searchTopics } from '../app/actions/search';

interface HeaderProps {
  isDarkMode?: boolean;
  mounted?: boolean;
  onToggleDarkMode?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigate?: (page: 'settings' | 'exam') => void;
  onStartExam?: (chapter: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  mounted = true,
  onToggleDarkMode,
  onOpenMobileMenu,
  onNavigate,
  onStartExam,
}) => {
  const { user } = useUser();
  const userName = user?.firstName || 'Student';
  
  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadNotifs();
  }, []);

  // Search Debounce Effect
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    const delay = setTimeout(async () => {
      try {
        const results = await searchTopics(searchQuery);
        setSearchResults(results as string[]);
        setShowSearchDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const handleNotificationClick = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    await markNotificationRead(id);
  };

  const handleViewSettings = () => {
    setShowNotifications(false);
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleSearchResultClick = (chapter: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    // Need to trigger exam setup with this chapter
    // We will use a custom event or pass a prop down
    if (onStartExam) {
      onStartExam(chapter);
    }
  };

  return (
    <header className="bg-slate-50/80 dark:bg-[#070914]/80 backdrop-blur-md sticky top-0 z-30 transition-colors py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between max-w-[1600px] w-full mx-auto">

        {/* Left Side: Mobile Menu & Welcome Text */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Welcome back, <span className="text-slate-800 dark:text-slate-200">{userName}!</span> 👋
            </h2>
            <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Let's continue your preparation.
            </p>
          </div>
        </div>

        {/* Right Side: Search, Notifications, Theme, Profile */}
        <div className="flex items-center space-x-4">

          {/* Search Bar */}
          <div className="hidden md:flex flex-col relative" ref={searchContainerRef}>
            <div className="flex items-center relative">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true) }}
                placeholder="Search topics..."
                className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-9 pr-12 text-sm text-slate-800 dark:text-slate-200 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              />
              <div className="absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400">
                Ctrl /
              </div>
            </div>
            
            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((topic, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSearchResultClick(topic)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between text-sm group transition-colors"
                      >
                        <span className="text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-semibold">{topic}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">
                    No matching topics found.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-white dark:ring-[#070914]"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden transition-colors">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
                  <button onClick={handleMarkAllRead} className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Mark all as read</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      You're all caught up!
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div key={notification.id} onClick={() => handleNotificationClick(notification.id)} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${notification.read ? 'opacity-60' : ''}`}>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mb-1 transition-colors">{notification.title}</p>
                        <p className="text-[10px] text-slate-500 transition-colors">{notification.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1 transition-colors">{notification.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-[#0A0C18] text-center transition-colors">
                  <button onClick={handleViewSettings} className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-full h-full">View All Settings</button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/5 transition-colors w-9 h-9 flex items-center justify-center"
            title="Toggle dark mode"
          >
            {mounted && isDarkMode !== undefined && (
              isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User Profile */}
          <div className="pl-2 flex items-center space-x-3">
            <UserButton />
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{userName}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Student</p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
