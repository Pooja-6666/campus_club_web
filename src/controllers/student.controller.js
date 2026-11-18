const prisma = require("../config/prisma");
const recommendationService = require("../services/recommendation.service");
const studentService = require("../services/student.service");

// Get the logged-in student's profile
const getProfile = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: req.user.id },
      select: {
        student_id: true,
        name: true,
        email: true,
        interests: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

// Update the logged-in student's interests
const updateInterests = async (req, res, next) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        error: "Interests must be an array",
      });
    }

    const cleaned = [
      ...new Set(
        interests
          .filter((value) => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => value.slice(0, 40))
      ),
    ].slice(0, 20);

    const student = await prisma.student.update({
      where: { student_id: req.user.id },
      data: { interests: cleaned },
      select: {
        student_id: true,
        name: true,
        email: true,
        interests: true,
      },
    });

    res.json({
      message: "Interests updated successfully",
      profile: student,
    });
  } catch (error) {
    next(error);
  }
};

// Get personalized recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const recommendations =
      await recommendationService.getRecommendations(
        req.user.id,
        limit
      );

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// Get the logged-in student's bookmarks
const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        student_id: req.user.id,
        event: {
          status: "APPROVED",
        },
      },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(bookmarks);
  } catch (error) {
    next(error);
  }
};

// Bookmark an approved event
const addBookmark = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const event = await prisma.event.findFirst({
      where: {
        event_id: eventId,
        status: "APPROVED",
      },
    });

    if (!event) {
      return res.status(404).json({
        error: "Approved event not found",
      });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        student_id_event_id: {
          student_id: req.user.id,
          event_id: eventId,
        },
      },
      update: {},
      create: {
        student_id: req.user.id,
        event_id: eventId,
      },
    });

    res.status(201).json({
      message: "Event bookmarked successfully",
      bookmark,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a bookmark
const removeBookmark = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const result = await prisma.bookmark.deleteMany({
      where: {
        student_id: req.user.id,
        event_id: eventId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: "Bookmark not found",
      });
    }

    res.json({
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
// Record when a student views an event
const recordEventView = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const view = await studentService.recordEventView(
      req.user.id,
      eventId
    );

    res.json({
      message: "Event view recorded successfully",
      view,
    });
  } catch (error) {
    next(error);
  }
};
// Set or update interest in an event
const setEventInterest = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    const { status } = req.body;

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    if (!["INTERESTED", "NOT_INTERESTED"].includes(status)) {
      return res.status(400).json({
        error: "Status must be INTERESTED or NOT_INTERESTED",
      });
    }

    const interest = await studentService.setEventInterest(
      req.user.id,
      eventId,
      status
    );

    res.json({
      message: "Event interest updated successfully",
      interest,
    });
  } catch (error) {
    next(error);
  }
};

// Remove interest response from an event
const removeEventInterest = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const result = await studentService.removeEventInterest(
      req.user.id,
      eventId
    );

    if (result.count === 0) {
      return res.status(404).json({
        error: "Interest response not found",
      });
    }

    res.json({
      message: "Event interest removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
// RSVP to an event
const rsvpEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const rsvp = await studentService.rsvpEvent(
      req.user.id,
      eventId
    );

    res.status(201).json({
      message: "RSVP successful",
      rsvp,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel an RSVP
const cancelRsvp = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const result = await studentService.cancelRsvp(
      req.user.id,
      eventId
    );

    if (result.count === 0) {
      return res.status(404).json({
        error: "RSVP not found",
      });
    }

    res.json({
      message: "RSVP cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get the logged-in student's interaction status for an event
const getEventInteractionStatus = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        error: "Invalid event ID",
      });
    }

    const status = await studentService.getEventInteractionStatus(
      req.user.id,
      eventId
    );

    res.json(status);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateInterests,
  getRecommendations,
  getBookmarks,
  addBookmark,
  removeBookmark,
  recordEventView,
  setEventInterest,
  removeEventInterest,
  rsvpEvent,
  cancelRsvp,
  getEventInteractionStatus,
};