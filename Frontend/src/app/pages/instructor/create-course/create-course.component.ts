import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Fixed import path

interface CourseData {
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | '';
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
    level: '',
    duration: null,
    description: '',
    isPremium: false,
  };

  imagePreview: string | null = null;
  isSubmitting = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user info for instructor data
    this.authService.user$.subscribe((user: any) => {
      this.currentUser = user;
      if (!user || user.role.toLowerCase() !== 'instructor') {
        // Redirect if not an instructor
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit(): void {
    if (!this.currentUser) {
      alert('Please log in to create a course.');
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
      alert('Please fill in all required fields.');
      return;
    }

    this.isSubmitting = true;

    // Prepare payload matching backend expectations
    const payload = {
      title: this.course.title,
      description: this.course.description,
      level: this.course.level,
      category: this.course.category,
      duration: Number(this.course.duration),
      isPremium: this.course.isPremium,
    };

    this.http.post('http://localhost:3000/api/courses', payload).subscribe({
      next: (response: any) => {
        alert('Course created successfully!');
        // Navigate to instructor dashboard or course list
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (error) => {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
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
