-- CreateTable
CREATE TABLE "uni-hungry"."user_presence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_presence_userId_key" ON "uni-hungry"."user_presence"("userId");

-- CreateIndex
CREATE INDEX "user_presence_lastSeenAt_idx" ON "uni-hungry"."user_presence"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "uni-hungry"."user_presence" ADD CONSTRAINT "user_presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "uni-hungry"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
