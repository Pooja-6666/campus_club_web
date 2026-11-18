from app.retrieval.search_events import search_events, events


SIMILARITY_THRESHOLD = 0.30


def clean_value(value, fallback="Not mentioned in the poster"):
    if value is None:
        return fallback

    value = str(value).strip()

    if not value or value.lower() in {
        "none",
        "null",
        "unknown",
        "na",
        "n/a"
    }:
        return fallback

    return value


def is_event_list_question(question):
    question = question.lower()

    patterns = [
        "which events",
        "what events",
        "list events",
        "list all events",
        "show all events",
        "show me all events",
        "available events",
        "all campus events",
        "upcoming events",
        "events available",
        "what events are happening"
    ]

    return any(
        pattern in question
        for pattern in patterns
    )


def generate_event_list_answer(question):

    question_lower = question.lower()

    if not events:
        return (
            "I couldn't find any event records in the "
            "currently indexed knowledge base."
        )

    matching_events = events

    if (
        "organized by" in question_lower
        or "organised by" in question_lower
    ):

        organizer_name = (
            question_lower.split("organized by")[-1]
            if "organized by" in question_lower
            else question_lower.split("organised by")[-1]
        ).strip(" ?.,")

        matching_events = [
            event
            for event in events
            if organizer_name in (
                event.get("organizer") or ""
            ).lower()
        ]

    if not matching_events:
        return (
            "I couldn't find any matching events "
            "in the available records."
        )

    answer = "### Available Campus Events\n\n"

    for number, event in enumerate(
        matching_events,
        start=1
    ):

        answer += (
            f"**{number}. "
            f"{clean_value(event.get('event_name'), 'Unknown event')}**\n\n"
            f"- Organizer: "
            f"{clean_value(event.get('organizer'))}\n"
            f"- Festival: "
            f"{clean_value(event.get('festival'))}\n"
            f"- Date: "
            f"{clean_value(event.get('date'))}\n"
            f"- Venue: "
            f"{clean_value(event.get('venue'))}\n\n"
        )

    answer += (
        f"**Total events found: "
        f"{len(matching_events)}**"
    )

    return answer


def detect_intent(question):

    question = question.lower()

    if any(
        word in question
        for word in [
            "who organized",
            "who is organizing",
            "organizer",
            "organised by",
            "organized by",
            "conducted by"
        ]
    ):
        return "organizer"

    if any(
        word in question
        for word in [
            "where",
            "venue",
            "location",
            "place",
            "held"
        ]
    ):
        return "venue"

    if any(
        word in question
        for word in [
            "when",
            "date",
            "time",
            "timing",
            "schedule"
        ]
    ):
        return "date_time"

    if any(
        word in question
        for word in [
            "register",
            "registration",
            "sign up",
            "enroll"
        ]
    ):
        return "registration"

    if any(
        word in question
        for word in [
            "contact",
            "phone",
            "email",
            "coordinator"
        ]
    ):
        return "contact"

    if any(
        word in question
        for word in [
            "source",
            "poster",
            "image"
        ]
    ):
        return "source"

    return "overview"


def generate_local_answer(question, results):

    if not results:
        return (
            "I couldn't find any matching events "
            "in the available records."
        )

    best_result = results[0]

    event = best_result["event"]
    score = best_result["score"]

    if score < SIMILARITY_THRESHOLD:
        return (
            "I couldn't identify a sufficiently relevant "
            "event from the available records. "
            "Please try using the event name."
        )

    event_name = clean_value(
        event.get("event_name"),
        "Unknown event"
    )

    organizer = clean_value(
        event.get("organizer")
    )

    festival = clean_value(
        event.get("festival")
    )

    category = clean_value(
        event.get("category")
    )

    date = clean_value(
        event.get("date")
    )

    end_date = clean_value(
        event.get("endDate")
    )

    time = clean_value(
        event.get("time")
    )

    venue = clean_value(
        event.get("venue")
    )

    registration = clean_value(
        event.get("registration_details")
    )

    contact = clean_value(
        event.get("contact_details")
    )

    description = clean_value(
        event.get("description")
    )

    source = clean_value(
        event.get("source_file"),
        "Unavailable"
    )

    event_id = event.get("event_id")

    intent = detect_intent(question)

    if intent == "organizer":

        answer = (
            f"The organizer of **{event_name}** "
            f"is **{organizer}**."
        )

    elif intent == "venue":

        answer = (
            f"The venue for **{event_name}** "
            f"is **{venue}**."
        )

    elif intent == "date_time":

        answer = (
            f"**{event_name}**\n\n"
            f"- Date: {date}\n"
            f"- End Date: {end_date}\n"
            f"- Time: {time}"
        )

    elif intent == "registration":

        answer = (
            f"Registration information for "
            f"**{event_name}**: {registration}."
        )

    elif intent == "contact":

        answer = (
            f"Contact information for "
            f"**{event_name}**: {contact}."
        )

    elif intent == "source":

        answer = (
            f"The source poster is **{source}**."
        )

    else:

        answer = (
            f"### {event_name}\n\n"
            f"- **Organizer:** {organizer}\n"
            f"- **Festival:** {festival}\n"
            f"- **Category:** {category}\n"
            f"- **Date:** {date}\n"
            f"- **End Date:** {end_date}\n"
            f"- **Time:** {time}\n"
            f"- **Venue:** {venue}\n"
            f"- **Registration:** {registration}\n"
            f"- **Contact:** {contact}\n"
            f"- **Description:** {description}"
        )

    if event_id is not None:
        answer += f"\n\n_Event ID: {event_id}_"

    answer += f"\n\n_Source: {source}_"

    return answer


def generate_answer(question):

    if not question or not question.strip():
        return "Please enter a question about campus events."

    if not events:
        return (
            "The campus event knowledge base has not "
            "been indexed yet."
        )

    if is_event_list_question(question):
        return generate_event_list_answer(question)

    results = search_events(
        question,
        top_k=3
    )

    return generate_local_answer(
        question,
        results
    )


if __name__ == "__main__":

    print(
        "\n========== CAMPUS CLUB RAG CHATBOT =========="
    )

    print("Type 'exit' to stop.")

    while True:

        question = input(
            "\nYou: "
        ).strip()

        if question.lower() in [
            "exit",
            "quit"
        ]:
            break

        print("\nAssistant:")

        print(
            generate_answer(question)
        )