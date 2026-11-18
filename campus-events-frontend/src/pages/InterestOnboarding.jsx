
import { useState } from "react";
import { updateStudentInterests } from "../services/api";

function InterestOnboarding({ onComplete }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableInterests = [
    { name: "Technology", icon: "💻", color: "purple" },
    { name: "AI", icon: "⚙️", color: "purple" },
    { name: "Coding", icon: "</>", color: "pink" },
    { name: "Competitions", icon: "🏆", color: "orange" },
    { name: "Cultural", icon: "🎭", color: "pink" },
    { name: "Music", icon: "♫", color: "orange" },
    { name: "Dance", icon: "💃", color: "orange" },
    { name: "Sports", icon: "⚽", color: "purple" },
    { name: "Astronomy", icon: "🔭", color: "purple" },
    { name: "Entrepreneurship", icon: "💡", color: "purple" },
    { name: "Workshop", icon: "⚙", color: "purple" },
    { name: "Social", icon: "♟", color: "pink" },
  ];

  const handleToggle = (interest) => {
    setSelectedInterests((previous) =>
      previous.includes(interest)
        ? previous.filter((item) => item !== interest)
        : [...previous, interest]
    );
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      setError("Please select at least one interest or skip for now.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateStudentInterests(selectedInterests);
      onComplete();
    } catch (err) {
      console.error(err);
      setError("Unable to save interests. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="interest-onboarding-page">
      <main className="interest-onboarding-main">
        <div className="interest-onboarding-heading">
          <h1>
            Welcome to <span>CampusEvents!</span>
          </h1>
          <div className="heading-underline"></div>
          <p>
            Select your interests so we can recommend campus events
            that you may enjoy.
          </p>
        </div>

        <section className="interest-onboarding-card">
          <div className="interest-panel-heading">
            <div className="interest-panel-title">
              <span className="interest-panel-icon">◇</span>
              <h2>Choose Your Interests</h2>
            </div>

            <span className="interest-hint">Pick one or more</span>
          </div>

          <div className="interest-onboarding-options">
            {availableInterests.map((interest) => (
              <label
                key={interest.name}
                className={`interest-onboarding-option ${
                  selectedInterests.includes(interest.name) ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(interest.name)}
                  onChange={() => handleToggle(interest.name)}
                />

                <span className={`interest-option-icon ${interest.color}`}>
                  {interest.icon}
                </span>

                <span className="interest-option-name">
                  {interest.name}
                </span>
              </label>
            ))}
          </div>
        </section>

        {error && <p className="interest-onboarding-error">{error}</p>}

        <div className="interest-onboarding-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            <span>✓</span>
            {saving ? "Saving..." : "Save Preferences"}
          </button>

          <button
            type="button"
            className="interest-onboarding-skip"
            onClick={onComplete}
            disabled={saving}
          >
            Skip for now
          </button>
        </div>
      </main>
    </div>
  );
}

export default InterestOnboarding;
