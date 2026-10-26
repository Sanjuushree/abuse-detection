import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  Server,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Eye
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '../api/client';
import { DashboardStats, Alert, RequestLog } from '../api/types';
import { SeverityBadge, HttpStatusBadge, HttpMethodBadge, StatusBadge } from '../components/Badge';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Modal } from '../components/Modal';

const STATUS_COLORS: Record<string, string> = {
  '2xx Success': '#10B981',
  '3xx Redirection': '#3B82F6',
  '4xx Client Error': '#F59E0B',
  '5xx Server Error': '#EF4444',
  'Other': '#64748B'
};

const METHOD_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRangeHours, setTimeRangeHours] = useState(24);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats(timeRangeHours);
      setStats(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRangeHours]);

  const handleTrafficGenerated = () => {
    loadData();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-medium">Gathering real-time behavioral telemetry...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const overview = stats?.overview;
  const hasData = overview && overview.total_requests > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Telemetry Dashboard</h2>
          <p className="text-sm text-slate-500">
            Real-time behavioral monitoring and explainable threat signals across monitored APIs.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Window:</span>
          <select
            value={timeRangeHours}
            onChange={(e) => setTimeRangeHours(Number(e.target.value))}
            className="text-xs font-medium text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value={1}>Last 1 Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="No API Traffic Recorded Yet"
          description="The instrumented gateway database is currently empty. Make requests to monitored endpoints or generate safe simulated traffic batches to demonstrate detections."
          actionLabel="Refresh Metrics"
          onAction={loadData}
          onGenerateTraffic={async () => {
            await api.generateDemoTraffic('all_scenarios');
            loadData();
          }}
        />
      ) : (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Requests */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total API Requests</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">{overview.total_requests.toLocaleString()}</div>
              <div className="text-xs text-slate-500 flex items-center">
                <span className="text-emerald-600 font-semibold flex items-center mr-1">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Live
                </span>
                logged in active window
              </div>
            </div>

            {/* Suspicious Requests */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspicious Requests</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 mb-1">{overview.suspicious_requests.toLocaleString()}</div>
              <div className="text-xs text-slate-500">
                {overview.total_requests > 0
                  ? `${((overview.suspicious_requests / overview.total_requests) * 100).toFixed(1)}% of total volume`
                  : '0%'}
              </div>
            </div>

            {/* Failed Requests */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed HTTP Requests</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 mb-1">{overview.failed_requests.toLocaleString()}</div>
              <div className="text-xs text-slate-500">4xx Client & 5xx Server errors</div>
            </div>

            {/* Active Security Alerts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Security Alerts</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600 mb-1">{overview.open_alerts}</div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Avg latency: {overview.avg_latency_ms}ms</span>
                <span className="font-semibold text-slate-700">{overview.api_health}</span>
              </div>
            </div>
          </div>

          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Traffic Over Time */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Traffic & Error Volatility</h3>
                  <p className="text-xs text-slate-500">Time-series breakdown of total, failed, and suspicious request spikes</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.traffic_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '10px',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="total" name="Total Requests" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="failed" name="Failed Requests" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
                    <Area type="monotone" dataKey="suspicious" name="Suspicious Requests" stroke="#F59E0B" strokeWidth={2} fillOpacity={0.2} fill="#F59E0B" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Code Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">HTTP Status Distribution</h3>
                <p className="text-xs text-slate-500">Response code breakdown</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {stats?.status_distribution.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.status_distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {stats.status_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748B'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">No status distributions</p>
                )}
              </div>

              <div className="mt-auto space-y-2 pt-2 border-t border-slate-100">
                {stats?.status_distribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || '#64748B' }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{item.value} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Alerts & Recent Request Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Threat Alerts</h3>
                  <p className="text-xs text-slate-500">Latest explainable security events</p>
                </div>
                <a href="#/threats" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center">
                  View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </a>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
                {!stats?.recent_alerts.length ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No security alerts triggered in the current window.
                  </div>
                ) : (
                  stats.recent_alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition-all flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <SeverityBadge severity={alert.severity} />
                          <span className="text-xs font-semibold text-slate-900">{alert.alert_type.replace(/_/g, ' ')}</span>
                        </div>
                        <StatusBadge status={alert.status} />
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{alert.description}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="font-mono">IP: {alert.source_ip}</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Request Telemetry */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Traffic Feed</h3>
                  <p className="text-xs text-slate-500">Most recent requests evaluated by gateway</p>
                </div>
                <a href="#/traffic" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center">
                  Live Stream <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </a>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Endpoint</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Client IP</th>
                      <th className="py-2.5 px-3 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stats?.recent_logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3">
                          <HttpMethodBadge method={log.method} />
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-800 max-w-[150px] truncate" title={log.endpoint}>
                          {log.endpoint}
                        </td>
                        <td className="py-2 px-3">
                          <HttpStatusBadge code={log.status_code} />
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{log.client_ip}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">{log.duration_ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alert Evidence Modal */}
      <Modal
        isOpen={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert ? `Alert Details: ${selectedAlert.alert_type}` : 'Alert Details'}
        footer={
          <button
            onClick={() => setSelectedAlert(null)}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        }
      >
        {selectedAlert && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Severity</span>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold text-slate-700">{selectedAlert.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Source IP</span>
                <span className="font-mono text-slate-800">{selectedAlert.source_ip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                <span className="text-slate-700">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Human-Readable Explanation</span>
              <p className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-700 leading-relaxed">
                {selectedAlert.detection_reason}
              </p>
            </div>

            {selectedAlert.evidence && (
              <div>
                <span className="font-bold text-slate-800 block mb-1">Supporting Forensic Evidence</span>
                <pre className="p-3 bg-slate-900 text-cyan-300 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedAlert.evidence), null, 2);
                    } catch {
                      return selectedAlert.evidence;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
