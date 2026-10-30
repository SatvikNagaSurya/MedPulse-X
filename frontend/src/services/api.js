import axios from 'axios';

// Read token directly from localStorage to avoid a circular import with auth.js
// (auth.js → api.js → auth.js would cause one module to be undefined at init time)
const getStoredToken = () => localStorage.getItem('medpulsex_token');

// ── Axios instance ────────────────────────────────────────────────────────────
// Uses an explicit absolute URL so requests always reach the backend whether
// the app is running in dev (Vite :3000) or production.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // set true only if using cookie-based sessions
});

// ── Request interceptor: attach JWT on every outgoing call ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Token expired or invalid – clear storage and redirect to login
      localStorage.removeItem('medpulsex_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Medical / Reports ─────────────────────────────────────────────────────────

/**
 * Parse a raw lab report TEXT and return extracted biomarkers + AI safety analysis.
 * @param {string} userId
 * @param {string} reportText
 * @returns {Promise<{ biomarkers: Array, safetyAnalysis: string }>}
 */
export const parseReport = (userId, reportText) =>
  api.post('/medical/parse-report', { userId, reportText }).then((r) => r.data);

/**
 * Upload a lab report FILE (PDF / JPEG / PNG) for Gemini AI analysis.
 * Uses multipart/form-data — Content-Type is set automatically by the browser.
 * @param {string} userId
 * @param {File} file  — a File object from an <input type="file">
 * @returns {Promise<{ biomarkers: Array, safetyAnalysis: string }>}
 */
export const parseReportFile = (userId, file) => {
  const form = new FormData();
  form.append('userId', userId);
  form.append('file', file);
  // Do NOT set Content-Type manually — Axios + FormData set the boundary automatically
  return api.post('/medical/parse-report', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// ── Health check ──────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health').then((r) => r.data);

export default api;
