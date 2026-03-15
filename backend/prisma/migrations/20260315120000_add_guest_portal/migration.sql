-- AlterTable
ALTER TABLE "Event" ADD COLUMN "guestPortalToken" TEXT UNIQUE;

-- AlterTable
ALTER TABLE "EventGuest" ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT false;
