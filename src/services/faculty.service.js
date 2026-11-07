
const prisma = require("../config/prisma");

const getPendingEvents = async () => {
  return prisma.event.findMany({
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
};

const approveEvent = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status !== "PENDING") {
    throw new Error("Only pending events can be approved");
  }

  return prisma.event.update({
    where: {
      event_id: eventId,
    },
    data: {
      status: "APPROVED",
      rejectionReason: null,
    },
  });
};

const rejectEvent = async (eventId, rejectionReason) => {
  const event = await prisma.event.findUnique({
    where: {
      event_id: eventId,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status !== "PENDING") {
    throw new Error("Only pending events can be rejected");
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error("Rejection reason is required");
  }

  return prisma.event.update({
    where: {
      event_id: eventId,
    },
    data: {
      status: "REJECTED",
      rejectionReason: rejectionReason.trim(),
    },
  });
};

module.exports = {
  getPendingEvents,
  approveEvent,
  rejectEvent,
};
