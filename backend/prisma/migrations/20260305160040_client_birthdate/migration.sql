-- AlterTable Client: drop type column, add birthdate (nullable)
ALTER TABLE "Client" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Client" ADD COLUMN "birthdate" TIMESTAMP(3);
