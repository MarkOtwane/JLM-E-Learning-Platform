/*
  Warnings:

  - You are about to drop the column `cvUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `expertise` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "cvUrl",
DROP COLUMN "expertise";
