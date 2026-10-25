import { useEffect, useState } from "react";
import {
  getRecommendedEvents,
  getBookmarks,
  getAllEvents,
  getProfile,
} from "../services/api";
import EventCard from "../components/EventCard";
import {
  House,
  CalendarDays,
  Heart,
  UserRound,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

function Home() {
  const [events, setEvents] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [activePage, setActivePage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [selectedClub, setSelectedClub] = useState("All");
  
  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    selectedCategory: "All",
    selectedDate: "",
    selectedStartTime: "",
    selectedEndTime: "",
    selectedClub: "All",
  });


const getTimeInMinutes = (timeValue) => {
  if (!timeValue) return null;

  const time = timeValue.trim();

  // Supports times such as "10:30 AM" and "2:30 PM"
  const twelveHourMatch = time.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes > 59) {
      return null;
    }

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    return hours * 60 + minutes;
  }

  // Also supports 24-hour times such as "14:30"
  const twentyFourHourMatch = time.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    if (hours > 23 || minutes > 59) return null;

    return hours * 60 + minutes;
  }

  return null;
};

const filteredEvents = events.filter((item) => {
  const event = item.event || item;
  const filters = appliedFilters;

  // Search by event title or description
  const search = filters.searchText.trim().toLowerCase();

  const matchesSearch =
    !search ||
    (event.title || "").toLowerCase().includes(search) ||
    (event.description || "").toLowerCase().includes(search);

  // Filter by category
  const matchesCategory =
    filters.selectedCategory === "All" ||
    event.category === filters.selectedCategory;

  // Filter by date
  let matchesDate = true;

  if (filters.selectedDate && event.date) {
    const eventDate = new Date(event.date);

    if (!Number.isNaN(eventDate.getTime())) {
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, "0");
      const day = String(eventDate.getDate()).padStart(2, "0");

      const localEventDate = `${year}-${month}-${day}`;

      matchesDate = localEventDate === filters.selectedDate;
    } else {
      matchesDate = false;
    }
  } else if (filters.selectedDate) {
    matchesDate = false;
  }

  // Filter by start and end time
  const eventTime = getTimeInMinutes(event.time);
  const startTime = getTimeInMinutes(filters.selectedStartTime);
  const endTime = getTimeInMinutes(filters.selectedEndTime);

  let matchesTime = true;

  if (startTime !== null || endTime !== null) {
    if (eventTime === null) {
      matchesTime = false;
    } else {
      if (startTime !== null && eventTime < startTime) {
        matchesTime = false;
      }

      if (endTime !== null && eventTime > endTime) {
        matchesTime = false;
      }
    }
  }

  // Filter by club
  const clubName = event.club?.club_name || "";

  const matchesClub =
    filters.selectedClub === "All" ||
    clubName === filters.selectedClub;

  return (
    matchesSearch &&
    matchesCategory &&
    matchesDate &&
    matchesTime &&
    matchesClub
  );
});


  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  
  const handleBookmarkChange = (eventId, isBookmarked) => {
    setBookmarkedIds((previousIds) => {
      const updatedIds = new Set(previousIds);

      if (isBookmarked) {
        updatedIds.add(Number(eventId));
      } else {
        updatedIds.delete(Number(eventId));
      }

      return updatedIds;
    });

    if (!isBookmarked) {
      setBookmarks((previousBookmarks) =>
        previousBookmarks.filter(
          (bookmark) => Number(bookmark.event_id) !== Number(eventId)
        )
      );
    }
  };


  const handleMyBookmarks = async () => {
    setActivePage("bookmarks");
    setLoading(true);
    setError("");

    try {
      const data = await getBookmarks();
      setBookmarks(data);

      setBookmarkedIds(
        new Set(data.map((bookmark) => Number(bookmark.event_id)))
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load bookmarks");
    } finally {
      setLoading(false);
    }
  };


  const handleHome = async () => {
    setActivePage("home");
    setLoading(true);
    setError("");

    try {
      const data = await getRecommendedEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load recommendations");
    } finally {
      setLoading(false);
    }
  };


  const handleAllEvents = async () => {
    setActivePage("allEvents");
    setLoading(true);
    setError("");

    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load all events");
    } finally {
      setLoading(false);
    }
  };

  const handleProfile = async () => {
    setActivePage("profile");
    setLoading(true);
    setError("");

    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load profile");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const [recommendedData, bookmarkData] = await Promise.all([
          getRecommendedEvents(),
          getBookmarks(),
        ]);

        setEvents(recommendedData);
        setBookmarks(bookmarkData);

        setBookmarkedIds(
          new Set(bookmarkData.map((bookmark) => Number(bookmark.event_id)))
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="home-page">
      <header className="sidebar-topbar">
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? "<" : ">"}
        </button>

        {sidebarOpen && (
          <div className="topbar-brand">
            <div className="home-brand">
              Campus<span>Events</span>
            </div>
            <p className="home-tagline">
              YOUR CAMPUS, YOUR COMMUNITY
            </p>
          </div>
        )}
        {!sidebarOpen && (
          <div className="topbar-page-name">
            {activePage === "home" && "Home"}
            {activePage === "allEvents" && "All Events"}
            {activePage === "bookmarks" && "My Bookmarks"}
            {activePage === "profile" && "Profile"}
          </div>
        )}
        <button
          className={`topbar-filter-button ${filtersOpen ? "open" : ""}`}
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="filter-button-icon" />
          <span>Filters</span>
          <ChevronDown
            className={`filter-chevron ${filtersOpen ? "rotated" : ""}`}
          />
        </button>
      </header>
      
      <div className={`dashboard-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {sidebarOpen && (
          <aside className="dashboard-sidebar">
            <div className="sidebar-brand">
              <div>
                <div className="home-brand">
                  Campus<span>Events</span>
                </div>
                <p className="home-tagline">
                  YOUR CAMPUS, YOUR COMMUNITY
                </p>
              </div>
            </div>


            <nav className="sidebar-nav">

              <button
                className={activePage === "home" ? "active" : ""}
                type="button"
                onClick={handleHome}
              >
                <House className="sidebar-icon" />
                <span>Home</span>
              </button>

              <button
                className={activePage === "allEvents" ? "active" : ""}
                type="button"
                onClick={handleAllEvents}
              >
                <CalendarDays className="sidebar-icon" />
                <span>All Events</span>
              </button>

              <button
                className={activePage === "bookmarks" ? "active" : ""}
                type="button"
                onClick={handleMyBookmarks}
              >
                <Heart className="sidebar-icon" />
                <span>My Bookmarks</span>
              </button>

            </nav>

            <div className="sidebar-bottom">
              <button
                className={activePage === "profile" ? "active" : ""}
                type="button"
                onClick={handleProfile}
              >
                <UserRound className="sidebar-icon" />
                <span>Profile</span>
              </button>

              <button type="button" onClick={handleLogout}>
                <LogOut className="sidebar-icon" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        )}

        <div className="dashboard-main">
          {(activePage === "home" || activePage === "allEvents") &&
          filtersOpen && (
            <section className="filter-panel">
              <div className="filter-field">
                <label htmlFor="event-search">Search</label>
                <input
                  id="event-search"
                  type="text"
                  placeholder="Search events..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="event-category">Category</label>
                <select
                  id="event-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Technical">Technical</option>
                  <option value="Competition">Competition</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="event-date">Date</label>
                <input
                  id="event-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="event-start-time">From Time</label>
                <input
                  id="event-start-time"
                  type="time"
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="event-end-time">To Time</label>
                <input
                  id="event-end-time"
                  type="time"
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="event-club">Club</label>
                <select
                  id="event-club"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Tech Club">Tech Club</option>
                  <option value="Music & Arts Club">Music & Arts Club</option>
                  <option value="Sports Club">Sports Club</option>
                </select>
              </div>

              <div className="filter-actions">
                <button
                  type="button"
                  className="filter-clear-button"
                  onClick={() => {
                    setSearchText("");
                    setSelectedCategory("All");
                    setSelectedDate("");
                    setSelectedStartTime("");
                    setSelectedEndTime("");
                    setSelectedClub("All");

                    setAppliedFilters({
                      searchText: "",
                      selectedCategory: "All",
                      selectedDate: "",
                      selectedStartTime: "",
                      selectedEndTime: "",
                      selectedClub: "All",
                    });
                  }}
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="filter-apply-button"
                  onClick={() => {
                    setAppliedFilters({
                      searchText,
                      selectedCategory,
                      selectedDate,
                      selectedStartTime,
                      selectedEndTime,
                      selectedClub,
                    });
                  }}
                >
                  Apply
                </button>
              </div>
            </section>
          )}
          <main className="home-content">
            {loading && (
              <div className="events-state">
                Loading {activePage === "bookmarks" ? "bookmarks" : "events"}...
              </div>
            )}

            {error && (
              <div className="events-state">
                {error}
              </div>
            )}

            {!loading &&
             !error &&
        (activePage === "home" || activePage === "allEvents")  && (
              filteredEvents.length === 0 ? (
                <div className="events-state">
                  No events available right now.
                </div>
              ) : (
                <section className="events-grid" aria-label="Recommended events">
                  {filteredEvents.map((item) => {
                    const event = item.event || item;

                    return (
                      <EventCard
                        key={event.event_id}
                        item={{
                          ...item,
                          isBookmarked: bookmarkedIds.has(Number(event.event_id)),
                        }}
                        onBookmarkChange={handleBookmarkChange}
                      />
                    );
                  })}
                </section>
              )
            )}

            {!loading && !error && activePage === "bookmarks" && (
              bookmarks.length === 0 ? (
                <div className="events-state">
                  You haven't bookmarked any events yet.
                </div>
              ) : (
                <section className="events-grid" aria-label="My bookmarked events">
                  {bookmarks.map((bookmark) => (
                    <EventCard
                      key={bookmark.event_id}
                      item={{
                        ...bookmark.event,
                        isBookmarked: true,
                      }}
                      onBookmarkChange={handleBookmarkChange}
                    />
                  ))}
                </section>
              )
            )}

            {!loading && !error && activePage === "profile" && profile && (
              <section className="profile-page">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {profile.name?.charAt(0).toUpperCase() || "S"}
                  </div>

                  <div>
                    <h1>{profile.name}</h1>
                    <p>Student Profile</p>
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Personal Information</h2>

                  <div className="profile-detail">
                    <span>Student ID</span>
                    <p>{profile.student_id}</p>
                  </div>

                  <div className="profile-detail">
                    <span>Full Name</span>
                    <p>{profile.name}</p>
                  </div>

                  <div className="profile-detail">
                    <span>Email Address</span>
                    <p>{profile.email}</p>
                  </div>

                  <div className="profile-detail">
                    <span>Interests</span>
                    <p>
                      {Array.isArray(profile.interests) &&
                      profile.interests.length > 0
                        ? profile.interests.join(", ")
                        : "No interests added yet"}
                    </p>
                  </div>
                </div>
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;