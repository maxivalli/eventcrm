/*
  Warnings:

  - You are about to drop the column `menu` on the `Quote` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MenuSection" DROP CONSTRAINT "MenuSection_menuId_fkey";

-- DropForeignKey
ALTER TABLE "MenuSectionItem" DROP CONSTRAINT "MenuSectionItem_dishId_fkey";

-- DropForeignKey
ALTER TABLE "MenuSectionItem" DROP CONSTRAINT "MenuSectionItem_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteMenu" DROP CONSTRAINT "QuoteMenu_menuId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteMenu" DROP CONSTRAINT "QuoteMenu_quoteId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "budgetPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "menu";

-- AddForeignKey
ALTER TABLE "MenuSection" ADD CONSTRAINT "MenuSection_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSectionItem" ADD CONSTRAINT "MenuSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MenuSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSectionItem" ADD CONSTRAINT "MenuSectionItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMenu" ADD CONSTRAINT "QuoteMenu_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteMenu" ADD CONSTRAINT "QuoteMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
