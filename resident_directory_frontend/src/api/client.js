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

async function request(path, { method = 'GET', token, body, query } = {}) {
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
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }

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

// PUBLIC_INTERFACE
export const api = {
  /** Convenience typed methods for this app's backend API. */
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { method: 'GET', token }),

  listResidents: ({ token, q, page, limit } = {}) =>
    request('/residents', { method: 'GET', token, query: { q, page, limit } }),

  getResident: ({ token, id }) => request(`/residents/${encodeURIComponent(id)}`, { method: 'GET', token }),

  createResident: ({ token, resident }) => request('/residents', { method: 'POST', token, body: resident }),

  updateResident: ({ token, id, resident }) =>
    request(`/residents/${encodeURIComponent(id)}`, { method: 'PUT', token, body: resident }),

  deleteResident: ({ token, id }) =>
    request(`/residents/${encodeURIComponent(id)}`, { method: 'DELETE', token }),
};
