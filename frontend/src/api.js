import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s — clear tokens and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  // Admin-only: User management
  listUsers: () => api.get('/auth/users/'),
  createUser: (data) => api.post('/auth/users/', data),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
  // Organization
  getOrganization: () => api.get('/auth/organization/'),
  updateOrganization: (data) => api.patch('/auth/organization/', data),
};

// ── Ingestion ───────────────────────────────────────────────────
export const ingestionAPI = {
  upload: (file, sourceType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    return api.post('/ingestion/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getBatches: (params) => api.get('/ingestion/batches/', { params }),
  getBatch: (id) => api.get(`/ingestion/batches/${id}/`),
  getRawRecords: (batchId) => api.get(`/ingestion/batches/${batchId}/raw/`),
  getStats: () => api.get('/ingestion/stats/'),
  // Admin-only
  deleteBatch: (id) => api.delete(`/ingestion/batches/${id}/delete/`),
  reprocessBatch: (id) => api.post(`/ingestion/batches/${id}/reprocess/`),
};

// ── Records ─────────────────────────────────────────────────────
export const recordsAPI = {
  list: (params) => api.get('/records/', { params }),
  get: (id) => api.get(`/records/${id}/`),
  dashboard: () => api.get('/records/dashboard/'),
  // Edit normalized fields
  edit: (id, data) => api.patch(`/records/${id}/edit/`, data),
  // Admin-only: Lock/unlock
  lock: (id, locked = true) => api.post(`/records/${id}/lock/`, { locked }),
  bulkLock: (recordIds, locked = true) =>
    api.post('/records/bulk-lock/', { record_ids: recordIds, locked }),
};

// ── Validation ──────────────────────────────────────────────────
export const validationAPI = {
  getIssues: (params) => api.get('/validation/issues/', { params }),
  getRecordIssues: (recordId) =>
    api.get(`/validation/issues/${recordId}/`),
  // Admin-only: Validation rules
  listRules: () => api.get('/validation/rules/'),
  createRule: (data) => api.post('/validation/rules/', data),
  updateRule: (id, data) => api.patch(`/validation/rules/${id}/`, data),
  deleteRule: (id) => api.delete(`/validation/rules/${id}/`),
};

// ── Approvals ───────────────────────────────────────────────────
export const approvalsAPI = {
  approve: (recordId, comment = '') =>
    api.post(`/approvals/${recordId}/`, { action: 'approved', comment }),
  reject: (recordId, comment = '') =>
    api.post(`/approvals/${recordId}/`, { action: 'rejected', comment }),
  // Admin-only: bulk actions
  bulkAction: (recordIds, action, comment = '') =>
    api.post('/approvals/bulk/', { record_ids: recordIds, action, comment }),
  getHistory: (recordId) =>
    api.get(`/approvals/history/${recordId}/`),
};

// ── Audit ───────────────────────────────────────────────────────
export const auditAPI = {
  list: (params) => api.get('/audit/', { params }),
  getEntityLogs: (entityType, entityId) =>
    api.get(`/audit/${entityType}/${entityId}/`),
};

export default api;
