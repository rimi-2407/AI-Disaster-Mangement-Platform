import { useState } from "react";
import Header from "./Header";
import "./ResponderDashboard.css";

function ResponderDashboard({
    user,
    reports,
    onUpdateStatus,
    onAssignTask,
    onLogout,
}) {
  const [filter, setFilter] = useState("All");
  const [selectedOrganizations, setSelectedOrganizations] = useState({});

  const filters = [
    "All",
    "Reported",
    "Accepted",
    "In Progress",
    "Resolved",
  ];

  const visibleReports = reports
    .filter((report) => filter === "All" || report.status === filter)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAtISO || 0) -
        new Date(a.createdAtISO || 0)
    );

  const countStatus = (status) =>
    reports.filter((report) => report.status === status).length;

  const getSeverityClass = (severity) =>
    (severity || "Low").toLowerCase();

  const organizations = [
  "City General Hospital",
  "Relief Food NGO",
  "District Rescue Team",
  "Emergency Shelter Network",
  "Water Relief Unit",
];

  return (
    <div className="responder-page">
      <Header />

      <div className="responder-topbar">
        <div>
          Welcome, <strong>Responder</strong>
          <small>{user.email}</small>
        </div>

        <button className="responder-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <main className="responder-main">
        <div className="responder-heading">
          <div>
            <p className="responder-eyebrow">EMERGENCY RESPONSE CENTRE</p>
            <h1>Responder Dashboard</h1>
            <p>Monitor incoming incidents and manage response progress.</p>
          </div>
          <div className="live-indicator">
            <span></span> Live session
          </div>
        </div>

        <section className="responder-stats">
          <div className="stat-card">
            <span>Total Reports</span>
            <strong>{reports.length}</strong>
          </div>

          <div className="stat-card">
            <span>Awaiting Response</span>
            <strong>{countStatus("Reported")}</strong>
          </div>

          <div className="stat-card">
            <span>Accepted</span>
            <strong>{countStatus("Accepted")}</strong>
          </div>

          <div className="stat-card">
            <span>In Progress</span>
            <strong>{countStatus("In Progress")}</strong>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <strong>{countStatus("Resolved")}</strong>
          </div>
        </section>

        <section className="incident-section">
          <div className="incident-heading">
            <div>
              <h2>Emergency Reports</h2>
              <p>Review citizen-submitted incidents and update their status.</p>
            </div>
            <strong>{visibleReports.length} reports</strong>
          </div>

          <div className="responder-filters">
            {filters.map((item) => (
              <button
                key={item}
                className={filter === item ? "active-filter" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {visibleReports.length === 0 ? (
            <div className="empty-reports">
              <span>📋</span>
              <h3>No reports found</h3>
              <p>
                {reports.length === 0
                  ? "Citizen emergency reports will appear here when submitted."
                  : "There are no reports under this status."}
              </p>
            </div>
          ) : (
            <div className="incident-list">
              {visibleReports.map((report) => (
                <article className="incident-card" key={report.id}>
                  <div className="incident-card-top">
                    <div>
                      <span className="incident-label">INCIDENT REPORT</span>
                      <h3>{report.disasterType}</h3>
                    </div>

                    <span
                      className={`severity-tag ${getSeverityClass(
                        report.severity
                      )}`}
                    >
                      {report.severity || "Low"}
                    </span>
                  </div>

                  <div className="incident-details">
                    <p>
                      <strong>Location:</strong> {report.location}
                    </p>
                    <p>
                      <strong>People affected:</strong>{" "}
                      {report.peopleAffected ?? 0}
                    </p>
                    <p>
                      <strong>Assistance:</strong> {report.assistance}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {report.description || "Not provided"}
                    </p>
                    <p>
                      <strong>Reported by:</strong>{" "}
                      {report.submittedBy || "Citizen"}
                    </p>
                    <p>
                      <strong>Submitted:</strong> {report.createdAt}
                    </p>
                  </div>
                  <div className="incident-details">
                    <p>
                      <strong>Location:</strong> {report.location}
                    </p>
                    <p>
                      <strong>People affected:</strong>{" "}
                      {report.peopleAffected ?? 0}
                    </p>
                    <p>
                      <strong>Assistance:</strong> {report.assistance}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {report.description || "Not provided"}
                    </p>
                    <p>
                      <strong>Reported by:</strong>{" "}
                      {report.submittedBy || "Citizen"}
                    </p>
                    <p>
                      <strong>Submitted:</strong> {report.createdAt}
                    </p>
                  </div>

                  {/* Individual emergency tasks */}
                  {report.tasks && report.tasks.length > 0 && (
  <div className="report-tasks">
    <h4>Individual Emergency Tasks</h4>

    {report.tasks.map((task) => (
      <div className="task-item" key={task.id}>
        <strong>{task.requirement}</strong>

        <p>Status: {task.status}</p>

        <p>
          Organisation:{" "}
          {task.assignedOrganization || "Not assigned"}
        </p>

        <select
          value={
  selectedOrganizations[task.id] ??
  task.assignedOrganization ??
  ""
}
          onChange={(e) =>
            setSelectedOrganizations((previous) => ({
              ...previous,
              [task.id]: e.target.value,
            }))
          }
        >
          <option value="">Select organisation</option>

          {organizations.map((organization) => (
            <option key={organization} value={organization}>
              {organization}
            </option>
          ))}
        </select>

        <button
          className="assign-task-btn"
          disabled={
            !selectedOrganizations[task.id] &&
            !task.assignedOrganization
          }
          onClick={() =>
            onAssignTask(
              report.id,
              task.id,
              selectedOrganizations[task.id] ||
                task.assignedOrganization
            )
          }
        >
          Assign Organisation
        </button>
      </div>
    ))}
  </div>
)}
                  <div className="incident-card-bottom"></div>
                  <div className="incident-card-bottom">
                    <span className={`status-tag ${report.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {report.status}
                    </span>

                    <div className="incident-actions">
                      {report.status === "Reported" && (
                        <button
                          className="accept-btn"
                          onClick={() =>
                            onUpdateStatus(report.id, "Accepted")
                          }
                        >
                          Accept Report
                        </button>
                      )}

                      {report.status === "Accepted" && (
                        <button
                          className="progress-btn"
                          onClick={() =>
                            onUpdateStatus(report.id, "In Progress")
                          }
                        >
                          Start Response
                        </button>
                      )}

                      {report.status === "In Progress" && (
                        <button
                          className="resolve-btn"
                          onClick={() =>
                            onUpdateStatus(report.id, "Resolved")
                          }
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ResponderDashboard;