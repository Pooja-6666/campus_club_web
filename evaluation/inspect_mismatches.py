
from pathlib import Path
import json

PROJECT_ROOT = Path(__file__).resolve().parent.parent

REPORT_FILE = (
    PROJECT_ROOT
    / "evaluation"
    / "reports"
    / "comparison_report.json"
)

with open(REPORT_FILE, "r", encoding="utf-8") as file:
    report = json.load(file)

print("\n========== MISMATCH INSPECTION ==========\n")

for field in [
    "title",
    "date",
    "endDate",
    "time",
    "venue",
    "category",
    "contact_phone"
]:

    print(f"\n{'=' * 60}")
    print(f"FIELD: {field}")
    print("=" * 60)

    mismatches = [
        item for item in report["mismatches"]
        if item.get("field") == field
    ]

    for item in mismatches:

        print(f"\nPoster: {item['image_name']}")
        print(f"Issue : {item['issue']}")
        print(f"Actual annotation : {item['ground_truth']}")
        print(f"OCR prediction    : {item['prediction']}")

print("\n========== END OF INSPECTION ==========\n")
