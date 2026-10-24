import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";

function OrganizerDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const data = await response.json();

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
  }, []);

  return (
    <div className="organizer-dashboard">
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
          <h2>Hello, {user.name}!</h2>
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
              onClick={() => {
                alert("Event creation will be connected next.");
              }}
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
            <div className="organizer-event-wrapper" key={event.event_id}>
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
            </div>
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
