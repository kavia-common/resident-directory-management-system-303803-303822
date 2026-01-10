import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AdminForm } from '../components/AdminForm';

// PUBLIC_INTERFACE
export function AdminEditPage() {
  /** Edit an existing admin: name/role, and optional password reset. */
  const { token } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const adminId = params.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [admin, setAdmin] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const adminForForm = useMemo(() => {
    if (!admin) return null;
    return {
      id: admin.id,
      username: admin.username,
      name: admin.name || '',
      role: admin.role || 'admin',
    };
  }, [admin]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        // No getAdmin endpoint defined; use list + find by id for now.
        const data = await api.listAdmins({ token, page: 1, page_size: 200 });
        const items = Array.isArray(data) ? data : data?.items || data?.results || [];
        const found = items.find((a) => String(a.id) === String(adminId));
        if (!found) throw new Error('Admin not found.');
        if (mounted) setAdmin(found);
      } catch (e) {
        if (mounted) setLoadError(e.message || 'Failed to load admin.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token, adminId]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.updateAdmin({
        token,
        id: adminId,
        admin: {
          name: values.name?.trim(),
          role: values.role?.trim(),
        },
      });
      navigate('/admin/admins', { replace: true });
    } catch (e) {
      setSubmitError(e.message || 'Update admin failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const onResetPassword = async () => {
    const next = window.prompt('Enter a new temporary password (min 8 chars):');
    if (!next) return;
    if (next.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }

    setResetBusy(true);
    setResetError('');
    setResetSuccess('');
    try {
      await api.resetAdminPassword({ token, id: adminId, password: next });
      setResetSuccess('Password reset successfully.');
    } catch (e) {
      // This endpoint may not exist yet in backend; show a clear message.
      setResetError(e.message || 'Password reset failed (endpoint may not be implemented).');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header page-header--row">
          <div>
            <h1 className="h1">Edit Admin</h1>
            <p className="muted">Update admin profile and role.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/admin/admins')}>
              Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card">
            <p>Loading admin…</p>
          </div>
        ) : loadError ? (
          <div className="card card--error" role="alert">
            <p className="text-error">{loadError}</p>
          </div>
        ) : (
          <>
            <AdminForm
              mode="edit"
              initialValue={adminForForm}
              onCancel={() => navigate('/admin/admins')}
              onSubmit={onSubmit}
              submitting={submitting}
              submitError={submitError}
            />

            <div style={{ marginTop: 12 }}>
              <div className="card">
                <h2 className="h2">Security</h2>
                {resetError ? (
                  <div className="alert alert--error" role="alert">
                    {resetError}
                  </div>
                ) : null}
                {resetSuccess ? (
                  <div className="alert alert--success" role="status">
                    {resetSuccess}
                  </div>
                ) : null}

                <p className="muted" style={{ marginTop: 6 }}>
                  If supported by the backend, you can reset this admin&apos;s password to a temporary value.
                </p>

                <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
                  <button className="btn btn-secondary" type="button" onClick={onResetPassword} disabled={resetBusy}>
                    {resetBusy ? 'Resetting…' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
