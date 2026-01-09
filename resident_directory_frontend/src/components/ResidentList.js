import React from 'react';

function formatContact(resident) {
  const parts = [];
  if (resident.email) parts.push(resident.email);
  if (resident.phone) parts.push(resident.phone);
  return parts.join(' • ');
}

// PUBLIC_INTERFACE
export function ResidentList({
  residents,
  loading,
  error,
  page,
  limit,
  total,
  onPageChange,
  mode = 'directory',
  onEdit,
  onDelete,
}) {
  /** Display a resident table for directory or admin mode, with pagination controls. */

  if (loading) {
    return (
      <div className="card">
        <p>Loading residents…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card--error" role="alert">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  if (!residents || residents.length === 0) {
    return (
      <div className="card">
        <p>No residents found.</p>
      </div>
    );
  }

  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : undefined;

  return (
    <div className="card">
      <div className="table-wrap" role="region" aria-label="Resident results">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>Photo</th>
              <th>Name</th>
              <th>Address</th>
              <th>Contact</th>
              {mode === 'admin' ? <th style={{ width: 180 }}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {residents.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="avatar">
                    {r.photo_url ? (
                      <img src={r.photo_url} alt={`${r.name || 'Resident'} thumbnail`} />
                    ) : (
                      <div className="avatar__placeholder" aria-hidden="true">
                        {r.name ? r.name.trim().slice(0, 1).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                </td>
                <td className="td-strong">{r.name}</td>
                <td>{r.address}</td>
                <td>{formatContact(r)}</td>
                {mode === 'admin' ? (
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary" type="button" onClick={() => onEdit?.(r)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" type="button" onClick={() => onDelete?.(r)}>
                        Delete
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination" aria-label="Pagination controls">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="pagination__meta">
          Page <strong>{page}</strong>
          {totalPages ? (
            <>
              {' '}
              of <strong>{totalPages}</strong>
            </>
          ) : null}
        </span>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onPageChange?.(page + 1)}
          disabled={totalPages ? page >= totalPages : residents.length < limit}
        >
          Next
        </button>
      </div>
    </div>
  );
}
