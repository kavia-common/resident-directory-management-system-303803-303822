import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// PUBLIC_INTERFACE
export function AdminOnlyRoute({ children }) {
  /** Route guard that allows only users with role=admin; otherwise redirects to home. */
  const { loadingMe, isAuthenticated, isAdmin } = useAuth();

  if (loadingMe) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading…</p>
      </div>
    );
  }

  // If not authenticated, ProtectedRoute should already redirect, but keep this safe.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="container">
          <div className="card card--error" role="alert">
            <p className="td-strong">Access denied</p>
            <p className="muted" style={{ marginTop: 6 }}>
              You do not have permission to view this page.
            </p>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => window.history.back()}>
                Go back
              </button>
              <span style={{ padding: '0 8px' }} />
              <button className="btn" type="button" onClick={() => window.location.assign('/')}>
                Go to Directory
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
