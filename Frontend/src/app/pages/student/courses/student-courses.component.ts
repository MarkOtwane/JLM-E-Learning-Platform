import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface Course {
  id: string;
  title: string;
  instructor?: string;
  progress?: number;
}

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-courses.component.html',
  styleUrls: ['./student-courses.component.css'],
})
export class StudentCoursesComponent implements OnInit {
  allCourses: Course[] = [];
  enrolledCourses: Course[] = [];
  isLoading = false;
  enrolling: string | null = null;

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.apiService.getAuth<Course[]>('/students/courses').subscribe({
      next: (enrolled) => {
        this.enrolledCourses = enrolled;
        this.apiService.getAuth<Course[]>('/courses').subscribe({
          next: (all) => {
            this.allCourses = all;
            this.isLoading = false;
          },
          error: () => {
            this.allCourses = [];
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.enrolledCourses = [];
        this.isLoading = false;
      },
    });
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourses.some((c) => c.id === courseId);
  }

  enroll(courseId: string) {
    this.enrolling = courseId;
    this.apiService.postAuth('/students/enroll', { courseId }).subscribe({
      next: () => {
        // Refresh enrolled courses
        this.apiService.getAuth<Course[]>('/students/courses').subscribe({
          next: (enrolled) => {
            this.enrolledCourses = enrolled;
            this.enrolling = null;
          },
          error: () => {
            this.enrolling = null;
          },
        });
      },
      error: () => {
        this.enrolling = null;
      },
    });
  }

  continueCourse(courseId: string) {
    this.router.navigate(['/learning/course', courseId]);
  }

  dropCourse(courseId: string) {
    this.enrolledCourses = this.enrolledCourses.filter(
      (c) => c.id !== courseId
    );
    // TODO: Add logic to notify backend and reset progress
  }
}
