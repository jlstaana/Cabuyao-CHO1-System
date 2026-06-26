import axios from 'axios';

export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const isNgrokApi = /ngrok(-free)?\.(app|dev)|ngrok\.io/i.test(apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(isNgrokApi ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.message === 'Network Error' || (error.response && error.response.status >= 500)) {
       // Only trigger a console error, UI components handle their own specific toast errors
       console.error('API Network or Server Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
