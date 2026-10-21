import { useState } from "react";
import Header from "./Components/Header";
import DisasterForm from "./Components/DisasterForm";

function App() {
  const [reports, setReports] = useState([]);

  // Add a newly submitted report to the list
  const handleReportSubmit = (report) => {
    setReports((previousReports) => [
      ...previousReports,
      report,
    ]);
  };

  // Group reports from the same location together
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

  // Calculate the overall priority of each area
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

    // Use the highest reported number to avoid blindly
    // adding potentially overlapping affected-person counts.
    const maxPeopleAffected = Math.max(
      ...areaReportsList.map(
        (report) => Number(report.peopleAffected) || 0
      )
    );

    let score = averageSeverity;

    // Add points based on the reported number of people affected
    if (maxPeopleAffected >= 100) {
      score += 3;
    } else if (maxPeopleAffected >= 50) {
      score += 2;
    } else if (maxPeopleAffected >= 10) {
      score += 1;
    }

    // Multiple reports provide additional evidence
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

  return (
    <div>
      <Header />

      <main>
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
                    <strong>Highest Reported Number of People Affected:</strong>{" "}
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
                        color:
                          assessment.priority === "Critical"
                            ? "red"
                            : assessment.priority === "High"
                            ? "orangered"
                            : assessment.priority === "Medium"
                            ? "#b8860b"
                            : "green",
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