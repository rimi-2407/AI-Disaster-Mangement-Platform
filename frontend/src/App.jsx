import { useState } from "react";
import Header from "./Components/Header";
import DisasterForm from "./Components/DisasterForm";
import Login from "./Components/Login";
import Citizendash from "./Components/Citizendash";
import ResponderDashboard from "./Components/ResponderDashboard";


function App() {
  const [reports, setReports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Demo login and registration
  const handleLogin = (userData) => {
    setCurrentUser({
      email: userData.email,
      role: userData.role,
    });
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Show login page before entering the dashboard
  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleLogin}
      />
    );
  }

  // Add a newly submitted report
  const handleReportSubmit = (report) => {
  setReports((previousReports) => [
    ...previousReports,
    {
      ...report,
      submittedBy: currentUser.email,
    },
  ]);
};

  const handleUpdateStatus = (reportId, newStatus) => {
  setReports((previousReports) =>
    previousReports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: newStatus,
            ...(newStatus === "Accepted"
              ? { assignedTo: currentUser.email }
              : {}),
          }
        : report
    )
  );
};

const handleAssignTask = (reportId, taskId, organization) => {
  setReports((previousReports) =>
    previousReports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            tasks: (report.tasks || []).map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    assignedOrganization: organization,
                    status: "Assigned",
                  }
                : task
            ),
          }
        : report
    )
  );
};
// Show the dedicated citizen dashboard
if (currentUser.role === "victim") {
  return (
    <Citizendash
      user={currentUser}
      reports={reports}
      onReportSubmit={handleReportSubmit}
      onLogout={handleLogout}
    />
  );
}
if (currentUser.role === "responder") {
  return (
    <ResponderDashboard
      user={currentUser}
      reports={reports}
      onUpdateStatus={handleUpdateStatus}
      onAssignTask={handleAssignTask}
      onLogout={handleLogout}
    />
  );
}

  // Group reports from the same location
  const areaReports = {};

  reports.forEach((report) => {
    const locationKey = report.location.trim().toLowerCase();

    if (!areaReports[locationKey]) {
      areaReports[locationKey] = {
        location: report.location.trim(),
        reports: [],
      };
    }

    areaReports[locationKey].reports.push(report);
  });

  // Calculate overall priority of each area
  const assessAreaPriority = (area) => {
    const severityValues = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };

    const areaReportsList = area.reports;

    const averageSeverity =
      areaReportsList.reduce(
        (total, report) =>
          total + (severityValues[report.severity] || 1),
        0
      ) / areaReportsList.length;

    const maxPeopleAffected = Math.max(
      ...areaReportsList.map(
        (report) => Number(report.peopleAffected) || 0
      )
    );

    let score = averageSeverity;

    if (maxPeopleAffected >= 100) {
      score += 3;
    } else if (maxPeopleAffected >= 50) {
      score += 2;
    } else if (maxPeopleAffected >= 10) {
      score += 1;
    }

    if (areaReportsList.length >= 4) {
      score += 2;
    } else if (areaReportsList.length >= 2) {
      score += 1;
    }

    let priority = "Low";

    if (score >= 6) {
      priority = "Critical";
    } else if (score >= 4) {
      priority = "High";
    } else if (score >= 2.5) {
      priority = "Medium";
    }

    return {
      priority,
      score: score.toFixed(1),
      averageSeverity: averageSeverity.toFixed(1),
      reportCount: areaReportsList.length,
      maxPeopleAffected,
    };
  };

  const roleNames = {
    victim: "Citizen",
    responder: "Responder",
    admin: "Authority",
  };

  const priorityColors = {
    Critical: "red",
    High: "orangered",
    Medium: "#b8860b",
    Low: "green",
  };

  return (
    <div>
      <Header />

      {/* User information and logout */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "15px",
          padding: "12px 25px",
          background: "#f3f6f9",
          borderBottom: "1px solid #ddd",
          flexWrap: "wrap",
        }}
      >
        <span>
          Welcome, <strong>{roleNames[currentUser.role]}</strong>
          {" "}({currentUser.email})
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: "9px 17px",
            background: "#173454",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <main style={{ padding: "25px" }}>
        <h1>AI Disaster Intelligence Platform</h1>

        <p>
          Report emergencies and view the automatically calculated
          priority of affected areas.
        </p>

        {/* Incident submission form */}
        <DisasterForm onSubmit={handleReportSubmit} />

        <hr />

        {/* Individual reports */}
        <section>
          <h2>Individual Disaster Reports</h2>

          {reports.length === 0 ? (
            <p>No reports submitted yet. Submit a report to begin.</p>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "12px",
                  margin: "10px 0",
                  borderRadius: "8px",
                }}
              >
                <h3>{report.disasterType}</h3>

                <p>
                  <strong>Location:</strong> {report.location}
                </p>

                <p>
                  <strong>Reported Severity:</strong>{" "}
                  {report.severity}
                </p>

                <p>
                  <strong>People Affected:</strong>{" "}
                  {report.peopleAffected}
                </p>

                <p>
                  <strong>Assistance Required:</strong>{" "}
                  {report.assistance}
                </p>

                <p>
                  <strong>Description:</strong>{" "}
                  {report.description || "Not provided"}
                </p>

                <p>
                  <strong>Status:</strong> {report.status}
                </p>

                <p>
                  <strong>Submitted At:</strong> {report.createdAt}
                </p>
              </div>
            ))
          )}
        </section>

        <hr />

        {/* Location-based priority dashboard */}
        <section>
          <h2>Location-Based Priority Dashboard</h2>

          <p>
            Reports from matching location names are grouped together
            to calculate an overall area priority.
          </p>

          {Object.keys(areaReports).length === 0 ? (
            <p>
              The dashboard will display area assessments after
              you submit your first report.
            </p>
          ) : (
            Object.values(areaReports).map((area) => {
              const assessment = assessAreaPriority(area);

              return (
                <div
                  key={area.location.toLowerCase()}
                  style={{
                    border: "2px solid #777",
                    padding: "16px",
                    margin: "12px 0",
                    borderRadius: "10px",
                  }}
                >
                  <h3>Location: {area.location}</h3>

                  <p>
                    <strong>Reports Received:</strong>{" "}
                    {assessment.reportCount}
                  </p>

                  <p>
                    <strong>Average Reported Severity:</strong>{" "}
                    {assessment.averageSeverity}/4
                  </p>

                  <p>
                    <strong>Highest Reported People Affected:</strong>{" "}
                    {assessment.maxPeopleAffected}
                  </p>

                  <p>
                    <strong>Assessment Score:</strong>{" "}
                    {assessment.score}
                  </p>

                  <h3>
                    Area Priority:{" "}
                    <span
                      style={{
                        color: priorityColors[assessment.priority],
                      }}
                    >
                      {assessment.priority}
                    </span>
                  </h3>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default App;