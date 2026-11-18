import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";
import CreateEvent from "./CreateEvent"; // <-- Import CreateEvent component

function OrganizerDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [withdrawingRequest, setWithdrawingRequest] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:3000/api/organizer/events",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          throw new Error(`Server returned HTML/Non-JSON: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Unable to load your events."
          );
        }

        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [showCreateForm]); // Refetch events when coming back from creating one

const handleWithdrawRequest = async (eventId, requestType) => {
      const isEvent = requestType === "event";

      const confirmed = window.confirm(
        isEvent
          ? "Are you sure you want to withdraw this event submission?"
          : "Are you sure you want to withdraw this edit request?"
      );

      if (!confirmed) return;

      try {
        setWithdrawingRequest(true);
        setError("");

        const token = localStorage.getItem("token");

        const endpoint = isEvent
          ? `http://localhost:3000/api/organizer/events/${eventId}/withdraw`
          : `http://localhost:3000/api/organizer/events/${eventId}/edit-request/withdraw`;

        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Unable to withdraw request."
          );
        }

        setEvents((currentEvents) =>
          currentEvents.map((event) => {
            if (event.event_id !== eventId) return event;

            if (isEvent) {
              return {
                ...event,
                status: "WITHDRAWN",
              };
            }

            return {
              ...event,
              editRequests: [],
            };
          })
        );

        alert(data.message);
      } catch (err) {
        setError(err.message);
      } finally {
        setWithdrawingRequest(false);
      }
    };

  // If user clicked "+ Create Event", render the CreateEvent view
  if (showCreateForm) {
    return (
      <div className="organizer-dashboard">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "20px 24px 0",
          paddingTop: "35px",
          position: "fixed",
          top: "20px",
          right: "24px",
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => {
            setShowCreateForm(false);
            setEditingEvent(null);
          }}
          className="organizer-logout-button"
        >
          ← Back to Dashboard
        </button>
      </div>

        <main className="organizer-dashboard-main">
          <CreateEvent
            eventToEdit={editingEvent}
            onSuccess={() => {
              setShowCreateForm(false);
              setEditingEvent(null);
            }}
          />
        </main>
      </div>
    );
  }

  const pendingEvents = events.filter(
    (event) => event.status === "PENDING"
  );

  const approvedEvents = events.filter(
    (event) => event.status === "APPROVED"
  );

  const rejectedEvents = events.filter(
    (event) => event.status === "REJECTED"
  );

  const editRequestEvents = events.filter(
    (event) => event.editRequests?.length > 0
  );

  const filteredEvents = {
    pending: pendingEvents,
    editRequests: editRequestEvents,
    approved: approvedEvents,
    rejected: rejectedEvents,
  }[activeTab];

  return (
    <div className="organizer-dashboard">
      <style>{`
                /* Expand organizer dashboard on larger screens */
                .organizer-dashboard .organizer-dashboard-main {
                  width: min(1200px, calc(100% - 48px));
                  max-width: 1200px;
                  margin: 0 auto;
                  box-sizing: border-box;
                  padding-top: 0;
                }

                /* Responsive event grid */
                .organizer-dashboard .events-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                  align-items: start;
                  gap: 24px;
                }

                /* Prevent cards from stretching */
                .organizer-dashboard .organizer-event-wrapper {
                  display: flex;
                  flex-direction: column;
                  align-self: start;
                  min-width: 0;
                  height: auto;
                }

                /* Override any fixed card height without affecting student cards */
                .organizer-dashboard .organizer-event-wrapper .event-card {
                  height: auto;
                  min-height: 0;
                  flex: 0 0 auto;
                  align-self: stretch;
                }

                .organizer-dashboard .organizer-event-status {
                  display: flex;
                  flex-wrap: wrap;
                  align-items: center;
                  justify-content: center;
                  gap: 10px;
                  margin-top: 12px;
                }

                .organizer-dashboard .organizer-event-actions {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  gap: 10px;
                  width: 100%;
                  margin-top: 12px;
                  flex-wrap: wrap;
                }

                .organizer-dashboard .organizer-event-actions button {
                  padding: 10px 16px !important;
                  font-size: 13px !important;
                  border-radius: 9px !important;
                  min-height: 40px;
                  white-space: nowrap;
                }

                .organizer-dashboard .organizer-edit-request-status {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 7px 12px;
                  border-radius: 999px;
                  font-size: 12px;
                  font-weight: 700;
                  letter-spacing: 0.3px;
                  margin: 8px 0 12px;
                  border: 1px solid transparent;
                }

                .organizer-dashboard .organizer-edit-request-status.status-pending {
                  color: #fbbf24;
                  background: rgba(251, 191, 36, 0.12);
                  border-color: rgba(251, 191, 36, 0.35);
                }

                .organizer-dashboard .organizer-edit-request-status.status-approved {
                  color: #4ade80;
                  background: rgba(74, 222, 128, 0.12);
                  border-color: rgba(74, 222, 128, 0.35);
                }

                .organizer-dashboard .organizer-edit-request-status.status-rejected {
                  color: #f87171;
                  background: rgba(248, 113, 113, 0.12);
                  border-color: rgba(248, 113, 113, 0.35);
                }

                @media (max-width: 600px) {
                  .organizer-dashboard .organizer-dashboard-main {
                    width: calc(100% - 24px);
                  }

                  .organizer-dashboard .events-grid {
                    grid-template-columns: 1fr;
                  }
                }
              `}</style>  
      
      {/* Organizer Dashboard Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          marginBottom: "0px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingTop: "24px",
          paddingBottom: "24px",
          paddingLeft: "24px",
          paddingRight: "24px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "#0f172a",
        }}
      >
        {/* Organizer Name and Club */}
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
            Organizer Portal
          </span>

          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "4px 0" }}>
            Welcome, {user?.name || "Organizer"}
          </h1>

          <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
            {user?.club?.club_name || user?.club_name || "Your Club"}
          </p>
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
            { id: "pending", label: "Pending", count: pendingEvents.length, color: "#fbbf24" },
            { id: "editRequests", label: "Edit Requests", count: editRequestEvents.length, color: "#fbbf24" },
            { id: "approved", label: "Approved", count: approvedEvents.length, color: "#34d399" },
            { id: "rejected", label: "Rejected", count: rejectedEvents.length, color: "#f87171" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 10px",
                  background: isActive ? "rgba(168, 85, 247, 0.18)" : "transparent",
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

      <main className="organizer-dashboard-main">
        <section className="organizer-events-section">
          <div className="organizer-section-heading">
            <div>
              <h2>My Events</h2>
              <p>Events created by you</p>
            </div>

            <button
              className="organizer-create-button"
              onClick={() => setShowCreateForm(true)}
            >
              + Create Event
            </button>
          </div>

          {loading && <p>Loading your events...</p>}

          {error && (
            <p className="organizer-dashboard-error">{error}</p>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="organizer-empty-state">
              <h3>No events in this section</h3>
              <p>Your events will appear here when you create them.</p>
            </div>
          )}

          {!loading && !error && filteredEvents.length > 0 && (
            <div className="events-grid" aria-label="My events">

              {filteredEvents.map((event) => (
              <div
                className="organizer-event-wrapper"
                key={event.event_id}
              >
                  <EventCard
                    item={{
                      ...event,
                      isBookmarked: false,
                    }}
                    showBookmark={false}
                  />
                  <div className="organizer-event-status">
                    <div className="organizer-event-actions">
                    {event.status === "PENDING" && (
                      <button
                        type="button"
                        className="organizer-create-button"
                        disabled={withdrawingRequest}
                        onClick={() =>
                          handleWithdrawRequest(event.event_id, "event")
                        }
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          color: "#f87171",
                          opacity: withdrawingRequest ? 0.6 : 1,
                          cursor: withdrawingRequest ? "not-allowed" : "pointer",
                        }}
                      >
                        Withdraw Request
                      </button>
                    )}

                    {activeTab === "editRequests" &&
                      event.status === "APPROVED" &&
                      event.editRequests?.some(
                        (request) => request.status === "PENDING"
                      ) && (
                        <button
                          type="button"
                          className="organizer-create-button"
                          disabled={withdrawingRequest}
                          onClick={() =>
                            handleWithdrawRequest(event.event_id, "edit")
                          }
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#f87171",
                            opacity: withdrawingRequest ? 0.6 : 1,
                            cursor: withdrawingRequest ? "not-allowed" : "pointer",
                          }}
                        >
                          Withdraw Edit Request
                        </button>
                    )}

                    {["PENDING", "APPROVED", "REJECTED"].includes(
                      String(event.status).toUpperCase()
                    ) && (
                      <button
                        type="button"
                        className="organizer-create-button"
                        onClick={() => {
                          const pendingEditRequest = event.editRequests?.[0];

                          const eventToEdit = pendingEditRequest?.proposedData
                            ? {
                                ...event,
                                ...pendingEditRequest.proposedData,
                                event_id: event.event_id,
                                status: event.status,
                              }
                            : event;

                          setEditingEvent(eventToEdit);
                          setShowCreateForm(true);
                        }}
                      >
                        {event.status === "REJECTED"
                          ? "Edit & Resubmit"
                          : "Edit Event"}
                      </button>
                    )}
                  </div>
                  </div>
                  {event.status === "REJECTED" && event.rejectionReason && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "14px",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        borderRadius: "10px",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 8px",
                          color: "#ef4444",
                          fontSize: "14px",
                        }}
                      >
                        Faculty Feedback / Rejection Reason
                      </h4>

                      <p
                        style={{
                          margin: 0,
                          color: "#cbd5e1",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {event.rejectionReason}
                      </p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default OrganizerDashboard;