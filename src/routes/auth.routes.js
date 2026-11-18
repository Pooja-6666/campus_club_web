
const express = require("express");
const router = express.Router();

const {
  loginStudent,
  loginOrganizer,
  loginFaculty,
  registerStudent,

  // Student password reset
  forgotStudentPassword,
  verifyStudentOTP,
  resetStudentPassword,

  // Organizer password reset
  forgotOrganizerPassword,
  verifyOrganizerOTP,
  resetOrganizerPassword,

  // Faculty password reset
  forgotFacultyPassword,
  verifyFacultyOTP,
  resetFacultyPassword,
} = require("../controllers/auth.controller");

// Student authentication
router.post("/student/signup", registerStudent);
router.post("/student/login", loginStudent);

// Student password reset
router.post("/student/forgot-password", forgotStudentPassword);
router.post("/student/verify-otp", verifyStudentOTP);
router.post("/student/reset-password", resetStudentPassword);

// Organizer authentication
router.post("/organizer/login", loginOrganizer);

// Organizer password reset
router.post("/organizer/forgot-password", forgotOrganizerPassword);
router.post("/organizer/verify-otp", verifyOrganizerOTP);
router.post("/organizer/reset-password", resetOrganizerPassword);

// Faculty authentication
router.post("/faculty/login", loginFaculty);

// Faculty password reset
router.post("/faculty/forgot-password", forgotFacultyPassword);
router.post("/faculty/verify-otp", verifyFacultyOTP);
router.post("/faculty/reset-password", resetFacultyPassword);

module.exports = router;
