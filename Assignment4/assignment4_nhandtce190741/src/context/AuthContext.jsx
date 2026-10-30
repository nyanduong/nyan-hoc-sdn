import { createContext, useContext, useEffect, useState } from "react";
import {
  clearSession,
  getToken,
  readIdentity,
  SESSION_EXPIRED,
  TOKEN_KEY,
} from "../services/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readIdentity(getToken() || ""));
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    function expired() {
      setUser(null);
      setSessionMessage("Your session has expired. Please sign in again.");
    }
    function syncSession(event) {
      if (event.key === TOKEN_KEY || event.key === null) {
        setUser(readIdentity(getToken() || ""));
      }
    }
    window.addEventListener(SESSION_EXPIRED, expired);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(SESSION_EXPIRED, expired);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      clearSession();
      return;
    }
    const timer = setTimeout(
      () => {
        clearSession();
        setUser(null);
        setSessionMessage("Your session has expired. Please sign in again.");
      },
      Math.min(user.exp * 1000 - Date.now(), 2147483647),
    );
    return () => clearTimeout(timer);
  }, [user]);

  function login(token) {
    const identity = readIdentity(token || "");
    if (!identity)
      throw new Error("The server returned an invalid or expired login token.");
    localStorage.setItem(TOKEN_KEY, token);
    setUser(identity);
    setSessionMessage("");
    return identity;
  }
  function logout() {
    clearSession();
    setUser(null);
    setSessionMessage("");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, sessionMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
