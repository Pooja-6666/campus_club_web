-- CreateTable
CREATE TABLE "EventEditRequest" (
    "edit_request_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "proposedData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEditRequest_pkey" PRIMARY KEY ("edit_request_id")
);

-- CreateIndex
CREATE INDEX "EventEditRequest_event_id_idx" ON "EventEditRequest"("event_id");

-- CreateIndex
CREATE INDEX "EventEditRequest_status_idx" ON "EventEditRequest"("status");

-- AddForeignKey
ALTER TABLE "EventEditRequest" ADD CONSTRAINT "EventEditRequest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;
