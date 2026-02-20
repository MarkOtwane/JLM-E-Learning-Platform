import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface Course {
  id: string;
  title: string;
  instructor: { id: string; name: string; email: string };
  instructorName?: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  learners: number;
  rating: number;
}

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-courses.component.html',
  styleUrls: ['./admin-courses.component.css'],
})
export class AdminCoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.api.getAuth<Course[]>('/admin/courses').subscribe({
      next: (data) => {
        this.courses = data.map((course) => ({
          ...course,
          instructorName: course.instructor?.name || '-',
        }));
        this.filteredCourses = this.courses;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoading = false;
      },
    });
  }

  searchCourses(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredCourses = this.courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        (course.instructorName && course.instructorName.toLowerCase().includes(query)) ||
        course.category.toLowerCase().includes(query) ||
        course.level.toLowerCase().includes(query)
    );
  }

  deleteCourse(id: string): void {
    if (
      confirm(
        'Are you sure you want to delete this course? This action cannot be undone.'
      )
    ) {
      this.api.deleteAuth(`/admin/courses/${id}`).subscribe({
        next: () => {
          this.courses = this.courses.filter((course) => course.id !== id);
          this.filteredCourses = this.filteredCourses.filter(
            (course) => course.id !== id
          );
          alert('Course deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting course:', error);
          alert('Failed to delete course.');
        },
      });
    }
  }

  getStarArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    return Array(fullStars).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const maxStars = 5;
    return Array(maxStars - fullStars).fill(0);
  }
}

export default AdminCoursesComponent;
