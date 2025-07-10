import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service'; // Fixed import path

interface CourseData {
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number | null;
  description: string;
  isPremium: boolean;
}

@Component({
  selector: 'app-create-course',
  standalone: true,
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css'],
  imports: [FormsModule, CommonModule, HttpClientModule],
})
export class CreateCourseComponent implements OnInit {
  course: CourseData = {
    title: '',
    category: '',
    level: 'Beginner',
    duration: null,
    description: '',
    isPremium: false,
  };

  imagePreview: string | null = null;
  isSubmitting = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user info for instructor data
    this.authService.user$.subscribe((user: any) => {
      this.currentUser = user;
      if (!user || user.role !== 'INSTRUCTOR' || !user.isApproved) {
        // Redirect if not an approved instructor
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (
      !this.currentUser ||
      this.currentUser.role !== 'INSTRUCTOR' ||
      !this.currentUser.isApproved
    ) {
      this.router.navigate(['/']);
      return;
    }
    // Validate required fields
    if (
      !this.course.title ||
      !this.course.category ||
      !this.course.level ||
      !this.course.duration ||
      !this.course.description
    ) {
      return;
    }
    // Guard for allowed levels
    const allowedLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!allowedLevels.includes(this.course.level)) {
      return;
    }
    this.isSubmitting = true;
    const payload = {
      title: this.course.title,
      description: this.course.description,
      level: this.course.level,
      category: this.course.category,
      duration: Number(this.course.duration),
      isPremium: this.course.isPremium,
    };
    console.log('Sending payload:', payload);
    this.apiService.postAuth('/courses', payload).subscribe({
      next: (response: any) => {
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (error) => {
        if (error.status === 401) {
          this.authService.logout();
        } else {
        }
        this.isSubmitting = false;
      },
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/instructor-dashboard']);
    }
  }
}
