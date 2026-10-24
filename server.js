require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { getRecommendations } = require("./recommend");
const app = express();

// ==============================
// 🖼️ POSTER UPLOAD CONFIGURATION
// ==============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPG, JPEG, PNG and WEBP images are allowed"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not defined in .env");
  process.exit(1);
}

// ==============================
// 🔐 AUTH MIDDLEWARE
// ==============================
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No token",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
};

// ==============================
// 🧑‍🎓 STUDENT AUTH
// ==============================

app.post("/student/signup", async (req, res, next) => {
  try {
    const { name, email, password, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { email },
    });

    if (existingStudent) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        name,
        email,
        password: hashed,
        interests: interests || [],
      },
    });

    // Do not return password hash
    res.status(201).json({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      interests: student.interests,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/student/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await prisma.student.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        error: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: user.student_id,
        role: "STUDENT",
      },
      JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// ==============================
// 👤 PROFILE
// ==============================

app.get("/profile", authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.student.findUnique({
      where: {
        student_id: req.user.id,
      },
      select: {
        student_id: true,
        name: true,
        email: true,
        interests: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ==============================
// 👨‍💼 ORGANIZER AUTH
// ==============================

app.post("/organizer/signup", async (req, res, next) => {
  try {
    const { name, email, password, club_id } = req.body;

    if (!name || !email || !password || !club_id) {
      return res.status(400).json({
        error: "Name, email, password and club_id are required",
      });
    }

    const existingOrganizer = await prisma.organizer.findUnique({
      where: { email },
    });

    if (existingOrganizer) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const org = await prisma.organizer.create({
      data: {
        name,
        email,
        password: hashed,
        club_id,
      },
    });

    res.status(201).json({
      org_id: org.org_id,
      name: org.name,
      email: org.email,
      club_id: org.club_id,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/organizer/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const org = await prisma.organizer.findUnique({
      where: { email },
    });

    if (!org) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    const match = await bcrypt.compare(password, org.password);

    if (!match) {
      return res.status(401).json({
        error: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: org.org_id,
        role: "ORGANIZER",
      },
      JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// ==============================
// 👩‍🏫 FACULTY AUTH
// ==============================

app.post("/faculty/signup", async (req, res, next) => {
  try {
    const { name, email, password, club_id } = req.body;

    if (!name || !email || !password || !club_id) {
      return res.status(400).json({
        error: "Name, email, password and club_id are required",
      });
    }

    const existingFaculty = await prisma.faculty.findUnique({
      where: { email },
    });

    if (existingFaculty) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const faculty = await prisma.faculty.create({
      data: {
        name,
        email,
        password: hashed,
        club_id,
      },
    });

    res.status(201).json({
      faculty_id: faculty.faculty_id,
      name: faculty.name,
      email: faculty.email,
      club_id: faculty.club_id,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/faculty/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const f = await prisma.faculty.findUnique({
      where: { email },
    });

    if (!f) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    const match = await bcrypt.compare(password, f.password);

    if (!match) {
      return res.status(401).json({
        error: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: f.faculty_id,
        role: "FACULTY",
      },
      JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// ==============================
// 📅 EVENTS
// ==============================

// Organizer creates event
app.post(
  "/events",
  authMiddleware,
  upload.single("poster"),
  async (req, res, next) => {
  try {
    if (req.user.role !== "ORGANIZER") {
      return res.status(403).json({
        error: "Only organizers allowed",
      });
    }

    const {
      title,
      description,
      date,
      time,
      venue,
      club_id,
      category,
      tags,
      capacity,
      endDate,
    } = req.body;

    if (!title || !description || !date || !venue || !club_id) {
      return res.status(400).json({
        error: "Title, description, date, venue and club_id are required",
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        time,
        venue,
        club_id: Number(club_id),
        category: category || null,
        tags:
          typeof tags === "string"
            ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : tags || [],
        capacity: capacity ? Number(capacity) : null,

        posterUrl: req.file
          ? `/uploads/${req.file.filename}`
          : null,

        created_by: req.user.id,
        status: "PENDING",
      },
    });

    res.status(201).json({
  ...event,
  posterUrl: event.posterUrl
    ? `http://localhost:3000${event.posterUrl}`
    : null,
});
  } catch (error) {
    next(error);
  }
});

// View approved events
app.get("/events", async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        club: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    res.json(
      events.map((event) => ({
        ...event,
        posterUrl: event.posterUrl
          ? `http://localhost:3000${event.posterUrl}`
          : null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

// ==============================
// 👩‍🏫 FACULTY EVENT MANAGEMENT
// ==============================

app.get("/events/pending", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "FACULTY") {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const events = await prisma.event.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        club: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.put("/events/:id/approve", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "FACULTY") {
      return res.status(403).json({
        error: "Only faculty allowed",
      });
    }

    const event = await prisma.event.update({
      where: {
        event_id: Number(req.params.id),
      },
      data: {
        status: "APPROVED",
      },
    });

    res.json(event);
  } catch (error) {
    next(error);
  }
});

app.put("/events/:id/reject", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "FACULTY") {
      return res.status(403).json({
        error: "Only faculty allowed",
      });
    }

    const event = await prisma.event.update({
      where: {
        event_id: Number(req.params.id),
      },
      data: {
        status: "REJECTED",
      },
    });

    res.json(event);
  } catch (error) {
    next(error);
  }
});

// ==============================
// 👀 VIEW TRACKING
// ==============================

app.post("/events/:id/view", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.json({ ok: true });
    }

    const event_id = Number(req.params.id);

    const view = await prisma.eventView.upsert({
      where: {
        student_id_event_id: {
          student_id: req.user.id,
          event_id,
        },
      },
      update: {
        createdAt: new Date(),
      },
      create: {
        student_id: req.user.id,
        event_id,
      },
    });

    res.json(view);
  } catch (error) {
    next(error);
  }
});

// ==============================
// ❌ NOT INTERESTED
// ==============================

app.post("/events/not-interested", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can use this action",
      });
    }

    const { event_id, category, tag } = req.body;

    const entry = await prisma.notInterested.create({
      data: {
        student_id: req.user.id,
        event_id,
        category,
        tag,
      },
    });

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// ==============================
// 🤖 RECOMMENDATIONS
// ==============================

app.get("/events/recommended", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students get recommendations",
      });
    }

    const limit = Number(req.query.limit) || 10;

    const recommendations = await getRecommendations(
      req.user.id,
      limit
    );

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// TEMPORARY: recommendation testing without authentication
app.get("/events/recommended-test", async (req, res, next) => {
  try {
    const studentId = Number(req.query.studentId);
    const limit = Number(req.query.limit) || 10;

    if (!studentId) {
      return res.status(400).json({
        error: "studentId is required",
      });
    }

    const recommendations = await getRecommendations(
      studentId,
      limit
    );

    res.json({
      studentId,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation test error:", error);

    res.status(500).json({
      error: "Failed to generate recommendations",
    });
  }
});

app.get("/organizer/events", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "ORGANIZER") {
      return res.status(403).json({
        error: "Only organizers allowed",
      });
    }

    const events = await prisma.event.findMany({
      where: {
        created_by: req.user.id,
      },
      include: {
        club: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(
      events.map((event) => ({
        ...event,
        posterUrl: event.posterUrl
          ? `http://localhost:3000${event.posterUrl}`
          : null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

// ==============================
// ⭐ BOOKMARK
// ==============================

app.post("/bookmark", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can bookmark events",
      });
    }

    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({
        error: "event_id is required",
      });
    }

    const bm = await prisma.bookmark.upsert({
      where: {
        student_id_event_id: {
          student_id: req.user.id,
          event_id,
        },
      },
      update: {},
      create: {
        student_id: req.user.id,
        event_id,
      },
    });

    res.json(bm);
  } catch (error) {
    next(error);
  }
});


app.get("/bookmarks", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can view bookmarks",
      });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        student_id: req.user.id,
      },
      include: {
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(bookmarks);
  } catch (error) {
    next(error);
  }
});


app.delete("/bookmark/:event_id", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can remove bookmarks",
      });
    }

    await prisma.bookmark.deleteMany({
      where: {
        student_id: req.user.id,
        event_id: Number(req.params.event_id),
      },
    });

    res.json({
      ok: true,
    });
  } catch (error) {
    next(error);
  }
});

// TEMPORARY: bookmark testing without authentication
app.post("/bookmark-test", async (req, res, next) => {
  try {
    const studentId = Number(req.body.student_id);
    const eventId = Number(req.body.event_id);

    if (!studentId || !eventId) {
      return res.status(400).json({
        error: "student_id and event_id are required",
      });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        student_id_event_id: {
          student_id: studentId,
          event_id: eventId,
        },
      },
      update: {},
      create: {
        student_id: studentId,
        event_id: eventId,
      },
    });

    res.json(bookmark);
  } catch (error) {
    console.error("Bookmark test error:", error);

    res.status(500).json({
      error: "Failed to create bookmark",
    });
  }
});

// ==============================
// ✅ RSVP
// ==============================

app.post("/rsvp", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can RSVP",
      });
    }

    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({
        error: "event_id is required",
      });
    }

    const rsvp = await prisma.rSVP.upsert({
      where: {
        student_id_event_id: {
          student_id: req.user.id,
          event_id,
        },
      },
      update: {
        status: "GOING",
      },
      create: {
        student_id: req.user.id,
        event_id,
        status: "GOING",
      },
    });

    res.json(rsvp);
  } catch (error) {
    next(error);
  }
});

