import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


REQUIRED_FIELDS = [
    "event_name",
    "date",
    "endDate",
    "time",
    "venue",
    "category",
]


def clean_value(value, fallback="NA"):
    """Convert empty/null OCR values into a consistent representation."""
    if value is None:
        return fallback

    value = str(value).strip()

    if not value or value.lower() in {
        "none",
        "null",
        "unknown",
        "n/a",
    }:
        return fallback

    return value


def normalize_event(event):
    """
    Normalize one structured OCR event.

    The PostgreSQL event_id is preserved if it is already
    present in the OCR/approved event data.
    """

    normalized = {
        "event_id": event.get("event_id"),
        "event_name": clean_value(event.get("event_name")),
        "organizer": clean_value(event.get("organizer")),
        "festival": clean_value(event.get("festival")),
        "category": clean_value(event.get("category")),
        "date": clean_value(event.get("date")),
        "endDate": clean_value(event.get("endDate")),
        "time": clean_value(event.get("time")),
        "venue": clean_value(event.get("venue")),
        "registration_details": clean_value(
            event.get("registration_details")
        ),
        "contact_details": clean_value(
            event.get("contact_details")
        ),
        "description": clean_value(event.get("description")),
        "source_file": clean_value(
            event.get("source_file")
        ),
    }

    return normalized


def create_document(event):
    """
    Convert one normalized event into the text that will be embedded.
    """

    return (
        f"Event: {event['event_name']}\n"
        f"Organizer: {event['organizer']}\n"
        f"Festival: {event['festival']}\n"
        f"Category: {event['category']}\n"
        f"Date: {event['date']}\n"
        f"End Date: {event['endDate']}\n"
        f"Time: {event['time']}\n"
        f"Venue: {event['venue']}\n"
        f"Registration: {event['registration_details']}\n"
        f"Contact: {event['contact_details']}\n"
        f"Description: {event['description']}\n"
    )


def load_ocr_events(input_file):
    """
    Load structured OCR output from a JSON file.
    """

    input_file = Path(input_file)

    if not input_file.exists():
        raise FileNotFoundError(
            f"OCR input file not found: {input_file}"
        )

    with open(input_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, dict):
        data = data.get("events", [])

    if not isinstance(data, list):
        raise ValueError(
            "OCR data must contain a list of event records."
        )

    return data


def prepare_rag_documents(input_file):
    """
    Load OCR records, normalize them, and create RAG documents.
    """

    raw_events = load_ocr_events(input_file)

    events = []
    documents = []

    for raw_event in raw_events:
        event = normalize_event(raw_event)

        # Skip records without an event name.
        if event["event_name"] == "NA":
            continue

        events.append(event)
        documents.append(create_document(event))

    return events, documents


if __name__ == "__main__":
    print("OCR → RAG ingestion module ready.")