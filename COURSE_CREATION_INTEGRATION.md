# Production Course Creation System - Integration Checklist

## Backend Integration

### 1. Update Prisma Schema ✓ DONE

- [x] Added Course model fields (subtitle, language, thumbnailUrl, status, SEO fields, etc.)
- [x] Created CourseVersion model for audit trail
- [x] Added indexes for query optimization
- [x] Updated User model with courseVersions relation
- **Action Required**: Run `npx prisma migrate dev --name add_course_production_fields`

### 2. Create/Update Services

- [x] Create `courses.service.v2.ts` with:
     - [x] createCourse()
     - [x] saveDraft()
     - [x] publishCourse()
     - [x] scheduleCourse()
     - [x] archiveCourse()
     - [x] restoreCourse()
     - [x] duplicateCourse()
     - [x] getInstructorCourses()
     - [x] getPublishedCourse()
     - [x] getCourseVersionHistory()

- [x] Create `course-version.service.ts` with:
     - [x] getCourseVersionHistory()
     - [x] getVersionDetails()
     - [x] getVersionDiff()
     - [x] getVersionTimeline()
     - [x] getActivityReport()
     - [x] cleanupOldVersions()

- [x] Create/Update `file-upload.service.ts` in `/backend/src/common/` with:
     - [x] uploadThumbnail()
     - [x] uploadVideo()
     - [x] uploadAttachment()
     - [x] deleteFile()
     - [x] getStorageStats()

### 3. Create/Update Controllers

- [x] Create `courses.controller.v2.ts` with endpoints:
     - [x] POST /courses (create)
     - [x] GET /courses/my (get instructor courses)
     - [x] GET /courses/my-all (with archived)
     - [x] GET /courses/:id (get course)
     - [x] PATCH /courses/:id/draft (save draft)
     - [x] POST /courses/:id/publish (publish)
     - [x] POST /courses/:id/schedule (schedule)
     - [x] POST /courses/:id/archive (archive)
     - [x] POST /courses/:id/restore (restore)
     - [x] POST /courses/:id/duplicate (duplicate)
     - [x] POST /courses/:id/upload/thumbnail (upload thumbnail)
     - [x] POST /courses/:id/upload/video (upload video)
     - [x] GET /courses/:id/versions (get version history)
     - [x] GET /courses/:id/versions/:versionNumber (get specific version)
     - [x] GET /courses/:id/timeline (get timeline)
     - [x] GET /courses/:id/activity (get activity report)
     - [x] GET /courses/published/:courseId (public - no auth)

### 4. Create DTOs

- [x] Create `create-course-v2.dto.ts` with:
     - [x] CreateCourseBasicDto
     - [x] CreateCourseMediaDto
     - [x] CreateCoursePricingDto
     - [x] CreateCoursePublishingDto
     - [x] CreateCourseDto (combined)
     - [x] CourseLevel enum
     - [x] CourseStatus enum

- [x] Create `update-course-v2.dto.ts` with:
     - [x] UpdateCourseDto
     - [x] SaveCourseDraftDto
     - [x] PublishCourseDto
     - [x] ArchiveCourseDto

### 5. Register Services & Controllers in Module

**File**: `/backend/src/courses/courses.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { CoursesControllerV2 } from "./courses.controller.v2";
import { CoursesServiceV2 } from "./courses.service.v2";
import { CourseVersionService } from "./course-version.service";
import { FileUploadService } from "../common/file-upload.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
	controllers: [CoursesControllerV2],
	providers: [CoursesServiceV2, CourseVersionService, FileUploadService, PrismaService],
	exports: [CoursesServiceV2, CourseVersionService, FileUploadService],
})
export class CoursesModule {}
```

**Action Required**:

- [ ] Update `/backend/src/courses/courses.module.ts` to include new controller and services
- [ ] Ensure FileUploadService is available (may be in app.module.ts as global provider)

### 6. Configure File Upload Middleware

**File**: `/backend/src/main.ts`

```typescript
import { Express } from "express";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for file uploads
	app.enableCors({
		origin: process.env.FRONTEND_URL || "http://localhost:4200",
		credentials: true,
	});

	// Increase payload size for large file uploads
	app.use(express.json({ limit: "50mb" }));
	app.use(express.urlencoded({ limit: "50mb", extended: true }));

	// Serve uploaded files as static
	app.use("/uploads", express.static("uploads"));

	await app.listen(3000);
}

bootstrap();
```

