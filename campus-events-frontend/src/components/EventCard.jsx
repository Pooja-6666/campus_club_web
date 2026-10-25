import { useEffect, useState } from "react";
import { addBookmark, removeBookmark } from "../services/api";

function EventCard({
  item,
  onBookmarkChange,
  showBookmark = true,
}) {
  const event = item.event || item;
  
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

  return (
    <>
      <article className="event-card poster-event-card">
        <div className="event-poster">
          {/* 1. Added onError fallback here */}
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
              onClick={() => setDetailsOpen(true)}
            >
              View Details
            </button>
          </div>
        </div>
      </article>
      {event.club && (
  <div className="flex items-center gap-2 my-2 p-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
    {/* Club Logo */}
    {event.club.logo_url && (
      <img 
        src={event.club.logo_url.startsWith("http") ? event.club.logo_url : `http://localhost:3000${event.club.logo_url}`} 
        alt={event.club.club_name} 
        className="w-7 h-7 rounded-full object-cover border border-purple-500/30"
      />
    )}
    
    {/* Club Name & Department */}
    <div className="flex flex-col">
      <span className="text-xs font-bold text-purple-400">
        {event.club.club_name}
      </span>
      {event.club.department && (
        <span className="text-[10px] text-slate-400">
          {event.club.department}
        </span>
      )}
    </div>
  </div>
)}

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
                  {/* 👇 Add this new phone number row */}
                  {event.contact_phone && (
                    <p>📞 <strong>Contact:</strong> <a href={`tel:${event.contact_phone}`} style={{ color: "#c084fc", textDecoration: "underline" }}>{event.contact_phone}</a></p>
                  )}
                  {event.club && (
                    <p>🏫 <strong>Club:</strong> {event.club.club_name}</p>
                  )}
                </div>

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
              </div>

              <div className="event-modal-poster-container">
                {/* 2. Added onError fallback here as well */}
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