import { create } from 'zustand';
import { googleLoginRequest, loginRequest, registerRequest } from '@/api/auth';
import { SESSION_EXPIRED_EVENT } from '@/api/http';
import type { AuthResponse, User, UserRole } from '@/types';
import { clearAuthSession, getAccessToken, getStoredUser, saveAuthSession } from '@/utils/tokenStorage';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends Credentials {
  fullName: string;
}

/** Seeded demo accounts (see migration V2/V6). Shown publicly on purpose. */
export const DEMO_ACCOUNTS: Record<UserRole, Credentials> = {
  STUDENT: { email: 'student@test.com', password: 'student123' },
  ORGANIZER: { email: 'org@test.com', password: 'org123' },
  ADMIN: { email: 'admin@test.com', password: 'admin123' },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  hydrate: () => void;
  login: (payload: Credentials) => Promise<User>;
  loginAsDemo: (role: UserRole) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  register: (payload: RegisterCredentials) => Promise<User>;
  logout: () => void;
}

function toUser(response: AuthResponse): User {
  return {
    id: response.userId,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
  };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const applySession = (response: AuthResponse) => {
    saveAuthSession(response);
    const user = toUser(response);
    set({ user, isAuthenticated: true, isInitialized: true });
    return user;
  };

  return {
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    hydrate: () => {
      const user = getStoredUser();
      const token = getAccessToken();
      set({ user, isAuthenticated: Boolean(user && token), isInitialized: true });
    },
    login: async (payload) => applySession(await loginRequest(payload)),
    loginAsDemo: async (role) => get().login(DEMO_ACCOUNTS[role]),
    loginWithGoogle: async (idToken) => applySession(await googleLoginRequest(idToken)),
    register: async (payload) => applySession(await registerRequest(payload)),
    logout: () => {
      clearAuthSession();
      set({ user: null, isAuthenticated: false, isInitialized: true });
    },
  };
});

window.addEventListener(SESSION_EXPIRED_EVENT, () => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isInitialized: true });
});
