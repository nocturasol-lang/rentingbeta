/*
  Warnings:

  - You are about to drop the column `bookingId` on the `cleaning_tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cleaning_tasks" DROP COLUMN "bookingId",
ADD COLUMN     "bookingReference" TEXT;
