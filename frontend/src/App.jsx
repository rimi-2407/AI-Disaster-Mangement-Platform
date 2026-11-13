
import { useState } from "react";
import Header from "./Components/Header";
import DisasterForm from "./Components/DisasterForm";
import Login from "./Components/Login";
import Citizendash from "./Components/Citizendash";
import ResponderDashboard from "./Components/ResponderDashboard";
import { apiRequest } from "./api";

function App() {
  const [reports, setReports] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  // Login using the backend
  const handleLogin = async (userData) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: userData.email,
        password: userData.password,
      },
    });

    const accessToken = data.access_token;

    setToken(accessToken);
    setCurrentUser(data.user);

    // Fetch emergency reports
    const reportsData = await apiRequest("/api/reports/", {
      method: "GET",
      token: accessToken,
    });

    setReports(
      (reportsData.reports || []).map((report) => ({
        ...report,
        submittedBy:
          data.user.role === "citizen" ? data.user.email : "Citizen",
      }))
    );

    // Fetch all assignments for responders
    if (data.user.role === "responder") {
      const assignmentsData = await apiRequest("/api/assignments/", {
        method: "GET",
        token: accessToken,
      });

      setAssignments(assignmentsData.assignments || []);
    } else {
      setAssignments([]);
    }
  };

  // Register and automatically log in
  const handleRegister = async (userData) => {
    if (userData.role === "responder") {
      await apiRequest("/api/responders/register", {
        method: "POST",
        body: {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          location: userData.location,
          specialisation: userData.specialisation,
        },
      });
    } else {
      await apiRequest("/api/auth/register", {
        method: "POST",
        token: token,
        body: {
          username: userData.username,
          email: userData.email,
          password: userData.password,
        },
      });
    }

    await handleLogin(userData);
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setReports([]);
    setAssignments([]);
  };

  // Show login page before entering dashboard
  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  // Add a newly submitted report
  const handleReportSubmit = async (report) => {
    try {
      const assistance = Array.isArray(report.assistanceNeeds)
        ? report.assistanceNeeds.join(", ")
        : report.assistance || report.assistanceNeeded || "";

      const response = await apiRequest("/api/reports/", {
        method: "POST",
        token: token,
        body: {
          disasterType: report.disasterType,
          location: report.location,
          severity: report.severity,
          peopleAffected: Number(report.peopleAffected) || 0,
          assistance: assistance,
          description: report.description || "",
          latitude: report.latitude ?? null,
          longitude: report.longitude ?? null,
        },
      });

      const savedReport = response.report;

      setReports((previousReports) => [
        ...previousReports,
        {
          ...savedReport,
          submittedBy: currentUser.email,
        },
      ]);

      alert("Emergency report submitted successfully!");
    } catch (error) {
      alert(error.message || "Failed to submit emergency report.");
    }
  };

  // Update assignment status through the backend
  const handleUpdateAssignmentStatus = async (
    assignmentId,
    newStatus
  ) => {
    try {
      const response = await apiRequest(
        `/api/assignments/${assignmentId}/status`,
        {
          method: "PATCH",
          token: token,
          body: {
            status: newStatus,
          },
        }
      );

      setAssignments((previousAssignments) =>
        previousAssignments.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                ...(response.assignment || {}),
                status: newStatus,
              }
            : assignment
        )
      );

      alert("Assignment status updated successfully!");
    } catch (error) {
      alert(error.message || "Failed to update assignment status.");
    }
  };

  // Show citizen dashboard
  if (currentUser.role === "citizen") {
    return (
      <Citizendash
        user={currentUser}
        reports={reports}
        onReportSubmit={handleReportSubmit}
        onLogout={handleLogout}
      />
    );
  }

  // Show responder dashboard
  if (currentUser.role === "responder") {
    return (
      <ResponderDashboard
        user={currentUser}
        reports={reports}
        assignments={assignments}
        onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
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
    citizen: "Citizen",
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
          Welcome, <strong>{roleNames[currentUser.role] || "User"}</strong>
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
