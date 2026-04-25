-- CreateEnum
CREATE TYPE "uni-hungry"."TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "uni-hungry"."TabStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "uni-hungry"."tables" (
    "id" TEXT NOT NULL,
    "number" INTEGER,
    "name" TEXT,
    "capacity" INTEGER,
    "status" "uni-hungry"."TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uni-hungry"."tabs" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" "uni-hungry"."TabStatus" NOT NULL DEFAULT 'OPEN',
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uni-hungry"."tab_items" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tab_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tables_restaurantId_idx" ON "uni-hungry"."tables"("restaurantId");

-- CreateIndex
CREATE INDEX "tabs_tableId_status_idx" ON "uni-hungry"."tabs"("tableId", "status");

-- CreateIndex
CREATE INDEX "tab_items_tabId_idx" ON "uni-hungry"."tab_items"("tabId");

-- AddForeignKey
ALTER TABLE "uni-hungry"."tables" ADD CONSTRAINT "tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "uni-hungry"."restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uni-hungry"."tabs" ADD CONSTRAINT "tabs_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "uni-hungry"."tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uni-hungry"."tab_items" ADD CONSTRAINT "tab_items_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "uni-hungry"."tabs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uni-hungry"."tab_items" ADD CONSTRAINT "tab_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "uni-hungry"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
