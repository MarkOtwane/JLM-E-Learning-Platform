import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CourseRefreshService } from '../../../services/course-refresh.service';
import { InstructorService } from '../../../services/instructor.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>My Courses</h1>
        <button class="btn-primary" routerLink="/instructor/create-course">
          <i class="fas fa-plus"></i>
          Create New Course
        </button>
      </div>

      @if (isLoading) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading courses...</p>
        </div>
      }

      @if (!isLoading && courses.length > 0) {
        <div class="courses-grid">
          @for (course of courses; track course.id) {
            <div class="course-card">
              <div class="course-header">
                <h3>{{ course.title }}</h3>
                <span class="course-status">Published</span>
              </div>
              <p class="course-description">{{ course.description }}</p>
              <div class="course-stats">
                <span
                  ><i class="fas fa-users"></i>
                  {{ course.totalStudents || 0 }} students</span
                >
                <span
                  ><i class="fas fa-book"></i>
                  {{ course.totalModules || 0 }} modules</span
                >
              </div>
              <div class="course-actions">
                <button
                  class="btn-secondary"
                  [routerLink]="['/instructor/edit-course', course.id]"
                >
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button
                  class="btn-secondary"
                  [routerLink]="['/instructor/courses', course.id, 'students']"
                >
                  <i class="fas fa-users"></i> Students
                </button>
                <button
                  class="btn-secondary"
                  [routerLink]="['/instructor/courses', course.id, 'assignments']"
                >
                  <i class="fas fa-tasks"></i> Assignments
                </button>
                <button
                  class="btn-secondary"
                  [routerLink]="['/instructor/courses', course.id, 'analytics']"
                >
                  <i class="fas fa-chart-bar"></i> Analytics
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (!isLoading && courses.length === 0) {
        <div class="empty-state">
          <i class="fas fa-book"></i>
          <h2>No Courses Yet</h2>
          <p>Start by creating your first course</p>
          <button class="btn-primary" routerLink="/instructor/create-course">
            <i class="fas fa-plus"></i>
            Create Course
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 2rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .page-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
      }

      .btn-primary {
        background: #4f46e5;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-primary:hover {
        background: #4338ca;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      .loading {
        text-align: center;
        padding: 4rem;
        color: #6b7280;
      }

      .loading i {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .courses-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .course-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }

      .course-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 0.5rem;
      }

      .course-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        margin: 0;
      }

      .course-status {
        background: #10b981;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        text-transform: uppercase;
      }

      .course-description {
        color: #6b7280;
        margin-bottom: 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .course-stats {
        display: flex;
        gap: 1rem;
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .course-stats span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .course-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .empty-state {
        text-align: center;
        padding: 4rem;
        background: white;
        border-radius: 0.75rem;
        border: 2px dashed #e5e7eb;
      }

      .empty-state i {
        font-size: 4rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .empty-state h2 {
        font-size: 1.5rem;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .empty-state p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }
    `,
  ],
})
export class MyCoursesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courses: any[] = [];
  isLoading = true;

  constructor(
    private instructorService: InstructorService,
    private router: Router,
    private courseRefreshService: CourseRefreshService,
  ) {}

  ngOnInit(): void {
    // Listen for course creation events and refresh courses
    this.courseRefreshService.courseCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCourses();
      });
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourses(): void {
    this.instructorService
      .getCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses: any[]) => {
          this.courses = courses;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load courses', err);
          this.isLoading = false;
        },
      });
  }
}
