import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <h1 class="page-title">Assignments</h1>
        <p class="page-description">Track and submit your course assignments</p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab = tab.id"
            [class.border-primary-600]="activeTab === tab.id"
            [class.text-primary-600]="activeTab === tab.id"
            [class.border-transparent]="activeTab !== tab.id"
            [class.text-gray-500]="activeTab !== tab.id"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            {{ tab.label }}
            <span *ngIf="tab.count" class="ml-2 py-0.5 px-2 rounded-full text-xs font-medium"
                  [class.bg-primary-100]="activeTab === tab.id"
                  [class.text-primary-600]="activeTab === tab.id"
                  [class.bg-gray-100]="activeTab !== tab.id"
                  [class.text-gray-600]="activeTab !== tab.id">
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Assignment List -->
      <div class="grid grid-cols-1 gap-4">
        <div *ngFor="let assignment of getFilteredAssignments()" class="card hover:shadow-md transition-shadow">
          <div class="card-body">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge badge-primary text-xs">{{ assignment.course }}</span>
                  <span [class]="getStatusBadgeClass(assignment.status)" class="badge text-xs">
                    {{ assignment.status }}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ assignment.title }}</h3>
                <p class="text-sm text-gray-600 mb-3">{{ assignment.description }}</p>
                
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {{ assignment.dueDate | date:'MMM d, yyyy' }}
                  </span>
                  <span *ngIf="assignment.grade" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Grade: {{ assignment.grade }}
                  </span>
                </div>
              </div>
              
              <div class="flex-shrink-0 ml-4">
                <button *ngIf="assignment.status === 'Pending'" class="btn-primary text-sm">
                  Submit
                </button>
                <button *ngIf="assignment.status === 'Submitted'" class="btn-secondary text-sm">
                  View Submission
                </button>
                <button *ngIf="assignment.status === 'Graded'" class="btn-outline text-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AssignmentsComponent {
  activeTab = 'all';
  
  tabs = [
    { id: 'all', label: 'All', count: 12 },
    { id: 'pending', label: 'Pending', count: 5 },
    { id: 'submitted', label: 'Submitted', count: 4 },
    { id: 'graded', label: 'Graded', count: 3 }
  ];

  assignments = [
    {
      id: '1',
      title: 'Final Project: Build a Web Application',
      description: 'Create a full-stack web application using learned technologies',
      course: 'Web Development',
      dueDate: new Date('2026-02-15'),
      status: 'Pending'
    },
    {
      id: '2',
      title: 'React Component Design',
      description: 'Design and implement reusable React components',
      course: 'Advanced React',
      dueDate: new Date('2026-02-10'),
      status: 'Submitted'
    },
    {
      id: '3',
      title: 'UI/UX Case Study',
      description: 'Complete case study analysis of a popular application',
      course: 'UI/UX Design',
      dueDate: new Date('2026-01-25'),
      status: 'Graded',
      grade: 'A'
    }
  ];

  getFilteredAssignments() {
    if (this.activeTab === 'all') return this.assignments;
    return this.assignments.filter(a => a.status.toLowerCase() === this.activeTab);
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'Pending': 'badge-warning',
      'Submitted': 'badge-info',
      'Graded': 'badge-success'
    };
    return classes[status] || 'badge-primary';
  }
}
