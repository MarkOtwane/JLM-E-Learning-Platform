# Production-Ready Course Creation System - Implementation Guide

## Overview

This document describes the complete production-ready course creation system implemented for the JLM E-Learning Platform. The system provides a robust, scalable, and user-friendly solution for instructors to create, manage, and publish courses.

## Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Controllers (REST)                       │
│  CoursesControllerV2 - Handles all course-related endpoints     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                          │                                      │
│          ┌───────────────▼──────────────┐   ┌──────────────┐   │
│          │   CoursesServiceV2           │   │ CourseVersion│   │
│          │  - Course CRUD               │   │   Service    │   │
│          │  - Draft management          │   │ - Versioning │   │
│          │  - Publishing flow           │   │ - Audit trail│   │
│          │  - Archive/Restore           │   │ - History    │   │
│          │  - Duplicate                 │   │              │   │
│          └───────────────┬──────────────┘   └──────────────┘   │
│                          │                                      │
│          ┌───────────────┼──────────────────────────────────┐   │
│          │               │                                  │   │
│          ▼               ▼                                  ▼   │
│    ┌──────────┐   ┌──────────────┐                  ┌───────────┐
│    │ Prisma   │   │FileUpload    │                  │ Database  │
│    │Service   │   │Service       │                  │(PostgreSQL)
│    └──────────┘   │- Local FS    │                  │- Course   │
│                   │- S3 (future) │                  │- Version  │
│                   └──────────────┘                  └───────────┘
└──────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌────────────────────────────────────────────────────┐
│  CourseCreationWizardComponent                     │
│  - Multi-step form (4 steps: Basic, Media,        │
│    Pricing, Publishing)                            │
│  - Auto-save every 30 seconds                      │
│  - Progress tracking                              │
│  - File uploads with preview                      │
└────────────────────┬─────────────────────────────┘
                     │
        ┌────────────┴───────────┬─────────────────┐
        │                        │                 │
        ▼                        ▼                 ▼
   ┌─────────────┐         ┌──────────────┐  ┌─────────────┐
   │ ApiService  │         │Instructor    │  │ Course      │
   │ (HTTP calls)│         │Service       │  │ Refresh     │
   └─────────────┘         └──────────────┘  │ Service     │
                                              └─────────────┘
```

## Backend Implementation

### 1. Database Schema (Prisma)

#### Course Model Extensions

```prisma
model Course {
  // ... existing fields ...

  // Basic Information
  subtitle          String?
  language          String = "English"
  tags              String[]

  // Media
  thumbnailUrl      String?
  introVideoUrl     String?

  // Pricing
  isPremium         Boolean = false
  price             Decimal = 0
  currency          String = "USD"
  discountPercentage Int = 0
  discountEndDate   DateTime?

  // Publishing
  status            CourseStatus = DRAFT
  scheduledPublishDate DateTime?

  // SEO
  seoTitle          String?
  seoDescription    String?
  urlSlug           String @unique
  ogImageUrl        String?

  // Analytics
  enrollmentCount   Int = 0
  averageRating     Float = 0
  ratingCount       Int = 0
  completionRate    Float = 0

  // Audit
  isDeleted         Boolean = false
  deletedAt         DateTime?
  versions          CourseVersion[]

  // Indexes for performance
  @@index([instructorId, isDeleted])
  @@index([status, isDeleted])
  @@index([urlSlug])
  @@unique([urlSlug, !isDeleted])
}

model CourseVersion {
  id                String @id @default(cuid())
  courseId          String
  versionNumber     Int
  changeType        String // 'created', 'updated', 'published', 'archived'
  changes           String // JSON stringified changes
  course            Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  changedById       String
  changedBy         User @relation("CourseVersions", fields: [changedById], references: [id])

  createdAt         DateTime @default(now())

  @@unique([courseId, versionNumber])
  @@index([courseId, createdAt])
  @@index([changedById])
}

model User {
  // ... existing fields ...
  courseVersions    CourseVersion[] @relation("CourseVersions")
}

enum CourseStatus {
  DRAFT
  PRIVATE
  PUBLISHED
  SCHEDULED
}
```

### 2. DTOs (Data Transfer Objects)

#### CreateCourseV2DTO

```typescript
// Step 1: Basic Information
class CreateCourseBasicDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 100)
  title: string;

  @IsOptional()
  @IsString()
  subtitle: string;

  @IsNotEmpty()
  @IsString()
  @Length(50, 2000)
  description: string;

  @IsNotEmpty()
  @IsEnum(['Programming', 'Design', ...])
  category: string;

  @IsNotEmpty()
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @IsOptional()
  @IsString()
  language: string = 'English';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  tags: string[];

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(1000)
  duration: number;
}

