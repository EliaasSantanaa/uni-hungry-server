/*
  Warnings:

  - The values [WAITRE] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "uni-hungry"."UserRole_new" AS ENUM ('ADMIN', 'MANAGER', 'USER', 'WAITER');
ALTER TABLE "uni-hungry"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "uni-hungry"."User" ALTER COLUMN "role" TYPE "uni-hungry"."UserRole_new" USING ("role"::text::"uni-hungry"."UserRole_new");
ALTER TYPE "uni-hungry"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "uni-hungry"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "uni-hungry"."UserRole_old";
ALTER TABLE "uni-hungry"."User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;
