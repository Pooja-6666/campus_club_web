const API_BASE_URL = "http://localhost:3000/api";

// Get recommended events
export const getRecommendedEvents = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/student/events/recommended?limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
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

// Get profile
export const getProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  return response.json();
};