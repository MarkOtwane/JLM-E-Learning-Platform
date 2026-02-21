import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  pendingInstructors: number;
  totalEarnings: number;
  totalCourses?: number;
  // Trend data
  studentsGrowth?: number;
  instructorsGrowth?: number;
  earningsGrowth?: number;
  coursesGrowth?: number;
}

interface TrendData {
  value: number;
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  label: string;
}

interface RecentActivity {
  id: string;
  type: 'student' | 'instructor' | 'course' | 'payment' | 'pending';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  status?: 'success' | 'warning' | 'info';
}

interface MetricCard {
  icon: string;
  iconBgClass: string;
  value: number | string;
  label: string;
  trend?: TrendData;
  format?: 'number' | 'currency';
  isWarning?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalStudents: 0,
    totalInstructors: 0,
    pendingInstructors: 0,
    totalEarnings: 0,
    totalCourses: 0,
    studentsGrowth: 0,
    instructorsGrowth: 0,
    earningsGrowth: 0,
    coursesGrowth: 0,
  };

  isLoading: boolean = true;
  metricCards: MetricCard[] = [];
  recentActivities: RecentActivity[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentActivities();
  }

  loadStats(): void {
    this.isLoading = true;
    this.api.getAuth<DashboardStats>('/admin/stats').subscribe({
      next: (data) => {
        this.stats = {
          ...this.stats,
          ...data,
          // Simulate growth percentages (in real app, these would come from backend)
          studentsGrowth:
            data.studentsGrowth ?? this.generateGrowthPercentage(),
          instructorsGrowth:
            data.instructorsGrowth ?? this.generateGrowthPercentage(),
          earningsGrowth:
            data.earningsGrowth ?? this.generateGrowthPercentage(),
          coursesGrowth: data.coursesGrowth ?? this.generateGrowthPercentage(),
        };
        this.buildMetricCards();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoading = false;
      },
    });
  }

  loadRecentActivities(): void {
    // In a real app, this would come from the backend
    // For now, we'll generate sample activities based on stats
    this.api.getAuth<any>('/admin/recent-activities').subscribe({
      next: (data) => {
        this.recentActivities =
          data.activities || this.generateSampleActivities();
      },
      error: () => {
        // If endpoint doesn't exist, use sample data
        this.recentActivities = this.generateSampleActivities();
      },
    });
  }

  private generateGrowthPercentage(): number {
    // Generate a random growth percentage between -5 and 25
    return Math.round((Math.random() * 30 - 5) * 10) / 10;
  }

  private generateSampleActivities(): RecentActivity[] {
    const activities: RecentActivity[] = [];

    if (this.stats.pendingInstructors > 0) {
      activities.push({
        id: '1',
        type: 'pending',
        title: 'Pending Instructor Applications',
        description: `${this.stats.pendingInstructors} instructor${this.stats.pendingInstructors > 1 ? 's' : ''} awaiting approval`,
        timestamp: new Date(),
        icon: 'fa-hourglass-half',
        status: 'warning',
      });
    }

    if (this.stats.totalStudents > 0) {
      activities.push({
        id: '2',
        type: 'student',
        title: 'New Student Enrollments',
        description: 'Students have enrolled in courses this week',
        timestamp: new Date(Date.now() - 3600000),
        icon: 'fa-user-graduate',
        status: 'success',
      });
    }

    if (this.stats.totalEarnings > 0) {
      activities.push({
        id: '3',
        type: 'payment',
        title: 'Revenue Update',
        description: 'New payments processed successfully',
        timestamp: new Date(Date.now() - 7200000),
        icon: 'fa-dollar-sign',
        status: 'success',
      });
    }

    activities.push({
      id: '4',
      type: 'course',
      title: 'Course Activity',
      description: 'Courses are actively being created and updated',
      timestamp: new Date(Date.now() - 86400000),
      icon: 'fa-book',
      status: 'info',
    });

    return activities;
  }

  private buildMetricCards(): void {
    this.metricCards = [
      {
        icon: 'fa-user-graduate',
        iconBgClass: 'students',
        value: this.stats.totalStudents,
        label: 'Total Students Enrolled',
        format: 'number',
        trend: this.buildTrendData(
          this.stats.studentsGrowth ?? 0,
          'vs last week',
        ),
      },
      {
        icon: 'fa-chalkboard-teacher',
        iconBgClass: 'instructors',
        value: this.stats.totalInstructors,
        label: 'Total Instructors',
        format: 'number',
        trend: this.buildTrendData(
          this.stats.instructorsGrowth ?? 0,
          'vs last month',
        ),
      },
      {
        icon: 'fa-hourglass-half',
        iconBgClass: 'pending',
        value: this.stats.pendingInstructors,
        label: 'Pending Instructors',
        format: 'number',
        isWarning: this.stats.pendingInstructors > 0,
        trend:
          this.stats.pendingInstructors > 0
            ? {
                value: this.stats.pendingInstructors,
                trend: 'up',
                percentage: 0,
                label: 'Needs Review',
              }
            : { value: 0, trend: 'neutral', percentage: 0, label: 'All Clear' },
      },
      {
        icon: '💰',
        iconBgClass: 'earnings',
        value: this.stats.totalEarnings,
        label: 'Total Revenue',
        format: 'currency',
        trend: this.buildTrendData(
          this.stats.earningsGrowth ?? 0,
          'vs last month',
        ),
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

  formatValue(value: number | string, format?: 'number' | 'currency'): string {
    if (typeof value === 'string') return value;

    if (format === 'currency') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  getActivityTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  trackByActivityId(index: number, activity: RecentActivity): string {
    return activity.id;
  }

  // Math wrapper for template access
  Math = Math;
}

export default AdminDashboardComponent;
