
function RoleSelection({ onSelectRole }) {
  return (
    <div className="role-selection">
      <header className="role-header">
        <h1>
          Campus<span>Events</span>
        </h1>
        <p>Your campus. Your events. All in one place.</p>
      </header>

      <main className="role-main">
        <h2>Welcome!</h2>
        <p>Choose how you'd like to sign in.</p>

        <div className="role-cards">
          <button
            className="role-card"
            onClick={() => onSelectRole("student")}
          >
            <span className="role-icon">🎓</span>
            <h3>Student</h3>
            <p>Discover and bookmark campus events.</p>
            <span className="role-action">Student Login →</span>
          </button>

          <button
            className="role-card"
            onClick={() => onSelectRole("organizer")}
          >
            <span className="role-icon">📅</span>
            <h3>Organizer</h3>
            <p>Create and manage campus events.</p>
            <span className="role-action">Organizer Login →</span>
          </button>

          <button
            className="role-card"
            onClick={() => onSelectRole("faculty")}
          >
            <span className="role-icon">👩‍🏫</span>
            <h3>Faculty</h3>
            <p>Review and approve campus events.</p>
            <span className="role-action">Faculty Login →</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default RoleSelection;
