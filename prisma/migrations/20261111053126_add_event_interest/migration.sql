-- CreateEnum
CREATE TYPE "EventInterestStatus" AS ENUM ('INTERESTED', 'NOT_INTERESTED');

-- CreateTable
CREATE TABLE "EventInterest" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "status" "EventInterestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventInterest_event_id_idx" ON "EventInterest"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "EventInterest_student_id_event_id_key" ON "EventInterest"("student_id", "event_id");

-- AddForeignKey
ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;
