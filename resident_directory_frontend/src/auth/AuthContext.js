import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = 'resident_directory_token';

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state (token/user) and actions (login/logout/refreshMe). */
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [user, setUser] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  // Register global 401 handler
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      // Navigation is handled at route level; clearing token forces ProtectedRoute to redirect.
    });
  }, [logout]);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    setLoadingMe(true);
    try {
      const me = await api.me(token);
      setUser(me);
    } catch (e) {
      // If token invalid, api client will invoke unauthorized handler (logout)
      setUser(null);
    } finally {
      setLoadingMe(false);
    }
  }, [token]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async ({ username, password }) => {
    const data = await api.login({ username, password });
    const newToken = data?.access_token || data?.token || '';
    if (!newToken) {
      throw new Error('Login succeeded but no token returned by server.');
    }
    setToken(newToken);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    // Immediately fetch /me for header display
    try {
      const me = await api.me(newToken);
      setUser(me);
    } catch {
      // ignore; protected routes will still work with token until /me succeeds
    }
    return newToken;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loadingMe,
      login,
      logout,
      refreshMe,
    }),
    [token, user, loadingMe, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access AuthContext. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
