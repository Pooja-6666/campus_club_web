
import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from app.ingestion.poster_extractor import (
    extract_text_with_ocr,
    extract_text_with_gemini,
    extract_event_fields_from_text
)


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

POSTER_FOLDER = (
    PROJECT_ROOT / "data" / "raw" / "posters" / "Posters(website)"
)

OUTPUT_FILE = PROJECT_ROOT / "data" / "processed" / "events.json"

TARGET_TOTAL = 10


# --------------------------------------------------
# LOAD AND SAVE
# --------------------------------------------------

def load_existing_events():

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    return []


def save_events(events):

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(events, file, indent=4, ensure_ascii=False)


# --------------------------------------------------
# NORMALIZE RECORD
# --------------------------------------------------

def normalize_record(data, poster, method):

    return {
        "source_file": poster.name,
        "event_name": data.get("event_name"),
        "organizer": data.get("organizer"),
        "festival": data.get("festival"),
        "category": data.get("category"),
        "date": data.get("date"),
        "time": data.get("time"),
        "venue": data.get("venue"),
        "registration_details": data.get("registration_details"),
        "contact_details": data.get("contact_details"),
        "extracted_text": data.get("extracted_text"),
        "extraction_method": method,
        "review_status": "needs_review"
    }


# --------------------------------------------------
# SAVE OR UPDATE RECORD
# --------------------------------------------------

def save_or_update(events, record):

    for index, event in enumerate(events):

        if event.get("source_file") == record["source_file"]:
            events[index] = record
            save_events(events)
            return

    events.append(record)
    save_events(events)


# --------------------------------------------------
# MAIN
# --------------------------------------------------

if __name__ == "__main__":

    print("\n========== EXTRACTION STARTED ==========\n")

    if not POSTER_FOLDER.exists():
        print("Poster folder not found:", POSTER_FOLDER)
        sys.exit(1)

    existing_events = load_existing_events()

    successful_events = [
        event for event in existing_events
        if event.get("extraction_method") != "failed"
    ]

    print("Existing successful records:", len(successful_events))

    if len(successful_events) >= TARGET_TOTAL:
        print("Target of 10 already reached.")
        sys.exit(0)

    image_extensions = {".png", ".jpg", ".jpeg"}

    all_posters = sorted([
        file for file in POSTER_FOLDER.iterdir()
        if file.is_file() and file.suffix.lower() in image_extensions
    ])

    processed_names = {
        event.get("source_file")
        for event in existing_events
        if event.get("extraction_method") != "failed"
    }

    pending_posters = [
        poster for poster in all_posters
        if poster.name not in processed_names
    ]

    remaining_needed = TARGET_TOTAL - len(successful_events)

    print("Total image posters:", len(all_posters))
    print("Additional successful records needed:", remaining_needed)
    print("Pending posters:", len(pending_posters))

    # Select extra candidates in case some posters fail.
    test_posters = pending_posters[:remaining_needed + 3]

    print("Posters selected for this run:", len(test_posters))

    for poster in test_posters:

        successful_events = [
            event for event in existing_events
            if event.get("extraction_method") != "failed"
        ]

        if len(successful_events) >= TARGET_TOTAL:
            break

        print(f"\nProcessing: {poster.name}")

        try:

            ocr_data = extract_text_with_ocr(poster)

            confidence = ocr_data.get("confidence", 0)
            word_count = ocr_data.get("word_count", 0)
            extracted_text = ocr_data.get("text", "")

            if (
                ocr_data.get("ocr_success")
                and confidence >= 60
                and word_count >= 8
            ):

                print("Using Tesseract + Gemini")

                data = extract_event_fields_from_text(extracted_text)
                data["extracted_text"] = extracted_text

                method = "tesseract_gemini"

            else:

                print("Using Gemini Vision")

                data = extract_text_with_gemini(poster)

                method = "gemini_vision"

            record = normalize_record(data, poster, method)

            save_or_update(existing_events, record)

            print("Saved:", poster.name)

        except Exception as error:

            print("Extraction failed:", error)

            failed_record = {
                "source_file": poster.name,
                "event_name": None,
                "extraction_method": "failed",
                "review_status": "needs_review",
                "error": str(error)
            }

            save_or_update(existing_events, failed_record)

            print("Failure saved:", poster.name)

    successful_events = [
        event for event in existing_events
        if event.get("extraction_method") != "failed"
    ]

    print("\n========== EXTRACTION COMPLETED ==========")
    print("Successful records:", len(successful_events))
    print("Target:", TARGET_TOTAL)
    print("Output:", OUTPUT_FILE)
