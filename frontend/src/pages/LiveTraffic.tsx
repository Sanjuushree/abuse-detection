import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Laptop
} from 'lucide-react';
import { api } from '../api/client';
import { PaginatedRequestLogs, RequestLog } from '../api/types';
import { HttpStatusBadge, HttpMethodBadge } from '../components/Badge';
import { EmptyState, ErrorState } from '../components/EmptyState';

export const LiveTraffic: React.FC = () => {
  const [data, setData] = useState<PaginatedRequestLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [statusCategory, setStatusCategory] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTrafficLogs({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        method: method || undefined,
        status_category: statusCategory || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to retrieve traffic telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, method, statusCategory, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live API Traffic Telemetry</h2>
          <p className="text-sm text-slate-500">
            Real-time inspection of API requests passing through the instrumented Sentinel gateway.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log Stream
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by endpoint path or client IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
            />
          </div>
        </form>

        {/* Method Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-500">Method:</span>
          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        {/* Status Category Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusCategory}
            onChange={(e) => {
              setStatusCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="2xx">2xx Success</option>
            <option value="3xx">3xx Redirection</option>
            <option value="4xx">4xx Client Errors</option>
            <option value="5xx">5xx Server Errors</option>
          </select>
        </div>

        {/* Page size */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-500">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : !data || data.logs.length === 0 ? (
        <EmptyState
          title="No Matching Request Logs"
          description="There are currently no request logs matching the selected filters. Clear your filters or send new requests to monitored endpoints."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setMethod('');
            setStatusCategory('');
            setPage(1);
          }}
          onGenerateTraffic={async () => {
            await api.generateDemoTraffic('normal');
            fetchLogs();
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('timestamp')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Timestamp (UTC)</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('method')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Method</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('endpoint')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Monitored Endpoint</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status_code')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('client_ip')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client IP</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('duration_ms')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Duration</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3 px-4">User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.logs.map((log: RequestLog) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <HttpMethodBadge method={log.method} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-medium">
                      {log.endpoint}
                    </td>
                    <td className="py-3 px-4">
                      <HttpStatusBadge code={log.status_code} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                      {log.client_ip}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-500">
                      {log.duration_ms} ms
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={log.user_agent}>
                      {log.user_agent || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <span className="font-semibold text-slate-800">{data.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{data.total_pages}</span> ({data.total} total requests)
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
    </div>
  );
};
