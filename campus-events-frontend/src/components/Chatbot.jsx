
import { useState } from "react";
import "./Chatbot.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = (e) => {
    e.preventDefault();

    // Placeholder only — chatbot API integration will be added later.
    if (!message.trim()) return;

    setMessage("");
  };

  return (
    <>
      {/* Floating chatbot button */}
      {!isOpen && (
        <button
        className="chatbot-floating-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open chatbot"
        >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-.9L3 21l1.9-5.5a8.5 8.5 0 1 1 16.1-4Z" />
            <circle cx="8.5" cy="11.5" r="0.8" fill="currentColor" />
            <circle cx="12.5" cy="11.5" r="0.8" fill="currentColor" />
            <circle cx="16.5" cy="11.5" r="0.8" fill="currentColor" />
        </svg>
        </button>


      )}

      {/* Chatbot window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-header-icon">🤖</span>
              <span>CampusEvents Assistant</span>
            </div>

            <button
              className="chatbot-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="chatbot-body">
            <div className="chatbot-placeholder">
              <div className="chatbot-placeholder-icon">🤖</div>

              <h2>Chatbot Coming Soon!</h2>

              <p>
                An AI assistant to help you discover events,
                get recommendations, and more.
              </p>
            </div>
          </div>

          <form className="chatbot-input-container" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit" aria-label="Send message">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;
