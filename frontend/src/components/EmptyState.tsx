import React from 'react';
import { Database, AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onGenerateTraffic?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  onGenerateTraffic
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl my-6">
      <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-4 shadow-sm">
        <Database className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onGenerateTraffic && (
          <button
            onClick={onGenerateTraffic}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate Sample Traffic
          </button>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 border border-rose-200 rounded-xl my-4">
      <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
      <h4 className="text-base font-semibold text-rose-900 mb-1">Failed to load data</h4>
      <p className="text-sm text-rose-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-rose-800 bg-white border border-rose-300 hover:bg-rose-50 rounded-md shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
};
