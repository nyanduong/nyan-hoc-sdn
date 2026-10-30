import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signin, signup } from "../services/api";
import { errorMessage } from "../api/client";
import Feedback from "../components/Feedback";

export default function AuthPage({ register = false }) {
  const { user, login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/reports" replace />;

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || pending) return;
    const values = Object.fromEntries(new FormData(form));
    values.email = values.email.trim();
    if (register) {
      values.username = values.username.trim();
      if (!values.username) {
        setError("Please enter a username.");
        return;
      }
    }
    if (!values.password.trim()) {
      setError("Please enter a password.");
      return;
    }
    setPending(true);
    setError("");
    try {
      if (register) {
        const result = await signup(values);
        navigate("/signin", {
          replace: true,
          state: {
            success: result.message || "Account created. Please sign in.",
          },
        });
      } else {
        const result = await signin(values);
        const identity = login(result.token);
        navigate(
          location.state?.from === "/reports/create" &&
            identity.role === "admin"
            ? "/reports/create"
            : "/reports",
          { replace: true },
        );
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-7 col-lg-5">
          <h1 className="h3 mb-4">{register ? "Sign up" : "Sign in"}</h1>
          <Feedback>{error}</Feedback>
          {!register && (
            <Feedback type="success">{location.state?.success}</Feedback>
          )}
          {!register && <Feedback type="warning">{sessionMessage}</Feedback>}
          <form onSubmit={submit}>
            <fieldset disabled={pending}>
              {register && (
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    className="form-control"
                    autoComplete="username"
                    required
                  />
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                />
              </div>
              {register && (
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="form-select"
                    defaultValue="user"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              <button className="btn btn-primary" type="submit">
                {pending
                  ? "Submitting…"
                  : register
                    ? "Create account"
                    : "Sign in"}
              </button>
            </fieldset>
          </form>
          <p className="mt-3">
            {register ? "Already have an account?" : "Need an account?"}{" "}
            <Link to={register ? "/signin" : "/signup"}>
              {register ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
