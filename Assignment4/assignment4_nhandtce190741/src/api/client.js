import axios from "axios";
import { expireSession, getToken, readIdentity } from "../services/session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (config.requiresAuth) {
    const token = getToken();
    if (!readIdentity(token || "")) {
      expireSession();
      return Promise.reject(
        new Error("Your session has expired. Please sign in again."),
      );
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A response for an old account must not clear the new account's session.
    if (
      error.response?.status === 401 &&
      error.config?.requiresAuth &&
      error.config.headers?.Authorization === `Bearer ${getToken()}`
    )
      expireSession();
    return Promise.reject(error);
  },
);

export function errorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ECONNABORTED")
    return "The request timed out. Please try again.";
  if (error.code === "ERR_NETWORK" || error.response?.status >= 502) {
    return "Cannot reach the server. Check that the Assignment 3 backend is running.";
  }
  return error.message || "Something went wrong. Please try again.";
}
