ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'staff';
UPDATE "User" SET "role" = 'admin' WHERE "id" = 1;
