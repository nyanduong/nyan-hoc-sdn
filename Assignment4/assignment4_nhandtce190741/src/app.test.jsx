import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { api } from "./api/client";
import { readIdentity, TOKEN_KEY } from "./services/session";

const userId = "507f1f77bcf86cd799439011";
function token(role = "user", expired = false) {
  return `header.${btoa(JSON.stringify({ id: userId, email: "tester@example.com", role, exp: Math.floor(Date.now() / 1000) + (expired ? -1 : 3600) }))}.signature`;
}
function mount(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
function adapter(data, status = 200) {
  return vi.fn(async (config) => {
    const response = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    };
    if (status >= 400)
      throw new AxiosError(
        "Request failed",
        "ERR_BAD_RESPONSE",
        config,
        null,
        response,
      );
    return response;
  });
}
const originalAdapter = api.defaults.adapter;
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  api.defaults.adapter = originalAdapter;
});

describe("Authentication and authorization", () => {
  it("rejects expired and malformed stored tokens", () => {
    expect(readIdentity(token("user", true))).toBeNull();
    expect(readIdentity("broken.token")).toBeNull();
    expect(readIdentity(token("admin")).role).toBe("admin");
  });
  it("redirects a guest from the protected reports route", async () => {
    mount("/reports");
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeTruthy();
  });
  it("blocks non-admin direct navigation without making any request", async () => {
    localStorage.setItem(TOKEN_KEY, token());
    const handler = adapter([]);
    api.defaults.adapter = handler;
    mount("/reports/create");
    expect(await screen.findByText("403 Forbidden")).toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });
  it("clears the token and redirects on a protected 401", async () => {
    localStorage.setItem(TOKEN_KEY, token());
    api.defaults.adapter = adapter({ message: "Invalid token" }, 401);
    mount("/reports");
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeTruthy();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(
      screen.getByText("Your session has expired. Please sign in again."),
    ).toBeTruthy();
  });
  it("displays backend login errors", async () => {
    api.defaults.adapter = adapter({ message: "Invalid credentials" }, 401);
    mount("/signin");
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "incorrect" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form"),
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Invalid credentials",
    );
  });
});

