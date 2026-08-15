"use client";
import React, { useState, useEffect } from "react";
import { Moon, Sun, Target, Calendar, Save, ShieldCheck, Loader2, Trash2, AlertTriangle, User, Flame, CheckCircle2, BookOpen } from "lucide-react";
import { getUserSettings, updateUserSettings, resetUserData } from "../app/actions/settings";
import { getDashboardStats } from "../app/actions/dashboard";
import { Btn } from "./ui/primitives";
import { useUser } from "@clerk/nextjs";

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type Tab = "general" | "goals" | "security";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "goals", label: "Study Goals" },
  { id: "security", label: "Security" },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("goals");
  const [dailyGoal, setDailyGoal] = useState(50);
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [settings, dash] = await Promise.all([
          getUserSettings(),
          getDashboardStats().catch(() => null),
        ]);
        if (cancelled) return;
        setDailyGoal(settings.dailyGoal);
        if (settings.examTargetDate) {
          const d = new Date(settings.examTargetDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setExamDate(`${yyyy}-${mm}-${dd}`);
        }
        setStats(dash);
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserSettings(dailyGoal, examDate || null);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  const [resetConfirming, setResetConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!resetConfirming) {
      setResetConfirming(true);
      return;
    }
    setResetting(true);
    try {
      await resetUserData();
      const settings = await getUserSettings();
      setDailyGoal(settings.dailyGoal);
      setExamDate(settings.examTargetDate ? settings.examTargetDate.slice(0, 10) : "");
      setResetConfirming(false);
      alert("Your progress data has been reset.");
    } catch (err) {
      console.error("Failed to reset data", err);
      setResetConfirming(false);
      alert("Reset failed. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-accent-bright animate-spin mb-4" />
        <p className="text-app-muted font-medium">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 space-y-6">
      {/* Header — reference placement */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
          Account Settings
        </h1>
        <p className="text-sm text-app-muted mt-1">Manage your preferences and study goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* LEFT — Profile Overview */}
        <div className="rounded-2xl border border-violet-500/25 bg-app-card/60 backdrop-blur p-6 flex flex-col items-center text-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/50 to-indigo-500/50 blur-md" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/40 shadow-[0_0_24px_rgba(139,92,246,0.4)] flex items-center justify-center">
              <User className="w-9 h-9 text-white" />
            </div>
          </div>
          <p className="mt-4 text-lg font-extrabold text-app-text">
            {user?.firstName || "Student"} {user?.lastName || ""}
          </p>
          <p className="text-xs text-app-muted mt-0.5">
            {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "Student"}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Signed in
          </div>

          {/* Stats row (real data) */}
          <div className="w-full mt-6 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-[#0b0f1d] border border-app-border px-2 py-3">
              <Flame className="w-4 h-4 text-amber-400 mx-auto" />
              <p className="mt-1.5 text-sm font-black text-app-text">{stats?.streak?.currentStreak ?? 0}</p>
              <p className="text-[9px] font-bold text-app-faint uppercase tracking-wide mt-0.5">Streak</p>
            </div>
            <div className="rounded-xl bg-[#0b0f1d] border border-app-border px-2 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
              <p className="mt-1.5 text-sm font-black text-app-text">{(stats?.totalAnswered ?? 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-app-faint uppercase tracking-wide mt-0.5">Solved</p>
            </div>
            <div className="rounded-xl bg-[#0b0f1d] border border-app-border px-2 py-3">
              <BookOpen className="w-4 h-4 text-sky-400 mx-auto" />
              <p className="mt-1.5 text-sm font-black text-app-text">{dailyGoal}</p>
              <p className="text-[9px] font-bold text-app-faint uppercase tracking-wide mt-0.5">Goal Qs</p>
            </div>
          </div>
        </div>

        {/* RIGHT — Settings card with tabs */}
        <div className="rounded-2xl border border-violet-500/25 bg-app-card/60 backdrop-blur overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-app-border px-6">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-4 py-3.5 text-sm font-bold transition-colors ${
                  tab === t.id ? "text-app-text" : "text-app-faint hover:text-app-muted"
                }`}
              >
                {t.label}
                {tab === t.id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {/* GENERAL */}
            {tab === "general" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-app-text">Theme</p>
                    <p className="text-xs text-app-muted mt-0.5">Deep-navy dark mode matches the reference product.</p>
                  </div>
                  <button
                    onClick={onToggleDarkMode}
                    aria-label="Toggle dark mode"
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-app-border2 transition-colors ${isDarkMode ? "bg-accent" : "bg-app-card2"}`}
                  >
                    <span
                      className={`pointer-events-none inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-0 transition-transform ${isDarkMode ? "translate-x-7" : "translate-x-1"}`}
                    >
                      {isDarkMode ? <Moon className="h-3.5 w-3.5 text-accent" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* STUDY GOALS */}
            {tab === "goals" && (
              <>
                <h3 className="text-base font-extrabold text-app-text">Study Goals</h3>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-app-text flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent-bright" /> Daily Question Goal
                      </p>
                      <p className="text-xs text-app-muted mt-0.5">Set your daily question target.</p>
                    </div>
                    <div className="flex items-center bg-app-deep border border-app-border rounded-xl overflow-hidden shrink-0">
                      <button
                        onClick={() => setDailyGoal(Math.max(10, dailyGoal - 10))}
                        className="px-4 py-2 text-app-muted hover:text-app-text hover:bg-app-card transition-colors font-bold"
                      >
                        −
                      </button>
                      <div className="w-16 text-center text-sm font-bold text-app-text border-x border-app-border py-2">{dailyGoal}</div>
                      <button
                        onClick={() => setDailyGoal(dailyGoal + 10)}
                        className="px-4 py-2 text-app-muted hover:text-app-text hover:bg-app-card transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-app-text flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-400" /> Target Exam Date
                      </p>
                      <p className="text-xs text-app-muted mt-0.5">Choose your target exam date.</p>
                    </div>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="bg-app-deep border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 transition-all shrink-0"
                    />
                  </div>
                </div>

                <div className="pt-5 flex justify-end border-t border-app-border mt-2">
                  <Btn onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving…" : "Save Changes"}
                  </Btn>
                </div>
              </>
            )}

            {/* SECURITY */}
            {tab === "security" && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.04] p-5">
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider">Danger Zone</h3>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-app-text">Reset Progress</p>
                  <p className="text-xs text-app-muted mt-0.5">
                    Permanently delete all your exam history and statistics. This cannot be undone.
                  </p>
                </div>
                {resetConfirming && (
                  <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 leading-relaxed mt-4">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>This permanently deletes <strong>your</strong> exam attempts, answers, bookmarks, daily goals, streaks and notifications. Click the button again to confirm.</span>
                  </div>
                )}
                <div className="mt-4">
                  <Btn
                    variant="danger"
                    onClick={handleReset}
                    disabled={resetting}
                    className={resetConfirming ? "bg-rose-500 text-white hover:bg-rose-600 border-rose-500" : ""}
                  >
                    {resetting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : resetConfirming ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {resetting ? "Resetting…" : resetConfirming ? "Click again to confirm" : "Reset Data"}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
