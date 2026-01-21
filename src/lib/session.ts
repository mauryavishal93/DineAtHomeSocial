export type SessionRole = "ADMIN" | "HOST" | "GUEST";

const ACCESS_TOKEN_KEY = "dah_access_token";
const ROLE_KEY = "dah_role";
const SESSION_CHANGE_EVENT = "dah_session_change";

function hasWindow() {
  return typeof window !== "undefined";
}

// Dispatch custom event when session changes
function dispatchSessionChange() {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

export function getAccessToken(): string | null {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRole(): SessionRole | null {
  if (!hasWindow()) return null;
  const v = window.localStorage.getItem(ROLE_KEY);
  if (v === "ADMIN" || v === "HOST" || v === "GUEST") return v;
  return null;
}

export function setSession(input: { accessToken: string; role: SessionRole }) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  window.localStorage.setItem(ROLE_KEY, input.role);
  dispatchSessionChange();
}

export function clearSession() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  dispatchSessionChange();
}