describe("Reports integration", () => {
  it("removes old reports immediately and fetches again when another tab changes account", async () => {
    const tokenA = token();
    const tokenB = `header.${btoa(JSON.stringify({ id: "user-b", email: "b@example.com", role: "user", exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
    localStorage.setItem(TOKEN_KEY, tokenA);
    let resolveB;
    const handler = vi.fn(async (config) => {
      if (config.headers.Authorization === `Bearer ${tokenB}`) {
        return new Promise((resolve) => {
          resolveB = () =>
            resolve({ data: [], status: 200, headers: {}, config });
        });
      }
      return {
        data: [
          {
            _id: "a",
            title: "Private report A",
            project: "A",
            severity: "low",
            status: "open",
            assignedTo: { username: "A" },
          },
        ],
        status: 200,
        headers: {},
        config,
      };
    });
    api.defaults.adapter = handler;
    mount("/reports");
    await screen.findByText("Private report A");
    await act(async () => {
      localStorage.setItem(TOKEN_KEY, tokenB);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: TOKEN_KEY,
          oldValue: tokenA,
          newValue: tokenB,
        }),
      );
    });
    expect(screen.queryByText("Private report A")).toBeNull();
    expect(screen.getByText("b@example.com")).toBeTruthy();
    expect(screen.getByText("Loading your reports…")).toBeTruthy();
    await waitFor(() => expect(resolveB).toBeTypeOf("function"));
    await act(async () => resolveB());
    expect(
      await screen.findByText("No reports are assigned to you."),
    ).toBeTruthy();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("does not restore an old account's delayed response after an account switch", async () => {
    const tokenA = token();
    const tokenB = `header.${btoa(JSON.stringify({ id: "user-b", email: "b@example.com", role: "user", exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
    localStorage.setItem(TOKEN_KEY, tokenA);
    let resolveA;
    api.defaults.adapter = vi.fn(async (config) => {
      if (config.headers.Authorization === `Bearer ${tokenA}`) {
        return new Promise((resolve) => {
          resolveA = () =>
            resolve({
              data: [{ _id: "a", title: "Late private report A" }],
              status: 200,
              headers: {},
              config,
            });
        });
      }
      return { data: [], status: 200, headers: {}, config };
    });
    mount("/reports");
    await waitFor(() => expect(resolveA).toBeTypeOf("function"));
    await act(async () => {
      localStorage.setItem(TOKEN_KEY, tokenB);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: TOKEN_KEY,
          oldValue: tokenA,
          newValue: tokenB,
        }),
      );
    });
    await screen.findByText("No reports are assigned to you.");
    await act(async () => resolveA());
    expect(screen.queryByText("Late private report A")).toBeNull();
  });

  it("ignores a late 401 belonging to the previous session", async () => {
    const oldToken = token();
    const newToken = token("admin");
    localStorage.setItem(TOKEN_KEY, newToken);
    const config = {
      requiresAuth: true,
      headers: { Authorization: `Bearer ${oldToken}` },
    };
    const error = new AxiosError(
      "Expired old session",
      "ERR_BAD_RESPONSE",
      config,
      null,
      { status: 401, config },
    );
    await expect(
      api.interceptors.response.handlers[0].rejected(error),
    ).rejects.toBe(error);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(newToken);
  });

  it("shows loading then backend reports with populated assignee and sends Bearer JWT", async () => {
    const jwt = token();
    localStorage.setItem(TOKEN_KEY, jwt);
    let resolveRequest;
    const handler = vi.fn(
      (config) =>
        new Promise((resolve) => {
          resolveRequest = () =>
            resolve({
              data: [
                {
                  _id: "report1",
                  title: "Login issue",
                  project: "Portal",
                  severity: "high",
                  status: "open",
                  assignedTo: { _id: userId, username: "Nhan" },
                },
              ],
              status: 200,
              headers: {},
              config,
            });
        }),
    );
    api.defaults.adapter = handler;
    mount("/reports");
    expect(screen.getByText("Loading your reports…")).toBeTruthy();
    await waitFor(() => expect(handler).toHaveBeenCalled());
    await act(async () => resolveRequest());
    expect(await screen.findByText("Login issue")).toBeTruthy();
    expect(screen.getByText("Nhan")).toBeTruthy();
    expect(handler.mock.calls[0][0].headers.Authorization).toBe(
      `Bearer ${jwt}`,
    );
  });
  it("shows the empty state and logs out without leaving a token", async () => {
    localStorage.setItem(TOKEN_KEY, token());
    api.defaults.adapter = adapter([]);
    mount("/reports");
    expect(
      await screen.findByText("No reports are assigned to you."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeTruthy();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
  it("shows backend error and recovers when retry succeeds", async () => {
    localStorage.setItem(TOKEN_KEY, token());
    api.defaults.adapter = adapter(
      { message: "Database temporarily unavailable" },
      500,
    );
    mount("/reports");
    expect(
      await screen.findByText("Database temporarily unavailable"),
    ).toBeTruthy();
    api.defaults.adapter = adapter([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("No reports are assigned to you."),
    ).toBeTruthy();
  });
  it("submits exactly the backend create contract without a client-set status", async () => {
    localStorage.setItem(TOKEN_KEY, token("admin"));
    const handler = adapter(
      {
        message: "Report created successfully",
        report: { _id: "new-report", title: "Checkout fails", status: "open" },
      },
      201,
    );
    api.defaults.adapter = handler;
    mount("/reports/create");
    for (const [label, value] of [
      ["Title", "Checkout fails"],
      ["Description", "Clicking pay fails"],
      ["Project", "Store"],
      ["Assigned To (User ID)", userId],
    ]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.submit(
      screen.getByRole("button", { name: "Create report" }).closest("form"),
    );
    expect(await screen.findByText("Report created successfully")).toBeTruthy();
    const config = handler.mock.calls[0][0];
    expect(config.url).toBe("/reports");
    expect(JSON.parse(config.data)).toEqual({
      title: "Checkout fails",
      description: "Clicking pay fails",
      project: "Store",
      severity: "low",
      assignedTo: userId,
    });
  });
});