app.put("/rsvp/:event_id/cancel", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can cancel RSVP",
      });
    }

    const rsvp = await prisma.rSVP.update({
      where: {
        student_id_event_id: {
          student_id: req.user.id,
          event_id: Number(req.params.event_id),
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    res.json(rsvp);
  } catch (error) {
    next(error);
  }
});

// ==============================
// 📝 POST-EVENT FEEDBACK
// ==============================

app.post("/events/:id/feedback", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        error: "Only students can submit feedback",
      });
    }

    const { rating, comment } = req.body;
    const event_id = Number(req.params.id);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "rating must be 1-5",
      });
    }

    const feedback = await prisma.eventFeedback.upsert({
      where: {
        student_id_event_id: {
          student_id: req.user.id,
          event_id,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        student_id: req.user.id,
        event_id,
        rating,
        comment,
      },
    });

    res.json(feedback);
  } catch (error) {
    next(error);
  }
});

// TEMPORARY: feedback testing without authentication
app.post("/feedback-test", async (req, res, next) => {
  try {
    const studentId = Number(req.body.student_id);
    const eventId = Number(req.body.event_id);
    const rating = Number(req.body.rating);

    if (!studentId || !eventId || !rating) {
      return res.status(400).json({
        error: "student_id, event_id and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "rating must be between 1 and 5",
      });
    }

    const feedback = await prisma.eventFeedback.upsert({
      where: {
        student_id_event_id: {
          student_id: studentId,
          event_id: eventId,
        },
      },
      update: {
        rating,
      },
      create: {
        student_id: studentId,
        event_id: eventId,
        rating,
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error("Feedback test error:", error);

    res.status(500).json({
      error: "Failed to create feedback",
    });
  }
});

// ==============================
// 🏫 CLUBS
// ==============================

app.post("/clubs", async (req, res, next) => {
  try {
    const { club_name, description } = req.body;

    if (!club_name) {
      return res.status(400).json({
        error: "club_name is required",
      });
    }

    const club = await prisma.club.create({
      data: {
        club_name,
        description,
      },
    });

    res.status(201).json(club);
  } catch (error) {
    next(error);
  }
});

app.get("/clubs", async (req, res, next) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: {
        club_name: "asc",
      },
    });

    res.json(clubs);
  } catch (error) {
    next(error);
  }
});

