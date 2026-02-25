import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CourseRefreshService } from '../../../services/course-refresh.service';
import { InstructorService } from '../../../services/instructor.service';

interface CourseMetrics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  avgProgress: number;
  avgQuizScore: number;
  completionRate: number;
  pendingAssignments: number;
  lastActivity: string;
  isPremium?: boolean;
}

interface DashboardMetrics {
  totalCourses: number;
  totalStudents: number;
  courses: CourseMetrics[];
}

interface TrendData {
  value: number;
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  label: string;
}

interface MetricCard {
  icon: string;
  iconBgClass: string;
  value: number | string;
  label: string;
  trend?: TrendData;
  format?: 'number' | 'currency' | 'percentage';
  isWarning?: boolean;
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

  // Metric cards for the new design
  metricCards: MetricCard[] = [];

  // Course data
  courses: CourseMetrics[] = [];
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

  // Math reference for template
  Math = Math;

  constructor(
    private authService: AuthService,
    private router: Router,
    private instructorService: InstructorService,
    private cdr: ChangeDetectorRef,
    private courseRefreshService: CourseRefreshService,
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.instructorEmail = user.email;
        this.instructorName = user.firstName || user.email;
        this.cdr.markForCheck();
      }
    });
    // Listen for course creation events and refresh dashboard
    this.courseRefreshService.courseCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });

    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    this.instructorService
      .getDashboardMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DashboardMetrics) => {
          this.totalCourses = data.totalCourses;
          this.totalStudents = data.totalStudents;
          this.courses = data.courses || [];

          // Calculate aggregate metrics
          this.pendingAssignments = this.courses.reduce(
            (sum, c) => sum + (c.pendingAssignments || 0),
            0,
          );
          this.averageCompletionRate =
            this.courses.length > 0
              ? Math.round(
                  this.courses.reduce(
                    (sum, c) => sum + (c.completionRate || 0),
                    0,
                  ) / this.courses.length,
                )
              : 0;

          // Build metric cards
          this.buildMetricCards();

          // Generate sample recent activity
          this.generateRecentActivity();

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load instructor dashboard data', err);
          this.isLoading = false;
          this.buildMetricCards(); // Build with default values
          this.cdr.markForCheck();
        },
      });

    // Mock earnings data (would come from payment service in production)
    this.totalEarnings = 4200;
  }

  private buildMetricCards(): void {
    this.metricCards = [
      {
        icon: 'fa-book',
        iconBgClass: 'courses',
        value: this.totalCourses,
        label: 'Total Courses',
        format: 'number',
        trend: this.buildTrendData(
          this.generateGrowthPercentage(),
          'vs last month',
        ),
      },
      {
        icon: 'fa-users',
        iconBgClass: 'students',
        value: this.totalStudents,
        label: 'Total Enrollments',
        format: 'number',
        trend: this.buildTrendData(
          this.generateGrowthPercentage(),
          'vs last week',
        ),
      },
      {
        icon: 'fa-chart-pie',
        iconBgClass: 'completion',
        value: this.averageCompletionRate,
        label: 'Avg. Completion Rate',
        format: 'percentage',
        trend: this.buildTrendData(
          this.generateGrowthPercentage(),
          'vs last month',
        ),
      },
      {
        icon: 'fa-clipboard-list',
        iconBgClass: 'pending',
        value: this.pendingAssignments,
        label: 'Pending Reviews',
        format: 'number',
        isWarning: this.pendingAssignments > 0,
        trend:
          this.pendingAssignments > 0
            ? {
                value: this.pendingAssignments,
                trend: 'up',
                percentage: 0,
                label: 'Needs Review',
              }
            : { value: 0, trend: 'neutral', percentage: 0, label: 'All Clear' },
      },
    ];
  }

  private buildTrendData(percentage: number, label: string): TrendData {
    let trend: 'up' | 'down' | 'neutral';
    if (percentage > 0) {
      trend = 'up';
    } else if (percentage < 0) {
      trend = 'down';
    } else {
      trend = 'neutral';
    }
    return {
      value: percentage,
      trend,
      percentage: Math.abs(percentage),
      label,
    };
  }

  private generateGrowthPercentage(): number {
    // Generate a random growth percentage between -5 and 25
    return Math.round((Math.random() * 30 - 5) * 10) / 10;
  }

  private generateRecentActivity(): void {
    this.recentActivity = [];

    if (this.pendingAssignments > 0) {
      this.recentActivity.push(
        `${this.pendingAssignments} assignment${this.pendingAssignments > 1 ? 's' : ''} awaiting review`,
      );
    }

    if (this.totalStudents > 0) {
      this.recentActivity.push('New student enrollments this week');
    }

    if (this.totalCourses > 0) {
      this.recentActivity.push('Course content recently updated');
    }

    // Add some generic activities
    this.recentActivity.push('Platform activity recorded');
  }

  formatValue(value: number | string, format?: 'number' | 'currency' | 'percentage'): string {
    if (typeof value === 'string') return value;

    if (format === 'currency') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (format === 'percentage') {
      return `${value}%`;
    }

    return value.toLocaleString('en-US');
  }

  getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
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
    // Navigate to course content builder where modules are managed
    this.router.navigate(['/instructor/build-course'], {
      queryParams: { courseId },
    });
  }

  deleteCourse(courseId: string): void {
    if (
      confirm(
        'Are you sure you want to delete this course? This action cannot be undone.',
      )
    ) {
      // API call would go here
      this.courses = this.courses.filter((c) => c.courseId !== courseId);
      this.totalCourses = this.courses.length;
      this.buildMetricCards();
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
      year: 'numeric',
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
