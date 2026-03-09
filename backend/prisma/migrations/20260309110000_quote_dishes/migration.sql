-- CreateTable
CREATE TABLE "QuoteDish" (
    "id"      SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "dishId"  INTEGER NOT NULL,
    "nota"    TEXT,

    CONSTRAINT "QuoteDish_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuoteDish" ADD CONSTRAINT "QuoteDish_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteDish" ADD CONSTRAINT "QuoteDish_dishId_fkey"
    FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
