
import "./App.css";
import { useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import RoleSelection from "./pages/RoleSelection";
import OrganizerLogin from "./pages/OrganizerLogin";
import OrganizerDashboard from "./pages/OrganizerDashboard";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) return null;

      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  });

  const [selectedRole, setSelectedRole] = useState(null);

  const handleLogin = () => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setSelectedRole(null);
  };

  if (user) {
    if (user.role === "ORGANIZER") {
      return <OrganizerDashboard user={user} onLogout={handleLogout} />;
    }

    if (user.role === "STUDENT") {
      return <Home />;
    }

    // Avoid displaying the student home for an unknown role.
    handleLogout();
    return null;
  }

  if (!selectedRole) {
    return <RoleSelection onSelectRole={setSelectedRole} />;
  }

  if (selectedRole === "student") {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setSelectedRole(null)}
      />
    );
  }

  if (selectedRole === "organizer") {
    return (
      <OrganizerLogin
        onLogin={handleLogin}
        onBack={() => setSelectedRole(null)}
      />
    );
  }

  return (
    <div>
      <button onClick={() => setSelectedRole(null)}>
        ← Back to role selection
      </button>
      <h2>Faculty Login</h2>
      <p>This login will be implemented in a later phase.</p>
    </div>
  );
}

export default App;
