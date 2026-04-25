-- CreateEnum
CREATE TYPE "uni-hungry"."PaymentMethod" AS ENUM ('CASH', 'DEBIT_CARD', 'CREDIT_CARD');

-- AlterTable
ALTER TABLE "uni-hungry"."tabs" ADD COLUMN     "paymentMethod" "uni-hungry"."PaymentMethod",
ADD COLUMN     "serviceCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0;
