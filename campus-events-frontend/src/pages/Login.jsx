import { useState } from "react";

function Login({ selectedRole, onLogin, onBack }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const roleName =
    selectedRole === "faculty"
      ? "Faculty"
      : selectedRole === "organizer"
      ? "Organizer"
      : "Student";
  console.log("Selected role:", selectedRole);
  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3000/api/auth/${selectedRole}/login`,
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
        setError(data.error || data.message || "Login failed");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    resetMessages();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:3000/api/auth/student/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Signup failed");
        return;
      }

      setMessage("Account created successfully! Please log in.");

      setPassword("");
      setConfirmPassword("");
      setMode("login");

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

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3000/api/auth/${selectedRole}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Unable to send OTP");
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

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3000/api/auth/${selectedRole}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "OTP verification failed");
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

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3000/api/auth/${selectedRole}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
        setError(data.error || data.message || "Password reset failed");
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

  const renderInput = (
    label,
    id,
    type,
    value,
    setter,
    placeholder
  ) => (
    <div className="login-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        required
      />
    </div>
  );

  const renderSubmitButton = (text, loadingText) => (
    <button
      type="submit"
      className="login-submit"
      disabled={loading}
    >
      {loading ? loadingText : text}
    </button>
  );

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

        <h2>
          {mode === "login" && `${roleName} Login`}
          {mode === "signup" && "Student Signup"}
          {mode === "forgot-password" && "Forgot Password"}
          {mode === "verify-otp" && "Verify OTP"}
          {mode === "reset-password" && "Reset Password"}
        </h2>

        <p className="login-subtitle">
          {mode === "login" && `Sign in to your ${roleName.toLowerCase()} account.`}
          {mode === "signup" && "Create your student account."}
          {mode === "forgot-password" && "Enter your registered email address."}
          {mode === "verify-otp" && "Enter the 6-digit OTP sent to your email."}
          {mode === "reset-password" && "Choose a new password for your account."}
        </p>

        {message && <p className="login-success">{message}</p>}
        {error && <p className="login-error">{error}</p>}

        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            {renderInput("Email address", "user-email", "email", email, setEmail, "you@example.com")}
            {renderInput("Password", "user-password", "password", password, setPassword, "Enter your password")}

            {renderSubmitButton("Login →", "Signing in...")}

            <button
              type="button"
              className="back-button"
              onClick={() => {
                resetMessages();
                setMode("forgot-password");
              }}
            >
              Forgot Password?
            </button>

            {selectedRole === "student" && (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode("signup");
                  }}
                >
                  Sign up
                </button>
              </p>
            )}
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="login-form">
            {renderInput("Full name", "signup-name", "text", name, setName, "Enter your name")}
            {renderInput("Email address", "signup-email", "email", email, setEmail, "you@example.com")}
            {renderInput("Password", "signup-password", "password", password, setPassword, "At least 8 characters")}
            {renderInput("Confirm password", "signup-confirm-password", "password", confirmPassword, setConfirmPassword, "Re-enter your password")}

            {renderSubmitButton("Create Account", "Creating account...")}

            <button
              type="button"
              className="back-button"
              onClick={() => {
                resetMessages();
                setMode("login");
              }}
            >
              Already have an account? Login
            </button>
          </form>
        )}

        {mode === "forgot-password" && (
          <form onSubmit={handleForgotPassword} className="login-form">
            {renderInput("Registered email", "forgot-email", "email", email, setEmail, "you@example.com")}

            {renderSubmitButton("Send OTP", "Sending OTP...")}

            <button
              type="button"
              className="back-button"
              onClick={() => {
                resetMessages();
                setMode("login");
              }}
            >
              Back to Login
            </button>
          </form>
        )}

        {mode === "verify-otp" && (
          <form onSubmit={handleVerifyOTP} className="login-form">
            {renderInput("6-digit OTP", "verify-otp", "text", otp, setOtp, "Enter OTP")}

            {renderSubmitButton("Verify OTP", "Verifying...")}

            <button
              type="button"
              className="back-button"
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
          <form onSubmit={handleResetPassword} className="login-form">
            {renderInput("New password", "new-password", "password", password, setPassword, "Enter new password")}
            {renderInput("Confirm new password", "confirm-new-password", "password", confirmPassword, setConfirmPassword, "Confirm new password")}

            {renderSubmitButton("Reset Password", "Resetting password...")}
          </form>
        )}

        <p className="login-footer">
          Your campus life, all in one place.
        </p>
      </div>
    </div>
  );
}

export default Login;
