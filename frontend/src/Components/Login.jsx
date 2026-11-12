import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("victim");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const userData = {
      email: email.trim(),
      role,
      password
    };

    if (mode === "login") {
      if (onLogin) {
        onLogin(userData);
      } else {
        setError("Login form is ready. Backend connection is pending.");
      }
    } else {
      if (onRegister) {
        onRegister(userData);
      } else {
        setError("Registration form is ready. Backend connection is pending.");
      }
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
            <label>Select your role</label>

            <div className="role-options">
              {[
                { id: "victim", label: "Citizen", icon: "👤" },
                { id: "responder", label: "Responder", icon: "🚑" },
                { id: "admin", label: "Authority", icon: "🏢" }
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

            <button type="submit" className="login-submit">
              {mode === "login" ? "Sign In →" : "Create Account →"}
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