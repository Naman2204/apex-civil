"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Target, Calendar, Save, ShieldCheck, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { getUserSettings, updateUserSettings, resetUserData } from '../app/actions/settings';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const [dailyGoal, setDailyGoal] = useState(50);
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const settings = await getUserSettings();
        setDailyGoal(settings.dailyGoal);
        if (settings.examTargetDate) {
          // Format ISO date string to YYYY-MM-DD for the input
          const d = new Date(settings.examTargetDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setExamDate(`${yyyy}-${mm}-${dd}`);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserSettings(dailyGoal, examDate || null);
      // Optional: Add a success toast here
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
      // First click: ask for explicit confirmation.
      setResetConfirming(true);
      return;
    }
    setResetting(true);
    try {
      await resetUserData();
      // Reload settings so the UI returns to the correct empty state.
      const settings = await getUserSettings();
      setDailyGoal(settings.dailyGoal);
      setExamDate(settings.examTargetDate
        ? settings.examTargetDate.slice(0, 10)
        : '');
      setResetConfirming(false);
      alert('Your progress data has been reset.');
    } catch (err) {
      console.error('Failed to reset data', err);
      setResetConfirming(false);
      alert('Reset failed. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center transition-colors">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Account Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">Manage your preferences and study goals.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#131627] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-8 transition-colors shadow-sm dark:shadow-none">
        
        {/* Theme Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 transition-colors">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">Theme</p>
              <p className="text-xs text-slate-500 transition-colors">Choose between light and dark mode for your study sessions.</p>
            </div>
            <button
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-[#5c2dd5]' : 'bg-slate-300'}`}
            >
              <span className={`pointer-events-none inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                {isDarkMode ? <Moon className="h-3.5 w-3.5 text-[#5c2dd5]" /> : <Sun className="h-4 w-4 text-amber-500" />}
              </span>
            </button>
          </div>
        </div>

        {/* Study Goals */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 transition-colors">Study Goals</h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center transition-colors">
                <Target className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" /> Daily Question Goal
              </p>
              <p className="text-xs text-slate-500 transition-colors">Set the number of questions you want to solve each day.</p>
            </div>
            <div className="flex items-center bg-slate-50 dark:bg-[#0A0C18] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
              <button onClick={() => setDailyGoal(Math.max(10, dailyGoal - 10))} className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">-</button>
              <div className="w-16 text-center text-sm font-bold text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-800 py-2 transition-colors">{dailyGoal}</div>
              <button onClick={() => setDailyGoal(dailyGoal + 10)} className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">+</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center transition-colors">
                <Calendar className="w-4 h-4 mr-2 text-amber-500 dark:text-amber-400" /> Target Exam Date
              </p>
              <p className="text-xs text-slate-500 transition-colors">Set this to see a countdown on your dashboard.</p>
            </div>
            <input 
              type="date" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="bg-slate-50 dark:bg-[#0A0C18] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-500 border-b border-slate-200 dark:border-slate-800 pb-2 transition-colors">Danger Zone</h3>
          {resetConfirming && (
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>This permanently deletes <strong>your</strong> exam attempts, answers, bookmarks, daily goals, streaks and notifications. This cannot be undone. Click the button again to confirm.</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 transition-colors">Reset Progress</p>
              <p className="text-xs text-slate-500 transition-colors">Permanently delete all your exam history and statistics.</p>
            </div>
            <button
              onClick={handleReset}
              disabled={resetting}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${resetConfirming
                ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-200 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white'}`}
            >
              {resetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
              ) : resetConfirming ? (
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              )}
              {resetting ? 'Resetting…' : resetConfirming ? 'Click again to confirm' : 'Reset Data'}
            </button>
          </div>
        </div>
        
        {/* Save button */}
        <div className="pt-6 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`flex items-center justify-center space-x-2 bg-indigo-600 dark:bg-[#5c2dd5] hover:bg-indigo-700 dark:hover:bg-[#4b22b6] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
