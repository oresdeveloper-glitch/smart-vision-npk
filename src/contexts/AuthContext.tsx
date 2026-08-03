import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getMLServerUrl } from '../services/mlService';

export type UserRole = 'farmer' | 'expert' | 'researcher' | 'admin' | 'guest';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, username: string, email: string, password: string, role: UserRole) => Promise<string | null>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithPhone: (phone: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<string | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  getUsers: () => Promise<User[]>;
}

function getMLStyleUrl(): string {
  return getMLServerUrl();
}

const AUTH_SERVER_URL = (() => { try { return getMLStyleUrl(); } catch { return 'http://localhost:5000'; } })();
const TOKEN_KEY = 'npk_token';
const SESSION_KEY = 'npk_user';
const GUEST_SESSION_KEY = 'npk_guest_session';

async function api<T>(path: string, options: RequestInit = {}): Promise<{ data: T; error: string | null }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${AUTH_SERVER_URL}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { data: (json as T), error: json?.error || `Request failed (${res.status})` };
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'Cannot reach auth server.' };
  }
}

function normalizeUser(raw: User): User {
  return {
    ...raw,
    id: String(raw.id),
    role: (['farmer', 'expert', 'researcher', 'admin', 'guest'].includes(raw.role) ? raw.role : 'farmer') as UserRole,
  };
}

interface AuthResponse { token?: string; user?: User; error?: string }

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  login: async () => null,
  register: async () => null,
  loginWithGoogle: async () => false,
  loginWithPhone: async () => false,
  loginAsGuest: () => {},
  logout: () => {},
  updateUser: async () => null,
  changePassword: async () => null,
  getUsers: async () => [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return saved;
    } catch { return null; }
  });

  const isAuthenticated = !!user && !!localStorage.getItem(TOKEN_KEY);
  const isGuest = user?.role === 'guest' && !!localStorage.getItem(GUEST_SESSION_KEY);

  const saveSession = useCallback((u: User | null, token?: string) => {
    setUser(u);
    if (u && token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      localStorage.removeItem(GUEST_SESSION_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(GUEST_SESSION_KEY);
    }
  }, []);

  const saveGuest = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem(GUEST_SESSION_KEY, '1');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('npk_token');
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (error || !data?.token) return error || 'Login failed.';
    saveSession(normalizeUser(data.user), data.token);
    return null;
  }, [saveSession]);

  const register = useCallback(async (name: string, username: string, email: string, password: string, role: UserRole): Promise<string | null> => {
    const { data, error } = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password, role }),
    });
    if (error || !data?.token) return error || 'Registration failed.';
    saveSession(normalizeUser(data.user), data.token);
    return null;
  }, [saveSession]);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const loginWithPhone = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const loginAsGuest = useCallback(() => {
    saveGuest({
      id: 'guest_' + Date.now(),
      name: 'Guest User',
      username: 'guest',
      email: '',
      role: 'guest',
    });
  }, [saveGuest]);

  const logout = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) api('/auth/logout', { method: 'POST' }).catch(() => {});
    saveSession(null);
  }, [saveSession]);

  const updateUser = useCallback(async (data: Partial<User>): Promise<string | null> => {
    const { res, error } = await api<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (error) return error;
    saveSession(normalizeUser(res.user), localStorage.getItem(TOKEN_KEY) || undefined);
    return null;
  }, [saveSession]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
    const { error } = await api<{ ok: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return error;
  }, []);

  const getUsers = useCallback(async (): Promise<User[]> => {
    const { data } = await api<{ user: User[] }>('/auth/users');
    return (data.user || []).map(normalizeUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isGuest,
      login, register, loginWithGoogle, loginWithPhone,
      loginAsGuest, logout, updateUser,
      changePassword, getUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}