import { api } from "../api/client";

export const signup = async (values) =>
  (await api.post("/users/signup", values)).data;
export const signin = async (values) =>
  (await api.post("/users/signin", values)).data;
export const fetchReports = async (signal) =>
  (await api.get("/reports", { requiresAuth: true, signal })).data;
export const createReport = async (values) =>
  (await api.post("/reports", values, { requiresAuth: true })).data;
