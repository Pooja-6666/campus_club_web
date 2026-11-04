const prisma = require("../config/prisma");

const getOrganizerEvents = async (organizerId) => {
  return prisma.event.findMany({
    where: { created_by: organizerId },
    include: { club: true },
    orderBy: { createdAt: "desc" },
  });
};

const createEvent = async (organizerId, body, posterFile) => {
  const organizer = await prisma.organizer.findUnique({
    where: { org_id: organizerId },
    select: { org_id: true, club_id: true },
  });

  if (!organizer) {
    const error = new Error("Organizer account not found");
    error.status = 404;
    throw error;
  }

  const capacity = body.capacity ? Number(body.capacity) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    const error = new Error("Capacity must be a positive whole number");
    error.status = 400;
    throw error;
  }

  const date = new Date(`${body.date}T00:00:00.000Z`);
  const endDate = body.endDate
    ? new Date(`${body.endDate}T00:00:00.000Z`)
    : null;

  if (Number.isNaN(date.getTime()) || (endDate && Number.isNaN(endDate.getTime()))) {
    const error = new Error("Invalid event date");
    error.status = 400;
    throw error;
  }

  if (endDate && endDate < date) {
    const error = new Error("End date cannot be before start date");
    error.status = 400;
    throw error;
  }

  const tags = String(body.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return prisma.event.create({
    data: {
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      date,
      endDate,
      time: body.time ? String(body.time).trim() : null,
      venue: String(body.venue).trim(),
      contact_phone: body.contact_phone ? String(body.contact_phone).trim() : null,
      registrationUrl: body.registrationUrl ? String(body.registrationUrl).trim() : null,
      category: body.category ? String(body.category).trim() : null,
      tags,
      capacity,
      posterUrl: posterFile ? `/uploads/${posterFile.filename}` : null,
      extractedText: body.extractedText ? String(body.extractedText) : null,
      status: "PENDING",
      created_by: organizer.org_id,
      // Events belong to the organizer's assigned club.
      club_id: organizer.club_id,
    },
    include: { club: true },
  });
};

module.exports = {
  getOrganizerEvents,
  createEvent,
};
