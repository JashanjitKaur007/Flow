/*
  Warnings:

  - A unique constraint covering the columns `[name,latitude,longitude]` on the table `Clinic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staffId,tokenId,action]` on the table `StaffActivity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[queueId,tokenNumber]` on the table `Token` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Clinic" ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "Clinic_isActive_idx" ON "public"."Clinic"("isActive");

-- CreateIndex
CREATE INDEX "Clinic_latitude_longitude_idx" ON "public"."Clinic"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_name_latitude_longitude_key" ON "public"."Clinic"("name", "latitude", "longitude");

-- CreateIndex
CREATE INDEX "Queue_clinicId_idx" ON "public"."Queue"("clinicId");

-- CreateIndex
CREATE INDEX "Queue_queueDate_idx" ON "public"."Queue"("queueDate");

-- CreateIndex
CREATE INDEX "Queue_isActive_idx" ON "public"."Queue"("isActive");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_isRevoked_idx" ON "public"."Session"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_refreshTokenHash_isRevoked_expiresAt_idx" ON "public"."Session"("refreshTokenHash", "isRevoked", "expiresAt");

-- CreateIndex
CREATE INDEX "StaffActivity_staffId_idx" ON "public"."StaffActivity"("staffId");

-- CreateIndex
CREATE INDEX "StaffActivity_tokenId_idx" ON "public"."StaffActivity"("tokenId");

-- CreateIndex
CREATE INDEX "StaffActivity_action_idx" ON "public"."StaffActivity"("action");

-- CreateIndex
CREATE INDEX "StaffActivity_createdAt_idx" ON "public"."StaffActivity"("createdAt");

-- CreateIndex
CREATE INDEX "StaffActivity_tokenId_action_idx" ON "public"."StaffActivity"("tokenId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "StaffActivity_staffId_tokenId_action_key" ON "public"."StaffActivity"("staffId", "tokenId", "action");

-- CreateIndex
CREATE INDEX "Token_queueId_idx" ON "public"."Token"("queueId");

-- CreateIndex
CREATE INDEX "Token_patientId_idx" ON "public"."Token"("patientId");

-- CreateIndex
CREATE INDEX "Token_queueId_status_idx" ON "public"."Token"("queueId", "status");

-- CreateIndex
CREATE INDEX "Token_status_idx" ON "public"."Token"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Token_queueId_tokenNumber_key" ON "public"."Token"("queueId", "tokenNumber");

-- CreateIndex
CREATE INDEX "User_clinicId_idx" ON "public"."User"("clinicId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_clinicId_role_idx" ON "public"."User"("clinicId", "role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");
