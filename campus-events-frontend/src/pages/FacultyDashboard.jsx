import { useEffect, useState } from "react";

export default function FacultyDashboard({ user, onLogout }) {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/events/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch pending events");
      setPendingEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const handleAction = async (eventId, action) => {
    try {
      const res = await fetch(`http://localhost:3000/events/${eventId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to ${action} event`);
      // Refresh list
      fetchPendingEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", letterSpacing: "1.5px", color: "#a855f7", fontWeight: "700", textTransform: "uppercase" }}>Faculty Approval Portal</span>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "4px 0 0 0" }}>Welcome, {user?.name || "Faculty"}</h1>
        </div>
        <button onClick={onLogout} style={{ padding: "10px 20px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
          Logout
        </button>
      </div>

      {loading && <p style={{ color: "#94a3b8" }}>Loading pending approvals...</p>}
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {!loading && !error && pendingEvents.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", background: "rgba(30, 41, 59, 0.5)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 style={{ fontSize: "20px", color: "#cbd5e1" }}>All caught up!</h3>
          <p style={{ color: "#64748b" }}>There are no pending club event submissions requiring your approval right now.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
        {pendingEvents.map((event) => (
          <div key={event.event_id} style={{ background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {event.posterUrl && (
              <img src={`http://localhost:3000${event.posterUrl}`} alt={event.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
            )}
            <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "11px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "4px 8px", borderRadius: "6px", fontWeight: "600", textTransform: "uppercase" }}>
                  {event.category || "General"}
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "10px 0 6px 0" }}>{event.title}</h3>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.5", marginBottom: "16px" }}>{event.description}</p>
                <div style={{ fontSize: "12px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
                  <span>📍 <strong>Venue:</strong> {event.venue}</span>
                  <span>📅 <strong>Date:</strong> {new Date(event.date).toLocaleDateString()} at {event.time || "TBD"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleAction(event.event_id, "approve")} style={{ flex: 1, padding: "10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                  Approve ✓
                </button>
                <button onClick={() => handleAction(event.event_id, "reject")} style={{ flex: 1, padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                  Reject ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}