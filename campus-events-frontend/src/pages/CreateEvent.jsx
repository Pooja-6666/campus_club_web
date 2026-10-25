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
    contact_phone: "", // 👈 Added contact phone state
    club_id: "1",
    category: "Technology",
    tags: "AI, Hackathon",
    capacity: "100",
    endDate: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Smart Regex Parser to extract fields from OCR text
  const parseOcrFields = (text) => {
    const updates = {};
    
    // Attempt to find a date (e.g., "Jan 20th, 2025" or "2025-01-20")
    const dateMatch = text.match(/(?:date[:\s]*)?([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?[\s,]*\d{4})/i);
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate)) {
          updates.date = parsedDate.toISOString().split("T")[0];
        }
      } catch (e) {
        // fallback
      }
    }

    // Attempt to find venue (e.g., "VENUE: ...")
    const venueMatch = text.match(/venue[:\s]*([^\n]+)/i);
    if (venueMatch) {
      updates.venue = venueMatch[1].trim();
    }

    // Attempt to find title (e.g., "24 HOUR HACKATHON" or lines near top)
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && !formData.title) {
      // Pick a strong candidate line for title
      const titleCandidate = lines.find(l => l.includes("HACKATHON") || l.includes("BATTLE") || l.includes("PRESENTS")) || lines[0];
      updates.title = titleCandidate.replace(/PRESENTS|[:|]/gi, "").trim();
    }

    return updates;
  };

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
    setPoster(file);
    setPreview(URL.createObjectURL(file));

    try {
      setLoadingOcr(true);
      const token = localStorage.getItem("token");
      const uploadData = new FormData();
      uploadData.append("poster", file);

      const response = await fetch("http://localhost:3000/organizer/parse-poster", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedText(data.extractedText);
        
        // Smart parse fields from OCR text
        const smartFields = parseOcrFields(data.extractedText);

        setFormData((prev) => ({
          ...prev,
          description: data.extractedText,
          title: prev.title || smartFields.title || "",
          date: prev.date || smartFields.date || "",
          venue: prev.venue || smartFields.venue || "",
        }));
      } else {
        setError(data.error || "Failed to parse poster");
      }
    } catch (err) {
      console.error("OCR API error:", err);
    } finally {
      setLoadingOcr(false);
    }
  };

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
        if (formData[key]) data.append(key, formData[key]);
      });

      if (poster) {
        data.append("poster", poster);
      }

      const response = await fetch("http://localhost:3000/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create event");
      }

      setMessage("✨ Event submitted successfully! Pending faculty approval.");
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
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px", color: "#f8fafc" }}>
      <div style={{ marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "1.5px", color: "#a855f7", fontWeight: "700", textTransform: "uppercase" }}>Organizer Portal</span>
        <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "8px 0 6px 0", background: "linear-gradient(135deg, #fff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Create Campus Event</h1>
        <p style={{ color: "#94a3b8", fontSize: "15px" }}>Upload an event poster to instantly extract details with AI OCR ingestion.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Poster Upload Card */}
        <div style={{ background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#e2e8f0" }}>Event Poster & AI OCR</h3>
          
          {preview ? (
            <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <img src={preview} alt="Poster preview" style={{ width: "120px", height: "160px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }} />
              <div style={{ flex: 1 }}>
                {loadingOcr ? (
                  <p style={{ color: "#a855f7", fontWeight: "600", animation: "pulse 1.5s infinite" }}>🤖 Analyzing poster with AI OCR...</p>
                ) : (
                  <p style={{ color: "#22c55e", fontWeight: "600" }}>✅ Poster successfully ingested & parsed!</p>
                )}
                <button
                  type="button"
                  onClick={() => { setPoster(null); setPreview(""); setExtractedText(""); }}
                  style={{ marginTop: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
                >
                  Remove Poster
                </button>
              </div>
            </div>
          ) : (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(168, 85, 247, 0.4)", borderRadius: "12px", padding: "32px", cursor: "pointer", background: "rgba(168, 85, 247, 0.03)", transition: "all 0.2s ease" }}>
              <div style={{ fontSize: "28px", color: "#a855f7", marginBottom: "8px" }}>📁</div>
              <span style={{ fontWeight: "600", color: "#f8fafc", marginBottom: "4px" }}>Click to upload event poster</span>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Supports JPG, PNG, WEBP (Max 5MB)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePosterChange} style={{ display: "none" }} />
            </label>
          )}

          {extractedText && (
            <div style={{ marginTop: "16px", background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "10px", padding: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#c084fc", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>✨ Raw AI OCR Extracted Text</div>
              <p style={{ fontSize: "13px", color: "#cbd5e1", whiteSpace: "pre-wrap", maxHeight: "100px", overflowY: "auto", margin: 0, fontFamily: "monospace" }}>{extractedText}</p>
            </div>
          )}
        </div>

        {/* Event Information Grid */}
        <div style={{ background: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "28px", backdropFilter: "blur(10px)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "#e2e8f0" }}>Event Information</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Event Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. 24 Hour Hackathon" style={inputStyle} />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Event details..." rows="4" style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} style={inputStyle} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Time</label>
              <input type="text" name="time" value={formData.time} onChange={handleChange} placeholder="9 AM - 9 PM" style={inputStyle} />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Venue *</label>
              <input type="text" name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. MEL Seminar Hall, 7th Floor" style={inputStyle} />
            </div>

            {/* Contact Phone Number Field */}
            <div style={{ gridColumn: "span 2" }} className="form-group">
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }} className="text-xs text-slate-300 font-medium">Contact Phone Number</label>
              <input 
                type="tel" 
                name="contact_phone" 
                placeholder="e.g. +91 98765 43210" 
                value={formData.contact_phone || ""} 
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Technology" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Club ID *</label>
              <input type="number" name="club_id" value={formData.club_id} onChange={handleChange} placeholder="1" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="AI, Hackathon, Coding" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#cbd5e1" }}>Capacity</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="100" style={inputStyle} />
            </div>

          </div>
        </div>

        {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "12px 16px", borderRadius: "10px", fontSize: "14px" }}>{error}</div>}
        {message && <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22c55e", padding: "12px 16px", borderRadius: "10px", fontSize: "14px" }}>{message}</div>}

        <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", color: "#fff", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.4)", transition: "all 0.2s ease" }}>
          {loading ? "Submitting Event..." : "Submit Event for Approval →"}
        </button>

      </form>
    </div>
  );
}

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