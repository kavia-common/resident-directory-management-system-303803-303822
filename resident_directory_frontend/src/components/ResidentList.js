import React, { useMemo } from 'react';

function formatContact(resident) {
  const parts = [];
  if (resident.email) parts.push(resident.email);
  if (resident.phone) parts.push(resident.phone);
  return parts.join(' • ');
}

function formatUpdatedAt(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function normalizeSortValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  return String(value).toLowerCase();
}

function compareValues(a, b) {
  const av = normalizeSortValue(a);
  const bv = normalizeSortValue(b);
  if (typeof av === 'number' && typeof bv === 'number') return av - bv;
  return String(av).localeCompare(String(bv));
}

function buildPageList(current, totalPages, maxButtons = 7) {
  if (!totalPages || totalPages <= 1) return [1];

  // Always show first/last; window around current.
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

function SortableHeader({ label, field, activeSort, activeDir, onSort }) {
  const isActive = activeSort === field;
  const icon = !isActive ? '↕' : activeDir === 'asc' ? '↑' : '↓';

  return (
    <button
      type="button"
      className="table-sort"
      onClick={() => onSort?.(field)}
      aria-label={`Sort by ${label}${isActive ? ` (${activeDir})` : ''}`}
    >
      <span>{label}</span>
      <span className="table-sort__icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

// PUBLIC_INTERFACE
export function ResidentList({
  residents,
  loading,
  error,

  page,
  limit, // legacy name for page_size
  total,

  onPageChange,

  // Optional enhancements:
  pageSize,
  onPageSizeChange,

  sort,
  sortDir,
  onSortChange,

  mode = 'directory',
  onEdit,
  onDelete,
}) {
  /** Display a resident table for directory or admin mode, with pagination controls and optional sorting. */

  const effectivePageSize = pageSize ?? limit ?? 10;

  // If backend doesn't support sort, we can optionally sort client-side as a fallback.
  // Only apply to the current page's data to avoid surprises (server paging still dominates).
  const renderedResidents = useMemo(() => {
    if (!Array.isArray(residents)) return [];
    if (!sort) return residents;

    const copy = residents.slice();

    copy.sort((ra, rb) => {
      const dir = sortDir === 'desc' ? -1 : 1;

      // Support a few known fields, default to direct property access.
      const aVal = ra?.[sort];
      const bVal = rb?.[sort];

      // updated_at sorting should consider date values if possible.
      if (sort === 'updated_at') {
        const ad = aVal ? new Date(aVal).getTime() : 0;
        const bd = bVal ? new Date(bVal).getTime() : 0;
        return (ad - bd) * dir;
      }

      return compareValues(aVal, bVal) * dir;
    });

    return copy;
  }, [residents, sort, sortDir]);

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

  if (!renderedResidents || renderedResidents.length === 0) {
    return (
      <div className="card">
        <p>No residents found.</p>
      </div>
    );
  }

  const totalPages = typeof total === 'number' ? Math.max(1, Math.ceil(total / effectivePageSize)) : undefined;
  const pageList = buildPageList(page, totalPages);
  const canPrev = page > 1;
  const canNext = totalPages ? page < totalPages : renderedResidents.length >= effectivePageSize;

  const onSort = (field) => {
    if (!onSortChange) return;
    if (sort === field) {
      onSortChange({ sort: field, sortDir: sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ sort: field, sortDir: 'asc' });
    }
  };

  return (
    <div className="card">
      <div className="table-wrap" role="region" aria-label="Resident results">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>Photo</th>
              <th>
                <SortableHeader label="Name" field="name" activeSort={sort} activeDir={sortDir} onSort={onSort} />
              </th>
              <th>Address</th>
              <th>
                <SortableHeader
                  label="Building"
                  field="building"
                  activeSort={sort}
                  activeDir={sortDir}
                  onSort={onSort}
                />
              </th>
              <th>
                <SortableHeader label="Unit" field="unit" activeSort={sort} activeDir={sortDir} onSort={onSort} />
              </th>
              <th>Contact</th>
              <th>
                <SortableHeader
                  label="Updated"
                  field="updated_at"
                  activeSort={sort}
                  activeDir={sortDir}
                  onSort={onSort}
                />
              </th>
              {mode === 'admin' ? <th style={{ width: 180 }}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {renderedResidents.map((r) => (
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
                <td>{r.building || ''}</td>
                <td>{r.unit || ''}</td>
                <td>{formatContact(r)}</td>
                <td className="muted">{formatUpdatedAt(r.updated_at)}</td>
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
        <div className="pagination__left">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={!canPrev}
          >
            Prev
          </button>

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
                  onClick={() => onPageChange?.(p)}
                  disabled={p === page}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onPageChange?.(page + 1)}
            disabled={!canNext}
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
              {totalPages ? (
                <>
                  {' '}
                  of <strong>{totalPages}</strong>
                </>
              ) : null}
            </span>
          )}

          {onPageSizeChange ? (
            <label className="muted small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Page size
              <select
                className="input"
                style={{ width: 110, padding: '8px 10px' }}
                value={effectivePageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
