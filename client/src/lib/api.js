import { useAuth } from '../store/auth.js';

export class ApiError extends Error { constructor(status, body) { super(body?.error || `http_${status}`); this.status = status; this.body = body; } }

export async function api(path, { method = 'GET', body, form, signal } = {}) {
  const token = useAuth.getState().token;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined), signal });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && token) useAuth.getState().logout();
  if (!r.ok) throw new ApiError(r.status, data);
  return data;
}
