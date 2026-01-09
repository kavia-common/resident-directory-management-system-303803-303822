import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { ResidentList } from '../components/ResidentList';
import { ResidentForm } from '../components/ResidentForm';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_PAGE_SIZE = 10;

// PUBLIC_INTERFACE
export function AdminResidentsPage() {
  /** Admin page: list residents + create/edit/delete, plus CSV import/export. Requires auth via ProtectedRoute. */
  const { token } = useAuth();

  // Advanced filters
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [updatedFrom, setUpdatedFrom] = useState('');
  const [updatedTo, setUpdatedTo] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [residents, setResidents] = useState([]);
  const [total, setTotal] = useState(undefined);

  const [editing, setEditing] = useState(null); // null = no form, {} = create, {id...} = edit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // CSV import/export state
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvReport, setCsvReport] = useState(null);

  const query = useMemo(
    () => ({
      q,
      name,
      building,
      unit,
      phone,
      email,
      updated_at_from: updatedFrom || undefined,
      updated_at_to: updatedTo || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      page_size: pageSize,
    }),
    [q, name, building, unit, phone, email, updatedFrom, updatedTo, sortBy, sortDir, page, pageSize]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listResidents({ token, ...query });

      // New backend returns {items,total,page,page_size}. Keep backward compat just in case.
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
        building: values.building?.trim() || null,
        unit: values.unit?.trim() || null,
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

  const resetFilters = () => {
    setQ('');
    setName('');
    setBuilding('');
    setUnit('');
    setPhone('');
    setEmail('');
    setUpdatedFrom('');
    setUpdatedTo('');
    setSortBy('id');
    setSortDir('asc');
    setPage(1);
  };

  const onExportCsv = async () => {
    setCsvBusy(true);
    setCsvError('');
    try {
      const csv = await api.exportResidentsCsv({ token, ...query });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'residents_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      setCsvError(e.message || 'CSV export failed.');
    } finally {
      setCsvBusy(false);
    }
  };

  const onImportCsv = async (file) => {
    if (!file) return;
    setCsvBusy(true);
    setCsvError('');
    setCsvReport(null);
    try {
      const report = await api.importResidentsCsv({ token, file });
      setCsvReport(report);
      await load();
    } catch (e) {
      setCsvError(e.message || 'CSV import failed.');
    } finally {
      setCsvBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header page-header--row">
          <div>
            <h1 className="h1">Admin Residents</h1>
            <p className="muted">Create, edit, delete, and import/export residents.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" type="button" onClick={onExportCsv} disabled={csvBusy}>
              Export CSV
            </button>

            <label className="btn btn-secondary" style={{ margin: 0, cursor: csvBusy ? 'not-allowed' : 'pointer' }}>
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                disabled={csvBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  // allow selecting same file again later
                  e.target.value = '';
                  if (f) onImportCsv(f);
                }}
              />
            </label>

            <button className="btn btn-primary" type="button" onClick={startCreate}>
              + Create
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="row" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
            <div>
              <label className="muted" htmlFor="f-q">
                Search
              </label>
              <input
                id="f-q"
                className="input"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="q (broad search)"
              />
            </div>
            <div>
              <label className="muted" htmlFor="f-name">
                Name
              </label>
              <input
                id="f-name"
                className="input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setPage(1);
                }}
                placeholder="partial"
              />
            </div>
            <div>
              <label className="muted" htmlFor="f-building">
                Building
              </label>
              <input
                id="f-building"
                className="input"
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  setPage(1);
                }}
                placeholder="exact"
              />
            </div>
            <div>
              <label className="muted" htmlFor="f-unit">
                Unit
              </label>
              <input
                id="f-unit"
                className="input"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setPage(1);
                }}
                placeholder="exact"
              />
            </div>
            <div>
              <label className="muted" htmlFor="f-phone">
                Phone
              </label>
              <input
                id="f-phone"
                className="input"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPage(1);
                }}
                placeholder="exact"
              />
            </div>
            <div>
              <label className="muted" htmlFor="f-email">
                Email
              </label>
              <input
                id="f-email"
                className="input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setPage(1);
                }}
                placeholder="exact"
              />
            </div>
          </div>

          <div
            className="row"
            style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', marginTop: 10 }}
          >
            <div style={{ gridColumn: 'span 2' }}>
              <label className="muted" htmlFor="f-updated-from">
                Updated from (RFC3339)
              </label>
              <input
                id="f-updated-from"
                className="input"
                value={updatedFrom}
                onChange={(e) => {
                  setUpdatedFrom(e.target.value);
                  setPage(1);
                }}
                placeholder="2025-01-01T00:00:00Z"
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="muted" htmlFor="f-updated-to">
                Updated to (RFC3339)
              </label>
              <input
                id="f-updated-to"
                className="input"
                value={updatedTo}
                onChange={(e) => {
                  setUpdatedTo(e.target.value);
                  setPage(1);
                }}
                placeholder="2025-12-31T23:59:59Z"
              />
            </div>

            <div>
              <label className="muted" htmlFor="f-sort-by">
                Sort by
              </label>
              <select
                id="f-sort-by"
                className="input"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="id">id</option>
                <option value="name">name</option>
                <option value="email">email</option>
                <option value="phone">phone</option>
                <option value="building">building</option>
                <option value="unit">unit</option>
                <option value="created_at">created_at</option>
                <option value="updated_at">updated_at</option>
              </select>
            </div>

            <div>
              <label className="muted" htmlFor="f-sort-dir">
                Direction
              </label>
              <select
                id="f-sort-dir"
                className="input"
                value={sortDir}
                onChange={(e) => {
                  setSortDir(e.target.value);
                  setPage(1);
                }}
              >
                <option value="asc">asc</option>
                <option value="desc">desc</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
              <button className="btn btn-secondary" type="button" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn" type="button" onClick={load}>
                Apply
              </button>
            </div>
          </div>
        </div>

        {csvError ? (
          <div className="card card--error" role="alert" style={{ marginBottom: 12 }}>
            <p className="text-error">{csvError}</p>
          </div>
        ) : null}

        {csvReport ? (
          <div className="card" style={{ marginBottom: 12 }}>
            <p className="td-strong">CSV Import Report</p>
            <p className="muted" style={{ marginTop: 6 }}>
              Created: <strong>{csvReport.created}</strong> • Updated: <strong>{csvReport.updated}</strong> • Skipped:{' '}
              <strong>{csvReport.skipped}</strong> • Errors: <strong>{csvReport.errors?.length || 0}</strong>
            </p>

            {csvReport.errors?.length ? (
              <div style={{ marginTop: 10 }}>
                <p className="muted">First 10 errors:</p>
                <ul>
                  {csvReport.errors.slice(0, 10).map((err) => (
                    <li key={`${err.row_number}-${err.message}`}>
                      Row {err.row_number}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <ResidentList
          residents={residents}
          loading={loading}
          error={error}
          page={page}
          limit={pageSize}
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
