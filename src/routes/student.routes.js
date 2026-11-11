const express = require("express");
const router = express.Router();

const studentController = require("../controllers/student.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// All routes require student authentication
router.use(authenticate);
router.use(authorize("STUDENT"));

// Student profile
router.get("/profile", studentController.getProfile);
router.patch(
  "/profile/interests",
  studentController.updateInterests
);

// Personalized recommendations
router.get(
  "/events/recommended",
  studentController.getRecommendations
);

// Bookmarks
router.get("/bookmarks", studentController.getBookmarks);
router.post(
  "/bookmarks/:eventId",
  studentController.addBookmark
);
router.delete(
  "/bookmarks/:eventId",
  studentController.removeBookmark
);

// Event interactions

// Record event view
router.post(
  "/events/:eventId/view",
  studentController.recordEventView
);

// Set Interested / Not Interested
router.put(
  "/events/:eventId/interest",
  studentController.setEventInterest
);

// Remove interest response
router.delete(
  "/events/:eventId/interest",
  studentController.removeEventInterest
);

// RSVP to an event
router.post(
  "/events/:eventId/rsvp",
  studentController.rsvpEvent
);

// Cancel RSVP
router.delete(
  "/events/:eventId/rsvp",
  studentController.cancelRsvp
);

router.get(
  "/events/:eventId/interaction-status",
  studentController.getEventInteractionStatus
);

module.exports = router;