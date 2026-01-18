import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-bar-container">
      <!-- Label -->
      <div *ngIf="showLabel" class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">{{ label }}</span>
        <span class="text-sm font-semibold" [ngClass]="getProgressColor()">
          {{ value }}%
        </span>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-gray-200 rounded-full overflow-hidden" 
           [ngClass]="getSizeClass()">
        <div 
          class="h-full transition-all duration-500 ease-out rounded-full"
          [ngClass]="getBarColor()"
          [style.width.%]="value"
          role="progressbar"
          [attr.aria-valuenow]="value"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
          [attr.aria-label]="label || 'Progress'">
          <!-- Stripe animation for loading state -->
          <div *ngIf="animated" 
               class="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer">
          </div>
        </div>
      </div>

      <!-- Additional info -->
      <div *ngIf="subtitle" class="mt-1 text-xs text-gray-500">
        {{ subtitle }}
      </div>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `]
})
export class ProgressBarComponent {
  @Input() value: number = 0;
  @Input() label?: string;
  @Input() subtitle?: string;
  @Input() showLabel: boolean = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: 'primary' | 'success' | 'warning' | 'danger' = 'primary';
  @Input() animated: boolean = false;

  getSizeClass(): string {
    const sizes = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4'
    };
    return sizes[this.size];
  }

  getBarColor(): string {
    // Auto-color based on progress if color is primary
    if (this.color === 'primary') {
      if (this.value >= 80) return 'bg-green-500';
      if (this.value >= 50) return 'bg-primary-600';
      if (this.value >= 25) return 'bg-yellow-500';
      return 'bg-orange-500';
    }

    const colors = {
      primary: 'bg-primary-600',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500'
    };
    return colors[this.color];
  }

  getProgressColor(): string {
    if (this.value >= 80) return 'text-green-600';
    if (this.value >= 50) return 'text-primary-600';
    if (this.value >= 25) return 'text-yellow-600';
    return 'text-orange-600';
  }
}
