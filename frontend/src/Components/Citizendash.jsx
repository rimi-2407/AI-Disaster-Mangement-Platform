import { useState } from "react";
import Header from "./Header";
import DisasterForm from "./DisasterForm";
import "./Citizendash.css";

function Citizendash({ user, reports, onReportSubmit, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");

  const myReports = reports.filter(
    (report) => report.submittedBy === user.email
  );

  const pendingReports = myReports.filter(
    (report) => report.status !== "Resolved"
  );

  const resolvedReports = myReports.filter(
    (report) => report.status === "Resolved"
  );

  const scrollToReport = () => {
    setActiveSection("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="citizen-dashboard">
      <Header />

      <div className="citizen-topbar">
        <div>
          <span className="citizen-role">CITIZEN PORTAL</span>
          <h2>Welcome back!</h2>
          <p>{user.email}</p>
        </div>

        <button className="citizen-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <nav className="citizen-nav">
        {[
          ["overview", "Overview"],
          ["report", "Report Emergency"],
          ["reports", "My Reports"],
          ["safety", "Safety Centre"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={activeSection === id ? "active" : ""}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="citizen-main">
        {activeSection === "overview" && (
          <>
            <section className="citizen-hero">
              <div>
                <span>YOUR SAFETY MATTERS</span>
                <h1>Help is stronger when we act together.</h1>
                <p>
                  Report emergencies, request assistance and
                  keep track of the reports you have submitted.
                </p>
                <button onClick={scrollToReport}>
                  Report an Emergency →
                </button>
              </div>
              <div className="hero-symbol">✦</div>
            </section>

            <section className="citizen-stats">
              <div className="citizen-stat">
                <span>Total Reports</span>
                <h2>{myReports.length}</h2>
              </div>

              <div className="citizen-stat">
                <span>Active Reports</span>
                <h2>{pendingReports.length}</h2>
              </div>

              <div className="citizen-stat">
                <span>Resolved Reports</span>
                <h2>{resolvedReports.length}</h2>
              </div>
            </section>

            <section className="citizen-section">
              <div className="section-heading">
                <div>
                  <h2>Recent Emergency Reports</h2>
                  <p>Updates on emergencies you have reported.</p>
                </div>

                <button onClick={() => setActiveSection("reports")}>
                  View all →
                </button>
              </div>

              <ReportList reports={myReports.slice(-3).reverse()} />
            </section>

            <section className="citizen-help-card">
              <div>
                <h2>Need immediate assistance?</h2>
                <p>
                  If you are in immediate danger, contact local
                  emergency services. Do not wait for an online
                  report to be processed.
                </p>
              </div>
              <span>!</span>
            </section>
          </>
        )}

        {activeSection === "report" && (
          <section className="citizen-section">
            <h1>Report an Emergency</h1>
            <p>
              Provide accurate information so response teams
              can understand the situation.
            </p>

            <div className="citizen-form-card">
              <DisasterForm onSubmit={(report) => {
                onReportSubmit(report);
                setActiveSection("reports");
              }} />
            </div>
          </section>
        )}

        {activeSection === "reports" && (
          <section className="citizen-section">
            <h1>My Emergency Reports</h1>
            <p>Track the reports submitted from your account.</p>

            <ReportList reports={[...myReports].reverse()} />
          </section>
        )}

        {activeSection === "safety" && (
          <section className="citizen-section">
            <h1>Safety Centre</h1>
            <p>Basic reminders for emergency preparedness.</p>

            <div className="safety-grid">
              <div className="safety-card">
                <span>🎒</span>
                <h3>Emergency Kit</h3>
                <p>
                  Keep drinking water, first-aid supplies,
                  a flashlight and essential medicines ready.
                </p>
              </div>

              <div className="safety-card">
                <span>📱</span>
                <h3>Stay Connected</h3>
                <p>
                  Keep your phone charged and follow official
                  emergency announcements.
                </p>
              </div>

              <div className="safety-card">
                <span>🛟</span>
                <h3>Follow Instructions</h3>
                <p>
                  Follow evacuation instructions from authorised
                  emergency response personnel.
                </p>
              </div>

              <div className="safety-card">
                <span>🩹</span>
                <h3>First Aid</h3>
                <p>
                  Keep a first-aid kit accessible and seek
                  professional medical help when needed.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="citizen-footer">
        AI Disaster Intelligence Platform · Citizen Portal
      </footer>
    </div>
  );
}

function ReportList({ reports }) {
  if (reports.length === 0) {
    return (
      <div className="empty-reports">
        <span>📋</span>
        <h3>No reports yet</h3>
        <p>Your submitted emergency reports will appear here.</p>
      </div>
    );
  }

  return (
    <div className="citizen-report-list">
      {reports.map((report) => (
        <article className="citizen-report" key={report.id}>
          <div>
            <h3>{report.disasterType}</h3>
            <p>📍 {report.location}</p>
            <p>Assistance: {report.assistance}</p>
            <p>Severity: {report.severity}</p>
            <p>Status: {report.status || "Reported"}</p>
            <small>{report.createdAt}</small>
          </div>

          <span className={`report-status ${
            report.status === "Resolved" ? "resolved" : "pending"
          }`}>
            {report.status || "Reported"}
          </span>
        </article>
      ))}
    </div>
  );
}

export default Citizendash;
