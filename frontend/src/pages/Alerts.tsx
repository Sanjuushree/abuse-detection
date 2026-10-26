import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { PaginatedAlerts, Alert } from '../api/types';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Modal } from '../components/Modal';

export const Alerts: React.FC = () => {
  const [data, setData] = useState<PaginatedAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Selected Alert for Details Modal
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAlerts({
        page,
        page_size: pageSize,
        severity: severity || undefined,
        status: status || undefined,
        search: search.trim() || undefined
      });
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to retrieve alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, pageSize, severity, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAlerts();
  };

  const handleUpdateStatus = async (alertId: number, newStatus: 'Open' | 'Investigating' | 'Resolved') => {
    setActionLoadingId(alertId);
    setActionNotification(null);
    try {
      const updated = await api.updateAlertStatus(alertId, newStatus);
      setActionNotification(`Alert #${alertId} status changed to ${newStatus}.`);
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(updated);
      }
      fetchAlerts();
    } catch (e: any) {
      setActionNotification(`Error updating alert: ${e.message}`);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Incident & Alert Management</h2>
          <p className="text-sm text-slate-500">
            Triage, investigate, and resolve security alerts with audit status tracking stored in SQLite.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Incident Log
        </button>
      </div>

      {actionNotification && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
          {actionNotification}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert by reason, IP, or endpoint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
            />
          </div>
        </form>

        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-500">Severity:</span>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Alerts Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchAlerts} />
      ) : !data || data.alerts.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description="There are currently no security alerts matching your filter criteria. Generate test traffic or clear filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSeverity('');
            setStatus('');
            setPage(1);
          }}
          onGenerateTraffic={async () => {
            await api.generateDemoTraffic('brute_force');
            fetchAlerts();
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Target Endpoint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{alert.id}</td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{alert.source_ip}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 max-w-xs truncate" title={alert.related_endpoint}>
                      {alert.related_endpoint || 'General'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors"
                      >
                        Inspect
                      </button>

                      {alert.status === 'Open' && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'Investigating')}
                          disabled={actionLoadingId === alert.id}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Investigate
                        </button>
                      )}

                      {alert.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'Resolved')}
                          disabled={actionLoadingId === alert.id}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Page <span className="font-semibold text-slate-800">{data.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{data.total_pages}</span> ({data.total} recorded incidents)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </button>

              <button
                onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                disabled={page >= data.total_pages}
                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert ? `Incident Case: #${selectedAlert.id} (${selectedAlert.alert_type})` : 'Incident Details'}
        footer={
          selectedAlert && (
            <div className="flex items-center space-x-2 w-full justify-between">
              <div className="flex items-center space-x-2">
                {selectedAlert.status !== 'Investigating' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Investigating')}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    Mark as Investigating
                  </button>
                )}
                {selectedAlert.status !== 'Resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.id, 'Resolved')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )
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
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <StatusBadge status={selectedAlert.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Source IP</span>
                <span className="font-mono text-slate-900">{selectedAlert.source_ip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Recorded At</span>
                <span className="text-slate-700">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Human-Readable Reason</span>
              <p className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-slate-800 leading-relaxed">
                {selectedAlert.detection_reason}
              </p>
            </div>

            {selectedAlert.evidence && (
              <div>
                <span className="font-bold text-slate-800 block mb-1">Technical Forensic Evidence</span>
                <pre className="p-3.5 bg-slate-900 text-cyan-300 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
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
