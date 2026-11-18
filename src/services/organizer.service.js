const prisma = require("../config/prisma");

const getOrganizerEvents = async (organizerId) => {
  return prisma.event.findMany({
    where: { created_by: organizerId },
    include: {
      club: true,
      editRequests: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
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



const updateRejectedEvent = async (organizerId, eventId, body, posterFile) => {
  // Check ownership first, regardless of event status.
  const existing = await prisma.event.findFirst({
    where: {
      event_id: eventId,
      created_by: organizerId,
    },
  });

  if (!existing) {
    const error = new Error(
      "Event not found or you do not have permission to edit it"
    );
    error.status = 404;
    throw error;
  }

  // Only these statuses can be edited.
  if (!["PENDING", "REJECTED", "APPROVED"].includes(existing.status)) {
    const error = new Error("This event cannot be edited in its current status");
    error.status = 400;
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

  if (
    Number.isNaN(date.getTime()) ||
    (endDate && Number.isNaN(endDate.getTime()))
  ) {
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

  const updatedFields = {
    title: String(body.title).trim(),
    description: String(body.description).trim(),
    date,
    endDate,
    time: body.time ? String(body.time).trim() : null,
    venue: String(body.venue).trim(),
    contact_phone: body.contact_phone
      ? String(body.contact_phone).trim()
      : null,
    registrationUrl: body.registrationUrl
      ? String(body.registrationUrl).trim()
      : null,
    category: body.category ? String(body.category).trim() : null,
    tags,
    capacity,
    posterUrl: posterFile
      ? `/uploads/${posterFile.filename}`
      : body.removePoster === "true"
      ? null
      : existing.posterUrl,
    extractedText: body.extractedText
      ? String(body.extractedText)
      : existing.extractedText,
  };

  // APPROVED events: submit proposed changes for faculty approval.
  // Do NOT update the published Event record yet.
  if (existing.status === "APPROVED") {
    const pendingRequest = await prisma.eventEditRequest.findFirst({
      where: {
        event_id: eventId,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      const error = new Error(
        "This event already has a pending edit request"
      );
      error.status = 409;
      throw error;
    }

    return prisma.eventEditRequest.create({
      data: {
        event_id: eventId,
        proposedData: {
          ...updatedFields,
          date: date.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
        },
        status: "PENDING",
      },
    });
  }

  // PENDING events: update directly, still awaiting initial approval.
  // REJECTED events: update directly and resubmit for approval.
  return prisma.event.update({
    where: { event_id: eventId },
    data: {
      ...updatedFields,
      status: "PENDING",
      rejectionReason: null,
    },
    include: { club: true },
  });
};

const withdrawPendingEvent = async (organizerId, eventId) => {
  const event = await prisma.event.findFirst({
    where: {
      event_id: eventId,
      created_by: organizerId,
    },
  });

  if (!event) {
    const error = new Error("Event not found");
    error.status = 404;
    throw error;
  }

  if (event.status !== "PENDING") {
    const error = new Error("Only pending event submissions can be withdrawn");
    error.status = 409;
    throw error;
  }

  const result = await prisma.event.updateMany({
    where: {
      event_id: eventId,
      created_by: organizerId,
      status: "PENDING",
    },
    data: {
      status: "WITHDRAWN",
    },
  });

  if (result.count === 0) {
    const error = new Error("Event has already been processed");
    error.status = 409;
    throw error;
  }

  return prisma.event.findUnique({
    where: { event_id: eventId },
  });
};

const withdrawPendingEditRequest = async (organizerId, eventId) => {
  const event = await prisma.event.findFirst({
    where: {
      event_id: eventId,
      created_by: organizerId,
    },
  });

  if (!event) {
    const error = new Error("Event not found");
    error.status = 404;
    throw error;
  }

  const pendingRequest = await prisma.eventEditRequest.findFirst({
    where: {
      event_id: eventId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!pendingRequest) {
    const error = new Error("No pending edit request found");
    error.status = 404;
    throw error;
  }

  const result = await prisma.eventEditRequest.updateMany({
    where: {
      edit_request_id: pendingRequest.edit_request_id,
      status: "PENDING",
    },
    data: {
      status: "WITHDRAWN",
    },
  });

  if (result.count === 0) {
    const error = new Error("Edit request has already been processed");
    error.status = 409;
    throw error;
  }

  return prisma.eventEditRequest.findUnique({
    where: {
      edit_request_id: pendingRequest.edit_request_id,
    },
  });
};

module.exports = {
  getOrganizerEvents,
  createEvent,
  updateRejectedEvent,
  withdrawPendingEvent,
  withdrawPendingEditRequest,
};