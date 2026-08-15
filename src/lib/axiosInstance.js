import axios from 'axios';

// Set VITE_API_URL per environment (.env.local for dev, project settings on the
// host for production). Never hardcode a tunnel or laptop URL here — it becomes
// a single point of failure for the deployed site.
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error(
    'VITE_API_URL is not set — this production build is pointing at localhost and every API call will fail.'
  );
}

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (e.g., add auth token)
axiosInstance.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem('amc_catalyst_token');
    if (raw) {
      const token = JSON.parse(raw);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // A rejected sign-in is a 401 the page handles itself — redirecting here
    // would reload it and swallow the "wrong password" message.
    const isAuthAttempt = /\/auth\/(login|register)$/.test(error.config?.url ?? '');

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem('amc_catalyst_token');
      localStorage.removeItem('amc_catalyst_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
