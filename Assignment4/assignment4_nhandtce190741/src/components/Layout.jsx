import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user } = useAuth();
  return (
    <>
      <Header />
      <main className="container py-4">
        <div className="content-card">
          <Outlet key={user.id} />
        </div>
      </main>
    </>
  );
}
