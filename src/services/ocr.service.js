const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function extractTextFromPoster(imagePath) {
  try {
    console.log("Forwarding poster to Ollama Vision microservice:", imagePath);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));

    // Calls your FastAPI Python microservice running locally
    const response = await axios.post("http://127.0.0.1:8000/extract-poster", formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 200000,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "OCR extraction failed");
    }

    const parsedFields = response.data.data;
    console.log("AI DESCRIPTION FROM PYTHON:", parsedFields.description);
    console.log("AI EXTRACTED TIME FROM PYTHON:", parsedFields.time);
    console.log("ALL EXTRACTED FIELDS:", parsedFields);
    return {
      extractedText: JSON.stringify(parsedFields),
      parsedFields: {
        title: parsedFields.title || "",
        date: parsedFields.date || "",
        endDate: parsedFields.endDate || "",
        time: parsedFields.time || "",
        venue: parsedFields.venue || "",
        category: parsedFields.category || "Other",
        contact_phone: parsedFields.contact_phone || "",
        description: parsedFields.description || "",
      }
    };
  } catch (error) {
    console.error("Ollama OCR bridge error:", error.message);
    throw new Error("Failed to parse poster text via Ollama AI");
  }
}

module.exports = { extractTextFromPoster };