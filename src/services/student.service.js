const prisma = require("../config/prisma");

const recordEventView = async (studentId, eventId) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event || event.status !== "APPROVED") {
    throw new Error("Event not found");
  }

  return prisma.eventView.upsert({
    where: {
      student_id_event_id: {
        student_id: studentId,
        event_id: eventId,
      },
    },
    update: {
      createdAt: new Date(),
    },
    create: {
      student_id: studentId,
      event_id: eventId,
    },
  });
};

const bookmarkEvent = async (studentId, eventId) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event || event.status !== "APPROVED") {
    throw new Error("Event not found");
  }

  return prisma.bookmark.create({
    data: {
      student_id: studentId,
      event_id: eventId,
    },
  });
};

const removeBookmark = async (studentId, eventId) => {
  return prisma.bookmark.deleteMany({
    where: {
      student_id: studentId,
      event_id: eventId,
    },
  });
};

const rsvpEvent = async (studentId, eventId) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event || event.status !== "APPROVED") {
    throw new Error("Event not found");
  }

  return prisma.rSVP.upsert({
    where: {
      student_id_event_id: {
        student_id: studentId,
        event_id: eventId,
      },
    },
    update: {
      status: "GOING",
    },
    create: {
      student_id: studentId,
      event_id: eventId,
      status: "GOING",
    },
  });
};

const cancelRsvp = async (studentId, eventId) => {
  return prisma.rSVP.deleteMany({
    where: {
      student_id: studentId,
      event_id: eventId,
    },
  });
};

const setEventInterest = async (studentId, eventId, status) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event || event.status !== "APPROVED") {
    throw new Error("Event not found");
  }

  if (!["INTERESTED", "NOT_INTERESTED"].includes(status)) {
    throw new Error("Invalid interest status");
  }

  return prisma.eventInterest.upsert({
    where: {
      student_id_event_id: {
        student_id: studentId,
        event_id: eventId,
      },
    },
    update: {
      status,
    },
    create: {
      student_id: studentId,
      event_id: eventId,
      status,
    },
  });
};

const removeEventInterest = async (studentId, eventId) => {
  return prisma.eventInterest.deleteMany({
    where: {
      student_id: studentId,
      event_id: eventId,
    },
  });
};



const giveFeedback = async (studentId, eventId, rating) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event || event.status !== "APPROVED") {
    throw new Error("Event not found");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return prisma.eventFeedback.upsert({
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
};

const getEventInteractionStatus = async (studentId, eventId) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event || event.status !== "APPROVED") {
    throw new Error("Event not found");
  }

  const [interest, rsvp] = await Promise.all([
    prisma.eventInterest.findUnique({
      where: {
        student_id_event_id: {
          student_id: studentId,
          event_id: eventId,
        },
      },
    }),

    prisma.rSVP.findUnique({
      where: {
        student_id_event_id: {
          student_id: studentId,
          event_id: eventId,
        },
      },
    }),
  ]);

  return {
    interest: interest?.status || null,
    isRsvped: rsvp?.status === "GOING",
  };
};

module.exports = {
  recordEventView,
  bookmarkEvent,
  removeBookmark,
  rsvpEvent,
  cancelRsvp,
  giveFeedback,
  setEventInterest,
  removeEventInterest,
  getEventInteractionStatus,
};