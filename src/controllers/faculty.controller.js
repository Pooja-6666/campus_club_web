
const facultyService = require("../services/faculty.service");

const getPendingEvents = async (req, res, next) => {
  try {
    const events = await facultyService.getPendingEvents();

    res.json(events);
  } catch (error) {
    next(error);
  }
};

const getApprovedEvents = async (req, res, next) => {
  try {
    const events = await facultyService.getApprovedEvents();
    res.json(events);
  } catch (error) {
    next(error);
  }
};

const getRejectedEvents = async (req, res, next) => {
  try {
    const events = await facultyService.getRejectedEvents();
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


const getPendingEditRequests = async (req, res, next) => {
  try {
    const requests = await facultyService.getPendingEditRequests();
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

const approveEditRequest = async (req, res, next) => {
  try {
    const editRequestId = Number(req.params.id);

    if (!Number.isInteger(editRequestId) || editRequestId <= 0) {
      return res.status(400).json({
        error: "Invalid edit request ID",
      });
    }

    const event = await facultyService.approveEditRequest(editRequestId);
    res.json(event);
  } catch (error) {
    next(error);
  }
};

const rejectEditRequest = async (req, res, next) => {
  try {
    const editRequestId = Number(req.params.id);

    if (!Number.isInteger(editRequestId) || editRequestId <= 0) {
      return res.status(400).json({
        error: "Invalid edit request ID",
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

    const result = await facultyService.rejectEditRequest(
      editRequestId,
      rejectionReason
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingEvents,
  getApprovedEvents,
  getRejectedEvents,
  approveEvent,
  rejectEvent,
  getPendingEditRequests,
  approveEditRequest,
  rejectEditRequest,
};
