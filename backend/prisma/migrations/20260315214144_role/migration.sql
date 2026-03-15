/*
  Warnings:

  - You are about to alter the column `cantidad` on the `CateringItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `precioUnitario` on the `CateringItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `cantidad` on the `DishIngredient` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `budget` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `pricePerCover` on the `Quote` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `unitPrice` on the `QuoteItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `SupplierPayment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "CateringItem" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "precioUnitario" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "DishIngredient" ALTER COLUMN "cantidad" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "budget" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "pricePerCover" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "QuoteItem" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SupplierPayment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
