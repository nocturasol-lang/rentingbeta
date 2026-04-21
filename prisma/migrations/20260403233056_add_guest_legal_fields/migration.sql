-- CreateEnum
CREATE TYPE "GuestIdType" AS ENUM ('PASSPORT', 'NATIONAL_ID');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "guestDateOfBirth" DATE,
ADD COLUMN     "guestIdNumber" TEXT,
ADD COLUMN     "guestIdType" "GuestIdType",
ADD COLUMN     "guestNationality" TEXT,
ADD COLUMN     "guestResidenceCountry" TEXT;
