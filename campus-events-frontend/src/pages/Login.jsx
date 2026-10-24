
import { useState } from "react";

function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        "http://localhost:3000/student/login",
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
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      onLogin();
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    }
  };

  return (
    <div className="login-page">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
      >
        ← Back to role selection
      </button>

      <div className="login-card">
        <div className="login-brand">
          Campus<span>Events</span>
        </div>

        <div className="login-icon">🎓</div>

        <h2>Student Login</h2>

        <p className="login-subtitle">
          Welcome back! Discover what's happening on campus.
        </p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label htmlFor="student-email">Email address</label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="student-password">Password</label>
            <input
              id="student-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit">
            Login to your account →
          </button>
        </form>

        <p className="login-footer">
          Your campus life, all in one place.
        </p>
      </div>
    </div>
  );
}

export default Login;
