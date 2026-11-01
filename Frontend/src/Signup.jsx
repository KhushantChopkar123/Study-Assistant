
import { useState } from "react";
import "./Signup.css";

function Signup({ onSignup, onSwitchToLogin, onBackHome }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://study-assistant-111.onrender.com/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Signup creates a logged-in session
      await onSignup();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Home button - outside auth card */}
      <button
        type="button"
        className="auth-home-link"
        onClick={onBackHome}
      >
        🤖 Home
      </button>

      <div className="auth-card signup-card">

        {/* Brand */}
        <div className="auth-brand">
          <div className="brand-icon">✦</div>
          <span>
            Study
            <span className="brand-highlight"> Assistant</span>
          </span>
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <p className="auth-eyebrow">GET STARTED</p>
          <h1>Create your account</h1>
          <p className="auth-subtitle">
            Your personal learning assistant starts here.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup}>
          <div className="auth-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={100}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <span className="auth-hint">
              Use at least 8 characters.
            </span>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <span className="auth-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToLogin}
          >
            Login
          </button>
        </div>

        <div className="auth-bottom-note">
          Your space for ideas, learning & AI.
        </div>

      </div>
    </div>
  );
}

export default Signup;
