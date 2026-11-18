
from pathlib import Path
from collections import Counter
from openpyxl import load_workbook
import json

# ---------------- CONFIGURATION ----------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

EXCEL_FILE = (
    PROJECT_ROOT
    / "event-poster-dataset"
    / "poster-annotations.xlsx"
)

POSTER_DIR = (
    PROJECT_ROOT
    / "event-poster-dataset"
    / "posters"
)

REPORT_DIR = PROJECT_ROOT / "evaluation" / "reports"

EXPECTED_COLUMNS = [
    "image_name",
    "title",
    "date",
    "endDate",
    "date_text",
    "time",
    "venue",
    "category",
    "contact_phone",
    "description"
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# ---------------- IMAGE MATCHING ----------------

def find_image(filename, image_lookup):
    """
    Match an Excel image_name against actual poster filenames.

    Handles:
    1. Exact filename matches.
    2. Excel filenames without extensions.
    """

    filename = str(filename).strip()

    # First check exact filename
    if filename in image_lookup:
        return image_lookup[filename]

    # If extension is missing, append supported extensions.
    # Do not use Path(filename).stem here because filenames
    # contain dots in timestamps such as 16.22.59.
    if not any(
        filename.lower().endswith(ext)
        for ext in IMAGE_EXTENSIONS
    ):
        for ext in IMAGE_EXTENSIONS:
            candidate = filename + ext

            if candidate in image_lookup:
                return image_lookup[candidate]

    return None


# ---------------- VALIDATION ----------------

def validate_dataset():

    print("\n========== OCR DATASET VALIDATION ==========\n")

    errors = []
    warnings = []

    if not EXCEL_FILE.exists():
        raise FileNotFoundError(
            f"Annotation Excel not found: {EXCEL_FILE}"
        )

    if not POSTER_DIR.exists():
        raise FileNotFoundError(
            f"Poster directory not found: {POSTER_DIR}"
        )

    workbook = load_workbook(
        EXCEL_FILE,
        read_only=True,
        data_only=True
    )

    sheet = workbook.active

    headers = [
        str(cell).strip()
        if cell is not None else ""
        for cell in next(
            sheet.iter_rows(
                min_row=1,
                max_row=1,
                values_only=True
            )
        )
    ]

    # Ignore empty trailing Excel columns
    while headers and not headers[-1]:
        headers.pop()

    print(f"Excel sheet: {sheet.title}")
    print(f"Columns found: {headers}\n")

    if "image_name" not in headers:
        workbook.close()
        raise ValueError(
            "Required column 'image_name' is missing."
        )

    missing_columns = [
        column
        for column in EXPECTED_COLUMNS
        if column not in headers
    ]

    if missing_columns:
        warnings.append(
            f"Recommended columns missing: {missing_columns}"
        )

    column_index = {
        name: index
        for index, name in enumerate(headers)
        if name
    }

    annotations = []

    for row_number, row in enumerate(
        sheet.iter_rows(min_row=2, values_only=True),
        start=2
    ):

        if not any(value is not None for value in row):
            continue

        record = {}

        for column, index in column_index.items():
            value = row[index] if index < len(row) else None
            record[column] = value

        annotations.append({
            "row_number": row_number,
            "data": record
        })

    workbook.close()

    print(f"Annotation records: {len(annotations)}")

    # ---------------- IMAGE VALIDATION ----------------

    image_files = [
        file
        for file in POSTER_DIR.rglob("*")
        if file.is_file()
        and file.suffix.lower() in IMAGE_EXTENSIONS
    ]

    print(f"Poster images found: {len(image_files)}")

    image_lookup = {
        file.name: file
        for file in image_files
    }

    print("\nChecking image references...")

    referenced_images = []
    missing_images = []
    matched_image_names = set()

    for item in annotations:

        filename = item["data"].get("image_name")

        if filename is None or not str(filename).strip():
            errors.append(
                f"Row {item['row_number']}: Missing image_name"
            )
            continue

        filename = str(filename).strip()
        referenced_images.append(filename)

        matched_image = find_image(filename, image_lookup)

        if matched_image is None:

            missing_images.append(filename)

            errors.append(
                f"Row {item['row_number']}: "
                f"Image not found: {filename}"
            )

        else:

            # Track the actual image filename, not the
            # Excel reference (which may omit its extension).
            matched_image_names.add(matched_image.name)

    # ---------------- DUPLICATE VALIDATION ----------------

    counts = Counter(referenced_images)

    duplicates = [
        name
        for name, count in counts.items()
        if count > 1
    ]

    for name in duplicates:
        errors.append(
            f"Duplicate annotation reference: {name}"
        )

    # ---------------- UNUSED IMAGES ----------------

    unused_images = [
        filename
        for filename in image_lookup
        if filename not in matched_image_names
    ]

    if unused_images:
        warnings.append(
            f"Images without annotations: {unused_images}"
        )

    # ---------------- MISSING VALUE ANALYSIS ----------------

    missing_values = {}

    for column in headers:

        if not column:
            continue

        missing_count = 0

        for item in annotations:

            value = item["data"].get(column)

            if value is None or (
                isinstance(value, str)
                and value.strip().lower() in {
                    "",
                    "n/a",
                    "na",
                    "not available",
                    "unknown",
                    "null",
                    "none"
                }
            ):
                missing_count += 1

        missing_values[column] = missing_count

    # ---------------- REPORT ----------------

    report = {
        "total_annotations": len(annotations),
        "total_poster_images": len(image_files),
        "matched_images": len(matched_image_names),
        "missing_images": missing_images,
        "duplicate_annotations": duplicates,
        "unused_images": unused_images,
        "missing_values_by_column": missing_values,
        "warnings": warnings,
        "errors": errors,
        "status": "PASSED" if not errors else "FAILED"
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    report_file = REPORT_DIR / "validation_report.json"

    with open(report_file, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=4, default=str)

    # ---------------- SUMMARY ----------------

    print("\n========== VALIDATION SUMMARY ==========\n")

    print(f"Annotations       : {len(annotations)}")
    print(f"Poster images     : {len(image_files)}")
    print(f"Matched images    : {report['matched_images']}")
    print(f"Missing images    : {len(missing_images)}")
    print(f"Duplicate records : {len(duplicates)}")

    print("\nMissing values by column:")

    for column, count in missing_values.items():
        print(f"  {column}: {count}")

    if unused_images:
        print("\nUNUSED IMAGES:")

        for filename in unused_images:
            print(f"  - {filename}")

    if warnings:
        print("\nWARNINGS:")

        for warning in warnings:
            print(f"  - {warning}")

    if errors:
        print("\nERRORS:")

        for error in errors:
            print(f"  - {error}")

    print(f"\nFINAL STATUS: {report['status']}")
    print(f"Report saved to: {report_file}")

    print("\n=========================================\n")


if __name__ == "__main__":
    validate_dataset()
