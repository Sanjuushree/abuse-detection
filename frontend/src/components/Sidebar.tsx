import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  BrainCircuit,
  Network,
  Waypoints,
  BellRing,
  FileSpreadsheet,
  Sliders,
  HeartPulse,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live API Traffic', path: '/traffic', icon: Activity },
  { name: 'Threat Detection', path: '/threats', icon: ShieldAlert },
  { name: 'ML Analytics', path: '/ml', icon: BrainCircuit },
  { name: 'IP Analysis', path: '/ip-analysis', icon: Network },
  { name: 'API Endpoints', path: '/endpoints', icon: Waypoints },
  { name: 'Alerts', path: '/alerts', icon: BellRing },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', path: '/settings', icon: Sliders },
  { name: 'System Health', path: '/health', icon: HeartPulse },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#0A0F1D] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 min-h-screen select-none">
      {/* Brand & Tagline */}
      <div className="px-6 py-6 border-b border-slate-800/80 flex items-center space-x-3 bg-[#070B16]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0A0F1D] rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-wider text-white uppercase font-mono">
            API <span className="text-cyan-400">Sentinel</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
            Detect. Analyze. Protect.
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Security Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-400 border border-cyan-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 mr-3 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070B16]">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-medium text-slate-300">Environment</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
              v1.0.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Instrumented Gateway Prototype
          </p>
        </div>
      </div>
    </aside>
  );
};
