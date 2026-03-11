-- AlterTable: add checkinToken to Event
ALTER TABLE "Event" ADD COLUMN "checkinToken" TEXT;
CREATE UNIQUE INDEX "Event_checkinToken_key" ON "Event"("checkinToken");

-- CreateTable: EventGuest
CREATE TABLE "EventGuest" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Mayor',
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "ingreso" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGuest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
