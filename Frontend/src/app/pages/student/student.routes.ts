import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/new-dashboard/new-dashboard.component').then(
        m => m.NewDashboardComponent
      ),
    title: 'Dashboard'
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./courses/student-courses.component').then(
        m => m.StudentCoursesComponent
      ),
    title: 'My Courses'
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./pages/catalog/catalog.component').then(
        m => m.CatalogComponent
      ),
    title: 'Course Catalog'
  },
  {
    path: 'certifications',
    loadComponent: () =>
      import('./certifications/student-certifications.component').then(
        m => m.StudentCertificationsComponent
      ),
    title: 'Certificates'
  },
  {
    path: 'assignments',
    loadComponent: () =>
      import('./pages/assignments/assignments.component').then(
        m => m.AssignmentsComponent
      ),
    title: 'Assignments'
  },
  {
    path: 'exams',
    loadComponent: () =>
      import('./pages/exams/exams.component').then(
        m => m.ExamsComponent
      ),
    title: 'Exams'
  },
  {
    path: 'live-classes',
    loadComponent: () =>
      import('./pages/live-classes/live-classes.component').then(
        m => m.LiveClassesComponent
      ),
    title: 'Live Classes'
  },
  {
    path: 'messages',
    loadComponent: () =>
      import('./pages/messages/messages.component').then(
        m => m.MessagesComponent
      ),
    title: 'Messages'
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/notifications/notifications.component').then(
        m => m.NotificationsComponent
      ),
    title: 'Notifications'
  },
  {
    path: 'payment',
    loadComponent: () =>
      import('./payment/student-payment.component').then(
        m => m.StudentPaymentComponent
      ),
    title: 'Payments'
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/student-profile.component').then(
        m => m.StudentProfileComponent
      ),
    title: 'Profile'
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then(
        m => m.SettingsComponent
      ),
    title: 'Settings'
  },
  {
    path: 'help',
    loadComponent: () =>
      import('./pages/help/help.component').then(
        m => m.HelpComponent
      ),
    title: 'Help & Support'
  }
];
