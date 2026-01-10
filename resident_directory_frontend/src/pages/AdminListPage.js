import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_PAGE_SIZE = 10;

function buildPageList(current, totalPages, maxButtons = 7) {
  if (!totalPages || totalPages <= 1) return [1];

  const windowSize = Math.max(3, maxButtons - 2);
  const half = Math.floor(windowSize / 2);

  let start = Math.max(2, current - half);
  let end = Math.min(totalPages - 1, current + half);

  const actualWindow = end - start + 1;
  if (actualWindow < windowSize) {
    if (start === 2) {
      end = Math.min(totalPages - 1, end + (windowSize - actualWindow));
    } else if (end === totalPages - 1) {
      start = Math.max(2, start - (windowSize - actualWindow));
    }
  }

  const pages = [1];
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

// PUBLIC_INTERFACE
export function AdminListPage() {
  /** Admin Management: list admins with search, pagination, and role assignment. */
  const { token } = useAuth();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(undefined);

  // optimistic role update state
  const [roleBusyIds, setRoleBusyIds] = useState(() => new Set());
  const [roleError, setRoleError] = useState('');

  const query = useMemo(() => ({ q, page, page_size: pageSize }), [q, page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listAdmins({ token, ...query });

      // Expect paged response: {items,total,page,page_size}
      const items = Array.isArray(data) ? data : data?.items || data?.results || [];
      const t = Array.isArray(data) ? undefined : data?.total ?? data?.count;

      setAdmins(items);
      setTotal(t);
    } catch (e) {
      setError(e.message || 'Failed to load admins.');
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = typeof total === 'number' ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const pageList = buildPageList(page, totalPages);

  const onChangeRole = async (admin, nextRole) => {
    if (!admin?.id) return;

    setRoleError('');
    const prevRole = admin.role;

    // optimistic UI update
    setAdmins((rows) => rows.map((a) => (a.id === admin.id ? { ...a, role: nextRole } : a)));
    setRoleBusyIds((s) => new Set([...Array.from(s), admin.id]));

    try {
      await api.updateAdmin({ token, id: admin.id, admin: { role: nextRole, name: admin.name } });
    } catch (e) {
      // revert on failure
      setAdmins((rows) => rows.map((a) => (a.id === admin.id ? { ...a, role: prevRole } : a)));
      setRoleError(e.message || 'Role update failed.');
    } finally {
      setRoleBusyIds((s) => {
        const copy = new Set(Array.from(s));
        copy.delete(admin.id);
        return copy;
      });
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header page-header--row">
          <div>
            <h1 className="h1">Admin Management</h1>
            <p className="muted">Create and manage admin users and roles.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link className="btn btn-primary" to="/admin/admins/new">
              + Create Admin
            </Link>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div className="searchbar" style={{ gridTemplateColumns: '1fr auto' }}>
            <div>
              <label className="sr-only" htmlFor="admin-q">
                Search admins
              </label>
              <input
                id="admin-q"
                className="input"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by username…"
                type="search"
                autoComplete="off"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" type="button" onClick={load} disabled={loading}>
                Apply
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setQ('');
                  setPage(1);
                }}
                disabled={!q}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {roleError ? (
          <div className="card card--error" role="alert" style={{ marginBottom: 12 }}>
            <p className="text-error">{roleError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="card">
            <p>Loading admins…</p>
          </div>
        ) : error ? (
          <div className="card card--error" role="alert">
            <p className="text-error">{error}</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="card">
            <p className="td-strong">No admins found.</p>
            <p className="muted" style={{ marginTop: 6 }}>
              Try a different search, or create a new admin.
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap" role="region" aria-label="Admin results">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th style={{ width: 220 }}>Role</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const busy = roleBusyIds.has(a.id);
                    return (
                      <tr key={a.id}>
                        <td className="muted">{a.id}</td>
                        <td className="td-strong">{a.username}</td>
                        <td>{a.name || <span className="muted">—</span>}</td>
                        <td>
                          <label className="sr-only" htmlFor={`role-${a.id}`}>
                            Role for {a.username}
                          </label>
                          <select
                            id={`role-${a.id}`}
                            className="input"
                            style={{ padding: '8px 10px' }}
                            value={a.role || 'admin'}
                            disabled={busy}
                            onChange={(e) => onChangeRole(a, e.target.value)}
                          >
                            <option value="admin">admin</option>
                            <option value="viewer">viewer</option>
                          </select>
                          {busy ? (
                            <span className="muted small" style={{ marginLeft: 10 }}>
                              Saving…
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link className="btn btn-secondary" to={`/admin/admins/${a.id}`}>
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination" aria-label="Pagination controls">
              <div className="pagination__left">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>

                {totalPages ? (
                  <div className="pagination__pages" aria-label="Page numbers">
                    {pageList.map((p, idx) =>
                      p === '…' ? (
                        <span key={`ellipsis-${idx}`} className="muted" style={{ padding: '0 6px' }}>
                          …
                        </span>
                      ) : (
                        <button
                          key={`p-${p}`}
                          type="button"
                          className={`btn-page ${p === page ? 'is-active' : ''}`}
                          onClick={() => setPage(p)}
                          disabled={p === page}
                          aria-current={p === page ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                ) : null}

                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={totalPages ? page >= totalPages : false}
                >
                  Next
                </button>
              </div>

              <div className="pagination__right">
                {typeof total === 'number' ? (
                  <span className="pagination__meta">
                    Total <strong>{total}</strong> • Page <strong>{page}</strong>
                    {totalPages ? (
                      <>
                        {' '}
                        of <strong>{totalPages}</strong>
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span className="pagination__meta">
                    Page <strong>{page}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
