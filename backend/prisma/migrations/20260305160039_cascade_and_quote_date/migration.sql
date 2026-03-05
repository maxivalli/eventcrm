-- AlterTable: drop old FK constraints and re-add with CASCADE

-- Event -> Client
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_clientId_fkey";
ALTER TABLE "Event" ADD CONSTRAINT "Event_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Quote -> Event
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_eventId_fkey";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- QuoteItem -> Quote
ALTER TABLE "QuoteItem" DROP CONSTRAINT IF EXISTS "QuoteItem_quoteId_fkey";
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