// Step 2: Media
class CreateCourseMediaDto {
  @IsOptional()
  @IsUrl()
  thumbnailUrl: string;

  @IsOptional()
  @IsUrl()
  introVideoUrl: string;
}

// Step 3: Pricing
class CreateCoursePricingDto {
  @IsOptional()
  @IsBoolean()
  isPremium: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99999)
  price: number = 0;

  @IsOptional()
  @IsEnum(['USD', 'EUR', 'GBP', 'INR'])
  currency: string = 'USD';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number = 0;

  @IsOptional()
  @IsISO8601()
  discountEndDate: Date;
}

// Step 4: Publishing/SEO
class CreateCoursePublishingDto {
  @IsOptional()
  @IsEnum(CourseStatus)
  status: CourseStatus = CourseStatus.DRAFT;

  @IsOptional()
  @IsISO8601()
  scheduledPublishDate: Date;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  seoTitle: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  seoDescription: string;

  @IsOptional()
  @IsSlug()
  urlSlug: string;

  @IsOptional()
  @IsUrl()
  ogImageUrl: string;
}

// Combined DTO for single POST request
class CreateCourseDto extends IntersectionType(
  CreateCourseBasicDto,
  CreateCourseMediaDto,
  CreateCoursePricingDto,
  CreateCoursePublishingDto
) {}
```

#### UpdateCourseV2DTO

```typescript
class UpdateCourseDto extends PartialType(CreateCourseDto) {}
class SaveCourseDraftDto extends PartialType(CreateCourseDto) {}
class PublishCourseDto {
	@IsEnum(CourseStatus)
	status: CourseStatus = CourseStatus.PUBLISHED;
}
class ArchiveCourseDto {
	@IsBoolean()
	isDeleted: boolean = true;
}
```

### 3. Services

#### CoursesServiceV2 Methods

```typescript
// Create and manage courses
createCourse(userId, dto): Promise<{ success, course }>
saveDraft(userId, courseId, dto): Promise<{ success, course }>
publishCourse(userId, courseId): Promise<{ success, course }>
scheduleCourse(userId, courseId, date): Promise<{ success, course }>
archiveCourse(userId, courseId): Promise<{ success }>
restoreCourse(userId, courseId): Promise<{ success, course }>
duplicateCourse(userId, courseId): Promise<{ success, course }>

// Query methods
getInstructorCourses(userId, includeDeleted): Promise<Course[]>
getPublishedCourse(courseId): Promise<Course>
getCourseVersionHistory(userId, courseId): Promise<CourseVersion[]>

// Helper methods
validateCourseOwnership(userId, courseId)
generateSlug(title): string
createCourseVersion(userId, courseId, versionNumber, changeType, changes)
getChanges(oldObj, newObj): Record<string, any>
```

#### CourseVersionService Methods

```typescript
// Get version history
getCourseVersionHistory(courseId, page, limit): Promise<VersionHistory>
getVersionDetails(courseId, versionNumber): Promise<Version>
getVersionDiff(courseId, fromVersion, toVersion): Promise<Diff>
getVersionTimeline(courseId): Promise<Timeline>
getActivityReport(courseId, days): Promise<Report>

// Maintenance
cleanupOldVersions(courseId, keepVersions): Promise<{ deletedCount }>

// Helpers
generateChangeSummary(changeType, changes): string
calculateDiff(from, to): Record<string, any>
groupVersionsByUser(versions): Record<string, number>
groupVersionsByChangeType(versions): Record<string, number>
```

#### FileUploadService Methods

```typescript
// Upload operations
uploadThumbnail(file, courseId): Promise<UploadResult>
uploadVideo(file, courseId): Promise<UploadResult>
uploadAttachment(file, courseId, type): Promise<UploadResult>

// File operations
deleteFile(filePath): Promise<boolean>
getFileStats(filePath): { size, created, modified, isFile }
getStorageStats(): { thumbnails, videos, attachments, total }

// Validators and helpers
validateImage(file): void
validateVideo(file): void
generateSecureFilename(prefix, courseId, originalName): string
ensureUploadDirs(): void
getDirSize(dirPath): number
```

### 4. API Endpoints

#### Course Management

```http
# Create course
POST /courses
Content-Type: application/json

{
  "title": "Python Basics",
  "description": "Learn Python from scratch",
  "category": "Programming",
  "level": "BEGINNER",
  "duration": 120,
  "isPremium": false
}

