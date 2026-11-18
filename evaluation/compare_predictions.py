
from pathlib import Path
from collections import defaultdict
from datetime import datetime, date
import json
import re
import unicodedata

# ---------------- CONFIGURATION ----------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

PREDICTIONS_FILE = (
    PROJECT_ROOT / "evaluation" / "reports" / "ocr_predictions.json"
)

OUTPUT_FILE = (
    PROJECT_ROOT / "evaluation" / "reports" / "comparison_report.json"
)

FIELDS = [
    "title",
    "date",
    "endDate",
    "time",
    "venue",
    "category",
    "contact_phone"
]


# ---------------- NORMALIZATION ----------------

def clean_value(value):

    if value is None:
        return ""

    value = str(value).strip()

    if value.lower() in {
        "", "none", "null", "n/a", "na",
        "not available", "unknown"
    }:
        return ""

    return value


def normalize_text(value):

    value = clean_value(value).lower()

    value = unicodedata.normalize("NFKC", value)

    value = re.sub(r"\s+", " ", value)

    value = re.sub(r"[^\w]", "", value)

    return value


def normalize_date(value):

    value = clean_value(value)

    if not value:
        return ""

    # Excel dates may be serialized as strings.
    if "T" in value:
        value = value.replace("T", " ")

    try:
        parsed = datetime.fromisoformat(value)
        return parsed.strftime("%Y-%m-%d")
    except ValueError:
        pass

    try:
        parsed = date.fromisoformat(value)
        return parsed.strftime("%Y-%m-%d")
    except ValueError:
        return normalize_text(value)


def normalize_phone(value):

    value = clean_value(value)

    if not value:
        return set()

    # Extract Indian 10-digit phone numbers.
    numbers = re.findall(
        r"(?<!\d)(?:\+91[\s-]?)?([6-9]\d{9})(?!\d)",
        value
    )

    return set(numbers)


def normalize_field(field, value):

    if field in {"date", "endDate"}:
        return normalize_date(value)

    if field == "contact_phone":
        return normalize_phone(value)

    return normalize_text(value)


# ---------------- COMPARISON ----------------

def compare_predictions():

    with open(PREDICTIONS_FILE, "r", encoding="utf-8") as file:
        results = json.load(file)

    field_stats = defaultdict(
        lambda: {
            "total": 0,
            "correct": 0,
            "missed": 0,
            "hallucinated": 0,
            "incorrect": 0
        }
    )

    mismatches = []
    description_reviews = []

    for item in results:

        filename = item["image_name"]

        ground_truth = item.get("ground_truth") or {}
        prediction = item.get("prediction") or {}

        if item.get("status") != "SUCCESS":

            mismatches.append({
                "image_name": filename,
                "error": item.get("error", "OCR request failed")
            })

            continue

        for field in FIELDS:

            expected = ground_truth.get(field)
            actual = prediction.get(field)

            expected_normalized = normalize_field(
                field, expected
            )

            actual_normalized = normalize_field(
                field, actual
            )

            stats = field_stats[field]
            stats["total"] += 1

            if expected_normalized == actual_normalized:

                stats["correct"] += 1

            elif not expected_normalized and actual_normalized:

                stats["hallucinated"] += 1

                mismatches.append({
                    "image_name": filename,
                    "field": field,
                    "issue": "HALLUCINATION",
                    "ground_truth": expected,
                    "prediction": actual
                })

            elif expected_normalized and not actual_normalized:

                stats["missed"] += 1

                mismatches.append({
                    "image_name": filename,
                    "field": field,
                    "issue": "MISSED EXTRACTION",
                    "ground_truth": expected,
                    "prediction": actual
                })

            else:

                stats["incorrect"] += 1

                mismatches.append({
                    "image_name": filename,
                    "field": field,
                    "issue": "INCORRECT EXTRACTION",
                    "ground_truth": expected,
                    "prediction": actual
                })

        # Descriptions require semantic/manual review.
        description_reviews.append({
            "image_name": filename,
            "ground_truth": ground_truth.get("description"),
            "prediction": prediction.get("description")
        })

    # ---------------- SUMMARY ----------------

    summary = {}

    print("\n========== FIELD-WISE OCR EVALUATION ==========\n")

    for field, stats in field_stats.items():

        total = stats["total"]
        correct = stats["correct"]

        accuracy = (
            round((correct / total) * 100, 2)
            if total else 0
        )

        summary[field] = {
            **stats,
            "accuracy_percent": accuracy
        }

        print(f"{field}")
        print(f"  Records       : {total}")
        print(f"  Correct       : {correct}")
        print(f"  Accuracy      : {accuracy}%")
        print(f"  Missed        : {stats['missed']}")
        print(f"  Hallucinated  : {stats['hallucinated']}")
        print(f"  Incorrect     : {stats['incorrect']}")
        print()

    report = {
        "total_posters": len(results),
        "field_wise_results": summary,
        "mismatches": mismatches,
        "description_reviews": description_reviews
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:

        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False,
            default=str
        )

    print("Total mismatches:", len(mismatches))
    print("Description reviews:", len(description_reviews))
    print("Report saved to:", OUTPUT_FILE)

    print("\n===============================================\n")


if __name__ == "__main__":
    compare_predictions()

