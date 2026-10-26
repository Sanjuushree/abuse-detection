import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';

export const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleDownloadLogs = () => {
    try {
      const url = api.getRequestsCsvUrl(startDate || undefined, endDate || undefined);
      // Trigger native browser download
      window.open(url, '_blank');
      setIsError(false);
      setDownloadStatus('Request log CSV export initiated successfully.');
    } catch (e: any) {
      setIsError(true);
      setDownloadStatus(`Export error: ${e.message}`);
    }
    setTimeout(() => setDownloadStatus(null), 5000);
  };

  const handleDownloadAlerts = () => {
    try {
      const url = api.getAlertsCsvUrl(startDate || undefined, endDate || undefined);
      // Trigger native browser download
      window.open(url, '_blank');
      setIsError(false);
      setDownloadStatus('Threat alerts CSV export initiated successfully.');
    } catch (e: any) {
      setIsError(true);
      setDownloadStatus(`Export error: ${e.message}`);
    }
    setTimeout(() => setDownloadStatus(null), 5000);
  };

  const handleResetDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Forensic Audit Reports & Data Export</h2>
        <p className="text-sm text-slate-500">
          Generate structured CSV audit trails for compliance reporting, forensic investigations, and offline data analysis.
        </p>
      </div>

      {downloadStatus && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center shadow-xs animate-fade-in ${
            isError ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4 mr-2 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          )}
          {downloadStatus}
        </div>
      )}

      {/* Date Filter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-cyan-600" />
          <h3 className="text-base font-bold text-slate-900">Report Scope & Time Filtering</h3>
        </div>
        <p className="text-xs text-slate-500">
          Optionally restrict the export time window. Leave dates blank to export all stored historical telemetry.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date (UTC)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 bg-slate-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">End Date (UTC)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 bg-slate-50"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetDates}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Logs CSV */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Request Telemetry Audit Log</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export every recorded API call with timestamp, method, endpoint, status code, response duration in ms, and client IP.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadLogs}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Request Logs (.CSV)
            </button>
          </div>
        </div>

        {/* Security Alerts CSV */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Security Threats & Incidents Report</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export complete security alerts with severities, detection reasoning, forensic evidence summary, and resolution statuses.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadAlerts}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Threat Alerts (.CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
