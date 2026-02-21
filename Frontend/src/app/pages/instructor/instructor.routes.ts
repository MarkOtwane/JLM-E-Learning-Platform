import { Routes } from '@angular/router';

export const INSTRUCTOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/instructor-dashboard.component').then(
        m => m.InstructorDashboardComponent
      )
  },
  {
    path: 'create-course',
    loadComponent: () =>
      import('./create-course/create-course.component').then(
        m => m.CreateCourseComponent
      )
  },
  {
    path: 'edit-course/:courseId',
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
  },
  {
    path: 'courses/:courseId/students',
    loadComponent: () =>
      import('./students/course-students.component').then(
        m => m.CourseStudentsComponent
      )
  },
  {
    path: 'courses/:courseId/assignments',
    loadComponent: () =>
      import('./assignments/assignments.component').then(
        m => m.AssignmentsComponent
      )
  },
  {
    path: 'courses/:courseId/analytics',
    loadComponent: () =>
      import('./analytics/analytics.component').then(
        m => m.AnalyticsComponent
      )
  },
  {
    path: 'courses/:courseId/lessons/create',
    loadComponent: () =>
      import('./lesson-editor/lesson-editor.component').then(
        m => m.LessonEditorComponent
      )
  },
  {
    path: 'courses/:courseId/lessons/:lessonId/edit',
    loadComponent: () =>
      import('./lesson-editor/lesson-editor.component').then(
        m => m.LessonEditorComponent
      )
  }
];
