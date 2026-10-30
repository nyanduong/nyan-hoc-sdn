import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Forbidden from "../pages/Forbidden";

export default function ProtectedRoute({ adminOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return (
      <Navigate to="/signin" state={{ from: location.pathname }} replace />
    );
  if (adminOnly && user.role !== "admin") return <Forbidden />;
  return <Outlet />;
}
