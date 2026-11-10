const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const {
  getOrganizerEvents,
  parsePosterOcr,
  createOrganizerEvent,
  updateRejectedOrganizerEvent,
  withdrawPendingOrganizerEvent,
  withdrawPendingOrganizerEditRequest,
} = require("../controllers/organizer.controller");

router.use(authenticate);
router.use(authorize("ORGANIZER"));

router.get("/events", getOrganizerEvents);

// OCR: receives poster image and returns extracted fields to the frontend.
router.post("/parse-poster", upload.single("poster"), parsePosterOcr);

// Event creation: receives editable form data and optional poster file.
router.post("/events", upload.single("poster"), createOrganizerEvent);

// Edit a rejected event and resubmit it for faculty approval.
router.patch("/events/:id", upload.single("poster"), updateRejectedOrganizerEvent);

// Withdraw a pending event submission.
router.patch("/events/:id/withdraw", withdrawPendingOrganizerEvent);

// Withdraw a pending edit request.
router.patch("/events/:id/edit-request/withdraw", withdrawPendingOrganizerEditRequest);

module.exports = router;
