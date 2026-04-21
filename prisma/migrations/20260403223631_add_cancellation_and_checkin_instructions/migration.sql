-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "cancellationPolicy" TEXT NOT NULL DEFAULT 'FLEXIBLE',
ADD COLUMN     "checkInInstructions" TEXT;
