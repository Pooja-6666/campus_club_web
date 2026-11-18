const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Get recommended events
export const getRecommendedEvents = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/recommended?limit=10`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return response.json();
};

// Add bookmark
export const addBookmark = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/bookmarks/${eventId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to bookmark event");
  }

  return response.json();
};

// Remove bookmark
export const removeBookmark = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/bookmarks/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove bookmark");
  }

  return response.json();
};

// Get bookmarks
export const getBookmarks = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/bookmarks`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load bookmarks");
  }

  return response.json();
};

// Get all approved events
export const getAllEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/events`);

  if (!response.ok) {
    throw new Error("Failed to load all events");
  }

  return response.json();
};

// Get student profile
export const getProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/profile`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  return response.json();
};

// Update student interests
export const updateStudentInterests = async (interests) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/profile/interests`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ interests }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update interests");
  }

  return response.json();
};


// Record an event view
export const recordEventView = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/${eventId}/view`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to record event view");
  }

  return response.json();
};

// Set Interested / Not Interested
export const setEventInterest = async (eventId, status) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/${eventId}/interest`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update event interest");
  }

  return response.json();
};

// Remove interest response
export const removeEventInterest = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/${eventId}/interest`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove event interest");
  }

  return response.json();
};

// RSVP to an event
export const rsvpEvent = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/${eventId}/rsvp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to RSVP to event");
  }

  return response.json();
};

// Cancel RSVP
export const cancelRsvp = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/${eventId}/rsvp`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to cancel RSVP");
  }

  return response.json();
};

// Get the current student's interaction status for an event
export const getEventInteractionStatus = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/${eventId}/interaction-status`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch event interaction status");
  }

  return response.json();
};