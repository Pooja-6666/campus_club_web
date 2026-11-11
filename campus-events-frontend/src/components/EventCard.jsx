import { useEffect, useState } from "react";
import {
  addBookmark,
  removeBookmark,
  recordEventView,
  setEventInterest,
  removeEventInterest,
  rsvpEvent,
  cancelRsvp,
  getEventInteractionStatus,
} from "../services/api";

function EventCard({
  item,
  onBookmarkChange,
  onNotInterested,
  showBookmark = true,
}) {
  const event = item.event || item;

  const registrationUrl = event.registrationUrl?.trim();

  const isValidRegistrationUrl = (() => {
    if (!registrationUrl) return false;

    try {
      const url = new URL(registrationUrl);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  })();
  
  const rawPosterUrl = event.posterUrl || "/event-posters/default-event.png";
  const posterUrl = rawPosterUrl.startsWith("http")
    ? rawPosterUrl
    : `http://localhost:3000${rawPosterUrl}`;

  const [isBookmarked, setIsBookmarked] = useState(
    Boolean(item.isBookmarked)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Event interaction state
  const [interestStatus, setInterestStatus] = useState(null);
  const [isRsvped, setIsRsvped] = useState(false);
  const [interactionStatusLoading, setInteractionStatusLoading] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionMessage, setInteractionMessage] = useState("");

  // Open event details and load interaction data
  const handleOpenDetails = async () => {
    setDetailsOpen(true);
    setInteractionMessage("");
    setInteractionStatusLoading(true);

    try {
      const [, status] = await Promise.all([
        recordEventView(event.event_id),
        getEventInteractionStatus(event.event_id),
      ]);

      setInterestStatus(status.interest);
      setIsRsvped(status.isRsvped);
    } catch (error) {
      console.error("Error loading event interactions:", error);
      setInteractionMessage(
        "Could not load your event interaction status."
      );
    } finally {
      setInteractionStatusLoading(false);
    }
  };

  useEffect(() => {
    setIsBookmarked(Boolean(item.isBookmarked));
  }, [item.isBookmarked]);

  const date = new Date(event.date);
  const formattedDate = Number.isNaN(date.getTime())
    ? "Date not specified"
    : date.toLocaleDateString();

  const handleBookmark = async () => {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      if (isBookmarked) {
        await removeBookmark(event.event_id);
        setIsBookmarked(false);
        onBookmarkChange?.(event.event_id, false);
      } else {
        await addBookmark(event.event_id);
        setIsBookmarked(true);
        onBookmarkChange?.(event.event_id, true);
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      setMessage("Could not update bookmark. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Set or change interest in an event
  const handleInterest = async (status) => {
    if (interactionLoading) return;

    setInteractionLoading(true);
    setInteractionMessage("");

    try {
      if (interestStatus === status) {
        await removeEventInterest(event.event_id);
        setInterestStatus(null);
        setInteractionMessage("Your response has been removed.");
      } else {
        await setEventInterest(event.event_id, status);
        setInterestStatus(status);

        if (status === "NOT_INTERESTED") {
          await onNotInterested?.(event.event_id);
        } else {
          setInteractionMessage("Marked as Interested!");
        }
      }
    } catch (error) {
      console.error("Interest update error:", error);
      setInteractionMessage("Could not update your response. Please try again.");
    } finally {
      setInteractionLoading(false);
    }
  };
  // RSVP to an event or cancel an existing RSVP
  const handleRsvp = async () => {
    if (interactionLoading) return;

    setInteractionLoading(true);
    setInteractionMessage("");

    try {
      if (isRsvped) {
        await cancelRsvp(event.event_id);
        setIsRsvped(false);
        setInteractionMessage("Your RSVP has been cancelled.");
      } else {
        await rsvpEvent(event.event_id);
        setIsRsvped(true);
        setInteractionMessage("You have successfully RSVP'd!");
      }
    } catch (error) {
      console.error("RSVP error:", error);
      setInteractionMessage("Could not update your RSVP. Please try again.");
    } finally {
      setInteractionLoading(false);
    }
  };

  return (
    <>
      <article className="event-card poster-event-card">
        <div className="event-poster">
          <img
            className="event-poster-image"
            src={posterUrl}
            alt={`${event.title} poster`}
            onError={(e) => {
              e.target.src = "/event-posters/default-event.png";
            }}
          />
          <span
            className={`event-category poster-category category-${(
              event.category || "event"
            )
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {event.category || "Event"}
          </span>

          <div className="event-poster-bottom">
            <h3 className="poster-event-title" title={event.title}>
              {event.title}
            </h3>

            {event.club && (
              <div className="poster-club-name" title={event.club.club_name}>
                {event.club.logo_url && (
                  <img
                    src={
                      event.club.logo_url.startsWith("http")
                        ? event.club.logo_url
                        : `http://localhost:3000${event.club.logo_url}`
                    }
                    alt={event.club.club_name}
                    className="poster-club-logo"
                  />
                )}

                <div className="poster-club-text">
                  <span>{event.club.club_name}</span>
                  {event.club.department && (
                    <small>{event.club.department}</small>
                  )}
                </div>
              </div>
            )}

            {showBookmark && (
              <button
                type="button"
                className={`poster-bookmark-button ${
                  isBookmarked ? "bookmarked" : ""
                }`}
                onClick={handleBookmark}
                disabled={loading}
                aria-label={
                  isBookmarked ? "Remove bookmark" : "Bookmark event"
                }
                aria-pressed={isBookmarked}
                title={isBookmarked ? "Remove bookmark" : "Bookmark event"}
              >
                {isBookmarked ? "♥" : "♡"}
              </button>
            )}
            <button
              type="button"
              className="poster-details-button"
              onClick={handleOpenDetails}
            >
              View Details
            </button>
          </div>
        </div>
      </article>

      {detailsOpen && (
        <div
          className="event-modal-backdrop"
          onClick={() => setDetailsOpen(false)}
        >
          <section
            className="event-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`event-title-${event.event_id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="event-modal-close"
              onClick={() => setDetailsOpen(false)}
              aria-label="Close event details"
            >
              ×
            </button>

            <div className="event-modal-layout">
              <div className="event-modal-content">
                <span
                  className={`event-category poster-category category-${(
                    event.category || "event"
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {event.category || "Event"}
                </span>

                <h2 id={`event-title-${event.event_id}`}>
                  {event.title}
                </h2>

                <p className="event-modal-description">
                  {event.description || "No description available."}
                </p>

                <div className="event-modal-info">
                  <p>📅 <strong>Date:</strong> {formattedDate}</p>
                  <p>🕒 <strong>Time:</strong> {event.time || "Not specified"}</p>
                  <p>📍 <strong>Venue:</strong> {event.venue || "Not specified"}</p>
                  {event.contact_phone && (
                    <p>📞 <strong>Contact:</strong> <a href={`tel:${event.contact_phone}`} style={{ color: "#c084fc", textDecoration: "underline" }}>{event.contact_phone}</a></p>
                  )}
                  {event.club && (
                    <p>🏫 <strong>Club:</strong> {event.club.club_name}</p>
                  )}
                </div>

                {/* Event Registration */}
                {isValidRegistrationUrl ? (
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="poster-modal-register"
                  >
                    Register Now ↗
                  </a>
                ) : (
                  <p className="registration-unavailable">
                    Registration link is not available for this event.
                  </p>
                )}

                {showBookmark && (
                  <button
                    type="button"
                    className="poster-modal-bookmark"
                    onClick={handleBookmark}
                    disabled={loading}
                  >
                    {loading
                      ? "Please wait..."
                      : isBookmarked
                        ? "♥ Bookmarked"
                        : "♡ Bookmark Event"}
                  </button>
                )}
                {/* Event interest actions */}
                <div className="event-interest-actions">
                  <p>Are you interested in this event?</p>

                  <div className="event-interest-buttons">
                    <button
                      type="button"
                      className={`event-interest-button ${
                        interestStatus === "INTERESTED" ? "selected" : ""
                      }`}
                      onClick={() => handleInterest("INTERESTED")}
                      disabled={interactionLoading || interactionStatusLoading}
                      aria-pressed={interestStatus === "INTERESTED"}
                    >
                      Interested
                    </button>

                    <button
                      type="button"
                      className={`event-interest-button ${
                        interestStatus === "NOT_INTERESTED" ? "selected" : ""
                      }`}
                      onClick={() => handleInterest("NOT_INTERESTED")}
                      disabled={interactionLoading || interactionStatusLoading}
                      aria-pressed={interestStatus === "NOT_INTERESTED"}
                    >
                      Not Interested
                    </button>
                  </div>
                </div>

                {/* RSVP action */}
                <button
                  type="button"
                  className="poster-modal-rsvp"
                  onClick={handleRsvp}
                  disabled={interactionLoading || interactionStatusLoading}
                >
                  {interactionLoading
                    ? "Please wait..."
                    : isRsvped
                      ? "Cancel RSVP"
                      : "RSVP"}
                </button>

                {interactionMessage && (
                  <p className="event-interaction-message" role="status">
                    {interactionMessage}
                  </p>
                )}

              </div>

              <div className="event-modal-poster-container">
                <img
                  className="event-modal-poster"
                  src={posterUrl}
                  alt={`${event.title} poster`}
                  onError={(e) => {
                    e.target.src = "/event-posters/default-event.png";
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default EventCard;