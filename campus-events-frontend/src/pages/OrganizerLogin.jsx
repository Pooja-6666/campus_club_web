
import { useState } from "react";

function OrganizerLogin({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/organizer/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Login failed.");
        return;
      }

      if (!data.token || !data.user) {
        setError("Invalid login response from server.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/organizer/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Unable to send OTP.");
        return;
      }

      setMessage(data.message || "OTP sent to your email.");
      setMode("verify-otp");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/organizer/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "OTP verification failed.");
        return;
      }

      setMessage("OTP verified successfully.");
      setMode("reset-password");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetMessages();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/organizer/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            newPassword: password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Password reset failed.");
        return;
      }

      setMessage(data.message || "Password reset successfully.");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setMode("login");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    resetMessages();
    setMode("login");
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

        <h1>
          {mode === "login" && "Organizer Login"}
          {mode === "forgot-password" && "Forgot Password"}
          {mode === "verify-otp" && "Verify OTP"}
          {mode === "reset-password" && "Reset Password"}
        </h1>

        <p>
          {mode === "login" && "Manage your campus events in one place."}
          {mode === "forgot-password" && "Enter your registered email address."}
          {mode === "verify-otp" && "Enter the 6-digit OTP sent to your email."}
          {mode === "reset-password" && "Choose a new password."}
        </p>

        {message && <p className="login-success">{message}</p>}
        {error && (
          <p className="organizer-login-error" role="alert">
            {error}
          </p>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin}>
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

            <button
              type="submit"
              className="organizer-login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              className="organizer-back-button"
              onClick={() => {
                resetMessages();
                setMode("forgot-password");
              }}
            >
              Forgot Password?
            </button>
          </form>
        )}

        {mode === "forgot-password" && (
          <form onSubmit={handleForgotPassword}>
            <label htmlFor="forgot-email">Registered email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <button
              type="submit"
              className="organizer-login-button"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <button type="button" className="organizer-back-button" onClick={goBackToLogin}>
              Back to Login
            </button>
          </form>
        )}

        {mode === "verify-otp" && (
          <form onSubmit={handleVerifyOTP}>
            <label htmlFor="organizer-otp">6-digit OTP</label>
            <input
              id="organizer-otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
              required
            />

            <button
              type="submit"
              className="organizer-login-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="organizer-back-button"
              onClick={() => {
                resetMessages();
                setMode("forgot-password");
              }}
            >
              Back
            </button>
          </form>
        )}

        {mode === "reset-password" && (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />

            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            <button
              type="submit"
              className="organizer-login-button"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="organizer-login-footer">
          Campus<span>Events</span>
        </p>
      </div>
    </div>
  );
}

export default OrganizerLogin;
