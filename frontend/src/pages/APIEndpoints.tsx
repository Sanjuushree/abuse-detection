import React, { useState, useEffect } from 'react';
import {
  Waypoints,
  RefreshCw,
  Clock,
  AlertTriangle,
  Play,
  CheckCircle2,
  Send
} from 'lucide-react';
import { api } from '../api/client';
import { EndpointDetail } from '../api/types';
import { HttpMethodBadge } from '../components/Badge';
import { EmptyState, ErrorState } from '../components/EmptyState';

export const APIEndpoints: React.FC = () => {
  const [endpoints, setEndpoints] = useState<EndpointDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  const fetchEndpoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEndpoints();
      setEndpoints(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load endpoint analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleProbe = async (route: string, method = 'GET') => {
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await api.triggerSampleRequest(route, method);
      setProbeResult(`Probed ${method} ${route} -> Status: ${res.status || 'OK'}`);
      await fetchEndpoints();
    } catch (e: any) {
      setProbeResult(`Probe sent to ${route}: ${e.message}`);
      await fetchEndpoints();
    } finally {
      setProbing(false);
      setTimeout(() => setProbeResult(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">API Endpoint Behavioral Analytics</h2>
          <p className="text-sm text-slate-500">
            Per-route request distribution, latency profiling, and error breakdown across instrumented APIs.
          </p>
        </div>

        <button
          onClick={fetchEndpoints}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Endpoints
        </button>
      </div>

      {probeResult && (
        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium flex items-center shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 mr-2 text-cyan-600" />
          {probeResult}
        </div>
      )}

      {/* Monitored Sample Test Suite Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Live Monitored Route Playground</span>
            </h3>
            <p className="text-xs text-slate-300">
              Fire instant test calls directly against API Sentinel's instrumented backend routes to watch traffic register in real time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleProbe('/api/demo/resource', 'GET')}
            disabled={probing}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-400 transition-colors disabled:opacity-50"
          >
            GET /api/demo/resource (200 OK)
          </button>
          <button
            onClick={() => handleProbe('/api/demo/error-test', 'GET')}
            disabled={probing}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 border border-slate-600 text-red-400 transition-colors disabled:opacity-50"
          >
            GET /api/demo/error-test (500 Error)
          </button>
          <button
            onClick={() => handleProbe('/api/health', 'GET')}
            disabled={probing}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-400 transition-colors disabled:opacity-50"
          >
            GET /api/health
          </button>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchEndpoints} />
      ) : endpoints.length === 0 ? (
        <EmptyState
          title="No Endpoint Data Recorded"
          description="Send requests to monitored endpoints or generate traffic to view endpoint latency and error analytics."
          actionLabel="Generate Traffic"
          onAction={async () => {
            await api.generateDemoTraffic('normal');
            fetchEndpoints();
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Endpoint Path</th>
                  <th className="py-3 px-4">Total Requests</th>
                  <th className="py-3 px-4">Error Rate</th>
                  <th className="py-3 px-4">Avg Duration</th>
                  <th className="py-3 px-4">Observed Methods</th>
                  <th className="py-3 px-4">Last Accessed</th>
                  <th className="py-3 px-4 text-right">Interactive Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {endpoints.map((ep) => (
                  <tr key={ep.endpoint} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{ep.endpoint}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{ep.total_requests}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={ep.error_rate > 25 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {ep.error_rate.toFixed(1)}% ({ep.error_count} errors)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{ep.avg_duration_ms} ms</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(ep.method_counts).map(([method, cnt]) => (
                          <span
                            key={method}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {method} ({cnt})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {ep.last_accessed ? new Date(ep.last_accessed).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ep.endpoint.startsWith('/api') && (
                        <button
                          onClick={() => handleProbe(ep.endpoint, 'GET')}
                          disabled={probing}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Probe Route
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
