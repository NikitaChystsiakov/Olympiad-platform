import { create } from 'zustand';
import { googleLoginRequest, loginRequest, registerRequest } from '@/api/auth';
import type { User } from '@/types';
import { clearAuthSession, getAccessToken, getStoredUser, saveAuthSession } from '@/utils/tokenStorage';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends Credentials {
  fullName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  hydrate: () => void;
  login: (payload: Credentials) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (payload: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  hydrate: () => {
    const user = getStoredUser();
    const token = getAccessToken();
    set({
      user,
      isAuthenticated: Boolean(user && token),
      isInitialized: true,
    });
  },
  login: async (payload) => {
    const response = await loginRequest(payload);
    saveAuthSession(response);
    set({
      user: {
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      },
      isAuthenticated: true,
      isInitialized: true,
    });
  },
  loginWithGoogle: async (idToken) => {
    const response = await googleLoginRequest(idToken);
    saveAuthSession(response);
    set({
      user: {
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      },
      isAuthenticated: true,
      isInitialized: true,
    });
  },
  register: async (payload) => {
    const response = await registerRequest(payload);
    saveAuthSession(response);
    set({
      user: {
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      },
      isAuthenticated: true,
      isInitialized: true,
    });
  },
  logout: () => {
    clearAuthSession();
    set({ user: null, isAuthenticated: false, isInitialized: true });
  },
}));
