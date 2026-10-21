import { useState } from "react";

function DisasterForm({ onSubmit }) {
  const [disasterType, setDisasterType] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [peopleAffected, setPeopleAffected] = useState("");
  const [description, setDescription] = useState("");
  const [assistance, setAssistance] = useState("Medical Aid");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!disasterType.trim() || !location.trim()) {
      alert("Please enter disaster type and location.");
      return;
    }

    const report = {
      id: Date.now(),
      disasterType,
      location,
      severity,
      peopleAffected: Number(peopleAffected) || 0,
      description,
      assistance,
      status: "Reported",
      createdAt: new Date().toLocaleString(),
    };

    onSubmit(report);

    setDisasterType("");
    setLocation("");
    setSeverity("Low");
    setPeopleAffected("");
    setDescription("");
    setAssistance("Medical Aid");
  };

  return (
    <div>
      <h2>Report an Incident</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Disaster Type (e.g. Earthquake)"
          value={disasterType}
          onChange={(e) => setDisasterType(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <br /><br />

        <label>Severity: </label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <br /><br />

        <input
          type="number"
          placeholder="Number of people affected"
          min="0"
          value={peopleAffected}
          onChange={(e) => setPeopleAffected(e.target.value)}
        />

        <br /><br />

        <label>Assistance Required: </label>
        <select
          value={assistance}
          onChange={(e) => setAssistance(e.target.value)}
        >
          <option>Medical Aid</option>
          <option>Food and Water</option>
          <option>Rescue Team</option>
          <option>Shelter</option>
          <option>Evacuation</option>
          <option>Other</option>
        </select>

        <br /><br />

        <textarea
          placeholder="Describe the incident and assistance required"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
        />

        <br /><br />

        <button type="submit">Submit Report</button>
      </form>

      <hr />

      <h3>Live Preview</h3>
      <p>Type: {disasterType}</p>
      <p>Location: {location}</p>
      <p>Severity: {severity}</p>
      <p>People affected: {peopleAffected || "Not specified"}</p>
      <p>Assistance: {assistance}</p>
      <p>Description: {description || "Not provided"}</p>
    </div>
  );
}

export default DisasterForm;