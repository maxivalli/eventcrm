-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id"         SERIAL NOT NULL,
    "amount"     DOUBLE PRECISION NOT NULL,
    "date"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note"       TEXT,
    "method"     TEXT NOT NULL DEFAULT 'Efectivo',
    "supplierId" INTEGER NOT NULL,
    "eventId"    INTEGER NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
