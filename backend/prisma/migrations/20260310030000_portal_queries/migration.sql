CREATE TABLE "PortalQuery" (
  "id"        SERIAL PRIMARY KEY,
  "eventId"   INTEGER NOT NULL,
  "question"  TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortalQuery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);