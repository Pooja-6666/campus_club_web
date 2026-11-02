-- CreateTable
CREATE TABLE "PasswordResetOTP" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetOTP_student_id_key" ON "PasswordResetOTP"("student_id");

-- AddForeignKey
ALTER TABLE "PasswordResetOTP" ADD CONSTRAINT "PasswordResetOTP_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
