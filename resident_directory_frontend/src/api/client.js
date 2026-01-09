/**
 * Lightweight fetch-based API client.
 * - Uses REACT_APP_API_BASE_URL (defaults to http://localhost:3001)
 * - Attaches Authorization header when token exists
 * - Calls a registered unauthorized handler when a 401 occurs
 */

const DEFAULT_BASE_URL = 'http://localhost:3001';

let unauthorizedHandler = null;

// PUBLIC_INTERFACE
export function setUnauthorizedHandler(handler) {
  /** Register a callback that will be called on HTTP 401 responses. */
  unauthorizedHandler = handler;
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the configured API base URL. */
  return (process.env.REACT_APP_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', token, body, query, headers: extraHeaders } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  const headers = {
    Accept: 'application/json',
    ...(extraHeaders || {}),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body:
      body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (res.status === 401 && typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }

  // If caller expects CSV, they should call requestText()
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message || data.error)) ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function requestText(path, { method = 'GET', token, query } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  const headers = {
    Accept: 'text/csv',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { method, headers });

  if (res.status === 401 && typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    const message =
      (data && (data.detail || data.message || data.error)) ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return res.text();
}

// PUBLIC_INTERFACE
export const api = {
  /** Convenience typed methods for this app's backend API. */
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { method: 'GET', token }),

  listResidents: ({
    token,
    q,
    name,
    building,
    unit,
    phone,
    email,
    updated_at_from,
    updated_at_to,
    sort_by,
    sort_dir,
    page,
    page_size,
    // Back-compat:
    limit,
  } = {}) =>
    request('/residents', {
      method: 'GET',
      token,
      query: {
        q,
        name,
        building,
        unit,
        phone,
        email,
        updated_at_from,
        updated_at_to,
        sort_by,
        sort_dir,
        page,
        page_size: page_size ?? limit,
      },
    }),

  exportResidentsCsv: ({
    token,
    q,
    name,
    building,
    unit,
    phone,
    email,
    updated_at_from,
    updated_at_to,
    sort_by,
    sort_dir,
  } = {}) =>
    requestText('/residents/export', {
      method: 'GET',
      token,
      query: { q, name, building, unit, phone, email, updated_at_from, updated_at_to, sort_by, sort_dir },
    }),

  importResidentsCsv: async ({ token, file }) => {
    const form = new FormData();
    form.append('file', file);
    return request('/residents/import', { method: 'POST', token, body: form });
  },

  getResident: ({ token, id }) => request(`/residents/${encodeURIComponent(id)}`, { method: 'GET', token }),

  createResident: ({ token, resident }) => request('/residents', { method: 'POST', token, body: resident }),

  updateResident: ({ token, id, resident }) =>
    request(`/residents/${encodeURIComponent(id)}`, { method: 'PUT', token, body: resident }),

  deleteResident: ({ token, id }) =>
    request(`/residents/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
};
