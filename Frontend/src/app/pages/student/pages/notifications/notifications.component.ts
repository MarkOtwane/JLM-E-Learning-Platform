import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Notifications</h1>
            <p class="page-description">Stay updated with your learning activities</p>
          </div>
          <button class="btn-outline text-sm">Mark all as read</button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  [class.border-primary-600]="activeTab === tab.id"
                  [class.text-primary-600]="activeTab === tab.id"
                  [class.border-transparent]="activeTab !== tab.id"
                  [class.text-gray-500]="activeTab !== tab.id"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Notifications List -->
      <div class="space-y-2">
        <div *ngFor="let notification of getFilteredNotifications()"
             [class.bg-blue-50]="!notification.read"
             class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="card-body">
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <div [class]="getIconBgClass(notification.type)" class="w-12 h-12 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6" [class]="getIconColorClass(notification.type)" fill="none" stroke="currentColor" viewBox="0 0 24 24" [innerHTML]="getIcon(notification.type)"></svg>
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-start justify-between mb-1">
                  <h3 class="text-sm font-semibold text-gray-900">{{ notification.title }}</h3>
                  <span class="text-xs text-gray-500">{{ notification.time }}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{{ notification.message }}</p>
                <div class="flex items-center gap-2">
                  <span [class]="getTypeBadgeClass(notification.type)" class="badge text-xs">
                    {{ notification.type }}
                  </span>
                  <span *ngIf="!notification.read" class="w-2 h-2 bg-blue-600 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotificationsComponent {
  activeTab = 'all';

  tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'course', label: 'Courses' },
    { id: 'assignment', label: 'Assignments' }
  ];

  notifications = [
    {
      id: '1',
      type: 'course',
      title: 'New lesson available',
      message: 'Module 5: Advanced React Patterns is now available in your course',
      time: '5m ago',
      read: false
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Assignment due soon',
      message: 'Your Web Development final project is due in 2 days',
      time: '1h ago',
      read: false
    },
    {
      id: '3',
      type: 'grade',
      title: 'Assignment graded',
      message: 'Your React Component Design assignment has been graded. Grade: A',
      time: '3h ago',
      read: true
    },
    {
      id: '4',
      type: 'announcement',
      title: 'Platform update',
      message: 'New features added to improve your learning experience',
      time: '1d ago',
      read: true
    }
  ];

  getFilteredNotifications() {
    if (this.activeTab === 'unread') {
      return this.notifications.filter(n => !n.read);
    }
    if (this.activeTab === 'all') {
      return this.notifications;
    }
    return this.notifications.filter(n => n.type === this.activeTab);
  }

  getIconBgClass(type: string): string {
    const classes: any = {
      'course': 'bg-blue-100',
      'assignment': 'bg-yellow-100',
      'grade': 'bg-green-100',
      'announcement': 'bg-purple-100'
    };
    return classes[type] || 'bg-gray-100';
  }

  getIconColorClass(type: string): string {
    const classes: any = {
      'course': 'text-blue-600',
      'assignment': 'text-yellow-600',
      'grade': 'text-green-600',
      'announcement': 'text-purple-600'
    };
    return classes[type] || 'text-gray-600';
  }

  getTypeBadgeClass(type: string): string {
    const classes: any = {
      'course': 'badge-info',
      'assignment': 'badge-warning',
      'grade': 'badge-success',
      'announcement': 'badge-primary'
    };
    return classes[type] || 'badge-primary';
  }

  getIcon(type: string): string {
    const icons: any = {
      'course': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />',
      'assignment': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />',
      'grade': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />',
      'announcement': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />'
    };
    return icons[type] || '';
  }
}
