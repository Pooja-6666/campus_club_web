-- CreateTable
CREATE TABLE "OrganizerPasswordResetOTP" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerPasswordResetOTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyPasswordResetOTP" (
    "id" SERIAL NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyPasswordResetOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerPasswordResetOTP_org_id_key" ON "OrganizerPasswordResetOTP"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyPasswordResetOTP_faculty_id_key" ON "FacultyPasswordResetOTP"("faculty_id");

-- AddForeignKey
ALTER TABLE "OrganizerPasswordResetOTP" ADD CONSTRAINT "OrganizerPasswordResetOTP_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organizer"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyPasswordResetOTP" ADD CONSTRAINT "FacultyPasswordResetOTP_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;
