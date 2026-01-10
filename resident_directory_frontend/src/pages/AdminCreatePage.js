import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AdminForm } from '../components/AdminForm';

// PUBLIC_INTERFACE
export function AdminCreatePage() {
  /** Create a new admin user. */
  const { token } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (values) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      // Backend currently defines AdminCreate: { username, password }.
      // We also send role/name for forward compatibility; backend should ignore unknown fields or accept them.
      await api.createAdmin({
        token,
        admin: {
          username: values.username?.trim(),
          password: values.password,
          name: values.name?.trim(),
          role: values.role?.trim(),
        },
      });

      navigate('/admin/admins', { replace: true });
    } catch (e) {
      setSubmitError(e.message || 'Create admin failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header page-header--row">
          <div>
            <h1 className="h1">Create Admin</h1>
            <p className="muted">Add a new admin user and assign a role.</p>
          </div>
        </div>

        <AdminForm
          mode="create"
          initialValue={{ role: 'admin' }}
          onCancel={() => navigate('/admin/admins')}
          onSubmit={onSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