# Get my courses
GET /courses/my

# Save draft (partial update)
PATCH /courses/:id/draft
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}

# Publish course
POST /courses/:id/publish

# Schedule course
POST /courses/:id/schedule
Content-Type: application/json

{
  "scheduledPublishDate": "2024-12-31T12:00:00Z"
}

# Archive course
POST /courses/:id/archive

# Restore archived course
POST /courses/:id/restore

# Duplicate course
POST /courses/:id/duplicate
```

#### Media Upload

```http
# Upload thumbnail
POST /courses/:id/upload/thumbnail
Content-Type: multipart/form-data

file: [binary image data]

# Upload video
POST /courses/:id/upload/video
Content-Type: multipart/form-data

file: [binary video data]
```

#### Versioning & History

```http
# Get version history (paginated)
GET /courses/:id/versions?page=1&limit=20

# Get specific version
GET /courses/:id/versions/:versionNumber

# Get version timeline
GET /courses/:id/timeline

# Get activity report
GET /courses/:id/activity?days=30
```

#### Public APIs

```http
# Get published course (no auth required)
GET /courses/published/:courseId
```

## Frontend Implementation

### CourseCreationWizardComponent

A production-ready multi-step form component with:

#### Step 1: Basic Information

- Course title (5-100 chars)
- Subtitle (optional)
- Description (50-2000 chars)
- Category selection
- Level (Beginner, Intermediate, Advanced)
- Language
- Duration (15-1000 minutes)
- Tags (up to 10)

#### Step 2: Media

- Thumbnail upload (PNG, JPG, WebP, max 5MB)
- Intro video upload (MP4, WebM, max 500MB)
- File preview display

#### Step 3: Pricing

- Toggle for premium/free
- Price input (when premium)
- Currency selection
- Discount percentage
- Discount end date

#### Step 4: Publishing & SEO

- Course status (Draft, Private, Published, Scheduled)
- Scheduled publish date (when scheduled)
- SEO title (60 chars)
- SEO description (160 chars)
- URL slug (auto-generated or custom)
- Open Graph image URL

### Features

#### Auto-Save

- Saves draft automatically every 30 seconds
- Debounced form changes (3 second delay after typing)
- Visual auto-save indicator
- Can manually save at any step

#### Progress Tracking

- Visual progress bar (0-100%)
- Step indicators showing completion status
- Current step display (1 of 4)
- Navigation between steps

#### Form Validation

- Per-step validation before advancing
- Real-time error messages
- Field-specific error alerts
- Type coercion and normalization

#### File Upload

- Drag-and-drop support
- File size validation
- File type validation
- Progress indication (uploading...)
- Preview display after upload

## Data Flow

### Course Creation Flow

```
1. Instructor navigates to /instructor/create-course
2. CourseCreationWizardComponent loads
3. Form displays Step 1 (Basic Information)

Step 1-3:
- Instructor fills form fields
- Auto-save triggers every 30 seconds
- saveDraft() creates new course and updates database
- courseId stored locally for subsequent updates
- User can navigate between steps

Step 4: Publishing
- Instructor reviews SEO settings
- Clicks "Publish Course"
- Final form validation
- POST /courses/:id/publish
- CourseVersionService creates version record
- CourseRefreshService notifies other components
- Redirect to /instructor/my-courses

Result:
- Course published and visible in My Courses
- Dashboard automatically refreshed
- Instructor notified of successful publication
```

### Draft Auto-Save Flow

```
User types → debounceTime(3s) → valueChanges → autoSaveSubject$.next()
                                                      ↓
                           debounceTime(3s) → autoSave() triggered
                                                      ↓
                           Check: courseId exists? → Call API
                                      ↓
                           PATCH /courses/:id/draft
                                      ↓
                           Success: Update autoSaveStatus ✓
                           Failure: Show error message
                                      ↓
                           Periodic: interval(30000) also triggers autoSave()
```

### Version History Flow

```
Instructor makes changes → CoursesServiceV2 saves
                           ↓
    Check what changed → createCourseVersion()
                           ↓
    CourseVersionService records:
    - versionNumber (auto-increment)
    - changeType ('updated', 'published', etc.)
    - changes (JSON diff: before → after)
    - changedBy (user ID)
    - createdAt (timestamp)
                           ↓
    Stored in CourseVersion table
                           ↓
    Can query: GET /courses/:id/versions
    Returns: Paginated list of all changes
