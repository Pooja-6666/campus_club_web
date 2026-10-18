
const express = require("express");
const router = express.Router();

const {
  loginStudent,
  loginOrganizer,
} = require("../controllers/auth.controller");

router.post("/student/login", loginStudent);
router.post("/organizer/login", loginOrganizer);

module.exports = router;
