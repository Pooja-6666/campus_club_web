const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function extractTextFromPoster(imagePath) {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));

    const response = await axios.post(
      process.env.OCR_API_URL || "http://127.0.0.1:8000/extract-poster",
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 200000,
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error || "OCR extraction failed");
    }

    const fields = response.data.data || {};
    const parsedFields = {
      title: fields.title || "",
      date: fields.date || "",
      endDate: fields.endDate || "",
      time: fields.time || "",
      venue: fields.venue || "",
      category: fields.category || "Other",
      contact_phone: fields.contact_phone || "",
      description: fields.description || "",
    };

    return {
      extractedText: JSON.stringify(fields),
      parsedFields,
    };
  } catch (error) {
    console.error("OCR bridge error:", error.message);
    throw new Error(error.response?.data?.detail || error.message || "Failed to extract poster details");
  }
}

module.exports = { extractTextFromPoster };
