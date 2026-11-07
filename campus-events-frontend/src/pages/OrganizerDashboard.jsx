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
                    <span
                      className={`organizer-status status-${String(
                        event.status || "pending"
                      ).toLowerCase()}`}
                    >
                      Status: {event.status || "PENDING"}
                    </span>
                    {event.status === "REJECTED" && (
                      <button
                        type="button"
                        className="organizer-create-button"
                        onClick={() => {
                          setEditingEvent(event);
                          setShowCreateForm(true);
                        }}
                      >
                        Edit & Resubmit
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