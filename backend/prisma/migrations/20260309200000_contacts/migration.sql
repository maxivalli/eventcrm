-- CreateTable
CREATE TABLE "Contact" (
    "id"        SERIAL NOT NULL,
    "name"      TEXT NOT NULL,
    "phone"     TEXT NOT NULL DEFAULT '',
    "email"     TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Contact_name_idx" ON "Contact"("name" ASC);
