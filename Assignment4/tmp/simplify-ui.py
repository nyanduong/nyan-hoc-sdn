from pathlib import Path

root = Path('assignment4_nhandtce190741')
files = {
'src/components/Layout.jsx': '''import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <>
    <nav className="navbar navbar-expand bg-light border-bottom" aria-label="Main navigation">
      <div className="container flex-wrap gap-3">
        <Link className="navbar-brand" to="/reports">Bug Report Management</Link>
        <div className="navbar-nav flex-row gap-3">
          <NavLink className="nav-link" to="/reports" end>My reports</NavLink>
          {user.role === 'admin' && <NavLink className="nav-link" to="/reports/create">Create report</NavLink>}
        </div>
        <button className="btn btn-outline-secondary ms-sm-auto" onClick={() => { logout(); navigate('/signin', { replace: true }); }}>Sign out</button>
      </div>
    </nav>
    <main className="container py-4">
      <div className="small text-body-secondary mb-4 text-break">
        <div>Account: <span>{user.email}</span> ({user.role})</div>
        <div>My user ID: <code>{user.id}</code></div>
      </div>
      {/* Reset private page state immediately when another tab changes account. */}
      <Outlet key={user.id} />
    </main>
  </>;
}
''',
'src/pages/AuthPage.jsx': '''import { useState } from "react";
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
  const [error, setError] = useState('');
  if (user) return <Navigate to="/reports" replace />;

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || pending) return;
    const values = Object.fromEntries(new FormData(form));
    values.email = values.email.trim();
    if (register) {
      values.username = values.username.trim();
      if (!values.username) { setError('Please enter a username.'); return; }
    }
    if (!values.password.trim()) { setError('Please enter a password.'); return; }
    setPending(true);
    setError('');
    try {
      if (register) {
        const result = await signup(values);
        navigate('/signin', { replace: true, state: { success: result.message || 'Account created. Please sign in.' } });
      } else {
        const result = await signin(values);
        const identity = login(result.token);
        navigate(location.state?.from === '/reports/create' && identity.role === 'admin' ? '/reports/create' : '/reports', { replace: true });
      }
    } catch (err) { setError(errorMessage(err)); }
    finally { setPending(false); }
  }

  return <main className="container py-5">
    <div className="row justify-content-center"><div className="col-12 col-md-7 col-lg-5">
      <h1 className="h3 mb-4">{register ? 'Sign up' : 'Sign in'}</h1>
      <Feedback>{error}</Feedback>
      {!register && <Feedback type="success">{location.state?.success}</Feedback>}
      {!register && <Feedback type="warning">{sessionMessage}</Feedback>}
      <form onSubmit={submit}>
        <fieldset disabled={pending}>
          {register && <div className="mb-3"><label htmlFor="username" className="form-label">Username</label><input id="username" name="username" className="form-control" autoComplete="username" required /></div>}
          <div className="mb-3"><label htmlFor="email" className="form-label">Email address</label><input id="email" name="email" type="email" className="form-control" autoComplete="email" required /></div>
          <div className="mb-3"><label htmlFor="password" className="form-label">Password</label><input id="password" name="password" type="password" className="form-control" autoComplete={register ? 'new-password' : 'current-password'} required /></div>
          {register && <div className="mb-3"><label htmlFor="role" className="form-label">Role</label><select id="role" name="role" className="form-select" defaultValue="user"><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></div>}
          <button className="btn btn-primary" type="submit">{pending ? 'Submitting…' : register ? 'Create account' : 'Sign in'}</button>
        </fieldset>
      </form>
      <p className="mt-3">{register ? 'Already have an account?' : 'Need an account?'} <Link to={register ? '/signin' : '/signup'}>{register ? 'Sign in' : 'Sign up'}</Link></p>
    </div></div>
  </main>;
}
''',
'src/pages/ReportsPage.jsx': '''import { useEffect, useState } from "react";
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
''',
'src/pages/CreateReportPage.jsx': '''import { useState } from "react";
import { Link } from "react-router-dom";
import { createReport } from "../services/api";
import { errorMessage } from "../api/client";
import Feedback from "../components/Feedback";

export default function CreateReportPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || pending) return;
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
    if (Object.values(values).some((value) => !value)) { setError('Please complete every required field.'); return; }
    setPending(true);
    setError('');
    setSuccess(null);
    try {
      const result = await createReport(values);
      setSuccess(result);
      form.reset();
    } catch (err) { setError(errorMessage(err)); }
    finally { setPending(false); }
  }

  return <div className="row"><div className="col-12 col-lg-8">
    <h1 className="h3 mb-3">Create report</h1>
    <Feedback>{error}</Feedback>
    {success && <Feedback type="success"><strong>{success.message || 'Report created successfully'}</strong>{success.report && <div>Status: {success.report.status || 'open'}</div>}</Feedback>}
    <form onSubmit={submit}><fieldset disabled={pending}>
      <div className="mb-3"><label htmlFor="title" className="form-label">Title</label><input id="title" name="title" className="form-control" required /></div>
      <div className="mb-3"><label htmlFor="description" className="form-label">Description</label><textarea id="description" name="description" className="form-control" rows="4" required /></div>
      <div className="mb-3"><label htmlFor="severity" className="form-label">Severity</label><select id="severity" name="severity" className="form-select" defaultValue="low" required><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
      <div className="mb-3"><label htmlFor="project" className="form-label">Project</label><input id="project" name="project" className="form-control" required /></div>
      <div className="mb-3"><label htmlFor="assignedTo" className="form-label">Assigned To (User ID)</label><input id="assignedTo" name="assignedTo" className="form-control" pattern="[a-fA-F0-9]{24}" title="Enter a valid 24-character MongoDB user ID" aria-describedby="assigned-help" required /><div id="assigned-help" className="form-text">Enter the ID of an existing account with role user. Users can find their ID after signing in.</div></div>
      <button className="btn btn-primary me-2" type="submit">{pending ? 'Creating…' : 'Create report'}</button><Link className="btn btn-secondary" to="/reports">Cancel</Link>
    </fieldset></form>
  </div></div>;
}
''',
'src/pages/Forbidden.jsx': '''import { Link } from "react-router-dom";

export default function Forbidden() {
  return <><h1 className="h3">403 Forbidden</h1><p>Only admins can create reports.</p><Link className="btn btn-secondary" to="/reports">Back to my reports</Link></>;
}
''',
'index.html': '''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Assignment 4 - Bug Report Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'''
}
for name, content in files.items():
    (root / name).write_text(content, encoding='utf-8')

main = root / 'src/main.jsx'
main.write_text(main.read_text(encoding='utf-8').replace('import "./styles.css";\n', ''), encoding='utf-8')
app = root / 'src/App.jsx'
content = app.read_text(encoding='utf-8')
start = content.index('          <main className=')
end = content.index('          </main>', start) + len('          </main>')
content = content[:start] + '''          <main className="container py-4">
            <h1 className="h3">404 Not Found</h1>
            <Link to="/reports">Back to my reports</Link>
          </main>''' + content[end:]
app.write_text(content, encoding='utf-8')
