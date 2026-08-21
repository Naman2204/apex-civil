"use client";
import React, { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Activity,
  CalendarDays,
  Clock,
  Layers,
  Trophy,
  ChevronDown,
  Search,
  Zap,
  Target,
  BookOpen,
  Beaker,
  Compass,
  Calculator,
  Wrench,
  FlaskConical,
  Ruler,
  HardHat,
} from "lucide-react";
import { getExamHistory } from "../app/actions/analytics";
import { EmptyState, Btn } from "./ui/primitives";

interface HistoryRecord {
  id: string;
  date: string;
  timeOfDay: string;
  mode: string;
  topic: string;
  score: number;
  total: number;
  time: string;
}

/* Topic icon mapping */
const TOPIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Mixed Chapters": Layers,
  "Structural Analysis": HardHat,
  "Geotechnical Eng.": Compass,
  "Geotechnical Engineering": Compass,
  "Fluid Mechanics": Beaker,
  "Surveying": Ruler,
  "Construction Management": Wrench,
  "Concrete Technology": Calculator,
  "Steel Structures": Target,
  "Transportation Eng.": BookOpen,
  "Environmental Eng.": FlaskConical,
  "Uncategorized": BookOpen,
};

function getTopicIcon(topic: string) {
  if (TOPIC_ICONS[topic]) return TOPIC_ICONS[topic];
  const lower = topic.toLowerCase();
  if (lower.includes("structural")) return HardHat;
  if (lower.includes("geotechnical") || lower.includes("soil")) return Compass;
  if (lower.includes("fluid")) return Beaker;
  if (lower.includes("survey")) return Ruler;
  if (lower.includes("construction")) return Wrench;
  if (lower.includes("concrete")) return Calculator;
  if (lower.includes("steel")) return Target;
  if (lower.includes("transport")) return BookOpen;
  if (lower.includes("environment")) return FlaskConical;
  return Layers;
}

