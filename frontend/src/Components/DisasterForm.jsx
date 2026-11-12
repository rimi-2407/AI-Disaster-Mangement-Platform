import { useEffect, useState } from "react";
import "./DisasterForm.css";

function DisasterForm({ onSubmit }) {
  const [disasterType, setDisasterType] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [peopleAffected, setPeopleAffected] = useState("");
  const [description, setDescription] = useState("");

  // Multiple assistance requirements
  const [assistanceNeeds, setAssistanceNeeds] = useState([
    "Medical Aid",
  ]);

  const assistanceOptions = [
    "Medical Aid",
    "Food and Water",
    "Rescue Team",
    "Shelter",
    "Evacuation",
    "Other",
  ];

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add or remove an assistance requirement
  const handleAssistanceChange = (option) => {
    setAssistanceNeeds((previous) =>
      previous.includes(option)
        ? previous.filter((item) => item !== option)
        : [...previous, option]
    );
  };

  // Detect current location
  const detectLocation = () => {
    setLocationMessage("");
    setError("");

    if (!navigator.geolocation) {
      setLocationMessage(
        "Location detection is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        console.log("Latitude:", latitude, "Longitude:", longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: { Accept: "application/json" },
            }
          );

          if (!response.ok) {
            throw new Error("Address lookup failed.");
          }

          const data = await response.json();

          if (!data.display_name) {
            throw new Error("No readable address found.");
          }

          setLocation(data.display_name);
          setLocationMessage(
            "Address detected successfully. You can edit it if needed."
          );
        } catch (err) {
          setLocationMessage(
            "Could not retrieve your address. Please enter it manually."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Please enter your address manually.",
          2: "Location unavailable. Please enter your address manually.",
          3: "Location request timed out. Please try again.",
        };

        setLocationMessage(
          messages[err.code] || "Unable to detect your location."
        );
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // Generate and clean up photo preview
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const imageUrl = URL.createObjectURL(photo);
    setPreview(imageUrl);

    return () => URL.revokeObjectURL(imageUrl);
  }, [photo]);

  // Validate selected photograph
  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setPhoto(selectedFile);
  };

  // Submit emergency report
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!disasterType.trim() || !location.trim()) {
      setError("Please enter the disaster type and location.");
      return;
    }

    if (assistanceNeeds.length === 0) {
      setError("Please select at least one assistance requirement.");
      return;
    }

    if (
      peopleAffected !== "" &&
      (!Number.isInteger(Number(peopleAffected)) ||
        Number(peopleAffected) < 0)
    ) {
      setError(
        "Enter a valid non-negative whole number of people affected."
      );
      return;
    }

    const now = new Date();

    const report = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,

      disasterType: disasterType.trim(),
      location: location.trim(),
      severity,
      peopleAffected: Number(peopleAffected) || 0,
      description: description.trim(),

      // Store each assistance requirement separately
      assistanceNeeds: [...assistanceNeeds],

      // Preserve compatibility with existing dashboards
      assistance: assistanceNeeds.join(", "),
      tasks: assistanceNeeds.map((need) => ({
  id: globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  requirement: need,
  status: "Pending",
  assignedOrganization: null,
})),

      status: "Reported",
      createdAt: now.toLocaleString(),
      createdAtISO: now.toISOString(),

      attachmentName: photo?.name || null,
      attachmentFile: photo || null,
    };

    onSubmit(report);

    setSuccess("Your emergency report has been submitted successfully.");

    // Reset form
    setDisasterType("");
    setLocation("");
    setSeverity("Low");
    setPeopleAffected("");
    setDescription("");
    setAssistanceNeeds(["Medical Aid"]);
    setPhoto(null);

    const fileInput = document.getElementById("incident-photo");
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="disaster-form-container">
      <h2>Report an Incident</h2>

      <p className="form-intro">
        Share accurate details to help response teams understand the emergency.
      </p>

      {error && (
        <div className="form-message error-message">{error}</div>
      )}

      {success && (
        <div className="form-message success-message">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="disaster-form">
        {/* Disaster type */}
        <div className="form-field">
          <label htmlFor="disaster-type">Disaster type *</label>

          <input
            id="disaster-type"
            type="text"
            placeholder="e.g. Earthquake, Fire, Flood"
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
            required
            maxLength={80}
          />
        </div>

        {/* Location */}
        <div className="form-field">
          <label htmlFor="incident-location">Location *</label>

          <input
            id="incident-location"
            type="text"
            placeholder="Enter area, city or coordinates"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            maxLength={200}
          />

          <button
            type="button"
            className="location-button"
            onClick={detectLocation}
            disabled={locationLoading}
          >
            {locationLoading
              ? "Detecting location..."
              : "📍 Detect my location"}
          </button>

          {locationMessage && (
            <small className="field-message">
              {locationMessage}
            </small>
          )}

          <small>Address data © OpenStreetMap contributors</small>
        </div>

        {/* Severity and people affected */}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="severity">Severity</label>

            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="people-affected">People affected</label>

            <input
              id="people-affected"
              type="number"
              placeholder="If known"
              min="0"
              step="1"
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(e.target.value)}
            />
          </div>
        </div>

        {/* Multiple assistance selection */}
        <div className="form-field">
          <label>Assistance required *</label>

          <small>Select all the types of help needed.</small>

          <div className="assistance-options">
            {assistanceOptions.map((option) => (
              <label className="assistance-option" key={option}>
                <input
                  type="checkbox"
                  checked={assistanceNeeds.includes(option)}
                  onChange={() => handleAssistanceChange(option)}
                />

                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="form-field">
          <label htmlFor="description">Incident description</label>

          <textarea
            id="description"
            placeholder="Describe what happened and what help is needed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
          />

          <small>{description.length}/1000 characters</small>
        </div>

        {/* Photograph attachment */}
        <div className="form-field">
          <label htmlFor="incident-photo">
            Attach an incident photograph (optional)
          </label>

          <input
            id="incident-photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />

          <small>Maximum image size: 5 MB.</small>

          {preview && (
            <div className="photo-preview">
              <img
                src={preview}
                alt="Incident attachment preview"
              />

              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  document.getElementById("incident-photo").value = "";
                }}
              >
                Remove photo
              </button>
            </div>
          )}
        </div>

        <button type="submit" className="submit-report-button">
          Submit Emergency Report →
        </button>
      </form>

      {/* Live preview */}
      <div className="report-preview">
        <h3>Live Preview</h3>

        <p>
          <strong>Type:</strong> {disasterType || "Not entered"}
        </p>

        <p>
          <strong>Location:</strong> {location || "Not entered"}
        </p>

        <p>
          <strong>Severity:</strong> {severity}
        </p>

        <p>
          <strong>People affected:</strong>{" "}
          {peopleAffected || "Not specified"}
        </p>

        <p>
          <strong>Assistance:</strong>{" "}
          {assistanceNeeds.join(", ") || "Not selected"}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {description || "Not provided"}
        </p>

        <p>
          <strong>Attachment:</strong> {photo?.name || "None"}
        </p>
      </div>
    </div>
  );
}

export default DisasterForm;
