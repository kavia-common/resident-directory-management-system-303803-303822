import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Login screen for admin authentication. */
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/admin/residents';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="h1">Admin Login</h1>
          <p className="muted">Sign in to manage residents.</p>
        </div>

        <div className="card">
          {error ? (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          ) : null}

          <form className="form" onSubmit={onSubmit}>
            <div className="form-row">
              <label className="label" htmlFor="login-username">
                Username
              </label>
              <input
                id="login-username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="form-row">
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Login'}
              </button>
            </div>
          </form>

          <p className="muted small" style={{ marginTop: 12 }}>
            Note: Use the seeded admin credentials configured in the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
