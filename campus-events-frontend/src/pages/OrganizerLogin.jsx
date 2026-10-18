
import { useState } from "react";

function OrganizerLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/organizer/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Login failed. Check your credentials."
        );
      }

      if (!data.token || data.user?.role !== "ORGANIZER") {
        throw new Error("The server returned an invalid login response.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running on port 3000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organizer-login-page">
      <button
        type="button"
        className="organizer-back-button"
        onClick={onBack}
      >
        ← Back to role selection
      </button>

      <div className="organizer-login-card">
        <div className="organizer-login-icon">📅</div>
        <h1>Organizer Login</h1>
        <p>Manage your campus events in one place.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="organizer-email">Email address</label>
          <input
            id="organizer-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="organizer-password">Password</label>
          <input
            id="organizer-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="organizer-login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="organizer-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="organizer-login-footer">
          Campus<span>Events</span>
        </p>
      </div>
    </div>
  );
}

export default OrganizerLogin;
