-- CreateTable
CREATE TABLE "CateringItem" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'unidad',
    "precioUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proveedorId" INTEGER,
    "proveedorLibre" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CateringItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CateringItem" ADD CONSTRAINT "CateringItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CateringItem" ADD CONSTRAINT "CateringItem_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
