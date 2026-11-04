const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const {
  getOrganizerEvents,
  parsePosterOcr,
  createOrganizerEvent,
} = require("../controllers/organizer.controller");

router.use(authenticate);
router.use(authorize("ORGANIZER"));

router.get("/events", getOrganizerEvents);

// OCR: receives poster image and returns extracted fields to the frontend.
router.post("/parse-poster", upload.single("poster"), parsePosterOcr);

// Event creation: receives editable form data and optional poster file.
router.post("/events", upload.single("poster"), createOrganizerEvent);

module.exports = router;
