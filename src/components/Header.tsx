"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, Moon, Sun, Menu, Loader2, ArrowRight } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../app/actions/notifications";
import { searchTopics } from "../app/actions/search";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onNavigate?: (page: "settings" | "exam") => void;
  onStartExam?: (chapter: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onNavigate,
  onStartExam,
}) => {
  const { user } = useUser();
  const userName = user?.firstName || "Student";
  const { theme, setTheme } = useTheme();

  const [mountedState, setMountedState] = useState(false);
  useEffect(() => {
    setMountedState(true);
  }, []);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
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
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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
      onNavigate("settings");
    }
  };

  const handleSearchResultClick = (chapter: string) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    if (onStartExam) {
      onStartExam(chapter);
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  // Simple greeting logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-30 pt-4 px-4 sm:px-6 lg:px-8 pb-4 bg-[var(--app-bg)]/80 backdrop-blur-xl transition-colors border-b border-[var(--app-border)] shadow-sm">
      <div className="flex items-center justify-between gap-6 max-w-[1600px] mx-auto w-full h-14">
        
        {/* Left: Mobile Menu + Greeting */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
            className="lg:hidden p-2 -ml-2 rounded-xl text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-card)] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden md:flex flex-col justify-center min-w-0">
            <p className="text-[11px] font-bold text-[var(--accent-bright)] uppercase tracking-widest">{greeting},</p>
            <p className="text-xl font-black text-[var(--app-text)] tracking-tight truncate">{userName}</p>
          </div>
        </div>

        {/* Middle: Search (Pill shaped, premium) */}
        <div className="relative flex-1 max-w-2xl hidden lg:flex" ref={searchContainerRef}>
          <div className="relative w-full group">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-start)] to-[var(--accent)] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-md"></div>
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-faint)] group-focus-within:text-[var(--accent)] transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true) }}
              placeholder="Search topics, questions, shortcuts..."
              className="w-full bg-[var(--app-card)]/50 backdrop-blur-md border border-[var(--app-border)] rounded-full py-2.5 pl-12 pr-16 text-sm font-medium text-[var(--app-text)] placeholder:text-[var(--app-faint)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--app-card2)] border border-[var(--app-border2)] text-[var(--app-muted)] shadow-sm">
              Ctrl K
            </div>
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-[var(--app-card)] border border-[var(--app-border)] rounded-2xl shadow-2xl shadow-[var(--app-border)]/20 z-50 overflow-hidden backdrop-blur-xl">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  <div className="px-3 py-2 text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">Top Results</div>
                  {searchResults.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchResultClick(topic)}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-[var(--app-card2)] flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-faint)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent-soft)] transition-colors">
                          <Search className="w-4 h-4" />
                        </div>
                        <span className="text-[var(--app-text)] text-sm font-semibold">{topic}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[var(--accent)] transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--app-card2)] flex items-center justify-center mb-3">
                    <Search className="w-5 h-5 text-[var(--app-faint)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">No results found</p>
                  <p className="text-xs text-[var(--app-muted)] mt-1">Try adjusting your search terms.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* Action Pill */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] shadow-sm relative" ref={dropdownRef}>
            
            {/* Theme Toggle */}
            {mountedState && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full text-[var(--app-muted)] hover:text-[var(--accent)] hover:bg-[var(--app-card2)] transition-all"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {/* Notifications */}
            <div className="w-px h-5 bg-[var(--app-border)] mx-1"></div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-[var(--app-muted)] hover:text-[var(--accent)] hover:bg-[var(--app-card2)] transition-all"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--status-danger)] rounded-full ring-2 ring-[var(--app-card)] animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-[var(--app-card)] border border-[var(--app-border)] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-[var(--app-border)] flex justify-between items-center bg-[var(--app-card2)]/50">
                  <h3 className="text-sm font-bold text-[var(--app-text)]">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-bright)] font-bold transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[var(--app-card2)] flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 text-[var(--app-faint)]" />
                      </div>
                      <p className="text-sm font-semibold text-[var(--app-text)]">You're all caught up!</p>
                      <p className="text-xs text-[var(--app-muted)] mt-1">No new notifications.</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`p-3 rounded-xl border border-transparent hover:border-[var(--app-border)] hover:bg-[var(--app-card2)] transition-all cursor-pointer ${notification.read ? "opacity-60" : "bg-[var(--accent-soft)]/30 border-[var(--accent-soft)]"}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-xs font-bold ${notification.read ? 'text-[var(--app-text)]' : 'text-[var(--accent)]'}`}>{notification.title}</p>
                          {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1 shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">{notification.message}</p>
                        <p className="text-[9px] font-bold text-[var(--app-faint)] mt-2 uppercase tracking-wider">{notification.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-[var(--app-border)] bg-[var(--app-card2)]/50">
                  <button onClick={handleViewSettings} className="w-full py-2 rounded-lg text-[11px] font-bold text-[var(--app-text)] hover:bg-[var(--app-card)] transition-colors border border-transparent hover:border-[var(--app-border)] shadow-sm">
                    View All Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-[var(--app-border)]">
            <div className="hidden xl:flex flex-col items-end justify-center leading-tight">
              <p className="text-sm font-bold text-[var(--app-text)]">{userName}</p>
              <p className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-widest">Student</p>
            </div>
            <div className="p-0.5 rounded-full border border-[var(--app-border)] shadow-sm bg-[var(--app-card)]">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
