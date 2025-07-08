import { Routes } from '@angular/router';
import { ADMIN_ROUTES } from './pages/admin/admin.routes'; // ✅ Import Admin routes
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { HomeComponent } from './pages/home/home.component';
import { INSTRUCTOR_ROUTES } from './pages/instructor/instructor.routes';
import { LEARNING_ROUTES } from './pages/learning/learning.routes';
import { STUDENT_ROUTES } from './pages/student/student.routes';
import { AdminAuthGuard } from './services/admin-auth.guard';
import { NavbarComponent } from './shared/navbar/navbar.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'navbar', component: NavbarComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'courses', component: CoursesComponent },
  {
    path: 'test-connection',
    loadComponent: () =>
      import('./test-connection/test-connection.component').then(
        (m) => m.TestConnectionComponent
      ),
  },

  {
    path: 'pending',
    loadComponent: () =>
      import('./pages/auth/pending/pending.component').then(
        (m) => m.PendingComponent
      ),
  },
  {
    path: 'under-review',
    loadComponent: () =>
      import('./pages/auth/under-review/under-review.component').then(
        (m) => m.UnderReviewComponent
      ),
  },

  {
    path: 'student',
    loadComponent: () =>
      import('./pages/student/layout/student-layout.component').then(
        (m) => m.StudentLayoutComponent
      ),
    children: STUDENT_ROUTES,
  },
  {
    path: 'instructor',
    loadComponent: () =>
      import('./pages/instructor/layout/instructor-layout.component').then(
        (m) => m.InstructorLayoutComponent
      ),
    children: INSTRUCTOR_ROUTES,
  },
  {
    path: 'admin',
    canActivate: [AdminAuthGuard],
    loadComponent: () =>
      import('./pages/admin/layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: ADMIN_ROUTES,
  },
  {
    path: 'learning',
    children: LEARNING_ROUTES,
  },
  {
    path: 'debug',
    loadComponent: () =>
      import('./debug-page.component').then((m) => m.DebugPageComponent),
  },
];
