import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Detect IP of the computer running the dev server
export function getDetectedHostIp() {
  try {
    const hostUri = Constants.expoConfig?.hostUri 
      || Constants.manifest2?.extra?.expoGo?.debuggerHost
      || Constants.manifest?.debuggerHost
      || '';
    
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {
    console.log('Error detecting host IP:', e);
  }
  return process.env.EXPO_PUBLIC_API_HOST || 'localhost'; // Configurable host fallback
}

let cachedBaseUrl = null;

export async function getApiBaseUrl() {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const saved = await AsyncStorage.getItem('grievancegrid_api_url');
    if (saved) {
      cachedBaseUrl = saved;
      return saved;
    }
  } catch (e) {}

  if (process.env.EXPO_PUBLIC_API_URL) {
    cachedBaseUrl = process.env.EXPO_PUBLIC_API_URL;
    return cachedBaseUrl;
  }

  const detected = getDetectedHostIp();
  // Single authoritative FastAPI backend runs on port 8000
  cachedBaseUrl = `http://${detected}:8000/api`;
  return cachedBaseUrl;
}

export async function setApiBaseUrl(newUrl) {
  cachedBaseUrl = newUrl;
  await AsyncStorage.setItem('grievancegrid_api_url', newUrl);
}

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const token = await AsyncStorage.getItem('grievancegrid_token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${baseUrl}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.detail || data.error || data.message || `HTTP ${res.status}: ${res.statusText}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    console.warn(`Mobile API Error on ${url}:`, err);
    throw err;
  }
}

export const mobileApi = {
  login: (credentials) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  getComplaints: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/complaints${qs}`);
  },
  getComplaint: (id) => apiRequest(`/complaints/${id}`),
  createComplaint: (data) =>
    apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  uploadEvidence: async (fileUri, fileName, mimeType = 'image/jpeg') => {
    const baseUrl = await getApiBaseUrl();
    const token = await AsyncStorage.getItem('grievancegrid_token');
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName || 'photo.jpg',
      type: mimeType,
    });
    
    // In React Native fetch, do NOT set Content-Type header manually for multipart/form-data;
    // omitting it allows the runtime to set the multipart boundary automatically.
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/evidence/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.error || `Upload failed with status ${res.status}`);
    }
    return data;
  },
  forgotPassword: (contact) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: contact, contact }),
    }),
  verifyOtp: (contact, code) =>
    apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ contact, email: contact, code }),
    }),
  resetPassword: (contact, resetToken, newPassword) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ contact, email: contact, resetToken, newPassword }),
    }),
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  submitFeedback: (complaintId, data) =>
    apiRequest(`/complaints/${complaintId}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  submitAppeal: (complaintId, data) =>
    apiRequest(`/complaints/${complaintId}/appeal`, { method: 'POST', body: JSON.stringify(data) }),
  getWorkOrders: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/work-orders${qs}`);
  },
  updateWorkOrder: (id, data) =>
    apiRequest(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  completeWorkOrder: (id, data) =>
    apiRequest(`/work-orders/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  submitOfficerDecision: (complaintId, data) =>
    apiRequest(`/complaints/${complaintId}/decision`, { method: 'POST', body: JSON.stringify(data) }),
};

