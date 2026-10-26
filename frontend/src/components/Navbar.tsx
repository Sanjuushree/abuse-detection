import React, { useState, useEffect } from 'react';
import { Zap, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, ChevronDown } from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  title: string;
  onRefresh?: () => void;
  onTrafficGenerated?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onRefresh, onTrafficGenerated }) => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setIsBackendHealthy(data.status === 'Operational');
    } catch {
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (scenario: string) => {
    setGenerating(true);
    setShowScenarioMenu(false);
    try {
      const res = await api.generateDemoTraffic(scenario);
      setNotification(`Generated ${res.logs_generated} requests & ${res.alerts_triggered.length} alert(s)!`);
      if (onTrafficGenerated) onTrafficGenerated();
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setNotification(`Traffic generation error: ${e.message}`);
    } finally {
      setGenerating(false);
      setTimeout(() => setNotification(null), 4500);
    }
  };

  return (
    <header className="h-16 px-8 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title */}
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        
        {/* Backend health pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium border border-slate-200">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy === true
                ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                : isBackendHealthy === false
                ? 'bg-rose-500'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-slate-600">
            {isBackendHealthy === true ? 'Backend Online' : isBackendHealthy === false ? 'Backend Offline' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {notification && (
          <div className="px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-medium flex items-center shadow-xs animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-cyan-600" />
            {notification}
          </div>
        )}

        {/* Generate Traffic Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            disabled={generating}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Simulating...' : 'Simulate API Traffic'}
            <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
          </button>

          {showScenarioMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Demo Scenarios
              </div>
              <button
                onClick={() => handleGenerate('all_scenarios')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col font-medium text-slate-800"
              >
                <span>Full Mixed Traffic</span>
                <span className="text-[11px] text-slate-400 font-normal">Normal + Rate Spikes + Brute Force + 404s</span>
              </button>
              <button
                onClick={() => handleGenerate('normal')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col font-medium text-slate-800"
              >
                <span>Benign Baseline Traffic</span>
                <span className="text-[11px] text-slate-400 font-normal">Standard 200 OK customer API requests</span>
              </button>
              <button
                onClick={() => handleGenerate('rate_spike')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col font-medium text-slate-800"
              >
                <span>Rate Limit Spike</span>
                <span className="text-[11px] text-slate-400 font-normal">High-frequency bursts from single IP</span>
              </button>
              <button
                onClick={() => handleGenerate('brute_force')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col font-medium text-slate-800"
              >
                <span>Auth Brute Force</span>
                <span className="text-[11px] text-slate-400 font-normal">Repeated 401 Unauthorized attempts</span>
              </button>
              <button
                onClick={() => handleGenerate('path_scan')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col font-medium text-slate-800"
              >
                <span>Endpoint Scanning Probe</span>
                <span className="text-[11px] text-slate-400 font-normal">404 reconnaissance sweeps</span>
              </button>
            </div>
          )}
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh current data"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* API Docs Link */}
        <a
          href={import.meta.env.VITE_DOCS_URL || "http://127.0.0.1:8001/docs"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <span>FastAPI Docs</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-60" />
        </a>
      </div>
    </header>
  );
};
