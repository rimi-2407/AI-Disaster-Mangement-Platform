
import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("citizen");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (!username.trim()) {
        setError("Please enter your username.");
        return;
      }

      if (password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (role === "responder") {
        if (!phone.trim() || !location.trim() || !specialisation.trim()) {
          setError("Please complete all responder details.");
          return;
        }
      }
    }

    const userData = {
      username: username.trim(),
      email: email.trim(),
      password,
      role,
      phone: phone.trim(),
      location: location.trim(),
      specialisation: specialisation.trim(),
    };

    try {
      setLoading(true);

      if (mode === "login") {
        await onLogin(userData);
      } else {
        await onRegister(userData);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <span>DISASTER<span className="brand-light">GUARD</span></span>
        </div>

        <div className="hero-content">
          <p className="eyebrow">AI-POWERED EMERGENCY RESPONSE</p>

          <h1>
            When every
            <br />
            second <span>matters.</span>
          </h1>

          <p className="hero-description">
            Connecting people, emergency responders and authorities
            to coordinate faster, smarter disaster relief.
          </p>

          <div className="hero-points">
            <p>✓ Smart emergency reporting</p>
            <p>✓ Intelligent priority assessment</p>
            <p>✓ Coordinated rescue operations</p>
          </div>
        </div>

        <p className="left-footer">
          Preparedness. Intelligence. Response.
        </p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="mobile-brand">
            ✦ DISASTERGUARD
          </div>

          <p className="form-eyebrow">
            {mode === "login" ? "WELCOME BACK" : "JOIN OUR RESPONSE NETWORK"}
          </p>

          <h2>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </h2>

          <p className="form-subtitle">
            {mode === "login"
              ? "Access your disaster response workspace."
              : "Choose your role and join the platform."}
          </p>

          <form onSubmit={handleSubmit}>

            {mode === "signup" && (
              <>
                <label htmlFor="username">Full name / Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <label>Select your role</label>

                <div className="role-options">
                  {[
                    { id: "citizen", label: "Citizen", icon: "👤" },
                    { id: "responder", label: "Responder", icon: "🚑" }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`role-option ${role === item.id ? "selected" : ""}`}
                      onClick={() => setRole(item.id)}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                {role === "responder" && (
                  <>
                    <label htmlFor="phone">Phone number</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />

                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      type="text"
                      placeholder="City or area"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />

                    <label htmlFor="specialisation">Specialisation</label>
                    <input
                      id="specialisation"
                      type="text"
                      placeholder="e.g. Flood Rescue, Medical Aid"
                      value={specialisation}
                      onChange={(e) => setSpecialisation(e.target.value)}
                      required
                    />
                  </>
                )}
              </>
            )}

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {mode === "signup" && (
              <>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </>
            )}

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In →"
                  : "Create Account →"}
            </button>
          </form>

          <div className="form-switch">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => {
                  setMode("signup");
                  setError("");
                }}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button onClick={() => {
                  setMode("login");
                  setError("");
                }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          <p className="security-note">
            Your safety and information matter to us.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
