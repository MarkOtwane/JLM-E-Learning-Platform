-- Add link submission fields to QuizAttempt table
ALTER TABLE "QuizAttempt"
ADD COLUMN "projectLink" TEXT;

ALTER TABLE "QuizAttempt"
ADD COLUMN "linkType" TEXT;

ALTER TABLE "QuizAttempt"
ADD COLUMN "notes" TEXT;

ALTER TABLE "QuizAttempt"
ADD COLUMN "feedback" TEXT;