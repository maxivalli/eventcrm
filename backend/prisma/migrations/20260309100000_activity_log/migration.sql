-- CreateTable
CREATE TABLE "ActivityLog" (
    "id"        SERIAL NOT NULL,
    "action"    TEXT NOT NULL,
    "entity"    TEXT NOT NULL,
    "entityId"  INTEGER,
    "label"     TEXT NOT NULL,
    "detail"    TEXT,
    "meta"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);
