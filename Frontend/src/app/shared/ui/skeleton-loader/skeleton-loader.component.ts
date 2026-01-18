import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Card Skeleton -->
    <div *ngIf="type === 'card'" class="card animate-pulse">
      <div class="h-48 bg-gray-200"></div>
      <div class="card-body space-y-3">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="flex items-center gap-2 pt-2">
          <div class="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- List Item Skeleton -->
    <div *ngIf="type === 'list-item'" class="flex items-center gap-4 p-4 animate-pulse">
      <div class="h-12 w-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-200 rounded w-2/3"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div class="h-8 w-20 bg-gray-200 rounded"></div>
    </div>

    <!-- Table Row Skeleton -->
    <div *ngIf="type === 'table-row'" class="grid grid-cols-5 gap-4 p-4 border-b border-gray-200 animate-pulse">
      <div class="h-4 bg-gray-200 rounded"></div>
      <div class="h-4 bg-gray-200 rounded"></div>
      <div class="h-4 bg-gray-200 rounded"></div>
      <div class="h-4 bg-gray-200 rounded"></div>
      <div class="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>

    <!-- Text Skeleton -->
    <div *ngIf="type === 'text'" class="space-y-2 animate-pulse">
      <div class="h-4 bg-gray-200 rounded" [ngClass]="getWidthClass()"></div>
    </div>

    <!-- Avatar Skeleton -->
    <div *ngIf="type === 'avatar'" 
         class="bg-gray-200 rounded-full animate-pulse"
         [ngClass]="getAvatarSize()">
    </div>

    <!-- Custom Skeleton -->
    <div *ngIf="type === 'custom'" 
         class="bg-gray-200 rounded animate-pulse"
         [ngClass]="customClass"
         [style.width]="width"
         [style.height]="height">
    </div>
  `,
  styles: []
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'list-item' | 'table-row' | 'text' | 'avatar' | 'custom' = 'card';
  @Input() width?: string;
  @Input() height?: string;
  @Input() customClass?: string;
  @Input() lines: number = 1;

  getWidthClass(): string {
    const widths = ['w-full', 'w-5/6', 'w-3/4', 'w-2/3', 'w-1/2'];
    return widths[Math.floor(Math.random() * widths.length)];
  }

  getAvatarSize(): string {
    return this.customClass || 'h-10 w-10';
  }
}
