-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "uni-hungry";

-- CreateTable
CREATE TABLE "uni-hungry"."Teste" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Teste_pkey" PRIMARY KEY ("id")
);
