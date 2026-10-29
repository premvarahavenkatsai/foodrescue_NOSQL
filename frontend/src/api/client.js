const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('foodrescue_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.details && data.details.join(', ')) || `HTTP ${response.status} Error`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiRequest('/auth/me'),

  // Donations
  getDonations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/donations${query ? `?${query}` : ''}`);
  },
  getDonationById: (id) => apiRequest(`/donations/${id}`),
  createDonation: (data) => apiRequest('/donations', { method: 'POST', body: JSON.stringify(data) }),
  updateDonation: (id, data) => apiRequest(`/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelDonation: (id) => apiRequest(`/donations/${id}`, { method: 'DELETE' }),
  getMyDonations: () => apiRequest('/donations/my-donations'),

  // Requests
  createRequest: (data) => apiRequest('/requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyRequests: () => apiRequest('/requests/my-requests'),
  reviewRequest: (id, action) => apiRequest(`/requests/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Deliveries
  getAvailableTasks: () => apiRequest('/deliveries/available-tasks'),
  acceptTask: (id) => apiRequest(`/deliveries/${id}/accept`, { method: 'POST' }),
  pickupTask: (id) => apiRequest(`/deliveries/${id}/pickup`, { method: 'POST' }),
  confirmReceipt: (id) => apiRequest(`/deliveries/${id}/confirm-receipt`, { method: 'POST' }),
  getMyTasks: () => apiRequest('/deliveries/my-tasks'),

  // Analytics
  getKpis: () => apiRequest('/analytics/kpis'),
  getRescuedTrend: (groupBy = 'day') => apiRequest(`/analytics/rescued-trend?groupBy=${groupBy}`),
  getDonorContributions: () => apiRequest('/analytics/donor-contributions'),
  getLeaderboard: (limit = 10) => apiRequest(`/analytics/leaderboard?limit=${limit}`),
  getVolunteerStats: () => apiRequest('/analytics/volunteer-stats'),
  getCategoryBreakdown: () => apiRequest('/analytics/category-breakdown'),
  getNgoFulfillment: () => apiRequest('/analytics/ngo-fulfillment'),
  getCertificate: (volunteerId) => apiRequest(`/analytics/certificate/${volunteerId}`),

  // Admin
  getAdminUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${q ? `?${q}` : ''}`);
  },
  toggleUserStatus: (id, isActive) => apiRequest(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
  getAdminOrganizations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/organizations${q ? `?${q}` : ''}`);
  },
  verifyOrganization: (id, verificationStatus) => apiRequest(`/admin/organizations/${id}/verify`, { method: 'PUT', body: JSON.stringify({ verificationStatus }) }),
  getAdminDonations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/donations${q ? `?${q}` : ''}`);
  },

  // User Profile
  getProfile: () => apiRequest('/users/profile'),
  updateProfile: (data) => apiRequest('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateVolunteerProfile: (data) => apiRequest('/users/volunteer-profile', { method: 'PUT', body: JSON.stringify(data) }),
};
