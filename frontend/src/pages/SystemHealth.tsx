import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Database,
  Server,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Layers,
  Terminal
} from 'lucide-react';
import { api } from '../api/client';
import { SystemHealthData } from '../api/types';
import { ErrorState } from '../components/EmptyState';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHealth();
      setHealth(data);
      setLastChecked(new Date());
    } catch (e: any) {
      setError(e.message || 'System health check connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Infrastructure & Health Status</h2>
          <p className="text-sm text-slate-500">
            Real-time verification of FastAPI gateway services, SQLite persistence engine, and ML model runtime.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Run Health Diagnostics
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchHealth} />
      ) : health ? (
        <>
          {/* Status Hero Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  health.status === 'Operational'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black text-slate-900">Overall Gateway Health</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      health.status === 'Operational'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {health.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Last diagnostic ping: {lastChecked.toLocaleTimeString()} (auto-refreshes every 15s)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sentinel Release</span>
              <span className="font-mono font-bold text-xs text-slate-700">{health.version}</span>
            </div>
          </div>

          {/* Subsystem Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Backend FastAPI / Uvicorn */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Application Layer</span>
                <Server className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">FastAPI & Uvicorn</h4>
                <div className="flex items-center space-x-1.5 mt-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{health.backend_status}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Asynchronous ASGI engine processing incoming requests and running real-time detection middleware.
              </p>
            </div>

            {/* SQLite Database Engine */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Persistence Layer</span>
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">SQLite Database</h4>
                <div className="flex items-center space-x-1.5 mt-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{health.database_status}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Local ACID-compliant relational storage storing request telemetry, threshold rules, and alerts.
              </p>
            </div>

            {/* ML Anomaly Runtime */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cognitive Layer</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Isolation Forest ML</h4>
                <div className="flex items-center space-x-1.5 mt-1 text-xs text-slate-700 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{health.model_status}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Unsupervised scikit-learn anomaly engine extracting multivariate client behavioral vectors.
              </p>
            </div>
          </div>

          {/* Database Records Inventory */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Database Records Inventory</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Stored Logs</span>
                  <span className="text-2xl font-black text-slate-900">{health.total_request_logs.toLocaleString()}</span>
                </div>
                <Activity className="w-6 h-6 text-cyan-600 opacity-60" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Security Alerts</span>
                  <span className="text-2xl font-black text-indigo-600">{health.total_alerts.toLocaleString()}</span>
                </div>
                <ShieldCheck className="w-6 h-6 text-indigo-600 opacity-60" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Rule Heuristics</span>
                  <span className="text-2xl font-black text-emerald-600">{health.active_rules_count} Heuristics</span>
                </div>
                <Terminal className="w-6 h-6 text-emerald-600 opacity-60" />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
