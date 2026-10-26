import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  FileCode2
} from 'lucide-react';
import { api } from '../api/client';
import { PaginatedAlerts, Alert } from '../api/types';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { Modal } from '../components/Modal';

export const ThreatDetection: React.FC = () => {
  const [data, setData] = useState<PaginatedAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  // Selected for modal inspection
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAlerts({
        page,
        page_size: pageSize,
        severity: severity || undefined,
        status: status || undefined,
        category: category || undefined,
        search: search.trim() || undefined
      });
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch threat alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, pageSize, severity, status, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAlerts();
  };

  const handleStatusChange = async (alertId: number, newStatus: 'Open' | 'Investigating' | 'Resolved') => {
    setUpdatingId(alertId);
    setActionMessage(null);
    try {
      const updated = await api.updateAlertStatus(alertId, newStatus);
      setActionMessage(`Alert #${alertId} updated to ${newStatus}.`);
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(updated);
      }
      fetchAlerts();
    } catch (e: any) {
      setActionMessage(`Update error: ${e.message}`);
    } finally {
      setUpdatingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Threat Detection & Forensic Signals</h2>
          <p className="text-sm text-slate-500">
            Explainable rule-based pattern indicators and anomaly alarms with verifiable evidence.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Threats
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">Security Note:</span> Suspicious activity is an indicator of abnormal behavior,
          not conclusive proof of an attack. Alerts provide transparent reasoning and raw evidence for forensic analysts.
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert reason, IP, or endpoint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
            />
          </div>
        </form>

        {/* Severity */}
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

        {/* Status */}
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

        {/* Category */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-500">Engine:</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Engines</option>
            <option value="Rule-Based">Rule-Based</option>
            <option value="ML-Based">ML-Based</option>
          </select>
        </div>
      </div>

      {/* Main Alerts Feed */}
      {error ? (
        <ErrorState message={error} onRetry={fetchAlerts} />
      ) : !data || data.alerts.length === 0 ? (
        <EmptyState
          title="No Threat Signals Detected"
          description="The detection engine has not triggered any active security alerts matching the current filters. Generate simulated abuse traffic to observe real-time detection."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSeverity('');
            setStatus('');
            setCategory('');
            setPage(1);
          }}
          onGenerateTraffic={async () => {
            await api.generateDemoTraffic('brute_force');
            fetchAlerts();
          }}
        />
      ) : (
        <div className="space-y-3">
          {data.alerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {alert.category}
                  </span>
                  <StatusBadge status={alert.status} />
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800 leading-snug">{alert.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                  <span className="font-mono">Source IP: <strong className="text-slate-700">{alert.source_ip}</strong></span>
                  {alert.related_endpoint && (
                    <span className="font-mono">Endpoint: <strong className="text-slate-700">{alert.related_endpoint}</strong></span>
                  )}
                  <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Inspect Evidence
                </button>

                {alert.status === 'Open' && (
                  <button
                    onClick={() => handleStatusChange(alert.id, 'Investigating')}
                    disabled={updatingId === alert.id}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Investigate
                  </button>
                )}

                {alert.status !== 'Resolved' && (
                  <button
                    onClick={() => handleStatusChange(alert.id, 'Resolved')}
                    disabled={updatingId === alert.id}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <span className="font-semibold text-slate-800">{data.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{data.total_pages}</span> ({data.total} threat signals)
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

      {/* Forensic Modal Inspection */}
      <Modal
        isOpen={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert ? `Forensic Audit: #${selectedAlert.id} - ${selectedAlert.alert_type}` : 'Alert'}
        footer={
          selectedAlert && (
            <div className="flex items-center space-x-2 w-full justify-between">
              <div className="flex items-center space-x-2">
                {selectedAlert.status !== 'Investigating' && (
                  <button
                    onClick={() => handleStatusChange(selectedAlert.id, 'Investigating')}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    Mark as Investigating
                  </button>
                )}
                {selectedAlert.status !== 'Resolved' && (
                  <button
                    onClick={() => handleStatusChange(selectedAlert.id, 'Resolved')}
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
            {/* Top metadata table */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Severity</span>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Engine Category</span>
                <span className="font-semibold text-slate-800">{selectedAlert.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Client IP Source</span>
                <span className="font-mono font-semibold text-slate-900">{selectedAlert.source_ip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Investigation Status</span>
                <StatusBadge status={selectedAlert.status} />
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Associated Target Endpoint</span>
                <span className="font-mono text-slate-800">{selectedAlert.related_endpoint || 'Multiple/General'}</span>
              </div>
            </div>

            {/* Human Reason */}
            <div>
              <span className="font-bold text-slate-900 block mb-1">Explainable Detection Reasoning</span>
              <p className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 leading-relaxed font-sans">
                {selectedAlert.detection_reason}
              </p>
            </div>

            {/* Forensic JSON Evidence */}
            {selectedAlert.evidence && (
              <div>
                <span className="font-bold text-slate-900 block mb-1">Supporting Technical Telemetry (Evidence)</span>
                <pre className="p-3.5 bg-[#0A0F1D] text-cyan-300 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
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
