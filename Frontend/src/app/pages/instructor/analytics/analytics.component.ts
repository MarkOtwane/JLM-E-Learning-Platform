import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InstructorService } from '../../../services/instructor.service';
import { MaxPipe } from '../../../pipes/max.pipe';
import { MaxItemPipe } from '../../../pipes/max-item.pipe';

interface EnrollmentTrend {
  month: string;
  count: number;
}

interface QuizDistribution {
  range: string;
  count: number;
}

interface LessonDropOff {
  lessonId: string;
  title: string;
  order: number;
  totalViews: number;
  completions: number;
  dropOffRate: number;
}

interface Analytics {
  enrollmentTrends: EnrollmentTrend[];
  quizPerformanceDistribution: QuizDistribution[];
  lessonDropOff: LessonDropOff[];
  completionRate: number;
  totalEnrollments: number;
  totalCompletions: number;
}

@Component({
  selector: 'app-course-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, MaxPipe, MaxItemPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courseId: string = '';
  courseTitle: string = '';
  analytics: Analytics | null = null;
  isLoading: boolean = true;

  // Chart data
  enrollmentChartData: any = null;
  quizChartData: any = null;

  // View options
  activeTab: 'overview' | 'enrollments' | 'quizzes' | 'lessons' = 'overview';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private instructorService: InstructorService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    if (this.courseId) {
      this.loadAnalytics();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnalytics(): void {
    this.isLoading = true;

    this.instructorService
      .getCourseAnalytics(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Analytics) => {
          this.analytics = data;
          this.prepareChartData();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load analytics', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  prepareChartData(): void {
    if (!this.analytics) return;

    // Prepare enrollment chart data
    this.enrollmentChartData = {
      labels: this.analytics.enrollmentTrends.map((t) => t.month),
      data: this.analytics.enrollmentTrends.map((t) => t.count),
    };

    // Prepare quiz distribution chart data
    this.quizChartData = {
      labels: this.analytics.quizPerformanceDistribution.map((d) => d.range),
      data: this.analytics.quizPerformanceDistribution.map((d) => d.count),
    };
  }

  setActiveTab(tab: 'overview' | 'enrollments' | 'quizzes' | 'lessons'): void {
    this.activeTab = tab;
  }

  getProgressColor(value: number): string {
    if (value >= 80) return 'var(--color-success, #10b981)';
    if (value >= 50) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  getRangeStart(range: string): number {
    const parts = range.split('-');
    return parseInt(parts[0], 10) || 0;
  }

  getDropOffColor(rate: number): string {
    if (rate <= 20) return 'var(--color-success, #10b981)';
    if (rate <= 50) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  goBack(): void {
    this.router.navigate(['/instructor/dashboard']);
  }

  exportToCSV(): void {
    if (!this.analytics) return;

    // Create CSV content
    let csv = 'Lesson,Order,Views,Completions,Drop-off Rate\n';
    this.analytics.lessonDropOff.forEach((lesson) => {
      csv += `"${lesson.title}",${lesson.order},${lesson.totalViews},${lesson.completions},${lesson.dropOffRate}%\n`;
    });

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-analytics-${this.courseId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
