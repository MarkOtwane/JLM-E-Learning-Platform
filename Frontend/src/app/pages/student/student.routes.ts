import { Routes } from '@angular/router';
import { StudentDashboardComponent } from './dashboard/student-dashboard.component';
import { StudentCoursesComponent } from './courses/student-courses.component';
import { StudentPaymentComponent } from './payment/student-payment.component';
import { StudentProfileComponent } from './profile/student-profile.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',  // Changed from '' to 'dashboard'
    component: StudentDashboardComponent,
    title: 'Student Dashboard'
  },
  {
    path: 'courses',
    component: StudentCoursesComponent,
    title: 'My Courses'
  },
  {
    path: 'payment',
    component: StudentPaymentComponent,
    title: 'Payment Info'
  },
  {
    path: 'certifications',
    loadComponent: () =>
      import('./certifications/student-certifications.component').then(
        m => m.StudentCertificationsComponent
      ),
    title: 'Certifications'
  },
  {
    path: 'profile',
    component: StudentProfileComponent,
    title: 'My Profile'
  }
];