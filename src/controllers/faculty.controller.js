
const facultyService = require("../services/faculty.service");

const getPendingEvents = async (req, res, next) => {
  try {
    const events = await facultyService.getPendingEvents();

    res.json(events);
  } catch (error) {
    next(error);
  }
};

const approveEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);

    if (Number.isNaN(eventId)) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const event = await facultyService.approveEvent(eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};

const rejectEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);

    if (Number.isNaN(eventId)) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const { rejectionReason } = req.body;

    if (
      typeof rejectionReason !== "string" ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        error: "Please provide a rejection reason",
      });
    }

    const event = await facultyService.rejectEvent(
      eventId,
      rejectionReason
    );

    res.json(event);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingEvents,
  approveEvent,
  rejectEvent,
};
