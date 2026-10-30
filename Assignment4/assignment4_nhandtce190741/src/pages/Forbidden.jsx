import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <>
      <h1 className="h3">403 Forbidden</h1>
      <p>Only admins can create reports.</p>
      <Link className="btn btn-secondary" to="/reports">
        Back to my reports
      </Link>
    </>
  );
}
