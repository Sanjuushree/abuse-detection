import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { LiveTraffic } from './pages/LiveTraffic';
import { ThreatDetection } from './pages/ThreatDetection';
import { MLAnalytics } from './pages/MLAnalytics';
import { IPAnalysis } from './pages/IPAnalysis';
import { APIEndpoints } from './pages/APIEndpoints';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { SystemHealth } from './pages/SystemHealth';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/traffic': 'Live API Traffic Telemetry',
  '/threats': 'Threat Detection Signals',
  '/ml': 'Machine Learning Anomaly Engine',
  '/ip-analysis': 'Client IP Analytics',
  '/endpoints': 'API Endpoints Telemetry',
  '/alerts': 'Security Incident Management',
  '/reports': 'Audit Reports & Data Export',
  '/settings': 'Detection Engine Thresholds',
  '/health': 'System Health & Runtime Status'
};

const Layout: React.FC = () => {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'API Sentinel Security Console';

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={currentTitle} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/traffic" element={<LiveTraffic />} />
            <Route path="/threats" element={<ThreatDetection />} />
            <Route path="/ml" element={<MLAnalytics />} />
            <Route path="/ip-analysis" element={<IPAnalysis />} />
            <Route path="/endpoints" element={<APIEndpoints />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/health" element={<SystemHealth />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  // Use HashRouter to guarantee smooth routing in local file/preview environments without server fallback issues
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}
