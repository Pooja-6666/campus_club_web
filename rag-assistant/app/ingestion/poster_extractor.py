
import os
import io
import json
import base64
from pathlib import Path

import pytesseract
from PIL import Image
from pytesseract import Output
from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

ENV_FILE = PROJECT_ROOT / ".env"

load_dotenv(dotenv_path=ENV_FILE, override=True)

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

MODEL_NAME = "gemini-3.8-flash"


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env")

    return genai.Client(
        api_key=api_key,
        http_options={"timeout": 180000}
    )


# --------------------------------------------------
# OCR EXTRACTION
# --------------------------------------------------

def extract_text_with_ocr(image_path):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(image_path)

    image = Image.open(image_path).convert("RGB")

    extracted_text = pytesseract.image_to_string(
        image,
        config="--oem 3 --psm 3"
    )

    ocr_data = pytesseract.image_to_data(
        image,
        output_type=Output.DICT,
        config="--oem 3 --psm 3"
    )

    confidences = []

    for confidence in ocr_data["conf"]:
        try:
            value = float(confidence)

            if value >= 0:
                confidences.append(value)

        except (ValueError, TypeError):
            continue

    average_confidence = (
        sum(confidences) / len(confidences)
        if confidences else 0
    )

    word_count = len(extracted_text.split())

    return {
        "text": extracted_text.strip(),
        "confidence": round(average_confidence, 2),
        "word_count": word_count,
        "ocr_success": bool(extracted_text.strip())
    }


# --------------------------------------------------
# JSON EXTRACTION HELPER
# --------------------------------------------------

def parse_json_response(response_text):

    text = response_text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "", 1)
        text = text.replace("```", "").strip()

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("Gemini did not return valid JSON")

    return json.loads(text[start:end + 1])


# --------------------------------------------------
# GEMINI VISION EXTRACTION
# --------------------------------------------------

def extract_text_with_gemini(image_path):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(image_path)

    client = get_gemini_client()

    image = Image.open(image_path).convert("RGB")
    image.thumbnail((1024, 1024))

    image_buffer = io.BytesIO()
    image.save(image_buffer, format="PNG")

    image_base64 = base64.b64encode(
        image_buffer.getvalue()
    ).decode("utf-8")

    prompt = """
    Examine this event poster and extract information.

    Return ONLY valid JSON with these fields:

    {
        "event_name": null,
        "organizer": null,
        "festival": null,
        "category": null,
        "date": null,
        "time": null,
        "venue": null,
        "registration_details": null,
        "contact_details": null
    }

    Rules:
    1. Extract only information visibly supported by the poster.
    2. Use null when information is missing or unclear.
    3. Do not invent event details.
    4. Do not confuse a tagline with the event name.
    5. Preserve proper names as accurately as possible.
    6. Use YYYY-MM-DD only when the complete date is clear.
    """

    response = client.interactions.create(
        model=MODEL_NAME,
        input=[
            {"type": "text", "text": prompt},
            {
                "type": "image",
                "data": image_base64,
                "mime_type": "image/png"
            }
        ],
        timeout=300
    )

    return parse_json_response(response.output_text)


# --------------------------------------------------
# GEMINI TEXT EXTRACTION
# --------------------------------------------------

def extract_event_fields_from_text(extracted_text):

    if not extracted_text.strip():
        raise ValueError("OCR returned empty text")

    client = get_gemini_client()

    prompt = f"""
    Extract campus event information from the OCR text below.

    Return ONLY valid JSON with these fields:

    {{
        "event_name": null,
        "organizer": null,
        "festival": null,
        "category": null,
        "date": null,
        "time": null,
        "venue": null,
        "registration_details": null,
        "contact_details": null
    }}

    Rules:
    1. Use only information present in the OCR text.
    2. Use null for missing or unclear information.
    3. Do not invent details.
    4. Do not mistake a tagline for an event name.
    5. Use YYYY-MM-DD only if the complete date is available.

    OCR TEXT:
    {extracted_text}
    """

    response = client.interactions.create(
        model=MODEL_NAME,
        input=prompt,
        timeout=300
    )

    return parse_json_response(response.output_text)
