import React from "react";
import { Home, Zap, Layers, AlertTriangle, Bookmark, BarChart3, Activity, Settings, MessageSquareText } from "lucide-react";
import { BrandLogo } from "./ui/BrandLogo";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: 'dashboard' | 'exam' | 'bookmarks' | 'quick-practice' | 'topics' | 'weak-topics' | 'analytics' | 'performance' | 'settings') => void;
  className?: string;
}

type NavPage = SidebarProps["onNavigate"] extends (p: infer P) => void ? P : never;

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "quick-practice", label: "Quick Practice", icon: Zap },
  { id: "topics", label: "Topics", icon: MessageSquareText },
  { id: "weak-topics", label: "Weak Topics", icon: AlertTriangle },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "performance", label: "Performance", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, className = "hidden lg:flex" }) => {
  return (
    <aside role="navigation" aria-label="Main navigation" className={`${className} flex-col w-[260px] h-screen sticky top-0 shrink-0 transition-colors`}
      style={{ background: 'var(--app-sidebar)' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex flex-col justify-center">
        <button className="flex items-center gap-3 w-full text-left" onClick={() => onNavigate("dashboard")}>
          <div className="min-w-0">
            <BrandLogo />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--app-faint)' }}>
              Civil Engineering Mastery
            </p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {NAV_ITEMS.filter(item => item.id !== "settings").map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[16px] font-bold transition-all whitespace-nowrap"
              style={active ? {
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                boxShadow: 'inset 0 0 0 1px var(--app-border2)',
              } : {
                color: 'var(--app-muted)',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--app-text)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--app-muted)'; (e.currentTarget as HTMLElement).style.background = ''; } }}
            >
              <span aria-hidden="true" className="w-[22px] h-[22px] shrink-0 flex items-center justify-center"
                style={{ color: active ? 'var(--accent)' : 'inherit', filter: active ? 'drop-shadow(0 0 5px var(--neon-blue))' : undefined }}>
                <item.icon className="w-[22px] h-[22px]" />
              </span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--neon-blue)' }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions (Settings) */}
      <div className="p-4 shrink-0">
        {NAV_ITEMS.filter(item => item.id === "settings").map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[16px] font-bold transition-all whitespace-nowrap"
              style={active ? {
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                boxShadow: 'inset 0 0 0 1px var(--app-border2)',
              } : {
                color: 'var(--app-muted)',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--app-text)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--app-muted)'; (e.currentTarget as HTMLElement).style.background = ''; } }}
            >
              <span aria-hidden="true" className="w-[22px] h-[22px] shrink-0 flex items-center justify-center"
                style={{ color: active ? 'var(--accent)' : 'inherit', filter: active ? 'drop-shadow(0 0 5px var(--neon-blue))' : undefined }}>
                <item.icon className="w-[22px] h-[22px]" />
              </span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--neon-blue)' }} />}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
