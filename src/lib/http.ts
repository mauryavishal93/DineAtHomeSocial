let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start refresh
  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include" // Include httpOnly cookie
      });
      
      const json = (await res.json().catch(() => null)) as
        | { data?: { accessToken?: string; role?: string } }
        | null;

      if (res.ok && json?.data?.accessToken) {
        // Update localStorage with new token
        if (typeof window !== "undefined") {
          const { setSession } = await import("./session");
          setSession({
            accessToken: json.data.accessToken,
            role: (json.data.role as any) || "GUEST"
          });
        }
        return json.data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

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
      },
      credentials: "include" // Include cookies for refresh token
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: T; error?: string }
      | null;

    // If 401 and error mentions token expiration, try to refresh
    if (res.status === 401 && (json?.error?.includes("exp") || json?.error?.includes("token") || json?.error?.includes("expired") || json?.error?.includes("timestamp"))) {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Retry the original request with new token
        // Remove old authorization header and add new one
        const originalHeaders = opts?.headers as Record<string, string> | undefined;
        const { authorization, ...otherHeaders } = originalHeaders ?? {};
        const retryRes = await fetch(path, {
          ...opts,
          headers: {
            "Content-Type": "application/json",
            ...(otherHeaders as Record<string, string>),
            authorization: `Bearer ${newToken}`
          },
          credentials: "include"
        });
        const retryJson = (await retryRes.json().catch(() => null)) as
          | { data?: T; error?: string }
          | null;

        if (!retryRes.ok) {
          return { ok: false, error: retryJson?.error ?? `HTTP ${retryRes.status}` };
        }
        return { ok: true, data: (retryJson?.data ?? (null as T)) as T };
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== "undefined") {
          const { clearSession } = await import("./session");
          clearSession();
          window.location.href = "/auth/login";
        }
        return { ok: false, error: "Session expired. Please log in again." };
      }
    }

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

