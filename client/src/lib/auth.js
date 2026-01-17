const KEY = "dineathome_access_token";

export function setAccessToken(token) {
  if (!token) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(KEY) || "";
}

