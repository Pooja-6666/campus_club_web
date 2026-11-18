const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  getPendingEvents,
  getApprovedEvents,
  getRejectedEvents,
  approveEvent,
  rejectEvent,
  getPendingEditRequests,
  approveEditRequest,
  rejectEditRequest,
} = require("../controllers/faculty.controller");

router.get(
  "/events/pending",
  authenticate,
  authorize("FACULTY"),
  getPendingEvents
);

router.get(
  "/events/approved",
  authenticate,
  authorize("FACULTY"),
  getApprovedEvents
);

router.get(
  "/events/rejected",
  authenticate,
  authorize("FACULTY"),
  getRejectedEvents
);

router.put(
  "/events/:id/approve",
  authenticate,
  authorize("FACULTY"),
  approveEvent
);

router.put(
  "/events/:id/reject",
  authenticate,
  authorize("FACULTY"),
  rejectEvent
);

// View edit requests for already-approved events
router.get(
  "/event-edit-requests/pending",
  authenticate,
  authorize("FACULTY"),
  getPendingEditRequests
);

// Approve proposed changes to a published event
router.put(
  "/event-edit-requests/:id/approve",
  authenticate,
  authorize("FACULTY"),
  approveEditRequest
);

// Reject proposed changes to a published event
router.put(
  "/event-edit-requests/:id/reject",
  authenticate,
  authorize("FACULTY"),
  rejectEditRequest
);

module.exports = router;