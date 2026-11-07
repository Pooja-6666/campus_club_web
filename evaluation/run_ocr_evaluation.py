
from pathlib import Path
from openpyxl import load_workbook
import requests
import json
import time

# ---------------- CONFIGURATION ----------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

EXCEL_FILE = PROJECT_ROOT / "event-poster-dataset" / "poster-annotations.xlsx"
POSTER_DIR = PROJECT_ROOT / "event-poster-dataset" / "posters"

OUTPUT_DIR = PROJECT_ROOT / "evaluation" / "reports"
OUTPUT_FILE = OUTPUT_DIR / "ocr_predictions.json"

OCR_API_URL = "http://127.0.0.1:8000/extract-poster"


# ---------------- LOAD ANNOTATIONS ----------------

def load_annotations():

    workbook = load_workbook(
        EXCEL_FILE,
        read_only=True,
        data_only=True
    )

    sheet = workbook.active

    headers = [
        str(value).strip() if value is not None else ""
        for value in next(sheet.iter_rows(
            min_row=1,
            max_row=1,
            values_only=True
        ))
    ]

    annotations = []

    for row in sheet.iter_rows(min_row=2, values_only=True):

        if not any(value is not None for value in row):
            continue

        record = dict(zip(headers, row))

        filename = record.get("image_name")

        if filename:
            annotations.append(record)

    workbook.close()

    return annotations


# ---------------- OCR REQUEST ----------------

def run_ocr(image_path):

    with open(image_path, "rb") as image_file:

        response = requests.post(
            OCR_API_URL,
            files={
                "file": (
                    image_path.name,
                    image_file,
                    "image/jpeg"
                )
            },
            timeout=600
        )

    response.raise_for_status()

    result = response.json()

    if not result.get("success"):
        raise RuntimeError(
            result.get("error", "OCR extraction failed")
        )

    if not isinstance(result.get("data"), dict):
        raise ValueError("OCR response does not contain valid data")

    return result["data"]


# ---------------- MAIN EVALUATION ----------------

def main():

    print("\n========== OCR EVALUATION ==========\n")

    annotations = load_annotations()

    print(f"Annotations loaded: {len(annotations)}")

    results = []

    for index, annotation in enumerate(annotations, start=1):

        filename = str(annotation["image_name"]).strip()

        matches = list(POSTER_DIR.rglob(filename))

        if not matches:

            print(f"[{index}] Image not found: {filename}")

            results.append({
                "image_name": filename,
                "ground_truth": annotation,
                "prediction": None,
                "status": "FAILED",
                "error": "Image not found"
            })

            continue

        if len(matches) > 1:

            print(f"[{index}] Multiple matching images: {filename}")

            results.append({
                "image_name": filename,
                "ground_truth": annotation,
                "prediction": None,
                "status": "FAILED",
                "error": "Multiple matching image files found"
            })

            continue

        image_path = matches[0]

        print(f"\n[{index}/{len(annotations)}] Processing: {filename}")

        try:

            prediction = run_ocr(image_path)

            results.append({
                "image_name": filename,
                "ground_truth": annotation,
                "prediction": prediction,
                "status": "SUCCESS"
            })

            print("OCR completed successfully.")

        except Exception as error:

            results.append({
                "image_name": filename,
                "ground_truth": annotation,
                "prediction": None,
                "status": "FAILED",
                "error": str(error)
            })

            print(f"OCR failed: {error}")

        time.sleep(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:

        json.dump(
            results,
            file,
            indent=4,
            ensure_ascii=False,
            default=str
        )

    successful = sum(
        result["status"] == "SUCCESS"
        for result in results
    )

    failed = len(results) - successful

    print("\n========== EVALUATION SUMMARY ==========")
    print(f"Total annotations : {len(annotations)}")
    print(f"Processed         : {len(results)}")
    print(f"Successful        : {successful}")
    print(f"Failed            : {failed}")
    print(f"Output            : {OUTPUT_FILE}")
    print("\n=========================================")


if __name__ == "__main__":
    main()