// ==============================
// ROOT
// ==============================

app.get(
  "/faculty/events/pending",
  authMiddleware,
  async (req, res, next) => {
    try {
      if (req.user.role !== "FACULTY") {
        return res.status(403).json({
          error: "Only faculty allowed",
        });
      }

      const events = await prisma.event.findMany({
        where: {
          status: "PENDING",
        },
        include: {
          club: true,
          organizer: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      res.json(
        events.map((event) => ({
          ...event,
          posterUrl: event.posterUrl
            ? `http://localhost:3000${event.posterUrl}`
            : null,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.put(
  "/faculty/events/:id/approve",
  authMiddleware,
  async (req, res, next) => {
    try {
      if (req.user.role !== "FACULTY") {
        return res.status(403).json({
          error: "Only faculty allowed",
        });
      }

      const eventId = Number(req.params.id);

      const event = await prisma.event.findUnique({
        where: {
          event_id: eventId,
        },
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      if (event.status !== "PENDING") {
        return res.status(400).json({
          error: "Only pending events can be approved",
        });
      }

      const updatedEvent = await prisma.event.update({
        where: {
          event_id: eventId,
        },
        data: {
          status: "APPROVED",
        },
      });

      res.json(updatedEvent);
    } catch (error) {
      next(error);
    }
  }
);

app.put(
  "/faculty/events/:id/reject",
  authMiddleware,
  async (req, res, next) => {
    try {
      if (req.user.role !== "FACULTY") {
        return res.status(403).json({
          error: "Only faculty allowed",
        });
      }

      const eventId = Number(req.params.id);

      const event = await prisma.event.findUnique({
        where: {
          event_id: eventId,
        },
      });

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      if (event.status !== "PENDING") {
        return res.status(400).json({
          error: "Only pending events can be rejected",
        });
      }

      const updatedEvent = await prisma.event.update({
        where: {
          event_id: eventId,
        },
        data: {
          status: "REJECTED",
        },
      });

      res.json(updatedEvent);
    } catch (error) {
      next(error);
    }
  }
);

// ==============================
// 🚨 ERROR HANDLER
// Must be the LAST app.use()
// ==============================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Something went wrong",
  });
});

// ==============================
// SERVER START
// ==============================

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});


