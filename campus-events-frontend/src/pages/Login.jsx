import { useState } from "react";

function Login({ onLogin, onBack }) {
  // Step state: 'check' (email lookup), 'login' (password if exists), 'signup' (details if new)
  const [step, setStep] = useState("check");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student"); // default role for sign-up
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Step 1: Check if email exists in database
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify email");
        return;
      }

      if (data.exists) {
        setStep("login");
        setMessage(`Welcome back! (${data.role} account detected)`);
      } else {
        setStep("signup");
        setMessage("No account found. Please fill in your details to sign up.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Step 2A: Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      // Determine endpoint based on email/role or route via student/organizer login
      let loginUrl = "http://localhost:3000/student/login";
      if (email.includes("organizer")) loginUrl = "http://localhost:3000/organizer/login";
      else if (email.includes("faculty")) loginUrl = "http://localhost:3000/faculty/login";

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      onLogin();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Step 2B: Handle Signup (Account Creation)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !password.trim()) {
      setError("Name and password are required");
      return;
    }

    try {
      setLoading(true);
      let signupUrl = "http://localhost:3000/student/signup";
      let payload = { name, email, password };

      if (role === "organizer") {
        signupUrl = "http://localhost:3000/organizer/signup";
        payload.club_id = 1; // Default club or let them choose if needed
      } else if (role === "faculty") {
        signupUrl = "http://localhost:3000/faculty/signup";
        payload.club_id = 1;
      }

      const response = await fetch(signupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sign up failed");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      onLogin();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
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

        <div className="login-icon">
          {step === "check" && "🔍"}
          {step === "login" && "🎓"}
          {step === "signup" && "✨"}
        </div>

        <h2>
          {step === "check" && "Sign In or Register"}
          {step === "login" && "Welcome Back"}
          {step === "signup" && "Create Account"}
        </h2>

        <p className="login-subtitle">
          {step === "check" && "Enter your email to check your account status."}
          {step === "login" && `Logging in as ${email}`}
          {step === "signup" && `Setting up account for ${email}`}
        </p>

        {/* STEP 1: CHECK EMAIL */}
        {step === "check" && (
          <form onSubmit={handleCheckEmail} className="login-form">
            <div className="login-field">
              <label htmlFor="user-email">Email address</label>
              <input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}
            {message && <p className="login-subtitle" style={{ color: "#a855f7" }}>{message}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Checking..." : "Continue →"}
            </button>
          </form>
        )}

        {/* STEP 2A: LOGIN (Password prompt) */}
        {step === "login" && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}
            {message && <p className="login-subtitle" style={{ color: "#a855f7" }}>{message}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in..." : "Login to your account →"}
            </button>

            <button
              type="button"
              className="back-button"
              style={{ marginTop: "10px", width: "100%", textAlign: "center" }}
              onClick={() => { setStep("check"); setError(""); setMessage(""); }}
            >
              ← Change Email
            </button>
          </form>
        )}

        {/* STEP 2B: SIGNUP (Details prompt) */}
        {step === "signup" && (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="user-name">Full Name</label>
              <input
                id="user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivers"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="new-password">Create Password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <option value="student">Student</option>
                <option value="organizer">Club Organizer</option>
                <option value="faculty">Faculty Approver</option>
              </select>
            </div>

            {error && <p className="login-error">{error}</p>}
            {message && <p className="login-subtitle" style={{ color: "#a855f7" }}>{message}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Creating account..." : "Complete Signup & Login →"}
            </button>

            <button
              type="button"
              className="back-button"
              style={{ marginTop: "10px", width: "100%", textAlign: "center" }}
              onClick={() => { setStep("check"); setError(""); setMessage(""); }}
            >
              ← Change Email
            </button>
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