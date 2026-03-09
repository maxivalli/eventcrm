-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id"          SERIAL PRIMARY KEY,
    "eventId"     INTEGER NOT NULL,
    "hora"        TEXT NOT NULL,
    "titulo"      TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria"   TEXT NOT NULL DEFAULT 'Protocolo',
    "orden"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleItem_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE
);
