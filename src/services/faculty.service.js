
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

const getApprovedEvents = async () => {
  return prisma.event.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      club: true,
      organizer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getRejectedEvents = async () => {
  return prisma.event.findMany({
    where: {
      status: "REJECTED",
    },
    include: {
      club: true,
      organizer: true,
    },
    orderBy: {
      createdAt: "desc",
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


const getPendingEditRequests = async () => {
  return prisma.eventEditRequest.findMany({
    where: {
      status: "PENDING",
      event: {
        status: "APPROVED",
      },
    },
    include: {
      event: {
        include: {
          club: true,
          organizer: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

const approveEditRequest = async (editRequestId) => {
  const editRequest = await prisma.eventEditRequest.findUnique({
    where: {
      edit_request_id: editRequestId,
    },
    include: {
      event: true,
    },
  });

  if (!editRequest) {
    throw new Error("Edit request not found");
  }

  if (editRequest.status !== "PENDING") {
    throw new Error("Only pending edit requests can be approved");
  }

  if (editRequest.event.status !== "APPROVED") {
    throw new Error("Only published events can have edit requests approved");
  }

  const proposedData = editRequest.proposedData;

  return prisma.$transaction(async (tx) => {
    // Apply proposed changes to the published event.
    const updatedEvent = await tx.event.update({
      where: {
        event_id: editRequest.event_id,
      },
      data: {
        ...proposedData,
        date: new Date(proposedData.date),
        endDate: proposedData.endDate
          ? new Date(proposedData.endDate)
          : null,
        status: "APPROVED",
        rejectionReason: null,
      },
      include: {
        club: true,
      },
    });

    // Mark the edit request as approved.
    await tx.eventEditRequest.update({
      where: {
        edit_request_id: editRequestId,
      },
      data: {
        status: "APPROVED",
        rejectionReason: null,
      },
    });

    return updatedEvent;
  });
};

const rejectEditRequest = async (editRequestId, rejectionReason) => {
  const editRequest = await prisma.eventEditRequest.findUnique({
    where: {
      edit_request_id: editRequestId,
    },
    include: {
      event: true,
    },
  });

  if (!editRequest) {
    throw new Error("Edit request not found");
  }

  if (editRequest.status !== "PENDING") {
    throw new Error("Only pending edit requests can be rejected");
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error("Rejection reason is required");
  }

  return prisma.eventEditRequest.update({
    where: {
      edit_request_id: editRequestId,
    },
    data: {
      status: "REJECTED",
      rejectionReason: rejectionReason.trim(),
    },
  });
};

module.exports = {
  getPendingEvents,
  getApprovedEvents,
  getRejectedEvents,
  approveEvent,
  rejectEvent,
  getPendingEditRequests,
  approveEditRequest,
  rejectEditRequest,
};