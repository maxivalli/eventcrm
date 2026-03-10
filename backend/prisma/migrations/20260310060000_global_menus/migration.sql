-- Crear tabla Menu global
CREATE TABLE "Menu" (
  "id"          SERIAL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla MenuSection
CREATE TABLE "MenuSection" (
  "id"        SERIAL PRIMARY KEY,
  "menuId"    INTEGER NOT NULL REFERENCES "Menu"("id") ON DELETE CASCADE,
  "nombre"    TEXT NOT NULL,
  "orden"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla MenuSectionItem (plato en sección de menú)
CREATE TABLE "MenuSectionItem" (
  "id"        SERIAL PRIMARY KEY,
  "sectionId" INTEGER NOT NULL REFERENCES "MenuSection"("id") ON DELETE CASCADE,
  "dishId"    INTEGER NOT NULL REFERENCES "Dish"("id") ON DELETE CASCADE,
  "nota"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla pivote Quote <-> Menu
CREATE TABLE "QuoteMenu" (
  "id"      SERIAL PRIMARY KEY,
  "quoteId" INTEGER NOT NULL REFERENCES "Quote"("id") ON DELETE CASCADE,
  "menuId"  INTEGER NOT NULL REFERENCES "Menu"("id") ON DELETE CASCADE
);

-- Eliminar tablas viejas de menú por evento
DROP TABLE IF EXISTS "EventMenuItem" CASCADE;
DROP TABLE IF EXISTS "EventMenuSection" CASCADE;
DROP TABLE IF EXISTS "CateringItem" CASCADE;
