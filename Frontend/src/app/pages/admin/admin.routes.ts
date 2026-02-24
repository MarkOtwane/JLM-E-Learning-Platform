import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminStudentsComponent } from './students/admin-students.component';
import { AdminInstructorsComponent } from './instructors/admin-instructors.component';
import { AdminCoursesComponent } from './courses/admin-courses.component';
import { AdminPendingInstructorsComponent } from './pending-instructors/admin-pending-instructors.component';
import { AdminMessagesComponent } from './messages/admin-messages.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
      },
      {
        path: 'pending-instructors',
        component: AdminPendingInstructorsComponent,
      },
      {
        path: 'students',
        component: AdminStudentsComponent,
      },
      {
        path: 'instructors',
        component: AdminInstructorsComponent,
      },
      {
        path: 'courses',
        component: AdminCoursesComponent,
      },
      {
        path: 'messages',
        component: AdminMessagesComponent,
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];