```

## Security Considerations

### Authorization

- All course endpoints require JWT authentication
- Instructors can only modify their own courses
- @Roles('INSTRUCTOR') decorator enforces role
- validateCourseOwnership() checks user ID

### File Security

- File types validated (whitelist only)
- File sizes enforced (thumbnails: 5MB, videos: 500MB)
- Secure filenames generated (timestamp + hash)
- Path normalization prevents directory traversal
- CORS headers configured for file delivery

### Data Validation

- class-validator decorators on all DTOs
- Min/max length constraints
- Enum validation (status, level, etc.)
- URL validation for thumbnail and video URLs
- Slug validation (alphanumeric + hyphens)

### Audit Trail

- CourseVersion model tracks all changes
- User attribution for each change
- Timestamps for when changes occurred
- Change details stored as JSON for analysis

## Performance Optimization

### Database

- Composite indexes on frequently queried fields
- Soft deletes (isDeleted flag) to avoid hard deletes
- Pagination support in version history
- Efficient JSON queries in Prisma

### File Storage

- Local file system storage (configurable)
- Secure filename generation prevents collision
- Directory structure organized by file type
- Storage statistics available for monitoring

### Frontend

- OnPush change detection optimization
- Debounced form value changes (3s)
- RxJS subscription cleanup (ngOnDestroy)
- Lazy loading for multi-step form
- Memory-efficient file handling

### API

- Proper HTTP status codes (201 for creation, 200 for updates)
- Efficient query selections (only needed fields)
- Pagination for list endpoints
- Compression for API responses

## Error Handling

### Backend Errors

```typescript
// Course not found
NotFoundException: "Course not found";

// Ownership validation
ForbiddenException: "You can only manage your own courses";

// Validation errors
BadRequestException: "URL slug is already in use";

// File upload errors
BadRequestException: "Thumbnail must be smaller than 5MB";

// Duplicate slug
ConflictException: "URL slug is already in use";
```

### Frontend Error Handling

- Try-catch blocks in async operations
- User-friendly alert messages
- Console logging for debugging
- Graceful fallbacks for failed uploads

## Testing Strategy

### Unit Tests

- CoursesServiceV2: Create, update, publish, archive, duplicate
- CourseVersionService: Version tracking, history retrieval
- FileUploadService: File validation, secure naming
- Validation: DTO validators with class-validator

### Integration Tests

- Full course creation flow (create → draft → publish)
- File upload and storage
- Version history creation and retrieval
- Authorization checks

### E2E Tests

- Instructor creates course in 4-step wizard
- Course not visible until published
- New course appears in My Courses after publish
- Version history tracked for all changes
- File uploads work correctly

## Deployment Considerations

### Prerequisites

- PostgreSQL 12+ with UUID support
- Node.js 16+ for backend
- Angular 16+ for frontend
- File system with sufficient storage (or S3 setup)

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
UPLOAD_PATH=./uploads
MAX_UPLOAD_SIZE=500000000  # 500MB

# Frontend
API_URL=https://api.example.com
```

### File Storage Setup

```bash
# Create upload directories
mkdir -p uploads/{thumbnails,videos,attachments/{assignment,module,resource}}
chmod 755 uploads
```

### Database Migration

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

## Future Enhancements

### Phase 2

- S3/Cloud storage support for files
- Course structure builder (modules/lessons)
- Assessment builder (quizzes/assignments)
- Dependency linking between lessons
- Drip scheduling (time-based content release)

### Phase 3

- Course preview as student
- Advanced analytics (enrollment trends, completion rates)
- Student feedback ratings and reviews
- Bulk course import/export
- Course templates for quick creation

### Phase 4

- AI-powered course content suggestions
- Automated video transcription
- Course marketplace with recommendations
- Revenue sharing and commission management
- Certification generation

## Support & Maintenance

### Monitoring

- Track auto-save failures
- Monitor file upload errors
- Watch for version history bloat
- Alert on large file uploads

### Maintenance Tasks

- Periodic version cleanup (keep last 50)
- Archive old test courses
- Clean up orphaned files
- Database vacuum and index optimization

### Common Issues

1. **File upload fails**: Check upload directory permissions
2. **Slug conflicts**: Ensure URL slug uniqueness constraint
3. **Draft not saving**: Verify courseId is created on first save
4. **Version history grows large**: Run version cleanup script

## Conclusion

This production-ready course creation system provides:
✅ Robust, scalable backend infrastructure
✅ User-friendly multi-step frontend wizard
✅ Comprehensive version history and audit trail
✅ Secure file upload and storage
✅ Auto-save and draft management
✅ Full authorization and validation
✅ Performance optimization throughout

The system is ready for production deployment and can handle enterprise-scale online education platforms.
