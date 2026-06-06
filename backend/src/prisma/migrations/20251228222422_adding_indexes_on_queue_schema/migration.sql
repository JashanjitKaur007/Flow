/*
  Warnings:

  - A unique constraint covering the columns `[clinicId,queueDate]` on the table `Queue` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Queue_clinicId_queueDate_idx" ON "public"."Queue"("clinicId", "queueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_clinicId_queueDate_key" ON "public"."Queue"("clinicId", "queueDate");
