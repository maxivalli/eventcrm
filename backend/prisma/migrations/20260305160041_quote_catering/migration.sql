-- AlterTable Quote: add kind and catering fields
ALTER TABLE "Quote" ADD COLUMN "kind"          TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "Quote" ADD COLUMN "menu"          TEXT;
ALTER TABLE "Quote" ADD COLUMN "covers"        INTEGER;
ALTER TABLE "Quote" ADD COLUMN "pricePerCover" DOUBLE PRECISION;
