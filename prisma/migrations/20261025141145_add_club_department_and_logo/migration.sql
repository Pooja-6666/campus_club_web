/*
  Warnings:

  - A unique constraint covering the columns `[club_name]` on the table `Club` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "department" TEXT,
ADD COLUMN     "faculty_lead" TEXT,
ADD COLUMN     "logo_url" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "time" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Club_club_name_key" ON "Club"("club_name");
