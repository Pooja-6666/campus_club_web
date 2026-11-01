
import streamlit as st
from pathlib import Path

from app.rag_pipeline import generate_answer, is_event_list_question
from app.retrieval.search_events import events


# --------------------------------------------------
# PAGE CONFIGURATION
# --------------------------------------------------

st.set_page_config(
    page_title="Campus Club AI Assistant",
    page_icon="🎓",
    layout="centered",
    initial_sidebar_state="expanded"
)


# --------------------------------------------------
# PATH CONFIGURATION
# --------------------------------------------------

POSTER_FOLDER = (
    Path(__file__).resolve().parent
    / "data"
    / "raw"
    / "posters"
    / "Posters(website)"
)


# --------------------------------------------------
# SESSION STATE
# --------------------------------------------------

if "messages" not in st.session_state:
    st.session_state.messages = []

if "pending_question" not in st.session_state:
    st.session_state.pending_question = None


# --------------------------------------------------
# CUSTOM CSS
# --------------------------------------------------

st.markdown("""
<style>

/* Main application */
.stApp {
    background-color: #0f172a;
    color: #f8fafc;
}

.block-container {
    max-width: 1000px;
    padding-top: 2rem;
    padding-bottom: 3rem;
}

/* General text */
.stApp p,
.stApp li,
.stApp label {
    color: #e2e8f0;
}

/* Headings */
.stApp h1,
.stApp h2,
.stApp h3,
.stApp h4 {
    color: #ffffff !important;
}

/* Hero section */
.hero {
    text-align: center;
    padding: 30px 20px;
    border-radius: 18px;
    background: linear-gradient(135deg, #312e81, #6d28d9);
    margin-bottom: 25px;
}

.hero h1 {
    color: #ffffff !important;
    font-size: 34px;
}

.hero p {
    color: #ede9fe !important;
}

/* Section headings */
.section-title {
    color: #c4b5fd !important;
    font-size: 17px;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 12px;
}

/* Chat message containers */
div[data-testid="stChatMessage"] {
    background-color: #1e293b;
    border: 1px solid #475569;
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 12px;
}

/* Chat response text */
div[data-testid="stChatMessage"] p,
div[data-testid="stChatMessage"] li,
div[data-testid="stChatMessage"] strong,
div[data-testid="stChatMessage"] em {
    color: #f8fafc !important;
}

/* Chat input container */
.stApp [data-testid="stChatInput"] {
    background-color: #ffffff !important;
    border: 2px solid #8b5cf6 !important;
    border-radius: 12px !important;
}

/* Actual typing area */
.stApp [data-testid="stChatInput"] textarea,
.stApp [data-testid="stChatInputTextArea"],
.stApp [data-testid="stChatInput"] textarea:focus {
    color: #111827 !important;
    -webkit-text-fill-color: #111827 !important;
    background-color: #ffffff !important;
    caret-color: #7c3aed !important;
    opacity: 1 !important;
}

/* Placeholder text */
.stApp [data-testid="stChatInput"] textarea::placeholder,
.stApp [data-testid="stChatInputTextArea"]::placeholder {
    color: #64748b !important;
    -webkit-text-fill-color: #64748b !important;
    opacity: 1 !important;
}

/* Suggested question buttons */
.stButton > button {
    width: 100%;
    border-radius: 10px;
    border: 1px solid #64748b;
    background-color: #1e293b;
    color: #ffffff !important;
    padding: 12px;
    text-align: left;
}

.stButton > button p {
    color: #ffffff !important;
}

.stButton > button:hover {
    border-color: #a78bfa;
    background-color: #312e81;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background-color: #1e1b35;
}

section[data-testid="stSidebar"] p,
section[data-testid="stSidebar"] span,
section[data-testid="stSidebar"] label,
section[data-testid="stSidebar"] li {
    color: #f8fafc !important;
}

/* Metrics */
[data-testid="stMetricValue"] {
    color: #c4b5fd !important;
}

/* Captions */
[data-testid="stCaptionContainer"] {
    color: #cbd5e1 !important;
}

/* Event card images */
div[data-testid="stImage"] img {
    border-radius: 10px;
}

</style>
""", unsafe_allow_html=True)


# --------------------------------------------------
# EVENT CARD RENDERING
# --------------------------------------------------

def render_event_cards(event_records):

    st.markdown("### 🎓 Available Campus Events")

    columns_per_row = 2

    for start in range(0, len(event_records), columns_per_row):

        columns = st.columns(columns_per_row)

        for column, event in zip(
            columns,
            event_records[start:start + columns_per_row]
        ):

            with column:

                with st.container(border=True):

                    source_file = event.get("source_file")

                    poster_path = (
                        POSTER_FOLDER / source_file
                        if source_file else None
                    )

                    # Poster image
                    if poster_path and poster_path.is_file():

                        st.image(
                            str(poster_path),
                            use_container_width=True
                        )

                    else:

                        st.info("Poster image unavailable")

                    # Event name
                    st.markdown(
                        f"#### {event.get('event_name') or 'Unknown Event'}"
                    )

                    # Event information
                    st.write(
                        f"**Organizer:** "
                        f"{event.get('organizer') or 'Not mentioned'}"
                    )

                    st.write(
                        f"**Festival:** "
                        f"{event.get('festival') or 'Not mentioned'}"
                    )

                    st.write(
                        f"**Date:** "
                        f"{event.get('date') or 'Not mentioned'}"
                    )

                    st.write(
                        f"**Venue:** "
                        f"{event.get('venue') or 'Not mentioned'}"
                    )

                    st.caption(
                        f"Source: {source_file or 'Unavailable'}"
                    )


