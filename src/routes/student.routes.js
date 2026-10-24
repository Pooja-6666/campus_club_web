
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  getRecommendations,
  getBookmarks,
  addBookmark,
  removeBookmark,
} = require("../controllers/student.controller");

// Personalized event recommendations
router.get(
  "/events/recommended",
  authenticate,
  authorize("STUDENT"),
  getRecommendations
);

// Get the logged-in student's bookmarks
router.get(
  "/bookmarks",
  authenticate,
  authorize("STUDENT"),
  getBookmarks
);

// Bookmark an event
router.post(
  "/bookmarks/:eventId",
  authenticate,
  authorize("STUDENT"),
  addBookmark
);

// Remove a bookmark
router.delete(
  "/bookmarks/:eventId",
  authenticate,
  authorize("STUDENT"),
  removeBookmark
);

module.exports = router;