**Action Required**:

- [ ] Update `/backend/src/main.ts` to configure file upload middleware
- [ ] Ensure static file serving is configured for `/uploads`

### 7. Create Upload Directory Structure

**Action Required**:

```bash
mkdir -p uploads/{thumbnails,videos,attachments/{assignment,module,resource}}
chmod 755 uploads
```

### 8. Environment Configuration

**File**: `.env`

```env
# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_THUMBNAIL_SIZE=5242880         # 5MB
MAX_VIDEO_SIZE=524288000           # 500MB
MAX_ATTACHMENT_SIZE=52428800       # 50MB
```

**Action Required**:

- [ ] Add upload configuration to `.env` file

### 9. Database Migrations

**Action Required**:

```bash
cd backend
npx prisma migrate dev --name add_course_production_fields
npx prisma generate  # Generate Prisma Client
```

---

## Frontend Integration

### 1. Create Course Types

**File**: `/Frontend/src/app/types/course.types.ts`

```typescript
export interface Course {
	id: string;
	title: string;
	subtitle?: string;
	description: string;
	category: string;
	level: CourseLevelEnum;
	language: string;
	duration: number;
	thumbnailUrl?: string;
	introVideoUrl?: string;
	isPremium: boolean;
	price?: number;
	currency: string;
	tags: string[];
	status: CourseStatusEnum;
	seoTitle?: string;
	seoDescription?: string;
	urlSlug: string;
	ogImageUrl?: string;
	enrollmentCount: number;
	averageRating?: number;
	ratingCount?: number;
	completionRate?: number;
	isDeleted: boolean;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export enum CourseLevelEnum {
	BEGINNER = "BEGINNER",
	INTERMEDIATE = "INTERMEDIATE",
	ADVANCED = "ADVANCED",
}

export enum CourseStatusEnum {
	DRAFT = "DRAFT",
	PRIVATE = "PRIVATE",
	PUBLISHED = "PUBLISHED",
	SCHEDULED = "SCHEDULED",
}

export interface CourseVersion {
	versionNumber: number;
	changeType: string;
	timestamp: Date;
	changedBy: {
		id: string;
		name: string;
		email: string;
	};
	changes: Record<string, any>;
	changeSummary: string;
}
```

**Action Required**:

- [ ] Create `/Frontend/src/app/types/course.types.ts` with interfaces above

### 2. Update/Create Instructor Service

**File**: `/Frontend/src/app/services/instructor.service.ts`

Add methods:

```typescript
getCourses(): Observable<Course[]> {
  return this.api.getAuth(`/courses/my`);
}

getCourseVersions(courseId: string): Observable<CourseVersion[]> {
  return this.api.getAuth(`/courses/${courseId}/versions`);
}

getVersionTimeline(courseId: string) {
  return this.api.getAuth(`/courses/${courseId}/timeline`);
}

getCourseActivityReport(courseId: string, days: number = 30) {
  return this.api.getAuth(`/courses/${courseId}/activity?days=${days}`);
}
```

**Action Required**:

- [ ] Add methods above to `/Frontend/src/app/services/instructor.service.ts`

### 3. Create Course Creation Wizard Component

- [x] Create `/Frontend/src/app/pages/instructor/create-course-wizard/create-course-wizard.component.ts`

**Action Required**:

- [ ] Verify component path matches your project structure
- [ ] Import necessary Angular modules (if using different versions)
- [ ] Update API endpoint paths if different

### 4. Update Course Refresh Service (Already Done in Phase 4)

**File**: `/Frontend/src/app/services/course-refresh.service.ts`

Verify it exists and contains:

```typescript
private courseCreatedSubject = new Subject<void>();
courseCreated$ = this.courseCreatedSubject.asObservable();

notifyCourseCreated() {
  this.courseCreatedSubject.next();
}
```

**Action Required**:

- [ ] Verify CourseRefreshService exists and has correct implementation

### 5. Update Routing

**File**: `/Frontend/src/app/app.routes.ts` or `/Frontend/src/app/pages/instructor/instructor-routes.ts`

Add route:

