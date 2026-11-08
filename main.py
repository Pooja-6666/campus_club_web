from fastapi import FastAPI, File, UploadFile
from PIL import Image
import requests
import base64
import json
import io
import os
import re

app = FastAPI()

QWEN_API_URL = "https://footsore-stinger-rehire.ngrok-free.dev/extract-poster"
QWEN_API_KEY = os.getenv("QWEN_API_KEY")

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llava:latest"


def classify_event_category(data):
    text = " ".join([
        str(data.get("title", "")),
        str(data.get("description", "")),
        str(data.get("venue", ""))
    ]).lower()

    # 1. Cultural events
    cultural_keywords = [
        "dance", "music", "singing", "singer", "song",
        "open mic", "open-mic", "painting", "drawing",
        "art exhibition", "drama", "theatre", "theater",
        "poetry", "fashion show", "cultural performance"
    ]

    # 2. Sports events
    sports_keywords = [
        "chess", "badminton", "football", "cricket",
        "basketball", "volleyball", "tennis", "table tennis",
        "kabaddi", "athletics", "marathon", "swimming",
        "sports meet"
    ]

    # 3. Technical events, including technology-based games
    technical_keywords = [
        "rtos", "programming", "coding", "hackathon",
        "artificial intelligence", "machine learning",
        "deep learning", "robotics", "cybersecurity",
        "software development", "web development",
        "app development", "data science", "cloud computing",
        "blockchain", "electronics", "embedded systems",
        "internet of things", "iot", "engineering",
        "technical workshop", "technical challenge",
        "cipher", "cryptography", "logic puzzle",
        "logic challenge", "puzzle solving", "problem solving",
        "treasure hunt", "tech challenge", "escape room",
        "debugging challenge", "algorithm challenge",
        "binary puzzle", "code breaking", "vault"
    ]

    # 4. Video gaming and esports events
    gaming_keywords = [
        "esports", "e-sports", "video game",
        "valorant", "pubg", "bgmi", "free fire",
        "counter strike", "gaming tournament",
        "fifa tournament"
    ]

    def matches(keywords):
        return any(keyword in text for keyword in keywords)

    # Classification priority
    if matches(cultural_keywords):
        return "Cultural"

    if matches(sports_keywords):
        return "Sports"

    if matches(technical_keywords):
        return "Technical"

    if matches(gaming_keywords):
        return "Gaming"

    # Keep AI classification when no keyword rule matches
    valid_categories = [
        "Technical", "Cultural", "Sports",
        "Gaming", "Social", "Other"
    ]

    current_category = data.get("category", "Other")

    return current_category if current_category in valid_categories else "Other"


