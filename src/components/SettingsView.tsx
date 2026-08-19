"use client";
import React, { useState, useEffect } from "react";
import { Target, Calendar, Save, ShieldCheck, Loader2, Trash2, AlertTriangle, User, Flame, CheckCircle2, BookOpen } from "lucide-react";
import { getUserSettings, updateUserSettings, resetUserData } from "../app/actions/settings";
import { getDashboardStats } from "../app/actions/dashboard";
import { Btn } from "./ui/primitives";
import { useUser } from "@clerk/nextjs";

interface SettingsViewProps {
}

type Tab = "general" | "goals" | "security";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "goals", label: "Study Goals" },
  { id: "security", label: "Security" },
];

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("goals");
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
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
        setDailyGoal(settings.dailyGoal ?? 30);
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
      await updateUserSettings(dailyGoal ?? 30, examDate || null);
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
      setDailyGoal(settings.dailyGoal ?? 30);
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
      <div className="flex flex-col items-center justify-center min-h-[50vh]" style={{ color: 'var(--app-text)' }}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
        <p style={{ color: 'var(--app-muted)' }}>Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 space-y-6" style={{ color: 'var(--app-text)' }}>
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--app-text)' }}>Account Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--app-muted)' }}>Manage your preferences and study goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* LEFT — Profile Overview */}
        <div className="rounded-2xl p-6 flex flex-col items-center text-center bp-card">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full" style={{ background: 'var(--accent-soft)', filter: 'blur(12px)' }} />
            <div className="relative w-full h-full rounded-full border flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', border: '1px solid var(--app-border)', boxShadow: '0 0 24px var(--neon-blue)' }}>
              <User className="w-9 h-9" style={{ color: 'var(--app-bg)' }} />
            </div>
          </div>
          <p className="mt-4 text-lg font-extrabold" style={{ color: 'var(--app-text)' }}>
            {user?.firstName || 'Student'} {user?.lastName || ''}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-muted)' }}>
            {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || 'Student'}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--status-success)' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Signed in
          </div>

          <div className="w-full mt-6 grid grid-cols-3 gap-2.5">
            {[
              { icon: <Flame className="w-4 h-4" style={{ color: 'var(--status-warning)' }} />, val: stats?.streak?.currentStreak ?? 0, label: 'Streak' },
              { icon: <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--status-success)' }} />, val: (stats?.totalAnswered ?? 0).toLocaleString(), label: 'Solved' },
              { icon: <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />, val: dailyGoal ?? 30, label: 'Goal Qs' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-2 py-3 text-center"
                style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
                <div className="flex justify-center">{s.icon}</div>
                <p className="mt-1.5 text-sm font-black" style={{ color: 'var(--app-text)' }}>{s.val}</p>
                <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--app-faint)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Settings tabs */}
        <div className="rounded-2xl overflow-hidden bp-card">
          {/* Tabs */}
          <div className="flex px-6" style={{ borderBottom: '1px solid var(--app-border)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="relative px-4 py-3.5 text-sm font-bold transition-colors"
                style={{ color: tab === t.id ? 'var(--app-text)' : 'var(--app-faint)' }}>
                {t.label}
                {tab === t.id && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--primary-start), var(--primary-end))' }} />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {tab === 'general' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium" style={{ color: 'var(--app-muted)' }}>General settings will appear here soon.</p>
              </div>
            )}

            {/* STUDY GOALS */}
            {tab === 'goals' && (
              <>
                <h3 className="text-base font-extrabold" style={{ color: 'var(--app-text)' }}>Study Goals</h3>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--app-text)' }}>
                        <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Daily Question Goal
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-muted)' }}>Set your daily question target.</p>
                    </div>
                    <div className="flex items-center rounded-xl overflow-hidden shrink-0"
                      style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)' }}>
                      <button onClick={() => setDailyGoal(Math.max(10, (dailyGoal ?? 30) - 10))}
                        className="px-4 py-2 text-lg font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--app-muted)' }}>−</button>
                      <div className="w-16 text-center text-sm font-bold py-2" style={{ color: 'var(--app-text)', borderLeft: '1px solid var(--app-border)', borderRight: '1px solid var(--app-border)' }}>{dailyGoal ?? 30}</div>
                      <button onClick={() => setDailyGoal((dailyGoal ?? 30) + 10)}
                        className="px-4 py-2 text-lg font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--app-muted)' }}>+</button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--app-text)' }}>
                        <Calendar className="w-4 h-4" style={{ color: 'var(--status-warning)' }} /> Target Exam Date
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-muted)' }}>Choose your target exam date.</p>
                    </div>
                    <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                      className="rounded-xl px-4 py-2 text-sm focus:outline-none transition-all shrink-0"
                      style={{ background: 'var(--app-bg)', border: '1px solid var(--app-border)', color: 'var(--app-text)' }} />
                  </div>
                </div>

                <div className="pt-5 flex justify-end" style={{ borderTop: '1px solid var(--app-border)', marginTop: '8px' }}>
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-6 h-10 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))', color: '#fff', boxShadow: '0 0 16px var(--neon-blue)' }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* SECURITY */}
            {tab === 'security' && (
              <div className="rounded-xl p-5" style={{ border: '1px solid var(--status-danger)', background: 'color-mix(in srgb, var(--status-danger) 10%, transparent)' }}>
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--status-danger)' }}>Danger Zone</h3>
                <div className="mt-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Reset Progress</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-muted)' }}>Permanently delete all your exam history and statistics. This cannot be undone.</p>
                </div>
                {resetConfirming && (
                  <div className="flex items-start gap-2 p-3.5 rounded-xl text-xs leading-relaxed mt-4"
                    style={{ background: 'color-mix(in srgb, var(--status-danger) 15%, transparent)', border: '1px solid var(--status-danger)', color: 'var(--status-danger)' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>This permanently deletes <strong>your</strong> exam attempts, answers, bookmarks, daily goals, streaks and notifications. Click again to confirm.</span>
                  </div>
                )}
                <div className="mt-4">
                  <button onClick={handleReset} disabled={resetting}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold transition-all"
                    style={{ background: resetConfirming ? 'var(--status-danger)' : 'color-mix(in srgb, var(--status-danger) 10%, transparent)', border: '1px solid var(--status-danger)', color: resetConfirming ? '#fff' : 'var(--status-danger)' }}>
                    {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : resetConfirming ? <AlertTriangle className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {resetting ? 'Resetting…' : resetConfirming ? 'Click again to confirm' : 'Reset Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
