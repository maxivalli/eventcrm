-- CreateTable Dish
CREATE TABLE "Dish" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable DishIngredient
CREATE TABLE "DishIngredient" (
    "id" SERIAL NOT NULL,
    "dishId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'g',
    "categoria" TEXT NOT NULL DEFAULT 'Otros',
    CONSTRAINT "DishIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventMenuSection
CREATE TABLE "EventMenuSection" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMenuSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventMenuItem
CREATE TABLE "EventMenuItem" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "dishId" INTEGER NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMenuItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DishIngredient" ADD CONSTRAINT "DishIngredient_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMenuSection" ADD CONSTRAINT "EventMenuSection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMenuItem" ADD CONSTRAINT "EventMenuItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "EventMenuSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMenuItem" ADD CONSTRAINT "EventMenuItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
