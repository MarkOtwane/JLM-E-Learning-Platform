import { inject } from '@angular/core';
import { CanActivateFn, Routes } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentCoursesComponent } from './courses/student-courses.component';
import { StudentDashboardComponent } from './dashboard/student-dashboard.component';
import { StudentPaymentComponent } from './payment/student-payment.component';
import { StudentProfileComponent } from './profile/student-profile.component';

// Async canActivate function for student routes
const studentAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return new Promise<boolean>((resolve) => {
    const sub = auth.user$.subscribe((user) => {
      if (user && user.role === 'student') {
        resolve(true);
      } else {
        window.location.href = '/login';
        resolve(false);
      }
      sub.unsubscribe();
    });
  });
};

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: StudentDashboardComponent,
    title: 'Student Dashboard',
    canActivate: [studentAuthGuard],
  },
  {
    path: 'courses',
    component: StudentCoursesComponent,
    title: 'My Courses',
    // Courses page is public for browsing
  },
  {
    path: 'payment',
    component: StudentPaymentComponent,
    title: 'Payment Info',
    canActivate: [studentAuthGuard],
  },
  {
    path: 'certifications',
    loadComponent: () =>
      import('./certifications/student-certifications.component').then(
        (m) => m.StudentCertificationsComponent
      ),
    title: 'Certifications',
    canActivate: [studentAuthGuard],
  },
  {
    path: 'profile',
    component: StudentProfileComponent,
    title: 'My Profile',
    canActivate: [studentAuthGuard],
  },
];
