import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <nav
        className="navbar navbar-expand bg-light border-bottom"
        aria-label="Main navigation"
      >
        <div className="container flex-wrap gap-3">
          <Link className="navbar-brand" to="/reports">
            Bug Report Management
          </Link>
          <div className="navbar-nav flex-row gap-3">
            <NavLink className="nav-link" to="/reports" end>
              My reports
            </NavLink>
            {user.role === "admin" && (
              <NavLink className="nav-link" to="/reports/create">
                Create report
              </NavLink>
            )}
          </div>
          <button
            className="btn btn-outline-secondary ms-sm-auto"
            onClick={() => {
              logout();
              navigate("/signin", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="container py-4">
        <div className="small text-body-secondary mb-4 text-break">
          <div>
            Account: <span>{user.email}</span> ({user.role})
          </div>
          <div>
            My user ID: <code>{user.id}</code>
          </div>
        </div>
        <Outlet key={user.id} />
      </main>
    </>
  );
}