/* Glowing Score Ring — theme-aware */
function ScoreRing({
  pct,
  score,
  total,
  size = 80,
  stroke = 6,
}: {
  pct: number;
  score: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));

  let color: string;
  let glowColor: string;
  if (p >= 75) {
    color = "#F59E0B";
    glowColor = "rgba(245, 158, 11, 0.6)";
  } else if (p >= 50) {
    color = "#F97316";
    glowColor = "rgba(249, 115, 22, 0.5)";
  } else {
    color = "#EF4444";
    glowColor = "rgba(239, 68, 68, 0.5)";
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-app-border"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke + 4}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`}
          opacity={0.3}
          style={{ filter: "blur(8px)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`}
          style={{
            filter: `drop-shadow(0 0 8px ${glowColor})`,
            transition: "stroke-dasharray 1s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xl font-black leading-none"
          style={{ color, textShadow: `0 0 20px ${glowColor}` }}
        >
          {score}
        </span>
        <span className="text-[11px] font-bold text-app-muted mt-0.5">/{total}</span>
      </div>
    </div>
  );
}

/* Performance Attempt Card — theme-aware */
function AttemptCard({ record, index }: { record: HistoryRecord; index: number }) {
  const percentage = Math.round((record.score / record.total) * 100);
  const isStrict = record.mode === "Mock Test";
  const topicIcon = getTopicIcon(record.topic);
  const delay = index * 0.1;
  const isTop = index === 0;

  return (
    <div
      className="group relative"
      style={{ animation: `slideInUp 0.5s ease-out ${delay}s both` }}
    >
      {/* Outer glow border */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
        style={{
          background: isTop
            ? "linear-gradient(135deg, rgba(6,182,212,0.4), rgba(34,211,238,0.15), rgba(6,182,212,0.4))"
            : isStrict
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.35))"
              : "linear-gradient(135deg, rgba(124, 92, 252, 0.35), rgba(139, 92, 246, 0.2), rgba(124, 92, 252, 0.35))",
          filter: "blur(2px)",
        }}
      />

      {/* Card content */}
      <div className="relative rounded-2xl overflow-hidden bg-[rgba(15,15,25,0.85)] border border-app-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.06),transparent_42%)] opacity-50" />
        {/* Inner subtle glow at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: isTop
              ? "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)"
              : isStrict
                ? "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)"
                : "linear-gradient(90deg, transparent, rgba(124, 92, 252, 0.5), transparent)",
          }}
        />

        <div className="relative px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-4 sm:gap-6">
          {/* Date & Time Column */}
          <div className="flex flex-col items-center min-w-[112px] shrink-0">
            <div className="px-4 py-2.5 rounded-xl border border-app-border bg-app-card2/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <p className="text-sm font-bold text-app-text text-center">{record.date}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <CalendarDays className="w-3 h-3 text-app-faint" />
                <p className="text-xs text-app-muted">{record.timeOfDay || ""}</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-px self-stretch bg-app-border/50" />

          {/* Topic Icon */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 bg-accent-soft/50"
            style={{
              boxShadow: isTop
                ? "0 0 20px rgba(6,182,212,0.2)"
                : isStrict
                  ? "0 0 20px rgba(59, 130, 246, 0.12)"
                  : "0 0 20px rgba(124, 92, 252, 0.12)",
            }}
          >
            <span style={{ color: 'var(--accent-bright)', filter: 'drop-shadow(0 0 8px var(--accent-bright))', display: 'flex' }}>
              {React.createElement(topicIcon, { className: "w-8 h-8 stroke-1" })}
            </span>
          </div>

          {/* Topic Name */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-app-text truncate">{record.topic}</h3>
          </div>

          {/* Mode Badge */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold border ${
                isStrict
                  ? "bg-app-blue-soft text-app-blue border-app-blue/30"
                  : "bg-accent-soft text-accent-bright border-accent/30"
              }`}
            >
              {record.mode}
            </span>
          </div>

          <div className="hidden md:block w-px self-stretch bg-app-border/50" />

          {/* Score Ring */}
          <div className="shrink-0">
            <ScoreRing pct={percentage} score={record.score} total={record.total} />
          </div>

          {/* Time Taken */}
          <div className="flex items-center gap-2 shrink-0 min-w-[80px] justify-end">
            <Clock className="w-4 h-4 text-app-faint" />
            <span className="text-sm font-semibold text-app-muted">{record.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Main PerformanceView */
export const PerformanceView: React.FC<{ onStartExam?: () => void }> = ({
  onStartExam,
}) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterDate, setFilterDate] = useState("All");

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      try {
        const data = await getExamHistory();
        if (!cancelled) setHistory(data as HistoryRecord[]);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 rounded-2xl bg-accent-soft/60 flex items-center justify-center animate-pulse mb-4 border border-accent/20 shadow-[0_0_20px_var(--neon-blue)]">
          <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--accent))', display: 'flex' }}>
            <Activity className="w-8 h-8 stroke-1" />
          </span>
        </div>
        <p className="text-sm text-app-muted font-medium">Loading performance history...</p>
      </div>
    );
  }

  const subjects = [...new Set(history.map((h) => h.topic))].sort();

  const filtered = history
    .filter((h) => {
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        if (
          !h.topic.toLowerCase().includes(query) &&
          !h.mode.toLowerCase().includes(query) &&
          !h.date.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (filterTopic !== "All" && h.topic !== filterTopic) return false;
      if (filterDate !== "All") {
        const recordDate = new Date(h.date);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (filterDate === "Today" && daysDiff > 0) return false;
        if (filterDate === "This Week" && daysDiff > 7) return false;
        if (filterDate === "This Month" && daysDiff > 30) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.date).getTime() || 0;
      const tb = new Date(b.date).getTime() || 0;
      return tb - ta;
    });

  return (
    <div className="w-full min-h-full pb-12 space-y-6" style={{ color: '#e8e8ff' }}>
      {/* Header with fire icon */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-400/30">
          <Zap className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
            Performance History
          </h1>
          <p className="text-sm text-app-muted mt-0.5">
            Review your past attempts and track improvements.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No attempts recorded"
          message="Complete a practice or strict exam to start building your performance history."
          action={<Btn onClick={onStartExam}>Take an Exam</Btn>}
        />
      ) : (
        <>
          {/* Search and Filters Row */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-app-border bg-app-card/30 p-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-app-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search performance..."
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium text-app-text placeholder:text-app-faint bg-app-deep/70 border border-app-border focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 rounded-xl text-sm font-semibold text-app-text bg-app-deep/70 border border-app-border focus:border-accent/50 focus:outline-none cursor-pointer"
              >
                <option value="All">Filter by Topic</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-app-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 rounded-xl text-sm font-semibold text-app-text bg-app-deep/70 border border-app-border focus:border-accent/50 focus:outline-none cursor-pointer"
              >
                <option value="All">Filter by Date</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
              <ChevronDown className="w-4 h-4 text-app-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Performance Cards */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No matches"
                message="No attempts found. Try different filters."
                action={
                  <Btn
                    variant="secondary"
                    onClick={() => {
                      setFilterTopic("All");
                      setFilterDate("All");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </Btn>
                }
              />
            ) : (
              filtered.map((record, index) => (
                <AttemptCard key={record.id} record={record} index={index} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
