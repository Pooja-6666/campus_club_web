import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";
import CreateEvent from "./CreateEvent"; // <-- Import CreateEvent component

function OrganizerDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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

  // If user clicked "+ Create Event", render the CreateEvent view
  if (showCreateForm) {
    return (
      <div className="organizer-dashboard">
        
        <header className="organizer-dashboard-header">
          <div>
            <h1>Campus<span>Events</span></h1>
            <p>Organizer Dashboard</p>
          </div>

          <button
            onClick={() => {
              setShowCreateForm(false);
              setEditingEvent(null);
            }}
            className="organizer-logout-button"
          >
            ← Back to Dashboard
          </button>
        </header>

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

  return (
    <div className="organizer-dashboard">
      <style>{`
                /* Expand organizer dashboard on larger screens */
                .organizer-dashboard .organizer-dashboard-main {
                  width: min(1200px, calc(100% - 48px));
                  max-width: 1200px;
                  margin: 0 auto;
                  box-sizing: border-box;
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
                  justify-content: space-between;
                  gap: 10px;
                  margin-top: 12px;
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

      <header className="organizer-dashboard-header">
        <div>
          <h1>Campus<span>Events</span></h1>
          <p>Organizer Dashboard</p>
        </div>

        <button onClick={onLogout} className="organizer-logout-button">
          Logout
        </button>
      </header>

      <main className="organizer-dashboard-main">
        <section className="organizer-welcome">
          <p>WELCOME BACK</p>
          <h2>Hello, {user?.name || "Organizer"}!</h2>
          <p>Manage your campus events from one place.</p>
        </section>

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

          {!loading && !error && events.length === 0 && (
            <div className="organizer-empty-state">
              <h3>No events yet</h3>
              <p>Your events will appear here when you create them.</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="events-grid" aria-label="My events">

              {events.map((event) => (
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
                    <div>
                      <p>
                        Event Status: {event.status || "PENDING"}
                      </p>

                      {event.status === "APPROVED" &&
                        event.editRequests?.some(
                          (request) => request.status === "PENDING"
                        ) && (
                        <div>
                          <div
                            className={`organizer-edit-request-status status-${String(
                              event.editRequests[0].status
                            ).toLowerCase()}`}
                          >
                            <span>
                              {event.editRequests[0].status === "PENDING"
                                ? "⏳"
                                : event.editRequests[0].status === "APPROVED"
                                ? "✓"
                                : "✕"}
                            </span>

                            <span>
                              Edit Request:{" "}
                              {event.editRequests[0].status === "PENDING"
                                ? "PENDING"
                                : event.editRequests[0].status}
                            </span>
                          </div>

                          {event.editRequests[0].status === "REJECTED" &&
                            event.editRequests[0].rejectionReason && (
                              <p>
                                Edit Rejection Reason:{" "}
                                {event.editRequests[0].rejectionReason}
                              </p>
                            )}
                        </div>
                      )}
                    </div>
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