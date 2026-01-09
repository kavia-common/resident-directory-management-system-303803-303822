import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { ResidentList } from '../components/ResidentList';
import { ResidentForm } from '../components/ResidentForm';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_LIMIT = 10;

// PUBLIC_INTERFACE
export function AdminResidentsPage() {
  /** Admin page: list residents + create/edit/delete with form. Requires auth via ProtectedRoute. */
  const { token } = useAuth();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [residents, setResidents] = useState([]);
  const [total, setTotal] = useState(undefined);

  const [editing, setEditing] = useState(null); // null = no form, {} = create, {id...} = edit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const query = useMemo(() => ({ q, page, limit }), [q, page, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listResidents({ token, ...query });
      const items = Array.isArray(data) ? data : data?.items || data?.results || [];
      const t = Array.isArray(data) ? undefined : data?.total ?? data?.count;
      setResidents(items);
      setTotal(t);
    } catch (e) {
      setError(e.message || 'Failed to load residents.');
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setEditing({});
  };

  const startEdit = (resident) => {
    setSubmitError('');
    setSubmitSuccess('');
    setEditing(resident);
  };

  const onDelete = async (resident) => {
    if (!resident?.id) return;
    const confirmed = window.confirm(`Delete resident "${resident.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await api.deleteResident({ token, id: resident.id });
      setSubmitSuccess('Resident deleted.');
      // Reload list after delete
      await load();
    } catch (e) {
      setSubmitError(e.message || 'Delete failed.');
    }
  };

  const onSubmitForm = async (values) => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = {
        name: values.name?.trim(),
        address: values.address?.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        photo_url: values.photo_url?.trim() || null,
      };

      if (editing?.id) {
        await api.updateResident({ token, id: editing.id, resident: payload });
        setSubmitSuccess('Resident updated successfully.');
      } else {
        await api.createResident({ token, resident: payload });
        setSubmitSuccess('Resident created successfully.');
      }

      setEditing(null);
      await load();
    } catch (e) {
      setSubmitError(e.message || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header page-header--row">
          <div>
            <h1 className="h1">Admin Residents</h1>
            <p className="muted">Create, edit, or delete residents.</p>
          </div>
          <div>
            <button className="btn btn-primary" type="button" onClick={startCreate}>
              + Create
            </button>
          </div>
        </div>

        <SearchBar
          value={q}
          onChange={(val) => {
            setQ(val);
            setPage(1);
          }}
          onSubmit={() => load()}
        />

        <ResidentList
          residents={residents}
          loading={loading}
          error={error}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(next) => setPage(next)}
          mode="admin"
          onEdit={startEdit}
          onDelete={onDelete}
        />

        {editing !== null ? (
          <div style={{ marginTop: 16 }}>
            <ResidentForm
              initialValue={editing}
              onCancel={() => setEditing(null)}
              onSubmit={onSubmitForm}
              submitting={submitting}
              submitError={submitError}
              submitSuccess={submitSuccess}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