# --------------------------------------------------
# DISPLAY SAVED MESSAGES
# --------------------------------------------------

def display_message(message):

    if message.get("type") == "event_cards":

        st.markdown(
            f"**Total events found: {len(message['events'])}**"
        )

        render_event_cards(message["events"])

    else:

        st.markdown(message.get("content", ""))


# --------------------------------------------------
# EVENT LIST QUESTION DETECTION
# --------------------------------------------------

def is_event_collection_question(question):

    question_lower = question.lower()

    organizer_query = (
        "events organized by" in question_lower
        or "events organised by" in question_lower
        or "which events are organized by" in question_lower
        or "which events are organised by" in question_lower
    )

    return (
        is_event_list_question(question)
        or organizer_query
    )


# --------------------------------------------------
# FILTER EVENTS
# --------------------------------------------------

def get_matching_events(question):

    question_lower = question.lower()

    matching_events = events

    if "organized by" in question_lower:

        organizer_name = question_lower.split(
            "organized by", 1
        )[1].strip(" ?.,")
        
        matching_events = [
            event for event in events
            if organizer_name in (
                event.get("organizer") or ""
            ).lower()
        ]

    elif "organised by" in question_lower:

        organizer_name = question_lower.split(
            "organised by", 1
        )[1].strip(" ?.,")
        
        matching_events = [
            event for event in events
            if organizer_name in (
                event.get("organizer") or ""
            ).lower()
        ]

    return matching_events


# --------------------------------------------------
# SIDEBAR
# --------------------------------------------------

with st.sidebar:

    st.title("🎓 Campus Club")

    st.caption("AI Event Assistant")

    st.divider()

    st.subheader("What I can do")

    st.markdown("""
    - 🔍 Discover campus events
    - 👥 Find event organizers
    - 📍 Check event venues
    - 📅 Find dates and timings
    - 📝 Explore registration details
    """)

    st.divider()

    st.subheader("Knowledge Base")

    st.metric(
        "Indexed Events",
        len(events)
    )

    st.caption(
        "Information is retrieved from the currently "
        "available event poster records."
    )

    st.divider()

    if st.button("🗑️ Clear conversation"):

        st.session_state.messages = []
        st.session_state.pending_question = None

        st.rerun()


# --------------------------------------------------
# HEADER
# --------------------------------------------------

st.markdown("""
<div class="hero">
    <h1>🎓 Campus Club AI Assistant</h1>
    <p>
        Your intelligent companion for discovering
        campus events and activities.
    </p>
</div>
""", unsafe_allow_html=True)


# --------------------------------------------------
# WELCOME SCREEN
# --------------------------------------------------

if not st.session_state.messages:

    st.markdown(
        '<div class="section-title">'
        '👋 Welcome! What would you like to know?'
        '</div>',
        unsafe_allow_html=True
    )

    st.write(
        "Ask me about events, organizers, venues, "
        "registration information and more."
    )

    st.markdown(
        '<div class="section-title">✨ Try asking</div>',
        unsafe_allow_html=True
    )

    suggestions = [
        "Which events are available?",
        "Who organized MONOPOLY?",
        "Tell me about SKY CIRCUIT",
        "Where is CRICKET CARNAGE happening?"
    ]

    for index, suggestion in enumerate(suggestions):

        if st.button(
            suggestion,
            key=f"suggestion_{index}"
        ):

            st.session_state.pending_question = suggestion

            st.rerun()


# --------------------------------------------------
# DISPLAY CHAT HISTORY
# --------------------------------------------------

for message in st.session_state.messages:

    with st.chat_message(message["role"]):

        display_message(message)


# --------------------------------------------------
# CHAT INPUT
# --------------------------------------------------

question = st.chat_input(
    "Ask anything about campus events..."
)

if st.session_state.pending_question:

    question = st.session_state.pending_question

    st.session_state.pending_question = None


# --------------------------------------------------
# GENERATE ANSWER
# --------------------------------------------------

if question:

    # Save and display user question
    st.session_state.messages.append({
        "role": "user",
        "content": question
    })

    with st.chat_message("user"):

        st.markdown(question)

    # Generate assistant response
    with st.chat_message("assistant"):

        with st.spinner("🔍 Finding campus events..."):

            try:

                if is_event_collection_question(question):

                    matching_events = get_matching_events(question)

                    if matching_events:

                        st.markdown(
                            f"**Total events found: "
                            f"{len(matching_events)}**"
                        )

                        render_event_cards(matching_events)

                        assistant_message = {
                            "role": "assistant",
                            "type": "event_cards",
                            "events": matching_events
                        }

                    else:

                        answer = (
                            "I couldn't find any events matching "
                            "your search in the available records."
                        )

                        st.markdown(answer)

                        assistant_message = {
                            "role": "assistant",
                            "content": answer
                        }

                else:

                    answer = generate_answer(question)

                    st.markdown(answer)

                    assistant_message = {
                        "role": "assistant",
                        "content": answer
                    }

            except Exception as error:

                print("Chatbot error:", error)

                answer = (
                    "Sorry, something went wrong while "
                    "retrieving event information. Please try again."
                )

                st.error(answer)

                assistant_message = {
                    "role": "assistant",
                    "content": answer
                }

    # Save assistant response
    st.session_state.messages.append(assistant_message)
