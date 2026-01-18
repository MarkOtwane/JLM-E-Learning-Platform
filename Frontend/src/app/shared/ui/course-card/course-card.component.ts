import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface CourseCardData {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  instructorAvatar?: string;
  thumbnail?: string;
  progress?: number;
  duration?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  rating?: number;
  enrollmentCount?: number;
  price?: number;
  isEnrolled?: boolean;
  lastAccessed?: Date;
  completedLessons?: number;
  totalLessons?: number;
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card group cursor-pointer overflow-hidden" (click)="handleClick()">
      <!-- Thumbnail -->
      <div class="relative h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
        <img 
          *ngIf="course.thumbnail; else placeholderThumbnail"
          [src]="course.thumbnail" 
          [alt]="course.title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <ng-template #placeholderThumbnail>
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </ng-template>
        
        <!-- Badge overlay -->
        <div class="absolute top-3 left-3 flex gap-2">
          <span *ngIf="course.level" 
                class="badge text-xs font-semibold bg-white/90 text-gray-800 backdrop-blur-sm">
            {{ course.level }}
          </span>
          <span *ngIf="course.isEnrolled" 
                class="badge badge-success text-xs font-semibold">
            Enrolled
          </span>
        </div>

        <!-- Progress bar overlay (for enrolled courses) -->
        <div *ngIf="course.progress !== undefined" class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
          <div class="h-full bg-primary-600 transition-all duration-300" 
               [style.width.%]="course.progress"></div>
        </div>
      </div>

      <!-- Content -->
      <div class="card-body">
        <!-- Category -->
        <p *ngIf="course.category" class="text-xs font-medium text-primary-600 mb-2 uppercase tracking-wide">
          {{ course.category }}
        </p>

        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {{ course.title }}
        </h3>

        <!-- Description -->
        <p *ngIf="course.description" class="text-sm text-gray-600 mb-4 line-clamp-2">
          {{ course.description }}
        </p>

        <!-- Instructor -->
        <div *ngIf="course.instructor" class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            <img *ngIf="course.instructorAvatar" 
                 [src]="course.instructorAvatar" 
                 [alt]="course.instructor"
                 class="w-full h-full object-cover"
            />
            <div *ngIf="!course.instructorAvatar" 
                 class="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600">
              {{ getInitials(course.instructor) }}
            </div>
          </div>
          <span class="text-sm text-gray-700 font-medium">{{ course.instructor }}</span>
        </div>

        <!-- Progress info for enrolled courses -->
        <div *ngIf="course.progress !== undefined" class="mb-4">
          <div class="flex justify-between items-center text-sm mb-1">
            <span class="text-gray-600">Progress</span>
            <span class="font-semibold text-gray-900">{{ course.progress }}%</span>
          </div>
          <div *ngIf="course.completedLessons !== undefined && course.totalLessons !== undefined" 
               class="text-xs text-gray-500">
            {{ course.completedLessons }} of {{ course.totalLessons }} lessons completed
          </div>
        </div>

        <!-- Footer meta -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <div class="flex items-center gap-4 text-sm text-gray-600">
            <span *ngIf="course.duration" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ course.duration }}
            </span>
            
            <span *ngIf="course.rating" class="flex items-center gap-1">
              <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {{ course.rating.toFixed(1) }}
            </span>

            <span *ngIf="course.enrollmentCount" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {{ formatNumber(course.enrollmentCount) }}
            </span>
          </div>

          <div *ngIf="course.price !== undefined" class="text-lg font-bold text-primary-600">
            <span *ngIf="course.price === 0">Free</span>
            <span *ngIf="course.price > 0">\${{ course.price }}</span>
          </div>
        </div>

        <!-- Action Button -->
        <button 
          *ngIf="showAction"
          (click)="handleActionClick($event)"
          class="mt-4 w-full btn-primary">
          {{ actionLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class CourseCardComponent {
  @Input() course!: CourseCardData;
  @Input() showAction: boolean = false;
  @Input() actionLabel: string = 'Continue Learning';
  
  @Output() cardClick = new EventEmitter<CourseCardData>();
  @Output() actionClick = new EventEmitter<CourseCardData>();

  handleClick(): void {
    this.cardClick.emit(this.course);
  }

  handleActionClick(event: Event): void {
    event.stopPropagation();
    this.actionClick.emit(this.course);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
