export async function apiFetch<T>(
  path: string,
  opts?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts?.headers ?? {})
      }
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: T; error?: string }
      | null;

    if (!res.ok) {
      return { ok: false, error: json?.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: (json?.data ?? (null as T)) as T };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Request failed"
    };
  }
}

