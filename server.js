const express = require("express");
const cors = require("cors");
const prisma = require("./prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "secret123";

// ==============================
// 🔐 AUTH MIDDLEWARE
// ==============================
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ==============================
// 🧑‍🎓 STUDENT AUTH
// ==============================
app.post("/student/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  const student = await prisma.student.create({
    data: { name, email, password: hashed }
  });

  res.json(student);
});

app.post("/student/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.student.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user.student_id, role: "STUDENT" },
    JWT_SECRET
  );

  res.json({ token });
});

// ==============================
// 👤 PROFILE
// ==============================
app.get("/profile", authMiddleware, async (req, res) => {
  const user = await prisma.student.findUnique({
    where: { student_id: req.user.id }
  });
  res.json(user);
});

// ==============================
// 👨‍💼 ORGANIZER AUTH
// ==============================
app.post("/organizer/signup", async (req, res) => {
  const { name, email, password, club_id } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  const org = await prisma.organizer.create({
    data: { name, email, password: hashed, club_id }
  });

  res.json(org);
});

app.post("/organizer/login", async (req, res) => {
  const { email, password } = req.body;

  const org = await prisma.organizer.findUnique({ where: { email } });
  if (!org) return res.status(404).json({ error: "Not found" });

  const match = await bcrypt.compare(password, org.password);
  if (!match) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: org.org_id, role: "ORGANIZER" },
    JWT_SECRET
  );

  res.json({ token });
});

// ==============================
// 👩‍🏫 FACULTY AUTH
// ==============================
app.post("/faculty/signup", async (req, res) => {
  const { name, email, password, club_id } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  const faculty = await prisma.faculty.create({
    data: { name, email, password: hashed, club_id }
  });

  res.json(faculty);
});

app.post("/faculty/login", async (req, res) => {
  const { email, password } = req.body;

  const f = await prisma.faculty.findUnique({ where: { email } });
  if (!f) return res.status(404).json({ error: "Not found" });

  const match = await bcrypt.compare(password, f.password);
  if (!match) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: f.faculty_id, role: "FACULTY" },
    JWT_SECRET
  );

  res.json({ token });
});

// ==============================
// 📅 EVENTS
// ==============================

// Create event (Organizer only)
app.post("/events", authMiddleware, async (req, res) => {
  if (req.user.role !== "ORGANIZER") {
    return res.status(403).json({ error: "Only organizers allowed" });
  }

  const { title, description, date, time, venue, club_id } = req.body;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      time,
      venue,
      club_id,
      created_by: req.user.id,
      status: "PENDING"
    }
  });

  res.json(event);
});

// View approved events (students)
app.get("/events", async (req, res) => {
  const events = await prisma.event.findMany({
    where: { status: "APPROVED" },
    include: { club: true }
  });

  res.json(events);
});

// Faculty: pending events
app.get("/events/pending", authMiddleware, async (req, res) => {
  if (req.user.role !== "FACULTY") {
    return res.status(403).json({ error: "Access denied" });
  }

  const events = await prisma.event.findMany({
    where: { status: "PENDING" },
    include: { club: true }
  });

  res.json(events);
});

// Approve
app.put("/events/:id/approve", authMiddleware, async (req, res) => {
  if (req.user.role !== "FACULTY") {
    return res.status(403).json({ error: "Only faculty allowed" });
  }

  const event = await prisma.event.update({
    where: { event_id: Number(req.params.id) },
    data: { status: "APPROVED" }
  });

  res.json(event);
});

// Reject
app.put("/events/:id/reject", authMiddleware, async (req, res) => {
  if (req.user.role !== "FACULTY") {
    return res.status(403).json({ error: "Only faculty allowed" });
  }

  const event = await prisma.event.update({
    where: { event_id: Number(req.params.id) },
    data: { status: "REJECTED" }
  });

  res.json(event);
});

// ==============================
// ⭐ BOOKMARK
// ==============================
app.post("/bookmark", authMiddleware, async (req, res) => {
  const { event_id } = req.body;

  const bm = await prisma.bookmark.create({
    data: { student_id: req.user.id, event_id }
  });

  res.json(bm);
});

// ==============================
// 🏫 CLUBS
// ==============================
app.post("/clubs", async (req, res) => {
  const { club_name, description } = req.body;

  const club = await prisma.club.create({
    data: { club_name, description }
  });

  res.json(club);
});

app.get("/clubs", async (req, res) => {
  const clubs = await prisma.club.findMany();
  res.json(clubs);
});

// ==============================
// ROOT
// ==============================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ==============================
// SERVER START
// ==============================
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});