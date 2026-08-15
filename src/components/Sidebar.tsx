import React from "react";
import { Database, Home, Zap, Layers, AlertTriangle, Bookmark, BarChart3, Target, Activity, Settings } from "lucide-react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: 'dashboard' | 'exam' | 'bookmarks' | 'quick-practice' | 'topics' | 'weak-topics' | 'analytics' | 'performance' | 'settings') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  className?: string;
}

type NavPage = SidebarProps["onNavigate"] extends (p: infer P) => void ? P : never;

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "quick-practice", label: "Quick Practice", icon: Zap },
  { id: "topics", label: "Topics", icon: Layers },
  { id: "weak-topics", label: "Weak Topics", icon: AlertTriangle },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "exam", label: "Simulate Exam", icon: Target },
  { id: "performance", label: "Performance", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, className = "hidden lg:flex" }) => {
  return (
    <aside className={`${className} flex-col w-[240px] h-screen bg-app-sidebar border-r border-app-border sticky top-0 shrink-0 transition-colors`}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-app-border">
        <button className="flex items-center gap-3 w-full text-left" onClick={() => onNavigate("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-bright flex items-center justify-center shadow-lg shadow-accent/30 shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight text-app-text leading-none">
              Apex<span className="text-accent-bright">Civil</span>
            </h1>
            <p className="text-[9px] font-bold text-app-faint uppercase tracking-[0.2em] mt-1">
              Civil Engineering Mastery
            </p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-accent/25 via-accent-soft/70 to-transparent text-accent-bright"
                  : "text-app-muted hover:text-app-text hover:bg-app-card"
              }`}
            >
              <item.icon
                className={`w-[18px] h-[18px] shrink-0 ${active ? "text-accent-bright" : "text-app-faint group-hover:text-app-muted"}`}
              />
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-bright shadow shadow-accent/60" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