@app.post("/extract-poster")
async def extract_poster(file: UploadFile = File(...)):
    try:
        # 1. Read and preprocess image
        image_bytes = await file.read()

        if not image_bytes:
            return {
                "success": False,
                "error": "Uploaded image is empty"
            }

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img.thumbnail((1800, 1800))

            buffered = io.BytesIO()
            img.save(buffered, format="JPEG", quality=95)
            image_bytes = buffered.getvalue()

        except Exception as img_err:
            print("Image preprocessing error:", str(img_err))
            return {
                "success": False,
                "error": "Could not process the uploaded image"
            }

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # 2. Detailed extraction prompt
        prompt = """
You are an accurate event-poster information extraction system.
Carefully inspect the entire supplied poster. Read the actual
printed text, including small text, subtitles, dates, timings,
organisers, contact details and registration information.
Extract the information into the JSON structure below.
IMPORTANT: Do not generate generic or invented event information.

FIELD INSTRUCTIONS:
1. TITLE: Extract the main event title.
2. DATE: Extract the START DATE in YYYY-MM-DD format.
3. END DATE: Extract the END DATE in YYYY-MM-DD format.
4. TIME: Extract complete event timing with AM/PM.
5. VENUE: Extract physical event venue.
6. CATEGORY: Choose exactly one: Technical, Cultural, Sports, Gaming, Social, Other.
7. CONTACT_PHONE: Extract every visible contact phone number separated by commas or null.
8. DESCRIPTION: Write a natural, informative description in 2-3 sentences.

OUTPUT RULES:
- Return valid JSON only.
- Do not return Markdown or explanations.
- Never omit a key.

Return exactly this structure:
{
    "title": "",
    "date": "",
    "endDate": "",
    "time": "",
    "venue": "",
    "category": "",
    "contact_phone": null,
    "description": ""
}
"""

        # 3. Try Qwen first, Ollama as fallback
        parsed_data = None

        try:
            if not QWEN_API_KEY:
                raise ValueError("QWEN_API_KEY is not configured")

            print("Sending poster to Qwen:", file.filename)

            qwen_response = requests.post(
                QWEN_API_URL,
                headers={"X-API-Key": QWEN_API_KEY},
                files={
                    "file": (
                        file.filename or "poster.jpg",
                        image_bytes,
                        "image/jpeg"
                    )
                },
                timeout=180
            )

            qwen_response.raise_for_status()
            qwen_result = qwen_response.json()

            if not qwen_result.get("success") or not isinstance(
                qwen_result.get("data"), dict
            ):
                raise ValueError("Invalid Qwen response")

            parsed_data = qwen_result["data"]
            print("Qwen inference time:", qwen_result.get("inference_time"))

        except Exception as qwen_error:
            print("Qwen unavailable:", str(qwen_error))
            print("Falling back to Ollama")

            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "images": [image_base64],
                "format": "json",
                "stream": False,
                "options": {"temperature": 0}
            }

            response = requests.post(
                OLLAMA_URL,
                json=payload,
                timeout=600
            )
            response.raise_for_status()

            raw_response = response.json().get("response", "")
            
            try:
                cleaned = raw_response.strip()
                cleaned = cleaned.replace("```json", "").replace("```", "").strip()

                start_idx = cleaned.index("{")
                end_idx = cleaned.rindex("}") + 1
                parsed_data = json.loads(cleaned[start_idx:end_idx])

            except (ValueError, json.JSONDecodeError) as parse_error:
                print("JSON parsing error:", str(parse_error))
                print("Invalid Ollama response:", raw_response)
                return {
                    "success": False,
                    "error": "Could not extract valid event details"
                }

        # If parsed_data is still None or empty
        if not parsed_data or not isinstance(parsed_data, dict):
            return {
                "success": False,
                "error": "Failed to extract valid event data from models"
            }

        # 4. Ensure all fields exist
        required_fields = [
            "title",
            "date",
            "endDate",
            "time",
            "venue",
            "category",
            "contact_phone",
            "description"
        ]

        for field in required_fields:
            if field not in parsed_data:
                parsed_data[field] = None if field == "contact_phone" else ""

        # Normalise text fields
        for field in required_fields:
            if field != "contact_phone":
                value = parsed_data[field]
                parsed_data[field] = (
                    str(value).strip() if value is not None else ""
                )

        # Normalise contact numbers if missing
        description = parsed_data.get("description", "")
        if not parsed_data.get("contact_phone"):
            phone_numbers = re.findall(
                r'(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)',
                description
            )
            if phone_numbers:
                parsed_data["contact_phone"] = ", ".join(
                    dict.fromkeys(phone_numbers)
                )

        # 5. Rule-based category classification
        detected_category = classify_event_category(parsed_data)
        parsed_data["category"] = detected_category

        # 6. Log and return
        print("\n========== EXTRACTED EVENT DETAILS ==========")
        print(json.dumps(parsed_data, indent=4, ensure_ascii=False))
        print("=============================================\n")

        return {
            "success": True,
            "data": parsed_data
        }

    except requests.exceptions.Timeout:
        print("Request timed out")
        return {
            "success": False,
            "error": "Poster processing timed out. Please try again."
        }

    except requests.exceptions.ConnectionError:
        print("Connection error occurred")
        return {
            "success": False,
            "error": "AI microservice or backend is unreachable"
        }

    except Exception as e:
        print("FastAPI Exception:", str(e))
        return {
            "success": False,
            "error": str(e)
        }