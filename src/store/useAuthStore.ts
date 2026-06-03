import { create } from 'zustand';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  signature?: string;
  membership: 'free' | 'pro' | 'enterprise';
  membershipExpiresAt?: number;
  credits: number;
  storageUsed: number;
  storageLimit: number;
  inviteCode: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!api.getToken(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    const res = await api.login(email, password);
    if (res.data) {
      set({
        user: res.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    }
    set({ error: res.error || '登录失败', loading: false });
    return false;
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    const res = await api.register(email, password, displayName);
    if (res.data) {
      set({
        user: res.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    }
    set({ error: res.error || '注册失败', loading: false });
    return false;
  },

  logout: () => {
    api.logout();
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    if (!api.getToken()) return;
    const res = await api.getMe();
    if (res.data) {
      set({ user: res.data, isAuthenticated: true });
    } else {
      set({ isAuthenticated: false, user: null });
      api.logout();
    }
  },

  updateProfile: async (data) => {
    const res = await api.updateProfile(data);
    if (res.data) {
      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      }));
      return true;
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
