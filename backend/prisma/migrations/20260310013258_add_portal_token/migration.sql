/*
  Warnings:

  - You are about to drop the `ScheduleItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[portalToken]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ScheduleItem" DROP CONSTRAINT "ScheduleItem_eventId_fkey";

-- DropIndex
DROP INDEX "ActivityLog_createdAt_idx";

-- DropIndex
DROP INDEX "Contact_name_idx";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "portalToken" TEXT;

-- DropTable
DROP TABLE "ScheduleItem";

-- CreateIndex
CREATE UNIQUE INDEX "Event_portalToken_key" ON "Event"("portalToken");
