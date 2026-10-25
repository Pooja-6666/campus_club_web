const Tesseract = require("tesseract.js");

// Universal intelligent parser that extracts structured fields from raw OCR text
function parseOcrTextLocally(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const updates = {};

  if (lines.length === 0) return updates;

  // 1. Title Extraction: Look for lines after "presents" or pick a prominent line
  const presentsIndex = lines.findIndex(l => /presents/i.test(l));
  let titleCandidate = "";
  if (presentsIndex !== -1 && lines[presentsIndex + 1]) {
    titleCandidate = lines[presentsIndex + 1];
  } else {
    titleCandidate = lines.find(l => l.length > 5 && !/(date|venue|time|fee|ph|contact)/i.test(l)) || lines[0];
  }
  updates.title = titleCandidate ? titleCandidate.replace(/PRESENTS|[:|]/gi, "").trim() : "";

  // 2. Date Extraction via Regex
  const dateRegex = /(?:date[:\s]*)?([A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?[\s,]*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
  const dateMatch = text.match(dateRegex);
  if (dateMatch && dateMatch[1]) {
    try {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed)) {
        updates.date = parsed.toISOString().split("T")[0];
      }
    } catch (e) {}
  }

  // 3. Venue Extraction
  const venueLine = lines.find(l => /(venue|location|hall|auditorium|block|room|ground|seminar)/i.test(l));
  if (venueLine) {
    updates.venue = venueLine.replace(/venue|location|[:|-]/gi, "").trim();
  }

  // 4. Time Extraction
  const timeMatch = text.match(/(?:time[:\s]*)?(\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?(?:\s*-\s*\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?)?)/i);
  if (timeMatch) {
    updates.time = timeMatch[1].trim();
  }

  // 5. Smart AI Summary Description
  let summary = `Join us for ${updates.title ? `"${updates.title}"` : "an upcoming campus event"}. `;
  if (updates.venue) {
    summary += `It will be hosted at ${updates.venue}. `;
  }
  summary += `Participate, connect with peers, and make the most of this campus experience!`;

  const highlightLine = lines.find(l => /(prize|fee|win|award|register)/i.test(l));
  if (highlightLine) {
    summary += ` Highlight: ${highlightLine}`;
  }

  updates.description = summary.trim();
  return updates;
}

async function extractTextFromPoster(imagePath) {
  try {
    console.log("Running local Tesseract OCR on:", imagePath);
    
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      { logger: m => {} } // silent logger or track progress if preferred
    );

    console.log("OCR raw text extracted successfully.");
    
    // Combine raw text with intelligent local extraction fields
    const parsedFields = parseOcrTextLocally(text || "");

    // Return a structured payload that your backend & frontend expect
    return {
      extractedText: text || "",
      parsedFields: parsedFields
    };
  } catch (error) {
    console.error("OCR service error:", error);
    throw new Error("Failed to parse poster text via OCR");
  }
}

module.exports = { extractTextFromPoster };