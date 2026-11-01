
from fastapi import FastAPI, File, UploadFile
from PIL import Image
import requests
import base64
import json
import io

app = FastAPI()

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

            # Preserve poster details while limiting image size
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

1. TITLE
Extract the main event title.
Do not use the organiser name or subtitle as the title.


2. DATE
Extract the START DATE in YYYY-MM-DD format.

If the poster gives a date range, extract the first date here.

If the year is printed elsewhere on the same poster in a clearly
relevant event context, you may use that year.

For example:
"3rd-4th November" and "Sensors Week 2026"
means the start date is "2026-11-03".

Do not use the current year automatically.
If the year cannot reasonably be established, return the date
without inventing a year only if necessary; otherwise return "".


3. END DATE
Extract the END DATE in YYYY-MM-DD format.

If the poster gives a single-day event, use the same date
as the start date.

If no end date is available, return "".

For example:
"3rd-4th November" with event year 2026:
date = "2026-11-03"
endDate = "2026-11-04"


4. TIME
Extract the complete event timing.

Preserve both start and end times, including AM/PM.

Example:
Poster: "2PM-5:30PM"
Return: "2:00 PM - 5:30 PM"

Do not replace a time range with a single time.
Do not use an assumed default time.
If the poster has no time, return "".


5. VENUE
Extract the physical event venue.

If it says TBA, To Be Announced or To Be Decided,
return "To be announced".

Do not mistake an organiser or event topic for a venue.
If unavailable, return "".


6. CATEGORY
Choose exactly one category:

Technical, Cultural, Sports, Gaming, Social, Other.

Classify according to the primary subject, not the event format.

Examples:
- RTOS workshop = Technical
- Cybersecurity seminar = Technical
- Dance competition = Cultural
- Football tournament = Sports
- Esports competition = Gaming
- Networking gathering = Social

If the subject is unclear, return "Other".


7. CONTACT_PHONE
Extract EVERY visible contact phone number.

If multiple numbers are present, include all of them
in one string separated by commas.

Do not confuse registration fees or other numbers with
phone numbers.

If no contact number is visible, return null.


8. DESCRIPTION
Write a natural, informative description in 2-3 sentences.

First identify:
- What the event is about.
- Its subject and learning or participation focus.
- Its subtitle or tagline.
- Relevant organisers and collaborations.
- Speaker details, if any are printed.
- Activities or challenges explicitly mentioned.

For workshops:
Explain the technical subject and practical learning focus.

For cultural events:
Describe the performances or cultural activities.

For competitions:
Explain the competition theme and challenge.

For other events:
Describe the actual purpose and experience.

IMPORTANT:
- Never start with "Join us for".
- Never create a generic description using only the title
  and venue.
- Do not invent speakers, activities, benefits or outcomes.
- Do not assume that a workshop includes activities that
  are not mentioned.
- Use the actual poster text as the source.
- Include relevant organisers and collaborations.
- Do not unnecessarily repeat date, time, venue or fees.
- If details are limited, write a shorter factual description.


EXAMPLE FOR THIS TYPE OF POSTER:

If a poster says:
"KERNELEX"
"A HANDS-ON RTOS WORKSHOP"
"BMSCE IEEE PES AND SENSORS COUNCIL WITH IEEE WiSe"
"Sensors Week 2026"
"3rd-4th November"
"2PM-5:30PM"
"VENUE: TBA"
"Harshith - 8310919267"
"Tanish - 8879534570"

The extracted information should reflect:
- A hands-on Real-Time Operating Systems workshop.
- Start date 3 November 2026.
- End date 4 November 2026.
- Timing 2:00 PM - 5:30 PM.
- Venue to be announced.
- Technical category.
- Both printed contact numbers.

A suitable description would explain that KERNELEX is a
hands-on workshop focused on Real-Time Operating Systems,
presented by the named IEEE organising groups as part of
Sensors Week 2026.

This example is guidance. Extract the actual supplied
poster rather than blindly copying the example.


OUTPUT RULES:
- Return valid JSON only.
- Do not return Markdown or explanations.
- All fields except contact_phone must be strings.
- contact_phone must be a string or null.
- Never omit a key.
- Never replace missing information with a guess.

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

        # 3. Send image to Ollama
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "images": [image_base64],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0
            }
        }

        print("Sending poster to Ollama:", file.filename)

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=600
        )

        response.raise_for_status()

        result_json = response.json()
        raw_response = result_json.get("response", "")

        print("Raw Ollama response:", raw_response)

        # 4. Parse JSON
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

        # 5. Ensure all fields exist
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

        # Normalise contact numbers
        import re

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

        # Validate category
        allowed_categories = {
            "technical": "Technical",
            "cultural": "Cultural",
            "sports": "Sports",
            "gaming": "Gaming",
            "social": "Social",
            "other": "Other"
        }

        category = parsed_data["category"].lower()
        parsed_data["category"] = allowed_categories.get(
            category,
            "Other"
        )
        # Apply rule-based category classification
        print("CATEGORY BEFORE RULES:", parsed_data["category"])

        detected_category = classify_event_category(parsed_data)

        print("CATEGORY DETECTED BY RULES:", detected_category)

        parsed_data["category"] = detected_category

        print("FINAL CATEGORY:", parsed_data["category"])

        # 6. Log and return
        print("\n========== EXTRACTED EVENT DETAILS ==========")
        print(json.dumps(parsed_data, indent=4, ensure_ascii=False))
        print("=============================================\n")

        return {
            "success": True,
            "data": parsed_data
        }

    except requests.exceptions.Timeout:
        print("Ollama request timed out")
        return {
            "success": False,
            "error": "Poster processing timed out. Please try again."
        }

    except requests.exceptions.ConnectionError:
        print("Could not connect to Ollama")
        return {
            "success": False,
            "error": "Ollama is not running or is unreachable"
        }

    except Exception as e:
        print("FastAPI Exception:", str(e))
        return {
            "success": False,
            "error": str(e)
        }
