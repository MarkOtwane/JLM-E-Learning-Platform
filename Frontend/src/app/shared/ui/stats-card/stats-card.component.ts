import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-body">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Label -->
            <p class="text-sm font-medium text-gray-600 mb-1">{{ label }}</p>
            
            <!-- Value -->
            <p class="text-3xl font-bold text-gray-900 mb-2">
              {{ formatValue() }}
            </p>

            <!-- Change Indicator -->
            <div *ngIf="change !== undefined" class="flex items-center gap-1 text-sm">
              <ng-container *ngIf="change > 0">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span class="text-green-600 font-medium">+{{ change }}%</span>
              </ng-container>
              <ng-container *ngIf="change < 0">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span class="text-red-600 font-medium">{{ change }}%</span>
              </ng-container>
              <ng-container *ngIf="change === 0">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
                </svg>
                <span class="text-gray-600 font-medium">0%</span>
              </ng-container>
              <span class="text-gray-500">{{ changeLabel }}</span>
            </div>

            <!-- Description -->
            <p *ngIf="description" class="text-xs text-gray-500 mt-2">
              {{ description }}
            </p>
          </div>

          <!-- Icon -->
          <div class="flex-shrink-0">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" 
                 [ngClass]="getIconBgClass()">
              <ng-container [ngSwitch]="icon">
                <!-- Courses -->
                <svg *ngSwitchCase="'courses'" class="w-6 h-6" [ngClass]="getIconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>

                <!-- Progress -->
                <svg *ngSwitchCase="'progress'" class="w-6 h-6" [ngClass]="getIconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>

                <!-- Certificate -->
                <svg *ngSwitchCase="'certificate'" class="w-6 h-6" [ngClass]="getIconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>

                <!-- Time -->
                <svg *ngSwitchCase="'time'" class="w-6 h-6" [ngClass]="getIconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <!-- Users -->
                <svg *ngSwitchCase="'users'" class="w-6 h-6" [ngClass]="getIconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>

                <!-- Trophy -->
                <svg *ngSwitchCase="'trophy'" class="w-6 h-6" [ngClass]="getIconColorClass()" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>

                <!-- Default -->
                <svg *ngSwitchDefault class="w-6 h-6" [ngClass]="getIconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StatsCardComponent {
  @Input() label: string = 'Stat';
  @Input() value: number | string = 0;
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() change?: number;
  @Input() changeLabel: string = 'vs last month';
  @Input() description?: string;
  @Input() icon: 'courses' | 'progress' | 'certificate' | 'time' | 'users' | 'trophy' | 'default' = 'default';
  @Input() color: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';

  formatValue(): string {
    let formatted = this.value.toString();
    if (this.prefix) formatted = this.prefix + formatted;
    if (this.suffix) formatted = formatted + this.suffix;
    return formatted;
  }

  getIconBgClass(): string {
    const colors = {
      primary: 'bg-primary-100',
      success: 'bg-green-100',
      warning: 'bg-yellow-100',
      danger: 'bg-red-100',
      info: 'bg-blue-100'
    };
    return colors[this.color];
  }

  getIconColorClass(): string {
    const colors = {
      primary: 'text-primary-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600',
      info: 'text-blue-600'
    };
    return colors[this.color];
  }
}
