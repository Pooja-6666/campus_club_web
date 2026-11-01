
import { useState } from "react";

function CreateEvent() {
  const [poster, setPoster] = useState(null);
  const [preview, setPreview] = useState("");
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    contact_phone: "",
    club_id: "1",
    category: "Technology",
    tags: "AI, Hackathon",
    capacity: "100",
    endDate: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Update individual form fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Convert AI-extracted date into YYYY-MM-DD
  const convertToDateInput = (dateText) => {
    if (!dateText) return "";

    const text = String(dateText).trim();

    // Already in HTML date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    // Remove ordinal suffixes: 23rd -> 23
    const normalised = text.replace(
      /(\d+)(st|nd|rd|th)/gi,
      "$1"
    );

    // Match dates such as 23 October 2023
    const match = normalised.match(
      /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/
    );

    if (!match) return "";

    const day = Number(match[1]);
    const monthName = match[2];
    const year = Number(match[3]);

    const parsed = new Date(
      `${monthName} ${day}, ${year}`
    );

    if (
      isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== year ||
      parsed.getDate() !== day
    ) {
      return "";
    }

    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");

    return `${year}-${month}-${formattedDay}`;
  };

  // Upload poster and automatically populate event fields
  const handlePosterChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Poster size must be less than 5 MB.");
      return;
    }

    setError("");
    setMessage("");
    setPoster(file);

    setPreview(URL.createObjectURL(file));

    try {
      setLoadingOcr(true);

      const token = localStorage.getItem("token");

      const uploadData = new FormData();
      uploadData.append("poster", file);

      const response = await fetch(
        "http://localhost:3000/organizer/parse-poster",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to parse poster"
        );
      }

      // Read structured fields returned by Node backend
      const fields = result.parsedFields;

      if (!fields || typeof fields !== "object") {
        throw new Error(
          "Structured event details were not received from the backend."
        );
      }

      console.log("AI extracted event fields:", fields);

      // Populate the form using individual JSON properties
      setFormData((prev) => ({
        ...prev,

        title: fields.title || "",
        description: fields.description || "",
        date: convertToDateInput(fields.date),
        endDate: convertToDateInput(fields.endDate),
        time: fields.time || "",
        venue: fields.venue || "",
        contact_phone: fields.contact_phone || "",
        category: fields.category || prev.category,
      }));

      // Show a short confirmation instead of displaying raw JSON
      setExtractedText(
        "Event details extracted successfully using AI."
      );

    } catch (err) {
      console.error("OCR API error:", err);

      setError(
        err.message || "Failed to extract poster details."
      );

    } finally {
      setLoadingOcr(false);
    }
  };

  // Submit event
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!formData.title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter an event description.");
      return;
    }

    if (!formData.date) {
      setError("Please select an event date.");
      return;
    }

    if (!formData.venue.trim()) {
      setError("Please enter the venue.");
      return;
    }

    if (!formData.club_id) {
      setError("Please enter the club ID.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });

      if (poster) {
        data.append("poster", poster);
      }

      const response = await fetch(
        "http://localhost:3000/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create event"
        );
      }

      setMessage(
        "✨ Event submitted successfully! Pending faculty approval."
      );

      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        contact_phone: "",
        club_id: "1",
        category: "",
        tags: "",
        capacity: "",
        endDate: "",
      });

      setPoster(null);
      setPreview("");
      setExtractedText("");

    } catch (err) {
      console.error(err);

      setError(
        err.message || "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "0 20px",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          marginBottom: "30px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "20px",
        }}
      >
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

        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            margin: "8px 0 6px 0",
            background: "linear-gradient(135deg, #fff 0%, #cbd5e1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Create Campus Event
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "15px" }}>
          Upload an event poster to instantly extract details with AI OCR ingestion.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >

        {/* Poster Upload Card */}

        <div
          style={{
            background: "rgba(30, 41, 59, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#e2e8f0",
            }}
          >
            Event Poster & AI OCR
          </h3>

          {preview ? (
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <img
                src={preview}
                alt="Poster preview"
                style={{
                  width: "120px",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />

              <div style={{ flex: 1 }}>
                {loadingOcr ? (
                  <p
                    style={{
                      color: "#a855f7",
                      fontWeight: "600",
                    }}
                  >
                    🤖 Analyzing poster with AI OCR...
                  </p>
                ) : (
                  <p
                    style={{
                      color: "#22c55e",
                      fontWeight: "600",
                    }}
                  >
                    ✅ Poster successfully ingested & parsed!
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPoster(null);
                    setPreview("");
                    setExtractedText("");
                    setError("");

                    setFormData((prev) => ({
                      ...prev,
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      venue: "",
                      contact_phone: "",
                    }));
                  }}
                  style={{
                    marginTop: "12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Remove Poster
                </button>
              </div>
            </div>
          ) : (
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed rgba(168, 85, 247, 0.4)",
                borderRadius: "12px",
                padding: "32px",
                cursor: "pointer",
                background: "rgba(168, 85, 247, 0.03)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  color: "#a855f7",
                  marginBottom: "8px",
                }}
              >
                📁
              </div>

              <span
                style={{
                  fontWeight: "600",
                  color: "#f8fafc",
                  marginBottom: "4px",
                }}
              >
                Click to upload event poster
              </span>

              <span
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Supports JPG, PNG, WEBP (Max 5MB)
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePosterChange}
                style={{ display: "none" }}
              />
            </label>
          )}

          {extractedText && (
            <div
              style={{
                marginTop: "16px",
                background: "rgba(168, 85, 247, 0.08)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#c084fc",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                ✨ AI Extraction Status
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  margin: 0,
                }}
              >
                {extractedText}
              </p>
            </div>
          )}
        </div>

        {/* Event Information */}

        <div
          style={{
            background: "rgba(30, 41, 59, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "28px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "20px",
              color: "#e2e8f0",
            }}
          >
            Event Information
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >

            {/* Title */}

            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>
                Event Title *
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 24 Hour Hackathon"
                style={inputStyle}
              />
            </div>

            {/* Description */}

            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>
                Description *
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Event details..."
                rows="4"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {/* Date */}

            <div>
              <label style={labelStyle}>
                Date *
              </label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* Time */}

            <div>
              <label style={labelStyle}>
                Time
              </label>

              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="9 AM - 9 PM"
                style={inputStyle}
              />
            </div>

            {/* Venue */}

            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>
                Venue *
              </label>

              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. MEL Seminar Hall, 7th Floor"
                style={inputStyle}
              />
            </div>

            {/* Contact */}

            <div
              style={{ gridColumn: "span 2" }}
              className="form-group"
            >
              <label style={labelStyle}>
                Contact Phone Number
              </label>

              <input
                type="tel"
                name="contact_phone"
                placeholder="e.g. +91 98765 43210"
                value={formData.contact_phone}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* Category */}

            <div>
              <label style={labelStyle}>
                Category
              </label>

              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Technology"
                style={inputStyle}
              />
            </div>

            {/* Club ID */}

            <div>
              <label style={labelStyle}>
                Club ID *
              </label>

              <input
                type="number"
                name="club_id"
                value={formData.club_id}
                onChange={handleChange}
                placeholder="1"
                style={inputStyle}
              />
            </div>

            {/* Tags */}

            <div>
              <label style={labelStyle}>
                Tags
              </label>

              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="AI, Hackathon, Coding"
                style={inputStyle}
              />
            </div>

            {/* Capacity */}

            <div>
              <label style={labelStyle}>
                Capacity
              </label>

              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="100"
                style={inputStyle}
              />
            </div>

          </div>
        </div>

        {/* Error and Success Messages */}

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {/* Submit Button */}

        <button
          type="submit"
          disabled={loading || loadingOcr}
          style={{
            background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
            color: "#fff",
            border: "none",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.4)",
            transition: "all 0.2s ease",
          }}
        >
          {loading
            ? "Submitting Event..."
            : loadingOcr
            ? "Extracting Event Details..."
            : "Submit Event for Approval →"}
        </button>

      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "6px",
  color: "#cbd5e1",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
};

export default CreateEvent;
