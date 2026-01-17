import { getAccessToken } from "./auth.js";

export async function apiFetch(path, opts = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {})
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...opts, headers });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: json?.error || `HTTP ${res.status}` };
  return { ok: true, data: json?.data };
}

