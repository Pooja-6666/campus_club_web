const API_BASE_URL = "http://localhost:3000";

export const getRecommendedEvents = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/events/recommended?limit=10`,
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


export const addBookmark = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/bookmark", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ event_id: Number(eventId) }),
  });

  if (!response.ok) {
    throw new Error("Failed to bookmark event");
  }

  return response.json();
};

export const removeBookmark = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `http://localhost:3000/bookmark/${eventId}`,
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


export const getBookmarks = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/bookmarks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load bookmarks");
  }

  return response.json();
};

export const getAllEvents = async () => {
  const response = await fetch("http://localhost:3000/events");

  if (!response.ok) {
    throw new Error("Failed to load all events");
  }

  return response.json();
};

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