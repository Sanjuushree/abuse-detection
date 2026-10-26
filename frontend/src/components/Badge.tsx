import React from 'react';

interface SeverityBadgeProps {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  switch (severity) {
    case 'Critical':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-600 animate-pulse"></span>
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600"></span>
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-600"></span>
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Low
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: 'Open' | 'Investigating' | 'Resolved' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          Open
        </span>
      );
    case 'Investigating':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Investigating
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Resolved
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};

export const HttpStatusBadge: React.FC<{ code: number }> = ({ code }) => {
  if (code >= 200 && code < 300) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        {code}
      </span>
    );
  } else if (code >= 300 && code < 400) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
        {code}
      </span>
    );
  } else if (code >= 400 && code < 500) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
        {code}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-red-50 text-red-700 border border-red-200">
        {code}
      </span>
    );
  }
};

export const HttpMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const m = method.toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (m === 'GET') color = 'bg-sky-50 text-sky-700 border-sky-200';
  if (m === 'POST') color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (m === 'PUT') color = 'bg-amber-50 text-amber-700 border-amber-200';
  if (m === 'DELETE') color = 'bg-rose-50 text-rose-700 border-rose-200';
  if (m === 'PATCH') color = 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${color}`}>
      {m}
    </span>
  );
};
