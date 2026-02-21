import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InstructorService } from '../../../services/instructor.service';

interface Student {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  enrolledAt: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity: string;
  isInactive: boolean;
  daysSinceLastActivity: number;
}

@Component({
  selector: 'app-course-students',
  templateUrl: './course-students.component.html',
  styleUrls: ['./course-students.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseStudentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  courseId: string = '';
  courseTitle: string = '';
  students: Student[] = [];
  filteredStudents: Student[] = [];
  isLoading: boolean = true;
  
  // Filters
  searchTerm: string = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  sortBy: 'name' | 'progress' | 'lastActivity' = 'name';
  
  // Stats
  totalStudents: number = 0;
  activeStudents: number = 0;
  inactiveStudents: number = 0;
  averageProgress: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private instructorService: InstructorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    if (this.courseId) {
      this.loadStudents();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStudents(): void {
    this.isLoading = true;
    
    this.instructorService.getCourseStudents(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Student[]) => {
          this.students = data;
          this.filteredStudents = [...data];
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load students', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  calculateStats(): void {
    this.totalStudents = this.students.length;
    this.activeStudents = this.students.filter(s => !s.isInactive).length;
    this.inactiveStudents = this.students.filter(s => s.isInactive).length;
    this.averageProgress = this.students.length > 0
      ? Math.round(this.students.reduce((sum, s) => sum + s.progressPercentage, 0) / this.students.length)
      : 0;
  }

  applyFilters(): void {
    let result = [...this.students];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.email.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (this.filterStatus === 'active') {
      result = result.filter(s => !s.isInactive);
    } else if (this.filterStatus === 'inactive') {
      result = result.filter(s => s.isInactive);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progressPercentage - a.progressPercentage;
        case 'lastActivity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        default:
          return 0;
      }
    });
    
    this.filteredStudents = result;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  viewStudentProfile(studentId: string): void {
    this.router.navigate(['/instructor/students', studentId, 'profile']);
  }

  messageStudent(studentId: string): void {
    this.router.navigate(['/instructor/messages', { to: studentId }]);
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'var(--color-success, #10b981)';
    if (progress >= 50) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/instructor/dashboard']);
  }
}
