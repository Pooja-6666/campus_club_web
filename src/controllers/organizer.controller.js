const organizerService = require("../services/organizer.service");
const ocrService = require("../services/ocr.service");

const getOrganizerEvents = async (req, res, next) => {
  try {
    const events = await organizerService.getOrganizerEvents(
      req.user.id
    );

    res.json(events);
  } catch (error) {
    next(error);
  }
};

const parsePosterOcr = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No poster image provided" });
    }

    const imagePath = req.file.path;
    const result = await ocrService.extractTextFromPoster(imagePath);

    res.json({
      message: "Poster successfully parsed via OCR",
      extractedText: result.extractedText,
      posterUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizerEvents,
  parsePosterOcr,
};