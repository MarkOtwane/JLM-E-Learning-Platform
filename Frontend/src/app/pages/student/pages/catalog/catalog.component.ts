import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CourseCardComponent, CourseCardData } from '../../../../shared/ui/course-card/course-card.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CourseCardComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Course Catalog</h1>
        <p class="page-description">Explore our wide range of courses and start learning today</p>
      </div>

      <!-- Search and Filters -->
      <div class="card">
        <div class="card-body">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchChange()"
                  placeholder="Search courses..."
                  class="input pl-10"
                />
              </div>
            </div>

            <!-- Category Filter -->
            <select [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()" class="input md:w-48">
              <option value="">All Categories</option>
              <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
            </select>

            <!-- Level Filter -->
            <select [(ngModel)]="selectedLevel" (ngModelChange)="onFilterChange()" class="input md:w-48">
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <!-- Sort -->
            <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange()" class="input md:w-48">
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Results Count -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600">
          Showing <span class="font-semibold">{{ filteredCourses.length }}</span> courses
        </p>
        <div class="flex gap-2">
          <button 
            (click)="viewMode = 'grid'"
            [class.bg-gray-200]="viewMode === 'grid'"
            class="btn-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button 
            (click)="viewMode = 'list'"
            [class.bg-gray-200]="viewMode === 'list'"
            class="btn-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <app-skeleton-loader *ngFor="let i of [1,2,3,4,5,6]" type="card"></app-skeleton-loader>
      </div>

      <!-- Empty State -->
      <app-empty-state
        *ngIf="!isLoading && filteredCourses.length === 0"
        icon="search"
        title="No courses found"
        description="Try adjusting your search or filters to find what you're looking for."
        actionLabel="Clear Filters"
        (action)="clearFilters()">
      </app-empty-state>

      <!-- Course Grid -->
      <div *ngIf="!isLoading && filteredCourses.length > 0" 
           [ngClass]="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
        <app-course-card
          *ngFor="let course of filteredCourses"
          [course]="course"
          [showAction]="true"
          [actionLabel]="course.isEnrolled ? 'Go to Course' : 'Enroll Now'"
          (cardClick)="viewCourseDetails($event)"
          (actionClick)="handleCourseAction($event)">
        </app-course-card>
      </div>

      <!-- Load More -->
      <div *ngIf="!isLoading && filteredCourses.length > 0 && hasMore" class="text-center">
        <button (click)="loadMore()" class="btn-outline">
          Load More Courses
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class CatalogComponent implements OnInit {
  isLoading = true;
  searchQuery = '';
  selectedCategory = '';
  selectedLevel = '';
  sortBy = 'popular';
  viewMode: 'grid' | 'list' = 'grid';
  hasMore = true;

  categories = ['Development', 'Design', 'Business', 'Marketing', 'Data Science', 'Photography'];
  
  allCourses: CourseCardData[] = [];
  filteredCourses: CourseCardData[] = [];

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;

    // TODO: Replace with actual API call
    setTimeout(() => {
      this.allCourses = this.generateMockCourses();
      this.filteredCourses = [...this.allCourses];
      this.isLoading = false;
    }, 1000);
  }

  generateMockCourses(): CourseCardData[] {
    const courses: CourseCardData[] = [];
    const levels: ('Beginner' | 'Intermediate' | 'Advanced')[] = ['Beginner', 'Intermediate', 'Advanced'];
    
    for (let i = 1; i <= 12; i++) {
      courses.push({
        id: `course-${i}`,
        title: `Sample Course ${i}`,
        description: 'Comprehensive course covering all essential topics and hands-on projects',
        instructor: `Instructor ${i}`,
        thumbnail: `https://picsum.photos/400/300?random=${i}`,
        level: levels[i % 3],
        category: this.categories[i % this.categories.length],
        rating: 4 + Math.random(),
        duration: `${4 + (i % 8)} weeks`,
        enrollmentCount: 1000 + Math.floor(Math.random() * 5000),
        price: i % 4 === 0 ? 0 : 29 + (i * 10),
        isEnrolled: i % 5 === 0
      });
    }
    return courses;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applySorting();
  }

  applyFilters(): void {
    this.filteredCourses = this.allCourses.filter(course => {
      const matchesSearch = !this.searchQuery || 
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || course.category === this.selectedCategory;
      const matchesLevel = !this.selectedLevel || course.level === this.selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });

    this.applySorting();
  }

  applySorting(): void {
    switch (this.sortBy) {
      case 'rating':
        this.filteredCourses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price-low':
        this.filteredCourses.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        this.filteredCourses.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'popular':
        this.filteredCourses.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
        break;
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedLevel = '';
    this.sortBy = 'popular';
    this.applyFilters();
  }

  viewCourseDetails(course: CourseCardData): void {
    console.log('View course details:', course);
  }

  handleCourseAction(course: CourseCardData): void {
    if (course.isEnrolled) {
      console.log('Go to course:', course);
    } else {
      console.log('Enroll in course:', course);
    }
  }

  loadMore(): void {
    console.log('Load more courses');
  }
}
