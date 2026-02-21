import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import {
  CourseCardComponent,
  CourseCardData,
} from '../../../../shared/ui/course-card/course-card.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton-loader/skeleton-loader.component';
import { StatsCardComponent } from '../../../../shared/ui/stats-card/stats-card.component';

@Component({
  selector: 'app-new-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CourseCardComponent,
    StatsCardComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">
          {{ getGreeting() }}, {{ getStudentName() }}!
          <i class="fas fa-hand-paper greeting-icon" aria-hidden="true"></i>
        </h1>
        <p class="page-description">Welcome back to your learning dashboard</p>
      </div>

      <!-- Stats Overview -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <app-stats-card
          label="Enrolled Courses"
          [value]="stats.enrolledCourses"
          icon="courses"
          color="primary"
          [change]="12"
          changeLabel="vs last month"
        >
        </app-stats-card>

        <app-stats-card
          label="Completed"
          [value]="stats.completedCourses"
          icon="progress"
          color="success"
          [change]="8"
          changeLabel="this month"
        >
        </app-stats-card>

        <app-stats-card
          label="Certificates"
          [value]="stats.certificates"
          icon="certificate"
          color="warning"
          [change]="4"
          changeLabel="this month"
        >
        </app-stats-card>

        <app-stats-card
          label="Learning Hours"
          [value]="stats.learningHours"
          suffix="h"
          icon="time"
          color="info"
          [change]="15"
          changeLabel="vs last week"
        >
        </app-stats-card>
      </div>

      <!-- Continue Learning Section -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Continue Learning</h2>
          <a
            routerLink="/student/courses"
            class="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View All →
          </a>
        </div>

        <!-- Loading State -->
        <div
          *ngIf="isLoading"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <app-skeleton-loader
            *ngFor="let i of [1, 2, 3]"
            type="card"
          ></app-skeleton-loader>
        </div>

        <!-- Empty State -->
        <app-empty-state
          *ngIf="!isLoading && activeCourses.length === 0"
          icon="courses"
          title="No active courses"
          description="You don't have any courses in progress. Explore our catalog to start learning!"
          actionLabel="Browse Courses"
          (action)="navigateToCatalog()"
        >
        </app-empty-state>

        <!-- Course Cards -->
        <div
          *ngIf="!isLoading && activeCourses.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <app-course-card
            *ngFor="let course of activeCourses"
            [course]="course"
            [showAction]="true"
            [actionLabel]="'Continue Learning'"
            (cardClick)="onCourseClick($event)"
            (actionClick)="continueCourse($event)"
          >
          </app-course-card>
        </div>
      </section>

      <!-- Recent Activity & Upcoming -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Upcoming Assignments -->
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">
                Upcoming Assignments
              </h3>
              <a
                routerLink="/student/assignments"
                class="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View All →
              </a>
            </div>

            <!-- Assignment List -->
            <div
              *ngIf="upcomingAssignments.length === 0"
              class="text-center py-8"
            >
              <svg
                class="w-12 h-12 mx-auto text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p class="text-sm text-gray-600">No upcoming assignments</p>
            </div>

            <div class="space-y-3">
              <div
                *ngFor="let assignment of upcomingAssignments"
                class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    class="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-900 truncate">
                    {{ assignment.title }}
                  </h4>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ assignment.courseName }}
                  </p>
                  <div class="flex items-center gap-2 mt-2">
                    <span
                      class="text-xs font-medium"
                      [ngClass]="getDueDateClass(assignment.dueDate)"
                    >
                      Due {{ formatDueDate(assignment.dueDate) }}
                    </span>
                  </div>
                </div>
                <span class="badge badge-warning text-xs">{{
                  assignment.status
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Live Classes -->
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">Live Classes</h3>
              <a
                routerLink="/student/live-classes"
                class="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View All →
              </a>
            </div>

            <!-- Live Class List -->
            <div
              *ngIf="upcomingLiveClasses.length === 0"
              class="text-center py-8"
            >
              <svg
                class="w-12 h-12 mx-auto text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p class="text-sm text-gray-600">No upcoming live classes</p>
            </div>

            <div class="space-y-3">
              <div
                *ngFor="let liveClass of upcomingLiveClasses"
                class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"
                >
                  <div
                    class="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                  ></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-900 truncate">
                    {{ liveClass.title }}
                  </h4>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ liveClass.instructor }}
                  </p>
                  <div
                    class="flex items-center gap-2 mt-2 text-xs text-gray-600"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {{ liveClass.scheduledTime | date: 'short' }}
                  </div>
                </div>
                <button
                  class="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Announcements -->
      <div class="card">
        <div class="card-body">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            Recent Announcements
          </h3>

          <div *ngIf="announcements.length === 0" class="text-center py-8">
            <svg
              class="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            <p class="text-sm text-gray-600">No recent announcements</p>
          </div>

          <div class="space-y-3">
            <div
              *ngFor="let announcement of announcements"
              class="flex gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100"
            >
              <div class="flex-shrink-0">
                <svg
                  class="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-gray-900">
                  {{ announcement.title }}
                </h4>
                <p class="text-sm text-gray-600 mt-1">
                  {{ announcement.message }}
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  {{ announcement.date | date: 'MMM d, yyyy' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .greeting-icon {
        margin-left: 8px;
        color: #f59e0b;
      }
    `,
  ],
})
export class NewDashboardComponent implements OnInit {
  isLoading = true;

  stats = {
    enrolledCourses: 0,
    completedCourses: 0,
    certificates: 0,
    learningHours: 0,
  };

  activeCourses: CourseCardData[] = [];
  upcomingAssignments: any[] = [];
  upcomingLiveClasses: any[] = [];
  announcements: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // TODO: Replace with actual API calls
    setTimeout(() => {
      this.stats = {
        enrolledCourses: 8,
        completedCourses: 3,
        certificates: 2,
        learningHours: 42,
      };

      this.activeCourses = [
        {
          id: '1',
          title: 'Introduction to Web Development',
          description: 'Learn the fundamentals of HTML, CSS, and JavaScript',
          instructor: 'John Doe',
          thumbnail: 'https://picsum.photos/400/300?random=1',
          progress: 65,
          level: 'Beginner',
          category: 'Development',
          rating: 4.8,
          duration: '6 weeks',
          completedLessons: 13,
          totalLessons: 20,
          isEnrolled: true,
        },
        {
          id: '2',
          title: 'Advanced React Patterns',
          description: 'Master advanced React concepts and patterns',
          instructor: 'Jane Smith',
          thumbnail: 'https://picsum.photos/400/300?random=2',
          progress: 30,
          level: 'Advanced',
          category: 'Development',
          rating: 4.9,
          duration: '8 weeks',
          completedLessons: 6,
          totalLessons: 20,
          isEnrolled: true,
        },
        {
          id: '3',
          title: 'UI/UX Design Fundamentals',
          description: 'Learn the principles of modern UI/UX design',
          instructor: 'Mike Johnson',
          thumbnail: 'https://picsum.photos/400/300?random=3',
          progress: 80,
          level: 'Intermediate',
          category: 'Design',
          rating: 4.7,
          duration: '5 weeks',
          completedLessons: 16,
          totalLessons: 20,
          isEnrolled: true,
        },
      ];

      this.upcomingAssignments = [
        {
          title: 'Final Project Submission',
          courseName: 'Web Development',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'Pending',
        },
        {
          title: 'Quiz: React Hooks',
          courseName: 'Advanced React',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'Pending',
        },
      ];

      this.upcomingLiveClasses = [
        {
          title: 'Live Q&A Session',
          instructor: 'John Doe',
          scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        },
      ];

      this.announcements = [
        {
          title: 'New Course Available!',
          message:
            'Check out our new Machine Learning course now available in the catalog.',
          date: new Date(),
        },
      ];

      this.isLoading = false;
    }, 1500);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getStudentName(): string {
    const user = this.authService.getCurrentUser();
    return user?.firstName || 'Student';
  }

  getDueDateClass(dueDate: Date): string {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days < 1) return 'text-red-600';
    if (days < 3) return 'text-orange-600';
    return 'text-gray-600';
  }

  formatDueDate(dueDate: Date): string {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
  }

  onCourseClick(course: CourseCardData): void {
    // Navigate to course detail
    console.log('Navigate to course:', course.id);
  }

  continueCourse(course: CourseCardData): void {
    // Navigate to learning page
    console.log('Continue course:', course.id);
  }

  navigateToCatalog(): void {
    // Navigate to catalog
    console.log('Navigate to catalog');
  }
}
