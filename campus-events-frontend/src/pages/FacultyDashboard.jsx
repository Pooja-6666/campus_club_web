import { useEffect, useState } from "react";

export default function FacultyDashboard({ user, onLogout }) {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [rejectedEvents, setRejectedEvents] = useState([]);

  const [approvedLoading, setApprovedLoading] = useState(true);
  const [rejectedLoading, setRejectedLoading] = useState(true);

  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [approvingEvent, setApprovingEvent] = useState(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);  
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);
  const [pendingEditRequests, setPendingEditRequests] = useState([]);
  const [editRequestLoading, setEditRequestLoading] = useState(true);
  const [rejectingEditRequest, setRejectingEditRequest] = useState(null);
  const [editRejectionReason, setEditRejectionReason] = useState("");
  const [submittingEditRejection, setSubmittingEditRejection] = useState(false);

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

  const fetchApprovedEvents = async () => {
    try {
      setApprovedLoading(true);

      const res = await fetch(
        "http://localhost:3000/api/faculty/events/approved",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch approved events");
      }

      setApprovedEvents(data);
    } catch (err) {
      console.error("Error fetching approved events:", err);
    } finally {
      setApprovedLoading(false);
    }
  };

  const fetchRejectedEvents = async () => {
    try {
      setRejectedLoading(true);

      const res = await fetch(
        "http://localhost:3000/api/faculty/events/rejected",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch rejected events");
      }

      setRejectedEvents(data);
    } catch (err) {
      console.error("Error fetching rejected events:", err);
    } finally {
      setRejectedLoading(false);
    }
  };

  const fetchPendingEditRequests = async () => {
  try {
    setEditRequestLoading(true);

    const res = await fetch(
      "http://localhost:3000/api/faculty/event-edit-requests/pending",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch edit requests");
    }

    setPendingEditRequests(data);
  } catch (err) {
    console.error("Error fetching edit requests:", err);
  } finally {
    setEditRequestLoading(false);
  }
};

  useEffect(() => {
    fetchPendingEvents();
    fetchApprovedEvents();
    fetchRejectedEvents();
    fetchPendingEditRequests();
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

  const confirmApproval = async () => {
    if (!approvingEvent || submittingApproval) return;

    try {
      setSubmittingApproval(true);

      const res = await fetch(
        `http://localhost:3000/api/faculty/events/${approvingEvent.event_id}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve event");
      }

      setApprovingEvent(null);
      await fetchPendingEvents();
      await fetchApprovedEvents();

      alert(`"${approvingEvent.title}" approved successfully!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingApproval(false);
    }
  };
  const handleEditRequestApproval = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/faculty/event-edit-requests/${requestId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve edit request");
      }

      await fetchPendingEditRequests();
      await fetchPendingEvents();
      await fetchApprovedEvents();

      alert("Event changes approved and published.");
    } catch (err) {
      alert(err.message);
    }
  };

  const submitEditRequestRejection = async () => {
    const reason = editRejectionReason.trim();

    if (!reason) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      setSubmittingEditRejection(true);

      const res = await fetch(
        `http://localhost:3000/api/faculty/event-edit-requests/${rejectingEditRequest.edit_request_id}/reject`,
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
        throw new Error(data.error || "Failed to reject edit request");
      }

      setRejectingEditRequest(null);
      setEditRejectionReason("");

      await fetchPendingEditRequests();

      alert("Edit request rejected. Feedback has been sent to the organizer.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingEditRejection(false);
    }
  };

  const openEditRequestRejectModal = (request) => {
    setRejectingEditRequest(request);
    setEditRejectionReason("");
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
      await fetchRejectedEvents();

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

      {/* Faculty Dashboard Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          marginBottom: "32px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "24px",
        }}
      >
        {/* Portal Title */}
        <div style={{ minWidth: "340px" }}>
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

        {/* Navigation Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            flex: 1,
            gap: "8px",
            padding: "8px",
            background: "rgba(30, 41, 59, 0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
          }}
        >
          {[
            {
              id: "pending",
              label: "Pending",
              count: pendingEvents.length,
              color: "#fbbf24",
            },
            {
              id: "editRequests",
              label: "Edit Requests",
              count: pendingEditRequests.length,
              color: "#fbbf24",
            },
            {
              id: "approved",
              label: "Approved",
              count: approvedEvents.length,
              color: "#34d399",
            },
            {
              id: "rejected",
              label: "Rejected",
              count: rejectedEvents.length,
              color: "#f87171",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 10px",
                  background: isActive
                    ? "rgba(168, 85, 247, 0.18)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(168, 85, 247, 0.6)"
                    : "1px solid transparent",
                  borderRadius: "10px",
                  color: isActive ? "#e9d5ff" : "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                  fontWeight: isActive ? "700" : "600",
                  fontSize: "13px",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{tab.label}</span>

                <span
                  style={{
                    background: `${tab.color}22`,
                    color: tab.color,
                    padding: "3px 8px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            padding: "16px 24px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "15px",
          }}
        >
          Logout
        </button>
      </div>


      {activeTab === "pending" && (
        <>
          {loading && (
            <p style={{ color: "#94a3b8" }}>Loading pending approvals...</p>
          )}

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
              <h3 style={{ fontSize: "20px", color: "#cbd5e1" }}>
                All caught up!
              </h3>
              <p style={{ color: "#64748b" }}>
                There are no pending club event submissions requiring your approval
                right now.
              </p>
            </div>
          )}
        </>
      )}

      {/* Pending changes to published events */}
      {activeTab === "editRequests" && (
      <>
      <div style={{ marginTop: "40px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
          Pending Changes to Published Events
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
          Review changes organizers have requested for already-approved events.
        </p>
      </div>
      {editRequestLoading && (
        <p style={{ color: "#94a3b8" }}>Loading edit requests...</p>
      )}

      {!editRequestLoading && pendingEditRequests.length === 0 && (
        <div
          style={{
            padding: "24px",
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "24px",
          }}
        >
          <p style={{ color: "#94a3b8", margin: 0 }}>
            There are no pending edit requests for published events.
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
          marginBottom: "40px",
        }}
      >
        {pendingEditRequests.map((request) => {
          const event = request.event;
          const proposed = request.proposedData;
          const fieldsToCompare = [
            { key: "title", label: "Event Title" },
            { key: "description", label: "Description" },
            { key: "date", label: "Start Date" },
            { key: "endDate", label: "End Date" },
            { key: "time", label: "Time" },
            { key: "venue", label: "Venue" },
            { key: "category", label: "Category" },
            { key: "tags", label: "Tags" },
            { key: "capacity", label: "Capacity" },
            { key: "contact_phone", label: "Contact Phone" },
            { key: "registrationUrl", label: "Registration URL" },
            { key: "posterUrl", label: "Poster" },
          ];

          const normalizeValue = (value, key) => {
            if (value === null || value === undefined || value === "") {
              return "";
            }

            if (key === "date" || key === "endDate") {
              const date = new Date(value);
              return Number.isNaN(date.getTime())
                ? String(value)
                : date.toISOString().slice(0, 10);
            }

            if (Array.isArray(value)) {
              return JSON.stringify(value);
            }

            return String(value).trim();
          };

          const changedFields = fieldsToCompare.filter(({ key }) =>
            normalizeValue(event[key], key) !==
            normalizeValue(proposed?.[key], key)
          );

          const formatValue = (value, key) => {
            if (key === "posterUrl") {
              return value ? "Poster available" : "No poster";
            }

            if (key === "date" || key === "endDate") {
              return value
                ? new Date(value).toLocaleDateString("en-IN", {
                    timeZone: "UTC",
                  })
                : "Not specified";
            }

            if (Array.isArray(value)) {
              return value.length ? value.join(", ") : "None";
            }

            return value === null || value === undefined || value === ""
              ? "Not specified"
              : String(value);
          };


          return (
            <div
              key={request.edit_request_id}
              style={{
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "16px",
                padding: "20px",
              }}
            >

              <h3 style={{ fontSize: "18px", margin: "12px 0 6px" }}>
                {event?.title}
              </h3>


              {/* Organizer Information */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.9)",
                  padding: "14px",
                  borderRadius: "10px",
                  marginTop: "16px",
                  fontSize: "13px",
                  lineHeight: "1.8",
                }}
              >
                <h4 style={{ color: "#c084fc", margin: "0 0 10px 0" }}>
                  Organizer Information
                </h4>

                <p style={{ margin: 0 }}>
                  <strong>Organizer:</strong>{" "}
                  {event?.organizer?.name || "Not available"}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Email:</strong>{" "}
                  {event?.organizer?.email || "Not available"}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Club:</strong>{" "}
                  {event?.club?.club_name || "Not available"}
                </p>
              </div>

              {/* Actual Changes */}
              <div
                style={{
                  background: "#0f172a",
                  padding: "14px",
                  borderRadius: "10px",
                  marginTop: "14px",
                  fontSize: "13px",
                  lineHeight: "1.7",
                }}
              >
                <h4 style={{ color: "#fbbf24", margin: "0 0 14px 0" }}>
                  Requested Changes ({changedFields.length})
                </h4>

                {changedFields.length === 0 ? (
                  <p style={{ color: "#94a3b8", margin: 0 }}>
                    No event details have changed.
                  </p>
                ) : (
                  changedFields.map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        marginBottom: "14px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <strong style={{ color: "#e2e8f0" }}>
                        {label}
                      </strong>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          marginTop: "8px",
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(248, 113, 113, 0.1)",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                        >
                          <span style={{ color: "#f87171", fontWeight: "700" }}>
                            BEFORE
                          </span>
                          <p style={{ margin: "5px 0 0", color: "#cbd5e1" }}>
                            {formatValue(event[key], key)}
                          </p>
                        </div>

                        <div
                          style={{
                            background: "rgba(52, 211, 153, 0.1)",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                        >
                          <span style={{ color: "#34d399", fontWeight: "700" }}>
                            AFTER
                          </span>
                          <p style={{ margin: "5px 0 0", color: "#cbd5e1" }}>
                            {formatValue(proposed?.[key], key)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>


              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  onClick={() =>
                    handleEditRequestApproval(request.edit_request_id)
                  }
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Accept
                </button>

                <button
                  onClick={() => openEditRequestRejectModal(request)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#DC2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
      {activeTab === "pending" && (
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
              {/* Organizer and Submission Information */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "18px",
                  fontSize: "12px",
                  lineHeight: "1.8",
                }}
              >
                <h4
                  style={{
                    color: "#c084fc",
                    fontSize: "13px",
                    margin: "0 0 8px 0",
                  }}
                >
                  Organizer Information
                </h4>

                <p style={{ margin: 0 }}>
                  <strong>Organizer:</strong>{" "}
                  {event.organizer?.name || "Not available"}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Email:</strong>{" "}
                  {event.organizer?.email || "Not available"}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Club:</strong>{" "}
                  {event.club?.club_name || "Not available"}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Submitted:</strong>{" "}
                  {event.createdAt
                    ? new Date(event.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not available"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setApprovingEvent(event)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Accept
                </button>

                <button
                  onClick={() => openRejectModal(event)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#DC2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Approved Events */}
      {activeTab === "approved" && (
        <>
          <div style={{ marginTop: "20px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
              Approved Events
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Events that have been approved and published.
            </p>
          </div>

          {approvedLoading && (
            <p style={{ color: "#94a3b8" }}>Loading approved events...</p>
          )}

          {!approvedLoading && approvedEvents.length === 0 && (
            <p style={{ color: "#94a3b8" }}>
              There are no approved events yet.
            </p>
          )}

          {!approvedLoading && approvedEvents.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
              }}
            >
              {approvedEvents.map((event) => (
                <div
                  key={event.event_id}
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(52, 211, 153, 0.35)",
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

                  <div style={{ padding: "20px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        background: "rgba(52, 211, 153, 0.2)",
                        color: "#34d399",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      Approved
                    </span>

                    <h3 style={{ fontSize: "18px", margin: "12px 0 6px" }}>
                      {event.title}
                    </h3>

                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                      {event.description}
                    </p>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#cbd5e1",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "16px",
                      }}
                    >
                      <span>📍 <strong>Venue:</strong> {event.venue}</span>
                      <span>
                        📅 <strong>Date:</strong>{" "}
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : "Not specified"}{" "}
                        at {event.time || "TBD"}
                      </span>
                      <span>
                        <strong>Organizer:</strong>{" "}
                        {event.organizer?.name || "Not available"}
                      </span>
                      <span>
                        <strong>Club:</strong>{" "}
                        {event.club?.club_name || "Not available"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Rejected Events */}
      {activeTab === "rejected" && (
        <>
          <div style={{ marginTop: "20px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
              Rejected Events
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Events that were rejected, along with the feedback provided to organizers.
            </p>
          </div>

          {rejectedLoading && (
            <p style={{ color: "#94a3b8" }}>Loading rejected events...</p>
          )}

          {!rejectedLoading && rejectedEvents.length === 0 && (
            <p style={{ color: "#94a3b8" }}>
              There are no rejected events.
            </p>
          )}

          {!rejectedLoading && rejectedEvents.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
              }}
            >
              {rejectedEvents.map((event) => (
                <div
                  key={event.event_id}
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(248, 113, 113, 0.35)",
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

                  <div style={{ padding: "20px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        background: "rgba(248, 113, 113, 0.2)",
                        color: "#f87171",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      Rejected
                    </span>

                    <h3 style={{ fontSize: "18px", margin: "12px 0 6px" }}>
                      {event.title}
                    </h3>

                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                      {event.description}
                    </p>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#cbd5e1",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "16px",
                      }}
                    >
                      <span>
                        📍 <strong>Venue:</strong> {event.venue}
                      </span>

                      <span>
                        📅 <strong>Date:</strong>{" "}
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : "Not specified"}{" "}
                        at {event.time || "TBD"}
                      </span>

                      <span>
                        <strong>Organizer:</strong>{" "}
                        {event.organizer?.name || "Not available"}
                      </span>

                      <span>
                        <strong>Club:</strong>{" "}
                        {event.club?.club_name || "Not available"}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "rgba(127, 29, 29, 0.2)",
                        border: "1px solid rgba(248, 113, 113, 0.25)",
                        borderRadius: "10px",
                        padding: "14px",
                        marginTop: "18px",
                      }}
                    >
                      <h4
                        style={{
                          color: "#f87171",
                          fontSize: "13px",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Rejection Reason / Feedback
                      </h4>

                      <p
                        style={{
                          color: "#cbd5e1",
                          fontSize: "13px",
                          lineHeight: "1.6",
                          margin: 0,
                        }}
                      >
                        {event.rejectionReason || "No rejection reason provided."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Approval Confirmation Modal */}
      {approvingEvent && (
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
              maxWidth: "450px",
              background: "#1e293b",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "22px" }}>
              Confirm Event Approval
            </h2>

            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
              Are you sure you want to approve this event?
            </p>

            <div
              style={{
                padding: "16px",
                background: "#0f172a",
                borderRadius: "10px",
                margin: "18px 0",
              }}
            >
              <p style={{ margin: 0, fontWeight: "700", fontSize: "17px" }}>
                {approvingEvent.title}
              </p>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: 0 }}>
                {approvingEvent.club?.club_name || "Club not specified"}
              </p>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              Once approved, this event will become eligible to appear on the
              student dashboard.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => setApprovingEvent(null)}
                disabled={submittingApproval}
                style={{
                  padding: "10px 18px",
                  background: "#334155",
                  color: "#f8fafc",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={confirmApproval}
                disabled={submittingApproval}
                style={{
                  padding: "10px 18px",
                  background: submittingApproval ? "#64748b" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: submittingApproval ? "not-allowed" : "pointer",
                }}
              >
                {submittingApproval ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
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
      {/* Edit Request Rejection Modal */}
      {rejectingEditRequest && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100,
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
              Reject Event Changes
            </h2>

            <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
              Event:{" "}
              <strong>{rejectingEditRequest.event?.title}</strong>
            </p>

            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              The original published event will remain unchanged.
            </p>

            <label
              htmlFor="editRejectionReason"
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
              id="editRejectionReason"
              value={editRejectionReason}
              onChange={(e) => setEditRejectionReason(e.target.value)}
              placeholder="Explain what needs to be corrected..."
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

            <p
              style={{
                color: "#64748b",
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {editRejectionReason.length}/1000 characters
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
                onClick={() => {
                  if (submittingEditRejection) return;
                  setRejectingEditRequest(null);
                  setEditRejectionReason("");
                }}
                disabled={submittingEditRejection}
                style={{
                  padding: "10px 16px",
                  background: "#334155",
                  color: "#f8fafc",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={submitEditRequestRejection}
                disabled={
                  submittingEditRejection || !editRejectionReason.trim()
                }
                style={{
                  padding: "10px 16px",
                  background:
                    submittingEditRejection || !editRejectionReason.trim()
                      ? "#7f1d1d"
                      : "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor:
                    submittingEditRejection || !editRejectionReason.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    submittingEditRejection || !editRejectionReason.trim()
                      ? 0.6
                      : 1,
                }}
              >
                {submittingEditRejection
                  ? "Submitting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
