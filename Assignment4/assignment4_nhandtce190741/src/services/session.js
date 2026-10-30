export const TOKEN_KEY = "bugdesk.token";
export const SESSION_EXPIRED = "bugdesk:session-expired";

export function readIdentity(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !payload.id ||
      !payload.email ||
      !["admin", "moderator", "user"].includes(payload.role) ||
      !Number.isFinite(payload.exp) ||
      payload.exp * 1000 <= Date.now()
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}
export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED));
}
