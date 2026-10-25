const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const {
  getOrganizerEvents,
} = require("../controllers/organizer.controller");

router.get(
  "/events",
  authenticate,
  authorize("ORGANIZER"),
  getOrganizerEvents
);
// POST: Parse uploaded poster via OCR
router.post(
  "/parse-poster",
  authenticate,
  authorize("ORGANIZER"),
  upload.single("poster"), // Expects file field name "poster"
  parsePosterOcr
);

module.exports = router;