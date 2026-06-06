/*
  Warnings:

  - Added the required column `endTime` to the `Queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Queue` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ClinicType" AS ENUM ('GENERAL_PRACTICE', 'PEDIATRICS', 'DERMATOLOGY', 'PSYCHIATRY', 'GYNECOLOGY', 'ORTHOPEDICS', 'ENT', 'DENTIST');

-- AlterTable
ALTER TABLE "public"."Clinic" ADD COLUMN     "openingHours" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "type" "public"."ClinicType" NOT NULL DEFAULT 'GENERAL_PRACTICE';

-- AlterTable
ALTER TABLE "public"."Queue" ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maxQueueSize" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;
