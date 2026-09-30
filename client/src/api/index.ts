const API_BASE = '/api';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('grievancegrid_token');
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to JSON content-type
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
    }

    return data as T;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) => 
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  
  register: (data: any) => 
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  
  getMe: () => 
    apiRequest('/auth/me'),

  forgotPassword: (email: string) => 
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (data: any) => 
    apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Reference
  getDepartments: () => apiRequest('/departments'),
  getJurisdictions: () => apiRequest('/jurisdictions'),
  getFieldWorkers: () => apiRequest('/field-workers'),
  getSlaConfigs: () => apiRequest('/sla-configs'),

  // Complaints
  getComplaints: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/complaints${qs}`);
  },

  getComplaint: (id: string) => apiRequest(`/complaints/${id}`),

  createComplaint: (data: any) => 
    apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) }),

  triageComplaint: (id: string, data: { department_id: string; priority?: string; deadline?: string }) =>
    apiRequest(`/complaints/${id}/triage`, { method: 'PUT', body: JSON.stringify(data) }),

  createWorkOrder: (complaintId: string, data: any) =>
    apiRequest(`/complaints/${complaintId}/work-orders`, { method: 'POST', body: JSON.stringify(data) }),

  resolveComplaint: (id: string, data: { resolution_notes?: string }) =>
    apiRequest(`/complaints/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  submitFeedback: (complaintId: string, data: { rating: number; comments?: string }) =>
    apiRequest(`/complaints/${complaintId}/feedback`, { method: 'POST', body: JSON.stringify(data) }),

  submitAppeal: (complaintId: string, data: { reason: string }) =>
    apiRequest(`/complaints/${complaintId}/appeal`, { method: 'POST', body: JSON.stringify(data) }),

  reviewAppeal: (appealId: string, data: { status: 'REOPENED' | 'REJECTED'; officer_notes?: string }) =>
    apiRequest(`/appeals/${appealId}/review`, { method: 'PUT', body: JSON.stringify(data) }),

  // Work Orders
  getWorkOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/work-orders${qs}`);
  },

  getWorkOrder: (id: string) => apiRequest(`/work-orders/${id}`),

  startWorkOrder: (id: string) => 
    apiRequest(`/work-orders/${id}/start`, { method: 'PUT' }),

  updateWorkOrder: (id: string, remarks: string) =>
    apiRequest(`/work-orders/${id}/updates`, { method: 'POST', body: JSON.stringify({ remarks }) }),

  completeWorkOrder: (id: string, data: { remarks: string; evidence_files?: any[] }) =>
    apiRequest(`/work-orders/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  verifyWorkOrder: (id: string, data: { decision: 'VERIFY' | 'RETURN'; notes?: string }) =>
    apiRequest(`/work-orders/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),

  // Evidence Upload
  uploadEvidence: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/evidence/upload', { method: 'POST', body: formData });
  },

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),

  // Audit
  getAuditEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/audit${qs}`);
  },

  // Dashboard stats
  getDashboardStats: () => apiRequest('/dashboard/stats'),
};
