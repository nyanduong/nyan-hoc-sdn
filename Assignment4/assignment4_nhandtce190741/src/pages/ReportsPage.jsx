import { useEffect, useState } from "react";
import { fetchReports } from "../services/api";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Feedback from "../components/Feedback";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setReports([]);
    setLoading(true);
    setError('');
    fetchReports(controller.signal).then((data) => {
      if (!Array.isArray(data)) throw new Error('The server returned an unexpected reports format.');
      if (!controller.signal.aborted) setReports(data);
    }).catch((err) => {
      if (!controller.signal.aborted) setError(errorMessage(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [user.id, revision]);

  return <>
    <h1 className="h3 mb-3">My reports</h1>
    {loading ? <p role="status">Loading your reports…</p>
      : error ? <><Feedback>{error}</Feedback><button className="btn btn-secondary" onClick={() => setRevision((n) => n + 1)}>Try again</button></>
        : reports.length === 0 ? <div className="alert alert-info" role="status">No reports are assigned to you.</div>
          : <div className="table-responsive"><table className="table table-bordered table-striped align-middle">
            <thead><tr><th scope="col">Title</th><th scope="col">Project</th><th scope="col">Severity</th><th scope="col">Status</th><th scope="col">Assigned To</th></tr></thead>
            <tbody>{reports.map((report) => <tr key={report._id}><td className="text-break">{report.title}</td><td className="text-break">{report.project}</td><td>{report.severity}</td><td>{report.status}</td><td>{report.assignedTo?.username || report.assignedTo?.email || 'Unavailable user'}</td></tr>)}</tbody>
          </table></div>}
  </>;
}
