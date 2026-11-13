
import { useState } from "react";
import Header from "./Header";
import "./ResponderDashboard.css";

function ResponderDashboard({
  user,
  reports,
  assignments,
  onUpdateAssignmentStatus,
  onLogout,
}) {
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Reported"];

  const visibleReports = reports
    .filter((report) => filter === "All" || report.status === filter)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );

  const countStatus = (status) =>
    assignments.filter((assignment) => assignment.status === status).length;

  const getSeverityClass = (severity) =>
    (severity || "Low").toLowerCase();

  const getReportForAssignment = (assignment) =>
    reports.find((report) => report.id === assignment.emergency_id);

  const getAssignmentAction = (assignment) => {
    if (assignment.status === "assigned") {
      return (
        <button
          className="progress-btn"
          onClick={() =>
            onUpdateAssignmentStatus(assignment.id, "in_progress")
          }
        >
          Start Task
        </button>
      );
    }

    if (assignment.status === "in_progress") {
      return (
        <button
          className="resolve-btn"
          onClick={() =>
            onUpdateAssignmentStatus(assignment.id, "completed")
          }
        >
          Mark Completed
        </button>
      );
    }

    return null;
  };

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
            <p className="responder-eyebrow">
              EMERGENCY RESPONSE CENTRE
            </p>
            <h1>Responder Dashboard</h1>
            <p>
              Monitor emergency incidents and manage your assigned tasks.
            </p>
          </div>

          <div className="live-indicator">
            <span></span> Live session
          </div>
        </div>

        {/* Assignment statistics */}
        <section className="responder-stats">
          <div className="stat-card">
            <span>Total Reports</span>
            <strong>{reports.length}</strong>
          </div>

          <div className="stat-card">
            <span>Total Assignments</span>
            <strong>{assignments.length}</strong>
          </div>

          <div className="stat-card">
            <span>Assigned</span>
            <strong>{countStatus("assigned")}</strong>
          </div>

          <div className="stat-card">
            <span>In Progress</span>
            <strong>{countStatus("in_progress")}</strong>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>{countStatus("completed")}</strong>
          </div>
        </section>

        {/* Emergency reports */}
        <section className="incident-section">
          <div className="incident-heading">
            <div>
              <h2>Emergency Reports</h2>
              <p>
                View all incidents submitted by citizens.
              </p>
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
                Emergency reports will appear here when citizens submit them.
              </p>
            </div>
          ) : (
            <div className="incident-list">
              {visibleReports.map((report) => (
                <article className="incident-card" key={report.id}>
                  <div className="incident-card-top">
                    <div>
                      <span className="incident-label">
                        INCIDENT REPORT #{report.id}
                      </span>
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
                      <strong>Assistance:</strong>{" "}
                      {report.assistance || "Not specified"}
                    </p>

                    <p>
                      <strong>Description:</strong>{" "}
                      {report.description || "Not provided"}
                    </p>

                    <p>
                      <strong>Submitted:</strong>{" "}
                      {report.createdAt || "Not available"}
                    </p>
                  </div>

                  <div className="incident-card-bottom">
                    <span className="status-tag">
                      {report.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Backend assignments */}
        <section className="incident-section">
          <div className="incident-heading">
            <div>
              <h2>Emergency Assignments</h2>
              <p>
                View assignments created by the administration and update
                your own task progress.
              </p>
            </div>

            <strong>{assignments.length} assignments</strong>
          </div>

          {assignments.length === 0 ? (
            <div className="empty-reports">
              <span>📦</span>
              <h3>No assignments yet</h3>
              <p>
                Assignments will appear here when the administration
                allocates emergency response tasks.
              </p>
            </div>
          ) : (
            <div className="incident-list">
              {assignments.map((assignment) => {
                const report = getReportForAssignment(assignment);

                return (
                  <article
                    className="incident-card"
                    key={assignment.id}
                  >
                    <div className="incident-card-top">
                      <div>
                        <span className="incident-label">
                          ASSIGNMENT #{assignment.id}
                        </span>

                        <h3>
                          {report
                            ? report.disasterType
                            : `Emergency #${assignment.emergency_id}`}
                        </h3>
                      </div>

                      <span className="status-tag">
                        {assignment.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="incident-details">
                      <p>
                        <strong>Emergency ID:</strong>{" "}
                        {assignment.emergency_id}
                      </p>

                      <p>
                        <strong>Responder ID:</strong>{" "}
                        {assignment.responder_id}
                      </p>

                      <p>
                        <strong>Resource ID:</strong>{" "}
                        {assignment.resource_id ?? "Not allocated"}
                      </p>

                      <p>
                        <strong>Resource quantity:</strong>{" "}
                        {assignment.resource_quantity}
                      </p>

                      {report && (
                        <>
                          <p>
                            <strong>Location:</strong> {report.location}
                          </p>

                          <p>
                            <strong>Severity:</strong> {report.severity}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="incident-card-bottom">
                      <span className="status-tag">
                        {assignment.status.replace("_", " ")}
                      </span>

                      <div className="incident-actions">
                        {Number(assignment.responder_id) ===
                          Number(user.responder_id) &&
                          getAssignmentAction(assignment)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ResponderDashboard;
