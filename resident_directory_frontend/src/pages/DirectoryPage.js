import React, { useEffect, useMemo, useState } from 'react';
import { api, getApiBaseUrl } from '../api/client';
import { SearchBar } from '../components/SearchBar';
import { ResidentList } from '../components/ResidentList';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_LIMIT = 10;

function apiBaseUrl() {
  return getApiBaseUrl();
}

// PUBLIC_INTERFACE
export function DirectoryPage() {
  /** Public resident directory with search + pagination. */
  const { token } = useAuth();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [residents, setResidents] = useState([]);
  const [total, setTotal] = useState(undefined);

  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState('');

  const query = useMemo(() => ({ q, page, page_size: limit }), [q, page, limit]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listResidents({ token, ...query });
      // Support either {items,total} or direct array responses.
      const items = Array.isArray(data) ? data : data?.items || data?.results || [];
      const t = Array.isArray(data) ? undefined : data?.total ?? data?.count;
      setResidents(items);
      setTotal(t);
    } catch (e) {
      setError(e.message || 'Failed to load residents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.page, query.limit, token]);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="h1">Directory</h1>
          <p className="muted">Search for residents by name, address, phone, or email.</p>

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
          onPageChange={(nextPage) => setPage(nextPage)}
          mode="directory"
        />
      </div>
    </div>
  );
}
