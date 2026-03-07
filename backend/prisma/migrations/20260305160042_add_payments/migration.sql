-- CreateTable
CREATE TABLE "Payment" (
    "id"        SERIAL NOT NULL,
    "amount"    DOUBLE PRECISION NOT NULL,
    "date"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note"      TEXT,
    "eventId"   INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
