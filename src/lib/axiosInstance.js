import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://h8kgrlv9-3000.inc1.devtunnels.ms/api',
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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('amc_catalyst_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;