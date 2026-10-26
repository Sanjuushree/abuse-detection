export interface RequestLog {
  id: number;
  timestamp: string;
  endpoint: string;
  method: string;
  client_ip: string;
  status_code: number;
  duration_ms: number;
  user_agent?: string;
  request_size?: number;
}

export interface PaginatedRequestLogs {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: RequestLog[];
}

export interface Alert {
  id: number;
  timestamp: string;
  alert_type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  description: string;
  source_ip: string;
  related_endpoint?: string;
  detection_reason: string;
  evidence?: string;
  status: 'Open' | 'Investigating' | 'Resolved';
}

export interface PaginatedAlerts {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  alerts: Alert[];
}

export interface DashboardOverview {
  total_requests: number;
  suspicious_requests: number;
  failed_requests: number;
  open_alerts: number;
  api_health: string;
  avg_latency_ms: number;
}

export interface TimeSeriesPoint {
  time: string;
  total: number;
  failed: number;
  suspicious: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
  percentage: number;
}

export interface DashboardStats {
  overview: DashboardOverview;
  traffic_over_time: TimeSeriesPoint[];
  status_distribution: DistributionPoint[];
  method_distribution: DistributionPoint[];
  recent_logs: RequestLog[];
  recent_alerts: Alert[];
}

export interface IPDetail {
  ip: string;
  total_requests: number;
  failed_requests: number;
  error_rate: number;
  first_seen?: string;
  last_seen?: string;
  unique_endpoints: number;
  endpoints_accessed: string[];
  alert_count: number;
  associated_alerts: Alert[];
  is_suspicious: boolean;
  evidence_notes: string[];
}

export interface EndpointDetail {
  endpoint: string;
  total_requests: number;
  error_count: number;
  error_rate: number;
  avg_duration_ms: number;
  method_counts: Record<string, number>;
  last_accessed?: string;
  status_distribution: Record<string, number>;
}

export interface MLModelStatus {
  is_trained: boolean;
  last_trained?: string;
  sample_count: number;
  anomaly_count: number;
  contamination: number;
  message: string;
  feature_names: string[];
  evaluation_metrics?: {
    model_type: string;
    n_estimators: number;
    configured_contamination: number;
    total_behavior_samples: number;
    detected_outliers_count: number;
    outlier_percentage: number;
    mean_decision_score: number;
    min_decision_score: number;
    max_decision_score: number;
    evaluation_note: string;
  };
}

export interface MLAnomalyItem {
  source_ip: string;
  anomaly_score: number;
  is_anomaly: boolean;
  features: Record<string, number>;
  explanation: string;
}

export interface SettingsData {
  rate_limit_threshold: number;
  rate_limit_window_seconds: number;
  failed_auth_threshold: number;
  failed_auth_window_seconds: number;
  scanning_404_threshold: number;
  scanning_window_seconds: number;
  error_spike_threshold: number;
  error_spike_window_seconds: number;
  alert_cooldown_seconds: number;
  ml_anomaly_contamination: number;
}

export interface SystemHealthData {
  status: string;
  backend_status: string;
  database_status: string;
  version: string;
  model_status: string;
  total_request_logs: number;
  total_alerts: number;
  active_rules_count: number;
}
