import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user } = useAuth();
  return (
    <>
      <Header />
      <main className="container py-4">
        <div className="small text-body-secondary mb-4 text-break">
          <div>
            Account: <span>{user.email}</span> ({user.role})
          </div>
          <div>
            My user ID: <code>{user.id}</code>
          </div>
        </div>
        <div className="content-card">
          <Outlet key={user.id} />
        </div>
      </main>
    </>
  );
}
