import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service'; // Fixed import path

interface CourseData {
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | '';
  duration: string;
  price: number;
  description: string;
  fullDescription: string;
  curriculum: string[];
  image?: File;
}

@Component({
  selector: 'app-create-course',
  standalone: true,
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css'],
  imports: [FormsModule, CommonModule, HttpClientModule]
})
export class CreateCourseComponent implements OnInit {
  course: CourseData = {
    title: '',
    category: '',
    level: '',
    duration: '',
    price: 0,
    description: '',
    fullDescription: '',
    curriculum: [''] // Start with one empty curriculum item
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
      if (!user || user.role !== 'instructor') {
        // Redirect if not an instructor
        this.router.navigate(['/']);
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }

      this.course.image = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.course.image = undefined;
    this.imagePreview = null;
  }

  addCurriculumItem(): void {
    this.course.curriculum.push('');
  }

  removeCurriculumItem(index: number): void {
    if (this.course.curriculum.length > 1) {
      this.course.curriculum.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (!this.currentUser) {
      alert('Please log in to create a course.');
      return;
    }

    // Validate curriculum items
    const validCurriculumItems = this.course.curriculum.filter(item => item.trim() !== '');
    if (validCurriculumItems.length === 0) {
      alert('Please add at least one learning point to the curriculum.');
      return;
    }

    this.isSubmitting = true;

    // Prepare form data
    const formData = new FormData();
    
    // Add course data
    formData.append('title', this.course.title);
    formData.append('category', this.course.category);
    formData.append('level', this.course.level);
    formData.append('duration', this.course.duration);
    formData.append('price', this.course.price.toString());
    formData.append('description', this.course.description);
    formData.append('fullDescription', this.course.fullDescription);
    formData.append('curriculum', JSON.stringify(validCurriculumItems));
    
    // Add instructor info (from current user)
    formData.append('instructorId', this.currentUser.id);
    formData.append('instructorName', this.currentUser.name);
    formData.append('instructorEmail', this.currentUser.email);
    
    // Add image if selected
    if (this.course.image) {
      formData.append('image', this.course.image);
    }

    // Submit to backend
    this.http.post('http://localhost:3000/api/courses', formData).subscribe({
      next: (response: any) => {
        alert('Course created successfully!');
        // Navigate to course content builder with the new course ID
        this.router.navigate(['/course-content-builder'], { 
          queryParams: { courseId: response.courseId } 
        });
      },
      error: (error) => {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/instructor-dashboard']);
    }
  }
}