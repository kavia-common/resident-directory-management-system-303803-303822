import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// PUBLIC_INTERFACE
export function Header() {
  /** Top header bar with navigation and auth controls. */
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
<<<<<<< SEARCH
            <NavLink
              to="/admin/residents"
              className={({ isActive }) => `app-nav__link ${isActive ? 'is-active' : ''}`}
            >
              Admin
            </NavLink>
=======
            {isAdmin ? (
              <NavLink
                to="/admin/residents"
                className={({ isActive }) => `app-nav__link ${isActive ? 'is-active' : ''}`}
              >
                Admin
              </NavLink>
            ) : null}

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header" role="banner">
      <div className="app-header__inner">
        <div className="app-header__left">
          <Link to="/" className="app-title" aria-label="Go to Resident Directory">
            Resident Directory
          </Link>
          <nav className="app-nav" aria-label="Primary navigation">
            <NavLink to="/" end className={({ isActive }) => `app-nav__link ${isActive ? 'is-active' : ''}`}>
              Directory
            </NavLink>
            <NavLink
              to="/admin/residents"
              className={({ isActive }) => `app-nav__link ${isActive ? 'is-active' : ''}`}
            >
              Admin
            </NavLink>
          </nav>
        </div>

        <div className="app-header__right">
          {isAuthenticated ? (
            <>
              <span className="chip" aria-label="Authenticated user">
                {user?.username ? `Admin: ${user.username}` : 'Admin'}
              </span>
              <button className="btn btn-danger" type="button" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn" type="button" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
