
import { useEffect, useState } from "react";

export default function FacultyDashboard({ user, onLogout }) {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  const token = localStorage.getItem("token");

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:3000/api/faculty/events/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch pending events");
      }

      setPendingEvents(data);
      setError("");
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
      const res = await fetch(
        `http://localhost:3000/api/faculty/events/${eventId}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} event`);
      }

      await fetchPendingEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const openRejectModal = (event) => {
    setRejectingEvent(event);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    if (submittingRejection) return;

    setRejectingEvent(null);
    setRejectionReason("");
  };

  const submitRejection = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setSubmittingRejection(true);

      const res = await fetch(
        `http://localhost:3000/api/faculty/events/${rejectingEvent.event_id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectionReason: reason,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject event");
      }

      setRejectingEvent(null);
      setRejectionReason("");

      await fetchPendingEvents();

      alert("Event rejected. Feedback has been sent to the organizer.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingRejection(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "20px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "12px",
              letterSpacing: "1.5px",
              color: "#a855f7",
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            Faculty Approval Portal
          </span>

          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "4px 0 0 0" }}>
            Welcome, {user?.name || "Faculty"}
          </h1>
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Logout
        </button>
      </div>

      {loading && <p style={{ color: "#94a3b8" }}>Loading pending approvals...</p>}

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {!loading && !error && pendingEvents.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 style={{ fontSize: "20px", color: "#cbd5e1" }}>All caught up!</h3>
          <p style={{ color: "#64748b" }}>
            There are no pending club event submissions requiring your approval
            right now.
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
        }}
      >
        {pendingEvents.map((event) => (
          <div
            key={event.event_id}
            style={{
              background: "rgba(30, 41, 59, 0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {event.posterUrl && (
              <img
                src={`http://localhost:3000${event.posterUrl}`}
                alt={event.title}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                }}
              />
            )}

            <div
              style={{
                padding: "20px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(168, 85, 247, 0.2)",
                    color: "#c084fc",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {event.category || "General"}
                </span>

                <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "10px 0 6px 0" }}>
                  {event.title}
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    lineHeight: "1.5",
                    marginBottom: "16px",
                  }}
                >
                  {event.description}
                </p>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginBottom: "16px",
                  }}
                >
                  <span>📍 <strong>Venue:</strong> {event.venue}</span>
                  <span>
                    📅 <strong>Date:</strong>{" "}
                    {new Date(event.date).toLocaleDateString()} at{" "}
                    {event.time || "TBD"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleAction(event.event_id, "approve")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Approve ✓
                </button>

                <button
                  onClick={() => openRejectModal(event)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Reject ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection feedback modal */}
      {rejectingEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "22px" }}>
              Reject Event
            </h2>

            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
              Event: <strong>{rejectingEvent.title}</strong>
            </p>

            <label
              htmlFor="rejectionReason"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Feedback / Rejection Reason
            </label>

            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this event is being rejected and what the organizer should correct..."
              rows={5}
              maxLength={1000}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #475569",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "14px",
                outline: "none",
              }}
            />

            <p style={{ color: "#64748b", fontSize: "12px", textAlign: "right" }}>
              {rejectionReason.length}/1000 characters
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={closeRejectModal}
                disabled={submittingRejection}
                style={{
                  padding: "10px 16px",
                  background: "#334155",
                  color: "#f8fafc",
                  border: "none",
                  borderRadius: "8px",
                  cursor: submittingRejection ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={submitRejection}
                disabled={submittingRejection || !rejectionReason.trim()}
                style={{
                  padding: "10px 16px",
                  background:
                    submittingRejection || !rejectionReason.trim()
                      ? "#7f1d1d"
                      : "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor:
                    submittingRejection || !rejectionReason.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    submittingRejection || !rejectionReason.trim()
                      ? 0.6
                      : 1,
                }}
              >
                {submittingRejection ? "Submitting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
