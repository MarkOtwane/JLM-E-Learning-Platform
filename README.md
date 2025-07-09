# JLM E-Learning Platform

A full-stack, modern e-learning platform for students, instructors, and administrators. Built with Angular (frontend) and NestJS (backend), it supports course management, instructor approval, student progress tracking, quizzes, payments, and more.

---

## Features

### For Students

-    Browse and enroll in courses
-    Track learning progress and earn certificates
-    Take quizzes and view results
-    Download certificates upon course completion
-    Update profile and upload profile picture

### For Instructors

-    Register and await admin approval before accessing dashboard
-    Create, update, and manage courses and modules
-    Upload course content (videos, PDFs, etc.)
-    Track student enrollments and progress
-    View analytics for courses

### For Admins

-    Approve or reject instructor applications
-    Manage users (students, instructors)
-    View platform statistics (users, courses, earnings, etc.)
-    Manage all courses and content
-    Issue and manage certificates

### General

-    Secure authentication and role-based access
-    Email notifications for registration, approval, and certificates
-    Responsive, modern UI/UX

---

## Tech Stack

-    **Frontend:** Angular 16+, TypeScript, RxJS, Angular Material (optional)
-    **Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL
-    **Database:** PostgreSQL (see `backend/prisma/schema.prisma`)
-    **Other:** JWT Auth, REST API, file uploads, email notifications

---

## Getting Started

### Prerequisites

-    Node.js (v18+ recommended)
-    npm (v9+)
-    PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/JLM-E-Learning-Platform.git
cd JLM-E-Learning-Platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

-    Configure your database in `.env` (see `prisma/schema.prisma` for models).
-    Run migrations and seed data:

```bash
npx prisma migrate deploy
npx prisma db seed
```

-    Start the backend server:

```bash
npm run start:dev
```

The backend runs on `http://localhost:3000/` by default.

### 3. Frontend Setup

```bash
cd ../Frontend
npm install
```

-    Start the Angular development server:

```bash
ng serve
```

The frontend runs on `http://localhost:4200/` by default.

---

## Project Structure

```
JLM-E-Learning-Platform/
  backend/      # NestJS API, Prisma, business logic
  Frontend/     # Angular app, UI, services
```

### Backend Highlights

-    `src/auth/` - Authentication, registration, login, JWT
-    `src/admin/` - Admin controllers and services
-    `src/instructor/` - Instructor analytics and dashboard
-    `src/courses/` - Course CRUD, modules, content
-    `src/student/` - Student progress, enrollments
-    `src/quizzes/` - Quiz and question management
-    `src/payment/` - Payment integration (Stripe, Mpesa, etc.)
-    `src/certificate/` - Certificate generation and management
-    `prisma/` - Database schema and migrations

### Frontend Highlights

-    `src/app/pages/home/` - Home/landing page
-    `src/app/pages/auth/` - Login, register, under-review, etc.
-    `src/app/pages/courses/` - Course catalog and details
-    `src/app/pages/student/` - Student dashboard, profile, certifications
-    `src/app/pages/instructor/` - Instructor dashboard, course builder
-    `src/app/pages/admin/` - Admin dashboard, user/course management
-    `src/app/shared/` - Shared components (navbar, footer, notifications)

---

## Database

-    See `backend/prisma/schema.prisma` for all models and relationships.
-    Run migrations with `npx prisma migrate deploy`.
-    Seed initial data with `npx prisma db seed`.

---

## Testing

### Backend

```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend

```bash
cd Frontend
ng test
```

---

## Deployment

-    Backend: Deploy as a Node.js app (see NestJS docs for deployment options).
-    Frontend: Build with `ng build` and deploy the static files to your preferred host.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT

---

## Contact

For questions, support, or contributions, open an issue or contact the maintainers.
