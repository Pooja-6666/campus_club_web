import "./App.css";
import { useState } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import RoleSelection from "./pages/RoleSelection";
import OrganizerLogin from "./pages/OrganizerLogin";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import FacultyDashboard from "./pages/FacultyDashboard"; // <-- Imported Faculty Dashboard

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

  // ==============================
  // 🔐 ROLE-BASED DASHBOARD ROUTING
  // ==============================
  if (user) {
    if (user.role === "ORGANIZER") {
      return <OrganizerDashboard user={user} onLogout={handleLogout} />;
    }

    if (user.role === "FACULTY") {
      return <FacultyDashboard user={user} onLogout={handleLogout} />;
    }

    if (user.role === "STUDENT") {
      return <Home />;
    }

    // Fallback for unknown role
    handleLogout();
    return null;
  }

  if (!selectedRole) {
    return <RoleSelection onSelectRole={setSelectedRole} />;
  }

  // Student Login / Signup flow
  if (selectedRole === "student") {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setSelectedRole(null)}
      />
    );
  }

  // Organizer Login / Signup flow
  if (selectedRole === "organizer") {
    return (
      <OrganizerLogin
        onLogin={handleLogin}
        onBack={() => setSelectedRole(null)}
      />
    );
  }

  // Faculty Login / Signup flow (now using the unified smart login component)
  if (selectedRole === "faculty") {
    return (
      <Login
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
      <h2>Invalid Role</h2>
    </div>
  );
}

export default App;