import { create } from 'zustand';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  theme: 'light',

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const theme = localStorage.getItem('theme') || 'light';

    set({ theme });

    if (token && user) {
      set({ user: JSON.parse(user), token, isAuthenticated: true });
      try {
        const { data } = await authService.getMe();
        set({ user: data.data.user });
        localStorage.setItem('user', JSON.stringify(data.data.user));
      } catch {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login({ email, password });
      const { user, token, refreshToken } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.register({ username, email, password });
      const { user, token, refreshToken } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
    toast.success('Logged out');
    window.location.href = '/auth/login';
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    set({ theme: next });
    document.documentElement.classList.toggle('dark', next === 'dark');
  },

  updateUser: (userData) => {
    const current = get().user;
    const updated = { ...current, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },
}));
