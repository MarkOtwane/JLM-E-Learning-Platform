"""
Course Creation System - Database Migration
Adds production-ready fields for comprehensive course management
"""

-- Add new enum for course status
ALTER TABLE "Course" ADD COLUMN "subtitle" TEXT;
ALTER TABLE "Course" ADD COLUMN "tags" TEXT[] DEFAULT '{}'; -- JSONB array of tags
ALTER TABLE "Course" ADD COLUMN "language" VARCHAR(10) DEFAULT 'en';
ALTER TABLE "Course" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN "introVideoUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN "status" VARCHAR(50) DEFAULT 'DRAFT'; -- DRAFT, PRIVATE, PUBLISHED, SCHEDULED
ALTER TABLE "Course" ADD COLUMN "scheduledPublishDate" TIMESTAMP;
ALTER TABLE "Course" ADD COLUMN "discountPercentage" FLOAT DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "discountEndDate" TIMESTAMP;
ALTER TABLE "Course" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "Course" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Course" ADD COLUMN "urlSlug" TEXT UNIQUE;
ALTER TABLE "Course" ADD COLUMN "ogImageUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN "isDeleted" BOOLEAN DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "enrollmentCount" INT DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "averageRating" FLOAT DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "ratingCount" INT DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "completionRate" FLOAT DEFAULT 0;

-- Create course version history table for auditing
CREATE TABLE "CourseVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "versionNumber" INT NOT NULL,
  "changeType" VARCHAR(50) NOT NULL, -- created, updated, published, archived
  "changes" JSONB NOT NULL,
  "changedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
  FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT
);

CREATE INDEX "CourseVersion_courseId" ON "CourseVersion"("courseId");
CREATE INDEX "CourseVersion_changedBy" ON "CourseVersion"("changedBy");
CREATE INDEX "CourseVersion_createdAt" ON "CourseVersion"("createdAt");

-- Add status indexes
CREATE INDEX "Course_status" ON "Course"("status");
CREATE INDEX "Course_urlSlug" ON "Course"("urlSlug");
CREATE INDEX "Course_isDeleted" ON "Course"("isDeleted");
