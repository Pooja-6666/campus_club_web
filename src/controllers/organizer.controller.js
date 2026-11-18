const organizerService = require("../services/organizer.service");
const ocrService = require("../services/ocr.service");

const getOrganizerEvents = async (req, res, next) => {
  try {
    const events = await organizerService.getOrganizerEvents(req.user.id);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

const parsePosterOcr = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No poster image provided" });
    }

    const result = await ocrService.extractTextFromPoster(req.file.path);

    return res.json({
      success: true,
      message: "Poster successfully parsed via OCR",
      extractedText: result.extractedText,
      parsedFields: result.parsedFields,
      // This is the local URL path; it will be stored with the created event.
      posterUrl: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    next(error);
  }
};

const createOrganizerEvent = async (req, res, next) => {
  try {
    const required = ["title", "description", "date", "venue"];
    const missing = required.filter((field) => !String(req.body[field] || "").trim());

    if (missing.length) {
      return res.status(400).json({
        error: `Required fields missing: ${missing.join(", ")}`,
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
      return res.status(400).json({ error: "Event date must be in YYYY-MM-DD format" });
    }

    if (req.body.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.endDate)) {
      return res.status(400).json({ error: "End date must be in YYYY-MM-DD format" });
    }

    if (req.body.registrationUrl) {
      try {
        const url = new URL(req.body.registrationUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        return res.status(400).json({ error: "Registration URL must start with http:// or https://" });
      }
    }

    const event = await organizerService.createEvent(req.user.id, req.body, req.file);
    return res.status(201).json({
      success: true,
      message: "Event submitted successfully and is pending faculty approval.",
      event,
    });
  } catch (error) {
    next(error);
  }
};


const updateRejectedOrganizerEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const required = ["title", "description", "date", "venue"];
    const missing = required.filter((field) => !String(req.body[field] || "").trim());
    if (missing.length) {
      return res.status(400).json({ error: `Required fields missing: ${missing.join(", ")}` });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
      return res.status(400).json({
        error: "Event date must be in YYYY-MM-DD format",
      });
    }

    if (req.body.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.endDate)) {
      return res.status(400).json({
        error: "End date must be in YYYY-MM-DD format",
      });
    }

    if (req.body.registrationUrl) {
      try {
        const url = new URL(req.body.registrationUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        return res.status(400).json({ error: "Registration URL must start with http:// or https://" });
      }
    }

    const event = await organizerService.updateRejectedEvent(
      req.user.id,
      eventId,
      req.body,
      req.file
    );

    const isEditRequest = event.edit_request_id !== undefined;

    return res.json({
      success: true,
      message: isEditRequest
        ? "Changes submitted for faculty approval. The published event remains unchanged until approval."
        : "Event updated and submitted for faculty approval.",
      ...(isEditRequest
        ? { editRequest: event }
        : { event }),
    });

  } catch (error) {
    next(error);
  }
};

const withdrawPendingOrganizerEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    await organizerService.withdrawPendingEvent(req.user.id, eventId);

    return res.json({
      success: true,
      message: "Event submission withdrawn successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const withdrawPendingOrganizerEditRequest = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    await organizerService.withdrawPendingEditRequest(req.user.id, eventId);

    return res.json({
      success: true,
      message: "Edit request withdrawn successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizerEvents,
  parsePosterOcr,
  createOrganizerEvent,
  updateRejectedOrganizerEvent,
  withdrawPendingOrganizerEvent,
  withdrawPendingOrganizerEditRequest,
};