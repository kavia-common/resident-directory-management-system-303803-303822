import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, getApiBaseUrl } from '../api/client';
import { SearchBar } from '../components/SearchBar';
import { ResidentList } from '../components/ResidentList';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_PAGE_SIZE = 10;
const Q_DEBOUNCE_MS = 300;

function apiBaseUrl() {
  return getApiBaseUrl();
}

// PUBLIC_INTERFACE
export function DirectoryPage() {
  /** Public resident directory with search + pagination and building/unit filters. */
  const { token } = useAuth();

  // Filters
  const [qInput, setQInput] = useState(''); // raw typing value
  const [q, setQ] = useState(''); // debounced committed value used for querying
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');

  // Paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Sorting (server-side preferred; ResidentList also applies a safe client-side fallback)
  const [sort, setSort] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [residents, setResidents] = useState([]);
  const [total, setTotal] = useState(undefined);

  // Misc/diagnostics
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState('');

  // Track if user has applied any filters (for better empty-state copy)
  const hasAnyFilter = Boolean(q.trim() || building.trim() || unit.trim());

  // Debounce q typing -> q (query value)
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQ(qInput);
    }, Q_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [qInput]);

  const query = useMemo(
    () => ({
      q,
      building,
      unit,
      page,
      page_size: pageSize,
      // Backend may accept sort/sort_dir; api client forwards as sort_by/sort_dir.
      sort,
      sort_dir: sortDir,
    }),
    [q, building, unit, page, pageSize, sort, sortDir]
  );

  const latestRequestId = useRef(0);

  const load = async () => {
    // Ensure stale responses don't overwrite newer ones.
    const requestId = ++latestRequestId.current;

    setLoading(true);
    setError('');
    try {
      const data = await api.listResidents({ token, ...query });

      // New backend returns {items,total,page,page_size}. Keep backward compat just in case.
      const items = Array.isArray(data) ? data : data?.items || data?.results || [];
      const t = Array.isArray(data) ? undefined : data?.total ?? data?.count;

      if (requestId !== latestRequestId.current) return;

      // If backend returns canonical paging values, honor them.
      if (!Array.isArray(data)) {
        if (typeof data?.page === 'number' && data.page >= 1) setPage(data.page);
        if (typeof data?.page_size === 'number' && data.page_size >= 1) setPageSize(data.page_size);
      }

      setResidents(items);
      setTotal(t);
    } catch (e) {
      if (requestId !== latestRequestId.current) return;
      setError(e.message || 'Failed to load residents.');
    } finally {
      if (requestId !== latestRequestId.current) return;
      setLoading(false);
    }
  };

  // Auto-load on filter/pagination change.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.building, query.unit, query.page, query.page_size, query.sort, query.sort_dir, token]);

  const onClearFilters = () => {
    setQInput('');
    setQ('');
    setBuilding('');
    setUnit('');
    setPage(1);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="h1">Directory</h1>
          <p className="muted">Search for residents by name and optionally filter by building/unit.</p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                setHealthLoading(true);
                setHealthResult('');
                try {
                  const res = await fetch(`${apiBaseUrl()}/config/health`);
                  const json = await res.json().catch(() => null);
                  if (!res.ok) {
                    const msg = json?.detail || json?.message || `HTTP ${res.status}`;
                    throw new Error(msg);
                  }
                  setHealthResult(`OK (CORS origins: ${(json?.cors?.allowed_origins || []).join(', ')})`);
                } catch (e) {
                  setHealthResult(e.message || 'Health check failed.');
                } finally {
                  setHealthLoading(false);
                }
              }}
              disabled={healthLoading}
            >
              {healthLoading ? 'Checking…' : 'API Health'}
            </button>

            {healthResult ? <span className="muted">{healthResult}</span> : null}
          </div>
        </div>

        <SearchBar
          qValue={qInput}
          buildingValue={building}
          unitValue={unit}
          onChangeQ={(val) => {
            setQInput(val);
            setPage(1);
          }}
          onChangeBuilding={(val) => {
            setBuilding(val);
            setPage(1);
          }}
          onChangeUnit={(val) => {
            setUnit(val);
            setPage(1);
          }}
          onClear={onClearFilters}
          onSubmit={() => load()}
        />

        {typeof total === 'number' ? (
          <p className="muted small" style={{ margin: '6px 0 12px' }}>
            Showing <strong>{residents.length}</strong> of <strong>{total}</strong> result{total === 1 ? '' : 's'}.
          </p>
        ) : null}

        {(!loading && !error && residents.length === 0) ? (
          <div className="card" style={{ marginBottom: 12 }}>
            <p className="td-strong">{hasAnyFilter ? 'No results match your filters.' : 'No residents found.'}</p>
            <p className="muted" style={{ marginTop: 6 }}>
              {hasAnyFilter ? 'Try clearing filters or searching for a different name.' : 'Please check back later.'}
            </p>
            {hasAnyFilter ? (
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-secondary" type="button" onClick={onClearFilters}>
                  Clear filters
                </button>
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
          pageSize={pageSize}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
          total={total}
          sort={sort}
          sortDir={sortDir}
          onSortChange={({ sort: nextSort, sortDir: nextDir }) => {
            setSort(nextSort);
            setSortDir(nextDir);
            setPage(1);
          }}
          onPageChange={(nextPage) => setPage(nextPage)}
          mode="directory"
        />
      </div>
    </div>
  );
}
