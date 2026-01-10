import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'resident_directory_access_token';
const REFRESH_TOKEN_KEY = 'resident_directory_refresh_token';

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state (tokens/user) and actions (login/logout/refreshMe/refreshSession). */
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);

  const clearSession = useCallback(() => {
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const logout = useCallback(async () => {
    // Best-effort server logout (revoke refresh tokens)
    try {
      if (refreshToken) {
        await api.logout({ refresh_token: refreshToken });
      }
    } catch {
      // ignore network/server errors; we still clear local session
    } finally {
      clearSession();
    }
  }, [refreshToken, clearSession]);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) throw new Error('No refresh token available.');
    const data = await api.refresh({ refresh_token: refreshToken });
    const newAccess = data?.access_token || '';
    const newRefresh = data?.refresh_token || '';
    if (!newAccess || !newRefresh) throw new Error('Refresh succeeded but tokens missing.');
    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
    return { accessToken: newAccess, refreshToken: newRefresh };
  }, [refreshToken]);

  // Register global 401 handler: attempt refresh once; if refresh fails, logout.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      try {
        await refreshSession();
      } catch {
        await logout();
      }
    });
  }, [refreshSession, logout]);

  const refreshMe = useCallback(async () => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    setLoadingMe(true);
    try {
      const me = await api.me(accessToken);
      setUser(me);
    } catch (e) {
      // Unauthorized handler may refresh/logout; do not overwrite state here.
      setUser(null);
    } finally {
      setLoadingMe(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async ({ username, password }) => {
    const data = await api.login({ username, password });
    const newAccess = data?.access_token || '';
    const newRefresh = data?.refresh_token || '';
    if (!newAccess || !newRefresh) {
      throw new Error('Login succeeded but tokens were not returned by server.');
    }
    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);

    // Immediately fetch /me for header display (includes role)
    try {
      const me = await api.me(newAccess);
      setUser(me);
    } catch {
      // ignore
    }
    return newAccess;
  }, []);

  const value = useMemo(
    () => ({
      token: accessToken, // back-compat for existing code paths
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isAdmin: (user?.role || '').toLowerCase() === 'admin',
      loadingMe,
      login,
      logout,
      refreshSession,
      refreshMe,
    }),
    [accessToken, refreshToken, user, loadingMe, login, logout, refreshSession, refreshMe]
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
