
const prisma = require("../config/prisma");
const recommendationService = require("../services/recommendation.service");

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
      where: { student_id: req.user.id },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookmarks);
  } catch (error) {
    next(error);
  }
};

// Bookmark an event
const addBookmark = async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
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
      return res.status(400).json({ error: "Invalid event ID" });
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

    res.json({ message: "Bookmark removed successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getBookmarks,
  addBookmark,
  removeBookmark,
};
