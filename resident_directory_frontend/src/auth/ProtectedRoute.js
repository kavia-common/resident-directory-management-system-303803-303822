import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// PUBLIC_INTERFACE
export function ProtectedRoute({ children }) {
  /** Guards children routes by redirecting to /login when unauthenticated. */
  const { isAuthenticated, loadingMe } = useAuth();
  const location = useLocation();

  if (loadingMe) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
