import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { DirectoryPage } from './pages/DirectoryPage';
import { LoginPage } from './pages/LoginPage';
import { AdminResidentsPage } from './pages/AdminResidentsPage';
import { ProtectedRoute } from './auth/ProtectedRoute';

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
                <AdminResidentsPage />
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
