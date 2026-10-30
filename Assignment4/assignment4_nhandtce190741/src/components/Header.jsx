import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="navbar navbar-expand navbar-dark app-header">
      <div className="container-fluid flex-wrap gap-2">
        <Link className="navbar-brand" to={user ? "/reports" : "/signin"}>
          BUG REPORT MANAGEMENT
        </Link>
        <nav
          className="navbar-nav flex-row gap-4 ms-auto"
          aria-label="Main navigation"
        >
          {user ? (
            <>
              <NavLink className="nav-link" to="/reports" end>
                My reports
              </NavLink>
              {user.role === "admin" && (
                <NavLink className="nav-link" to="/reports/create">
                  Create report
                </NavLink>
              )}
              <button
                className="nav-link border-0 bg-transparent"
                onClick={logout}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink className="nav-link" to="/signup">
                Sign up
              </NavLink>
              <NavLink className="nav-link" to="/signin">
                Sign in
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
