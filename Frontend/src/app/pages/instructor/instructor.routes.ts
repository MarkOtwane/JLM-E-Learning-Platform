import { Routes } from '@angular/router';

export const INSTRUCTOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/instructor-dashboard.component').then(
        m => m.InstructorDashboardComponent
      )
  },
  // Uncomment this if you add instructor-my-courses.component
  // {
  //   path: 'courses',
  //   loadComponent: () =>
  //     import('./my-courses/instructor-my-courses.component').then(
  //       m => m.InstructorMyCoursesComponent
  //     )
  // },
  {
    path: 'create-course',
    loadComponent: () =>
      import('./create-course/create-course.component').then(
        m => m.CreateCourseComponent
      )
  },
  {
    path: 'build-course',
    loadComponent: () =>
      import('./course-content-builder/course-content-builder.component').then(
        m => m.CourseContentBuilderComponent
      )
  }
];
