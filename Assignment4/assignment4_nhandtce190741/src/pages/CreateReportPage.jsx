import { useState } from "react";
import { Link } from "react-router-dom";
import { createReport } from "../services/api";
import { errorMessage } from "../api/client";
import Feedback from "../components/Feedback";

export default function CreateReportPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || pending) return;
    const values = Object.fromEntries(
      [...new FormData(form)].map(([key, value]) => [key, value.trim()]),
    );
    if (Object.values(values).some((value) => !value)) {
      setError("Please complete every required field.");
      return;
    }
    setPending(true);
    setError("");
    setSuccess(null);
    try {
      const result = await createReport(values);
      setSuccess(result);
      form.reset();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="row">
      <div className="col-12 col-lg-8">
        <h1 className="h3 mb-3">Create report</h1>
        <Feedback>{error}</Feedback>
        {success && (
          <Feedback type="success">
            <strong>{success.message || "Report created successfully"}</strong>
            {success.report && (
              <div>Status: {success.report.status || "open"}</div>
            )}
          </Feedback>
        )}
        <form onSubmit={submit}>
          <fieldset disabled={pending}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">
                Title
              </label>
              <input
                id="title"
                name="title"
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="4"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="severity" className="form-label">
                Severity
              </label>
              <select
                id="severity"
                name="severity"
                className="form-select"
                defaultValue="low"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="project" className="form-label">
                Project
              </label>
              <input
                id="project"
                name="project"
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="assignedTo" className="form-label">
                Assigned To (User ID)
              </label>
              <input
                id="assignedTo"
                name="assignedTo"
                className="form-control"
                pattern="[a-fA-F0-9]{24}"
                title="Enter a valid 24-character MongoDB user ID"
                aria-describedby="assigned-help"
                required
              />
              <div id="assigned-help" className="form-text">
                Enter the ID of an existing account with role user. Users can
                find their ID after signing in.
              </div>
            </div>
            <button className="btn btn-primary me-2" type="submit">
              {pending ? "Creating…" : "Create report"}
            </button>
            <Link className="btn btn-secondary" to="/reports">
              Cancel
            </Link>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
