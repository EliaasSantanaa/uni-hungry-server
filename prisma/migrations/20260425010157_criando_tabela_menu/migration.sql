-- CreateEnum
CREATE TYPE "uni-hungry"."MenuCategory" AS ENUM ('BEBIDAS', 'SOBREMESAS', 'PRATO_PRINCIPAL', 'ENTRADAS', 'ACOMPANHAMENTOS');

-- CreateTable
CREATE TABLE "uni-hungry"."menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" "uni-hungry"."MenuCategory" NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_category_idx" ON "uni-hungry"."menu_items"("restaurantId", "category");

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_isAvailable_idx" ON "uni-hungry"."menu_items"("restaurantId", "isAvailable");

-- AddForeignKey
ALTER TABLE "uni-hungry"."menu_items" ADD CONSTRAINT "menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "uni-hungry"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
