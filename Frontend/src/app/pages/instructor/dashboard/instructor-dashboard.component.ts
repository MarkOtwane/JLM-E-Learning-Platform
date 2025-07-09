import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css'],
  imports: [FormsModule, CommonModule],
})
export class InstructorDashboardComponent implements OnInit {
  instructorName: string = '';
  instructorEmail: string = '';
  courseCount: number = 0;
  totalStudents: number = 0;
  totalEarnings: number = 0;
  recentActivity: string[] = [];
  courses: any[] = [];

  // Calendar activity properties
  selectedDate: string = '';
  activityText: string = '';
  calendarActivities: { [date: string]: string[] } = {};

  // Editing state for activities
  editIndex: number | null = null;
  editText: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.instructorEmail = user.email;
        this.instructorName = user.firstName || user.email;
      }
    });
    // Fetch instructor metrics from backend
    this.apiService.getAuth('/instructors/dashboard').subscribe({
      next: (data: any) => {
        this.courseCount = data.totalCourses;
        this.totalStudents = data.totalStudents;
        this.courses = data.courses || [];
        // Use real recent activities if provided by backend
        this.recentActivity = data.recentActivity || [
          'Published "Intro to Web Development"',
          'Updated lesson content for "Angular Basics"',
          'New enrollment in "Node.js API Design"',
          'Student review posted on "TypeScript Essentials"',
        ];
      },
      error: (err) => {
        console.error('Failed to load instructor dashboard data', err);
      },
    });
    // These values would eventually come from the backend
    this.totalEarnings = 4200;
  }

  goToCreateCourse(): void {
    this.router.navigate(['/instructor/create-course']);
  }

  deleteCourse(courseId: string) {
    if (
      confirm(
        'Are you sure you want to delete this course? This action cannot be undone.'
      )
    ) {
      this.apiService.deleteAuth(`/courses/${courseId}`).subscribe({
        next: () => {
          this.courses = this.courses.filter((c) => c.courseId !== courseId);
          this.courseCount = this.courses.length;
          // Optionally, refresh dashboard data from backend
        },
        error: (err) => {
          console.error('Failed to delete course.', err);
        },
      });
    }
  }

  editCourse(courseId: string) {
    this.router.navigate([`/instructor/edit-course/${courseId}`]);
  }

  addActivity() {
    if (!this.selectedDate || !this.activityText.trim()) return;
    if (!this.calendarActivities[this.selectedDate]) {
      this.calendarActivities[this.selectedDate] = [];
    }
    this.calendarActivities[this.selectedDate].push(this.activityText.trim());
    this.activityText = '';
  }

  startEditActivity(index: number, text: string) {
    this.editIndex = index;
    this.editText = text;
  }

  saveEditActivity(index: number) {
    if (this.selectedDate && this.editText.trim()) {
      this.calendarActivities[this.selectedDate][index] = this.editText.trim();
    }
    this.editIndex = null;
    this.editText = '';
  }

  cancelEditActivity() {
    this.editIndex = null;
    this.editText = '';
  }

  deleteActivity(index: number) {
    if (this.selectedDate && this.calendarActivities[this.selectedDate]) {
      this.calendarActivities[this.selectedDate].splice(index, 1);
      if (this.calendarActivities[this.selectedDate].length === 0) {
        delete this.calendarActivities[this.selectedDate];
      }
    }
    this.cancelEditActivity();
  }
}
