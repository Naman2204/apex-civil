"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, Moon, Sun, Menu, Loader2, ArrowRight } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../app/actions/notifications";
import { searchTopics } from "../app/actions/search";

interface HeaderProps {
  isDarkMode?: boolean;
  mounted?: boolean;
  onToggleDarkMode?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigate?: (page: "settings" | "exam") => void;
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
  const userName = user?.firstName || "Student";

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search State
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

  return (
    <header className="sticky top-0 z-30 bg-app-sidebar/85 backdrop-blur-md border-b border-app-border transition-colors">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16 max-w-[1600px] mx-auto w-full">
        {/* Left: mobile menu + greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
            className="lg:hidden p-2 -ml-2 rounded-lg text-app-muted hover:text-app-text hover:bg-app-card transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block min-w-0">
            <p className="text-xs font-semibold text-app-faint uppercase tracking-wider">Welcome back</p>
            <p className="text-sm font-bold text-app-text truncate">{userName}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md hidden md:flex" ref={searchContainerRef}>
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-app-faint" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true) }}
              placeholder="Search topics…"
              className="w-full bg-app-deep border border-app-border rounded-lg py-2 pl-10 pr-12 text-sm text-app-text placeholder:text-app-faint focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-app-card border border-app-border text-app-faint hidden sm:block">
              Ctrl /
            </div>
          </div>

          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-app-card border border-app-border rounded-xl shadow-2xl z-50 overflow-hidden">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-accent-bright animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1.5">
                  {searchResults.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchResultClick(topic)}
                      className="w-full text-left px-4 py-2.5 hover:bg-app-card2 flex items-center justify-between text-sm group transition-colors"
                    >
                      <span className="text-app-text group-hover:text-accent-bright font-semibold">{topic}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-accent-bright transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-app-muted">No matching topics found.</div>
              )}
            </div>
          )}
        </div>

        {/* Right: notifications, theme, profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              aria-expanded={showNotifications}
              className="relative p-2.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-card transition-colors"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-bright rounded-full ring-2 ring-app-sidebar"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-app-card border border-app-border rounded-2xl shadow-2xl z-50 overflow-hidden transition-colors">
                <div className="px-4 py-3 border-b border-app-border flex justify-between items-center">
                  <h3 className="text-sm font-bold text-app-text">Notifications</h3>
                  <button onClick={handleMarkAllRead} className="text-xs text-accent-bright hover:text-accent font-semibold transition-colors">
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-app-muted">You're all caught up!</div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`px-4 py-3 border-b border-app-border/60 hover:bg-app-card2 transition-colors cursor-pointer ${notification.read ? "opacity-60" : ""}`}
                      >
                        <p className="text-xs text-app-text font-semibold mb-1">{notification.title}</p>
                        <p className="text-[10px] text-app-muted">{notification.message}</p>
                        <p className="text-[9px] text-app-faint mt-1">{notification.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 bg-app-deep text-center">
                  <button onClick={handleViewSettings} className="text-[11px] font-bold text-app-muted hover:text-app-text transition-colors w-full h-full">
                    View All Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-card transition-colors w-9 h-9 flex items-center justify-center"
            title="Toggle dark mode"
          >
            {mounted && isDarkMode !== undefined && (
              isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />
            )}
          </button>

          <div className="pl-1.5 flex items-center gap-2">
            <UserButton />
            <div className="hidden xl:block text-left leading-tight">
              <p className="text-[13px] font-bold text-app-text">{userName}</p>
              <p className="text-[9px] font-semibold text-app-faint uppercase tracking-wider">Student</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
