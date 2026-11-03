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

module.exports = router;