```typescript
{
  path: 'create-course-wizard',
  component: CourseCreationWizardComponent,
  canActivate: [AuthGuard, RolesGuard],
  data: { roles: ['INSTRUCTOR'] }
}
```

**Action Required**:

- [ ] Add course wizard route to your routing configuration
- [ ] Ensure it's under instructor section and protected by auth guards

### 6. Update Instructor Sidebar Navigation

**File**: `/Frontend/src/app/pages/instructor/instructor-sidebar/instructor-sidebar.component.ts`

Update "Create Course" menu item to point to new wizard:

```typescript
{
  label: 'Create Course',
  icon: 'add_circle',
  routerLink: '/instructor/create-course-wizard'  // Updated path
}
```

**Action Required**:

- [ ] Update sidebar navigation to use new course wizard route

### 7. Update My Courses Component (Already Done in Phase 4)

**File**: `/Frontend/src/app/pages/instructor/my-courses/my-courses.component.ts`

Verify it:

- [x] Fetches courses from `/courses/my` endpoint
- [x] Subscribes to CourseRefreshService.courseCreated$
- [x] Auto-reloads courses when new course is created

**Action Required**:

- [ ] Verify My Courses component has refresh subscription

### 8. Tailwind Configuration (Already Complete)

Verify `/Frontend/tailwind.config.ts` includes all utility classes used in wizard component.

**Action Required**:

- [ ] No action if using standard Tailwind
- [ ] If custom config, ensure responsive classes (md:grid, md:cols, etc.) are enabled

---

## Testing

### Backend Tests

#### 1. Service Tests

**File**: `/backend/src/courses/courses.service.v2.spec.ts`

```typescript
describe("CoursesServiceV2", () => {
	let service: CoursesServiceV2;
	let prisma: PrismaService;

	beforeEach(() => {
		// Mock implementations
	});

	it("should create course in draft status", async () => {
		// Test implementation
	});

	it("should auto-save draft without publishing", async () => {
		// Test implementation
	});

	it("should publish course and create version", async () => {
		// Test implementation
	});

	it("should prevent unauthorized course updates", async () => {
		// Test implementation
	});
});
```

**Action Required**:

- [ ] Create comprehensive unit tests for CoursesServiceV2
- [ ] Create tests for CourseVersionService
- [ ] Create tests for FileUploadService

#### 2. Controller Tests

**File**: `/backend/test/courses.e2e-spec.ts`

Test complete flows:

- Course creation → draft auto-save → publish
- File uploads with validation
- Version history tracking
- Authorization checks

**Action Required**:

- [ ] Create E2E tests for course creation workflow

### Frontend Tests

#### 1. Component Tests

**File**: `/Frontend/src/app/pages/instructor/create-course-wizard/create-course-wizard.component.spec.ts`

```typescript
describe('CourseCreationWizardComponent', () => {
  let component: CourseCreationWizardComponent;
  let fixture: ComponentFixture<CourseCreationWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCreationWizardComponent],
      providers: [ApiService, InstructorService, CourseRefreshService]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCreationWizardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should advance to next step on validation', () => {
    // Test implementation
  });

  it('should auto-save draft every 30 seconds', fakeAsync(() => {
    // Test implementation
  });

  it('should upload thumbnail and video', () => {
    // Test implementation
  });
});
```

**Action Required**:

- [ ] Create unit tests for CourseCreationWizardComponent
- [ ] Test each step's validation
- [ ] Test auto-save functionality
- [ ] Test file upload

#### 2. E2E Tests

**File**: `/Frontend/e2e/course-creation.e2e-spec.ts`

```typescript
describe("Course Creation Wizard E2E", () => {
	it("should create and publish course successfully", () => {
		// Navigate to wizard
		// Fill step 1
		// Go to step 2
		// Upload files
		// Go to step 3
		// Set pricing
		// Go to step 4
		// Publish
		// Verify course appears in My Courses
	});
});
```

**Action Required**:

- [ ] Create E2E tests for complete course creation flow

---

## Deployment Steps

### 1. Backend Deployment

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Run migrations
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Build
npm run build

# 5. Deploy (using your CI/CD pipeline)
# Example:
# - Push to main branch
# - GitHub Actions/GitLab CI runs: npm run build && npm test
# - Deploy to production server
```

**Action Required**:

- [ ] Run Prisma migrations in production
- [ ] Verify all new endpoints are accessible
- [ ] Test file uploads in production

### 2. Frontend Deployment

```bash
# 1. Install dependencies
cd Frontend
npm install

