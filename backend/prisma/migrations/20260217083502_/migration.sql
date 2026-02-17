/*
  Warnings:

  - A unique constraint covering the columns `[userId,courseId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Certificate_userId_courseId_idx" ON "Certificate"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Content_moduleId_type_idx" ON "Content"("moduleId", "type");

-- CreateIndex
CREATE INDEX "Course_price_idx" ON "Course"("price");

-- CreateIndex
CREATE INDEX "Course_category_level_idx" ON "Course"("category", "level");

-- CreateIndex
CREATE INDEX "Course_isPremium_price_idx" ON "Course"("isPremium", "price");

-- CreateIndex
CREATE INDEX "Course_category_isPremium_idx" ON "Course"("category", "isPremium");

-- CreateIndex
CREATE INDEX "Enrollment_userId_courseId_idx" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_currency_idx" ON "Payment"("currency");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_courseId_status_idx" ON "Payment"("courseId", "status");

-- CreateIndex
CREATE INDEX "Progress_userId_moduleId_idx" ON "Progress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "Progress_userId_completed_idx" ON "Progress"("userId", "completed");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_quizId_idx" ON "QuizAttempt"("userId", "quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_attemptDate_idx" ON "QuizAttempt"("userId", "attemptDate");
