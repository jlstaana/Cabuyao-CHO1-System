import { create } from 'zustand';
import api from '../utils/api';

export const publicReviewUser = {
  id: 'public-reviewer',
  name: 'Public Reviewer',
  email: 'reviewer@public.local',
  role: 'Admin',
  first_login: false,
  is_public_review: true,
};

const storedToken = localStorage.getItem('token') || null;

const useAuthStore = create((set) => ({
  user: storedToken ? null : publicReviewUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: !!storedToken,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true, loading: false });
    return user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore error on logout
    }
    localStorage.removeItem('token');
    set({ token: null, user: publicReviewUser, isAuthenticated: false, loading: false });
  },

  fetchUser: async () => {
    try {
      const response = await api.get('/user');
      set({ user: response.data, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: publicReviewUser, token: null, isAuthenticated: false, loading: false });
    }
  },

  completeOnboarding: async () => {
    const response = await api.post('/auth/onboarding-complete');
    set({ user: response.data.user });
    return response.data.user;
  }
}));

export default useAuthStore;
