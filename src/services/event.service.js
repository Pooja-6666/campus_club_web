const prisma = require("../config/prisma");

const getApprovedEvents = async () => {
  return prisma.event.findMany({
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
};

const getEventById = async (eventId) => {
  return prisma.event.findFirst({
    where: {
      event_id: eventId,
      status: "APPROVED",
    },
    include: {
      club: true,
    },
  });
};

module.exports = {
  getApprovedEvents,
  getEventById,
};