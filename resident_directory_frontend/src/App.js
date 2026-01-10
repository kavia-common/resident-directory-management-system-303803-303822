import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { DirectoryPage } from './pages/DirectoryPage';
import { LoginPage } from './pages/LoginPage';
import { AdminResidentsPage } from './pages/AdminResidentsPage';
import { AdminListPage } from './pages/AdminListPage';
import { AdminCreatePage } from './pages/AdminCreatePage';
import { AdminEditPage } from './pages/AdminEditPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminOnlyRoute } from './auth/AdminOnlyRoute';

// PUBLIC_INTERFACE
function App() {
  /** Application entry component: global layout and route configuration. */
  return (
    <div className="AppShell">
      <Header />
      <main className="app-main" role="main">
        <Routes>
          <Route path="/" element={<DirectoryPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin/residents"
            element={
              <ProtectedRoute>
                <AdminOnlyRoute>
                  <AdminResidentsPage />
                </AdminOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute>
                <AdminOnlyRoute>
                  <AdminListPage />
                </AdminOnlyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins/new"
            element={
              <ProtectedRoute>
                <AdminOnlyRoute>
                  <AdminCreatePage />
                </AdminOnlyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins/:id"
            element={
              <ProtectedRoute>
                <AdminOnlyRoute>
                  <AdminEditPage />
                </AdminOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
