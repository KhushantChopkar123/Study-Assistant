
import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onSwitchToSignup, onBackHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      await onLogin();
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

      <div className="auth-card login-card">

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
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1>Good to see you.</h1>
          <p className="auth-subtitle">
            Log in to continue your learning journey.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
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
                Logging in...
              </>
            ) : (
              <>
                Login to Study Assistant
                <span className="auth-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToSignup}
          >
            Sign up
          </button>
        </div>

        <div className="auth-bottom-note">
          Your space for ideas, learning & AI.
        </div>

      </div>
    </div>
  );
}

export default Login;
