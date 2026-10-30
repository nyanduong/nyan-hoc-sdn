import { Link, Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ReportsPage from "./pages/ReportsPage";
import CreateReportPage from "./pages/CreateReportPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/reports" replace />} />
      <Route path="/signin" element={<AuthPage key="signin" />} />
      <Route path="/signup" element={<AuthPage key="signup" register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/reports" element={<ReportsPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/reports/create" element={<CreateReportPage />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <main className="container py-4">
            <h1 className="h3">404 Not Found</h1>
            <Link to="/reports">Back to my reports</Link>
          </main>
        }
      />
    </Routes>
  );
}
