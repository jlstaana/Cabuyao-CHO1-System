import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore error on logout
    }
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/user');
      set({ user: response.data, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  completeOnboarding: async () => {
    const response = await api.post('/auth/onboarding-complete');
    set({ user: response.data.user });
    return response.data.user;
  }
}));

export default useAuthStore;
