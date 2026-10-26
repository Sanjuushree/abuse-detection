import {
  DashboardStats,
  PaginatedRequestLogs,
  PaginatedAlerts,
  Alert,
  IPDetail,
  EndpointDetail,
  MLModelStatus,
  MLAnomalyItem,
  SettingsData,
  SystemHealthData
} from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignored
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: (hours = 24): Promise<DashboardStats> =>
    fetch(`${BASE_URL}/dashboard/stats?hours=${hours}`).then(handleResponse<DashboardStats>),

  // Live Traffic
  getTrafficLogs: (params: {
    page?: number;
    page_size?: number;
    search?: string;
    method?: string;
    status_code?: number;
    status_category?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PaginatedRequestLogs> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    if (params.search) query.set('search', params.search);
    if (params.method) query.set('method', params.method);
    if (params.status_code) query.set('status_code', params.status_code.toString());
    if (params.status_category) query.set('status_category', params.status_category);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    return fetch(`${BASE_URL}/traffic?${query.toString()}`).then(handleResponse<PaginatedRequestLogs>);
  },

  // Threat Alerts
  getAlerts: (params: {
    page?: number;
    page_size?: number;
    severity?: string;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PaginatedAlerts> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    if (params.severity) query.set('severity', params.severity);
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    return fetch(`${BASE_URL}/threats?${query.toString()}`).then(handleResponse<PaginatedAlerts>);
  },

  getAlertDetail: (id: number): Promise<Alert> =>
    fetch(`${BASE_URL}/threats/${id}`).then(handleResponse<Alert>),

  updateAlertStatus: (id: number, status: 'Open' | 'Investigating' | 'Resolved'): Promise<Alert> =>
    fetch(`${BASE_URL}/threats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(handleResponse<Alert>),

  // IP Analysis
  getIPAnalysis: (search?: string, minRequests = 1): Promise<IPDetail[]> => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (minRequests) query.set('min_requests', minRequests.toString());
    return fetch(`${BASE_URL}/ip-analysis?${query.toString()}`).then(handleResponse<IPDetail[]>);
  },

  getIPDetail: (ip: string): Promise<IPDetail> =>
    fetch(`${BASE_URL}/ip-analysis/${encodeURIComponent(ip)}`).then(handleResponse<IPDetail>),

  // Endpoints
  getEndpoints: (): Promise<EndpointDetail[]> =>
    fetch(`${BASE_URL}/endpoints`).then(handleResponse<EndpointDetail[]>),

  // ML
  getMLStatus: (): Promise<MLModelStatus> =>
    fetch(`${BASE_URL}/ml/status`).then(handleResponse<MLModelStatus>),

  trainMLModel: (contamination = 0.05): Promise<{ success: boolean; message: string; metrics?: any }> =>
    fetch(`${BASE_URL}/ml/train?contamination=${contamination}`, { method: 'POST' }).then(
      handleResponse<{ success: boolean; message: string; metrics?: any }>
    ),

  getMLAnomalies: (): Promise<MLAnomalyItem[]> =>
    fetch(`${BASE_URL}/ml/anomalies`).then(handleResponse<MLAnomalyItem[]>),

  // Settings
  getSettings: (): Promise<SettingsData> =>
    fetch(`${BASE_URL}/settings`).then(handleResponse<SettingsData>),

  updateSettings: (settings: SettingsData): Promise<{ message: string }> =>
    fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(handleResponse<{ message: string }>),

  // Reports URL generators
  getRequestsCsvUrl: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);
    return `${BASE_URL}/reports/requests/csv?${query.toString()}`;
  },

  getAlertsCsvUrl: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);
    return `${BASE_URL}/reports/alerts/csv?${query.toString()}`;
  },

  // System Health
  getHealth: (): Promise<SystemHealthData> =>
    fetch(`${BASE_URL}/health`).then(handleResponse<SystemHealthData>),

  // Demo Traffic Generator
  generateDemoTraffic: (scenario = 'all_scenarios'): Promise<{
    status: string;
    scenario: string;
    logs_generated: number;
    alerts_triggered: string[];
    ml_training_result: string;
  }> =>
    fetch(`${BASE_URL}/demo/generate-traffic?scenario=${encodeURIComponent(scenario)}`, { method: 'POST' }).then(
      handleResponse<{
        status: string;
        scenario: string;
        logs_generated: number;
        alerts_triggered: string[];
        ml_training_result: string;
      }>
    ),

  // Monitored endpoint probe
  triggerSampleRequest: (endpoint: string, method = 'GET'): Promise<any> => {
    let url = endpoint;
    if (BASE_URL.startsWith('http')) {
      if (endpoint.startsWith('/api')) {
        url = BASE_URL + endpoint.slice(4);
      } else if (!endpoint.startsWith('http')) {
        url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      }
    }
    return fetch(url, { method }).then(res => res.json());
  }
};

