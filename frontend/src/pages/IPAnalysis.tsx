import React, { useState, useEffect } from 'react';
import {
  Network,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/client';
import { IPDetail } from '../api/types';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Modal } from '../components/Modal';

export const IPAnalysis: React.FC = () => {
  const [ips, setIps] = useState<IPDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIP, setSelectedIP] = useState<IPDetail | null>(null);

  const fetchIPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIPAnalysis(search.trim() || undefined);
      setIps(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch IP behavioral records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIPs();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Client IP Behavior Analytics</h2>
          <p className="text-sm text-slate-500">
            Multivariate behavioral profiles, failure rates, and activity timelines per requesting client IP.
          </p>
        </div>

        <button
          onClick={fetchIPs}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh IP Telemetry
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IP address (e.g. 192.168.1.101)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
            />
          </div>
        </form>

        <span className="text-xs text-slate-500">
          Tracking <strong className="text-slate-800">{ips.length}</strong> unique client IPs
        </span>
      </div>

      {/* Main Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchIPs} />
      ) : ips.length === 0 ? (
        <EmptyState
          title="No Client IP Activity Recorded"
          description="No request logs from distinct client IPs have been recorded in the gateway database yet."
          actionLabel="Clear Search"
          onAction={() => {
            setSearch('');
            fetchIPs();
          }}
          onGenerateTraffic={async () => {
            await api.generateDemoTraffic('all_scenarios');
            fetchIPs();
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Total Requests</th>
                  <th className="py-3 px-4">Failed Requests</th>
                  <th className="py-3 px-4">Error Rate</th>
                  <th className="py-3 px-4">Unique Endpoints</th>
                  <th className="py-3 px-4">Security Alerts</th>
                  <th className="py-3 px-4">Activity Range</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ips.map((item) => (
                  <tr key={item.ip} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.ip}</td>
                    <td className="py-3 px-4">
                      {item.is_suspicious ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Suspicious Signals
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Standard Behavior
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{item.total_requests}</td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-semibold">{item.failed_requests}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={item.error_rate > 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                        {item.error_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{item.unique_endpoints}</td>
                    <td className="py-3 px-4 font-mono">
                      {item.alert_count > 0 ? (
                        <span className="text-red-600 font-bold">{item.alert_count} active</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {item.last_seen ? new Date(item.last_seen).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedIP(item)}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Inspect IP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IP Deep Inspection Modal */}
      <Modal
        isOpen={selectedIP !== null}
        onClose={() => setSelectedIP(null)}
        title={selectedIP ? `Client IP Telemetry: ${selectedIP.ip}` : 'IP Details'}
        footer={
          <button
            onClick={() => setSelectedIP(null)}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        }
      >
        {selectedIP && (
          <div className="space-y-4 text-xs">
            {/* Top Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Volume</span>
                <span className="text-base font-black text-slate-800">{selectedIP.total_requests}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Failed Requests</span>
                <span className="text-base font-black text-rose-600">{selectedIP.failed_requests}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Failure Ratio</span>
                <span className="text-base font-black text-amber-600">{selectedIP.error_rate.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Security Alerts</span>
                <span className="text-base font-black text-indigo-600">{selectedIP.alert_count}</span>
              </div>
            </div>

            {/* Behavioral Notes */}
            <div>
              <span className="font-bold text-slate-800 block mb-1">Behavioral Evidence Indicators</span>
              {selectedIP.evidence_notes.length === 0 ? (
                <p className="p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-200">
                  No abnormal indicators detected. Activity complies with regular client baseline.
                </p>
              ) : (
                <ul className="space-y-1.5 p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-900">
                  {selectedIP.evidence_notes.map((note, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Endpoints Accessed */}
            <div>
              <span className="font-bold text-slate-800 block mb-1">Endpoints Accessed</span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {selectedIP.endpoints_accessed.map((ep, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-slate-200 text-slate-700">
                    {ep}
                  </span>
                ))}
              </div>
            </div>

            {/* Associated Alerts */}
            {selectedIP.associated_alerts.length > 0 && (
              <div>
                <span className="font-bold text-slate-800 block mb-1">Triggered Security Incidents</span>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {selectedIP.associated_alerts.map((alt) => (
                    <div key={alt.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <SeverityBadge severity={alt.severity} />
                        <span className="font-semibold text-slate-800">{alt.alert_type}</span>
                      </div>
                      <StatusBadge status={alt.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