# 2. Build for production
npm run build

# 3. Deploy (using your CI/CD pipeline)
# Build output goes to dist/
```

**Action Required**:

- [ ] Build and deploy frontend
- [ ] Verify course wizard routes work
- [ ] Test API calls to new endpoints

### 3. Create Upload Directories

```bash
# SSH into production server
ssh user@server

# Create directories
mkdir -p /var/www/app/uploads/{thumbnails,videos,attachments/{assignment,module,resource}}
chmod 755 /var/www/app/uploads
chmod 755 /var/www/app/uploads/thumbnails
chmod 755 /var/www/app/uploads/videos
chmod 755 /var/www/app/uploads/attachments
chmod 755 /var/www/app/uploads/attachments/{assignment,module,resource}
```

**Action Required**:

- [ ] Create upload directories with proper permissions
- [ ] Configure web server to serve static files from uploads

### 4. Environment Configuration

```bash
# Update .env on production server
UPLOAD_PATH=/var/www/app/uploads
MAX_THUMBNAIL_SIZE=5242880
MAX_VIDEO_SIZE=524288000
DATABASE_URL=your-production-db-url
JWT_SECRET=your-secret
```

**Action Required**:

- [ ] Set environment variables on production server

---

## Verification Checklist

### Backend Verification

- [ ] All new services created and exported from module
- [ ] All new controllers registered in module
- [ ] Database migrations run successfully
- [ ] Upload directories created with correct permissions
- [ ] API endpoints returning 200/201 responses
- [ ] Authorization working (403 on unauthorized access)
- [ ] File uploads working with size/type validation
- [ ] Version history being tracked
- [ ] No database errors in logs

### Frontend Verification

- [ ] Course types defined
- [ ] Instructor service has new methods
- [ ] Routing configured for wizard
- [ ] Sidebar navigation updated
- [ ] Wizard component loads without errors
- [ ] Form validation working
- [ ] Auto-save functioning (check network tab)
- [ ] File uploads working
- [ ] New courses appear in My Courses after publish
- [ ] No console errors

### Integration Verification

- [ ] Create course in wizard → saves as draft
- [ ] Draft auto-save every 30 seconds
- [ ] Can navigate between steps
- [ ] File uploads with preview
- [ ] Publish course → appears in My Courses
- [ ] Version history recorded for all changes
- [ ] Course refresh service notifies components
- [ ] Dashboard refreshes automatically

---

## Rollback Plan (If Needed)

```bash
# 1. Rollback database (Prisma)
npx prisma migrate resolve --rolled-back add_course_production_fields

# 2. Revert backend code
git checkout main src/courses/

# 3. Revert frontend code
cd Frontend
git checkout main

# 4. Restart services
npm run start
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Course not found" errors
**Solution**: Verify database migrations ran successfully: `npx prisma migrate status`

**Issue**: File upload fails with 413
**Solution**: Increase payload size limit in `main.ts`: `express.json({ limit: '50mb' })`

**Issue**: CORS errors on file upload
**Solution**: Ensure CORS is enabled in `main.ts` and includes frontend origin

**Issue**: Auto-save not triggering
**Solution**: Check browser console for errors, verify API endpoint returns 200

**Issue**: New course not appearing in My Courses
**Solution**: Verify CourseRefreshService subscription is active in My Courses component

---

## Completion Status

- [x] Backend services created (CoursesServiceV2, CourseVersionService, FileUploadService)
- [x] Backend controllers created (CoursesControllerV2)
- [x] DTOs defined (Create, Update, Archive)
- [x] Database schema updated (Course, CourseVersion models)
- [x] Frontend wizard component created (4-step form)
- [ ] Services registered in backend module (TODO - needs manual update)
- [ ] Routing configured for wizard (TODO - needs manual update)
- [ ] Database migrations applied (TODO - run in production)
- [ ] Upload directories created (TODO - create on filesystem)
- [ ] Environment variables configured (TODO - add to .env)
- [ ] Tests written and passing (TODO - create test files)
- [ ] Documentation complete (DONE)

**Total Completion**: 60% - Backend architecture complete, frontend UI complete, integration and deployment remaining
