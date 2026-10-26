import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Cpu,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Activity,
  Zap
} from 'lucide-react';
import { api } from '../api/client';
import { MLModelStatus, MLAnomalyItem } from '../api/types';
import { EmptyState, ErrorState } from '../components/EmptyState';

export const MLAnalytics: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<MLModelStatus | null>(null);
  const [anomalies, setAnomalies] = useState<MLAnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contamination, setContamination] = useState(0.05);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadMLData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await api.getMLStatus();
      setModelStatus(statusRes);
      if (statusRes.is_trained) {
        const anomaliesRes = await api.getMLAnomalies();
        setAnomalies(anomaliesRes);
      } else {
        setAnomalies([]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch ML analytics state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMLData();
  }, []);

  const handleTrainModel = async () => {
    setTraining(true);
    setFeedbackMessage(null);
    try {
      const res = await api.trainMLModel(contamination);
      setFeedbackMessage(res.message);
      await loadMLData();
    } catch (e: any) {
      setFeedbackMessage(`Training halted: ${e.message}`);
    } finally {
      setTraining(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Machine Learning Behavioral Analytics</h2>
          <p className="text-sm text-slate-500">
            Unsupervised Isolation Forest anomaly detection based on multivariate client behavioral feature profiles.
          </p>
        </div>

        <button
          onClick={loadMLData}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Model State
        </button>
      </div>

      {/* Honest Scientific Methodology Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
          <BrainCircuit className="w-4 h-4" />
          <span>Scientific ML Anomaly Methodology</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          This subsystem utilizes an <strong className="text-slate-200">Isolation Forest</strong> algorithm to detect multivariate behavioral outliers in request patterns (e.g. abnormal failure ratios, burst rates, route diversity).
          Anomaly scores measure deviation from empirical baseline clusters; they are <span className="text-amber-400 font-medium">statistical indicators</span> and not deterministic attack classifications.
          No synthetic ground truth or artificial 100% accuracy claims are fabricated.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium flex items-center shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 mr-2 text-cyan-600" />
          {feedbackMessage}
        </div>
      )}

      {/* Model Status Card & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <span>Isolation Forest Engine Status</span>
            </h3>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                modelStatus?.is_trained
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {modelStatus?.is_trained ? 'Active & Trained' : 'Awaiting Training'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {modelStatus?.message || 'Inspecting model state...'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Client Profiles</span>
              <span className="text-lg font-black text-slate-800">{modelStatus?.sample_count ?? 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Outliers Detected</span>
              <span className="text-lg font-black text-amber-600">{modelStatus?.anomaly_count ?? 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contamination Rate</span>
              <span className="text-lg font-black text-slate-800">
                {modelStatus ? `${(modelStatus.contamination * 100).toFixed(0)}%` : '5%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Evaluation</span>
              <span className="text-xs font-medium text-slate-700 block truncate">
                {modelStatus?.last_trained ? new Date(modelStatus.last_trained).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          {/* Model Features Extracted */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Extracted Multivariate Feature Vector
            </span>
            <div className="flex flex-wrap gap-2">
              {modelStatus?.feature_names.map((feat) => (
                <span
                  key={feat}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-cyan-50/70 text-cyan-800 border border-cyan-200"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Model Retraining Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-1">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Hyperparameter Tuning</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure expected outlier contamination ratio and trigger retraining on the current SQLite request dataset.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Contamination: {(contamination * 100).toFixed(1)}%</span>
                  <span className="text-slate-400 font-normal">Range: 1% - 50%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={contamination}
                  onChange={(e) => setContamination(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                Controls the proportion of expected anomalous behavior vectors within the unsupervised feature distribution.
              </p>
            </div>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-cyan-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          >
            {training ? 'Training Estimator...' : 'Train / Retrain Isolation Forest'}
          </button>
        </div>
      </div>

      {/* Evaluation Metrics (Displayed only when calculated) */}
      {modelStatus?.evaluation_metrics && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">Unsupervised Decision Distribution Metrics</h3>
          </div>

          <p className="text-xs text-slate-500 leading-snug">
            {modelStatus.evaluation_metrics.evaluation_note}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Type</span>
              <span className="text-xs font-bold text-slate-800">IsolationForest</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimators</span>
              <span className="text-xs font-bold text-slate-800">100 Trees</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Outlier Proportion</span>
              <span className="text-xs font-bold text-amber-600">{modelStatus.evaluation_metrics.outlier_percentage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mean Score</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{modelStatus.evaluation_metrics.mean_decision_score}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Min Score (Outlier)</span>
              <span className="text-xs font-bold text-rose-600 font-mono">{modelStatus.evaluation_metrics.min_decision_score}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Score (Inlier)</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">{modelStatus.evaluation_metrics.max_decision_score}</span>
            </div>
          </div>
        </div>
      )}

      {/* Evaluated Behavioral Anomaly Profiles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Evaluated Client Behavior Profiles</h3>
            <p className="text-xs text-slate-500">Unsupervised anomaly scores across active client IPs</p>
          </div>
        </div>

        {anomalies.length === 0 ? (
          <EmptyState
            title="Insufficient Training Data"
            description="At least 5 distinct client IP behavioral profiles are needed to fit the unsupervised Isolation Forest. Generate simulated traffic or send real requests to train the model."
            actionLabel="Generate Traffic Profiles"
            onAction={async () => {
              await api.generateDemoTraffic('all_scenarios');
              await loadMLData();
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4">Anomaly Flag</th>
                  <th className="py-3 px-4">Anomaly Index</th>
                  <th className="py-3 px-4">Total Reqs</th>
                  <th className="py-3 px-4">Error Ratio</th>
                  <th className="py-3 px-4">Endpoints</th>
                  <th className="py-3 px-4">Avg Latency</th>
                  <th className="py-3 px-4">Behavioral Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {anomalies.map((item) => (
                  <tr key={item.source_ip} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.source_ip}</td>
                    <td className="py-3 px-4">
                      {item.is_anomaly ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                          Outlier Anomaly
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Baseline Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span className={item.is_anomaly ? 'text-red-600' : 'text-slate-600'}>
                        {item.anomaly_score.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{item.features.total_requests}</td>
                    <td className="py-3 px-4 font-mono">
                      {(item.features.failed_request_ratio * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono">{item.features.unique_endpoints_count}</td>
                    <td className="py-3 px-4 font-mono">{item.features.avg_latency_ms.toFixed(1)} ms</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-sm">{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
