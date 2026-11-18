
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const organizerRoutes = require("./routes/organizer.routes");
const facultyRoutes = require("./routes/faculty.routes");
const studentRoutes = require("./routes/student.routes");

const errorHandler = require("./middleware/error.middleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadDir));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Campus Events API is running",
  });
});

// Global error handler
app.use(errorHandler);



module.exports = app;
