import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InstructorService } from '../../../services/instructor.service';
import { AuthService } from '../../../services/auth.service';

interface CourseMetrics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  avgProgress: number;
  avgQuizScore: number;
  completionRate: number;
  pendingAssignments: number;
  lastActivity: string;
}

interface DashboardMetrics {
  totalCourses: number;
  totalStudents: number;
  courses: CourseMetrics[];
}

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  instructorName: string = '';
  instructorEmail: string = '';
  
  // Dashboard metrics
  totalCourses: number = 0;
  totalStudents: number = 0;
  totalEarnings: number = 0;
  pendingAssignments: number = 0;
  averageCompletionRate: number = 0;
  
  // Course data
  courses: any[] = [];
  recentActivity: string[] = [];
  isLoading: boolean = true;
  
  // View mode
  viewMode: 'cards' | 'table' = 'cards';

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
    private instructorService: InstructorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.instructorEmail = user.email;
          this.instructorName = user.firstName || user.email;
          this.cdr.markForCheck();
        }
      });
    
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    this.instructorService.getDashboardMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DashboardMetrics) => {
          this.totalCourses = data.totalCourses;
          this.totalStudents = data.totalStudents;
          this.courses = data.courses || [];
          
          // Calculate aggregate metrics
          this.pendingAssignments = this.courses.reduce(
            (sum, c) => sum + (c.pendingAssignments || 0), 0
          );
          this.averageCompletionRate = this.courses.length > 0
            ? Math.round(this.courses.reduce((sum, c) => sum + (c.completionRate || 0), 0) / this.courses.length)
            : 0;
          
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load instructor dashboard data', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    
    // Mock earnings data (would come from payment service in production)
    this.totalEarnings = 4200;
  }

  // Quick Actions
  goToCreateCourse(): void {
    this.router.navigate(['/instructor/create-course']);
  }

  editCourse(courseId: string): void {
    this.router.navigate([`/instructor/edit-course/${courseId}`]);
  }

  viewStudents(courseId: string): void {
    this.router.navigate([`/instructor/courses/${courseId}/students`]);
  }

  viewAnalytics(courseId: string): void {
    this.router.navigate([`/instructor/courses/${courseId}/analytics`]);
  }

  createLesson(courseId: string): void {
    this.router.navigate([`/instructor/courses/${courseId}/lessons/create`]);
  }

  deleteCourse(courseId: string): void {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      // API call would go here
      this.courses = this.courses.filter((c) => c.courseId !== courseId);
      this.totalCourses = this.courses.length;
      this.cdr.markForCheck();
    }
  }

  // Calendar methods
  addActivity(): void {
    if (!this.selectedDate || !this.activityText.trim()) return;
    if (!this.calendarActivities[this.selectedDate]) {
      this.calendarActivities[this.selectedDate] = [];
    }
    this.calendarActivities[this.selectedDate].push(this.activityText.trim());
    this.activityText = '';
  }

  startEditActivity(index: number, text: string): void {
    this.editIndex = index;
    this.editText = text;
  }

  saveEditActivity(index: number): void {
    if (this.selectedDate && this.editText.trim()) {
      this.calendarActivities[this.selectedDate][index] = this.editText.trim();
    }
    this.editIndex = null;
    this.editText = '';
  }

  cancelEditActivity(): void {
    this.editIndex = null;
    this.editText = '';
  }

  deleteActivity(index: number): void {
    if (this.selectedDate && this.calendarActivities[this.selectedDate]) {
      this.calendarActivities[this.selectedDate].splice(index, 1);
      if (this.calendarActivities[this.selectedDate].length === 0) {
        delete this.calendarActivities[this.selectedDate];
      }
    }
    this.cancelEditActivity();
  }

  // Utility methods
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'var(--color-success, #10b981)';
    if (progress >= 50) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }
}
