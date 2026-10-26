import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Clock,
  KeyRound,
  Compass,
  Cpu
} from 'lucide-react';
import { api } from '../api/client';
import { SettingsData } from '../api/types';
import { ErrorState } from '../components/EmptyState';

const DEFAULT_SETTINGS_VALUES: SettingsData = {
  rate_limit_threshold: 30,
  rate_limit_window_seconds: 60,
  failed_auth_threshold: 5,
  failed_auth_window_seconds: 120,
  scanning_404_threshold: 6,
  scanning_window_seconds: 60,
  error_spike_threshold: 10,
  error_spike_window_seconds: 60,
  alert_cooldown_seconds: 120,
  ml_anomaly_contamination: 0.05
};

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch detection settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof SettingsData, value: string) => {
    const num = field === 'ml_anomaly_contamination' ? parseFloat(value) : parseInt(value, 10);
    setSettings((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      const res = await api.updateSettings(settings);
      setNotification(res.message || 'Detection rules successfully updated in SQLite database.');
    } catch (e: any) {
      setNotification(`Failed to save settings: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS_VALUES);
    setNotification('Values reset to recommended defaults. Click "Save Configuration" to persist.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Detection Engine Thresholds & Rule Configuration</h2>
        <p className="text-sm text-slate-500">
          Tune the sensitivity parameters of the explainable rule-based detector and machine learning isolation engine.
        </p>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center shadow-xs animate-fade-in ${
            notification.includes('Failed')
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.includes('Failed') ? (
            <AlertCircle className="w-4 h-4 mr-2 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          )}
          {notification}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={fetchSettings} />}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Rule 1: High Frequency Rate Limit */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">1. High-Frequency Rate Limit (DoS / Scraper Detection)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Triggers an alert when an individual client IP makes more requests than allowed within the specified time window.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Max Requests Threshold (1 - 10000)</label>
              <input
                type="number"
                min={1}
                max={10000}
                required
                value={settings.rate_limit_threshold}
                onChange={(e) => handleChange('rate_limit_threshold', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Time Window (seconds, 5 - 3600)</label>
              <input
                type="number"
                min={5}
                max={3600}
                required
                value={settings.rate_limit_window_seconds}
                onChange={(e) => handleChange('rate_limit_window_seconds', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Rule 2: Credential Brute Force */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">2. Authentication Brute Force (Credential Abuse)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Monitors repeated HTTP 401 Unauthorized / 403 Forbidden responses to identify automated password cracking or token guessing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Failed Auth Threshold (1 - 100)</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={settings.failed_auth_threshold}
                onChange={(e) => handleChange('failed_auth_threshold', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Window in Seconds (5 - 3600)</label>
              <input
                type="number"
                min={5}
                max={3600}
                required
                value={settings.failed_auth_window_seconds}
                onChange={(e) => handleChange('failed_auth_window_seconds', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Rule 3: 404 Route Scanning */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">3. Nonexistent Endpoint Scanning (Directory Fuzzing)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Identifies clients probing for unmapped endpoints or administrative backdoors resulting in consecutive 404 responses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">404 Threshold (1 - 100)</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={settings.scanning_404_threshold}
                onChange={(e) => handleChange('scanning_404_threshold', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Window in Seconds (5 - 3600)</label>
              <input
                type="number"
                min={5}
                max={3600}
                required
                value={settings.scanning_window_seconds}
                onChange={(e) => handleChange('scanning_window_seconds', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Rule 4: Error Bursts & Alert Deduplication */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">4. Error Bursts, Cooldown & ML Contamination</h3>
          </div>
          <p className="text-xs text-slate-500">
            Configure cumulative 4xx/5xx error trigger rates, cooldowns to prevent alarm storming, and ML outlier contamination.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Error Burst Threshold</label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={settings.error_spike_threshold}
                onChange={(e) => handleChange('error_spike_threshold', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Alert Cooldown (seconds)</label>
              <input
                type="number"
                min={10}
                max={3600}
                required
                value={settings.alert_cooldown_seconds}
                onChange={(e) => handleChange('alert_cooldown_seconds', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">ML Outlier Contamination</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.5"
                required
                value={settings.ml_anomaly_contamination}
                onChange={(e) => handleChange('ml_anomaly_contamination', e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset to Recommended Defaults
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl shadow-md shadow-cyan-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Validating & Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
