/*
  Warnings:

  - You are about to drop the `Clinic` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."DoctorType" AS ENUM ('GENERAL_PRACTICE', 'PEDIATRICS', 'DERMATOLOGY', 'PSYCHIATRY', 'GYNECOLOGY', 'ORTHOPEDICS', 'ENT', 'DENTIST');

-- DropForeignKey
ALTER TABLE "public"."Queue" DROP CONSTRAINT "Queue_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_clinicId_fkey";

-- DropTable
DROP TABLE "public"."Clinic";

-- DropEnum
DROP TYPE "public"."ClinicType";

-- CreateTable
CREATE TABLE "public"."DoctorClinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "public"."DoctorType" NOT NULL DEFAULT 'GENERAL_PRACTICE',
    "openingHours" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "DoctorClinic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorClinic_isActive_idx" ON "public"."DoctorClinic"("isActive");

-- CreateIndex
CREATE INDEX "DoctorClinic_latitude_longitude_idx" ON "public"."DoctorClinic"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorClinic_name_latitude_longitude_key" ON "public"."DoctorClinic"("name", "latitude", "longitude");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."DoctorClinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Queue" ADD CONSTRAINT "Queue_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."DoctorClinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
