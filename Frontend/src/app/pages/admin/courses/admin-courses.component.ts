import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Course {
  id: string;
  title: string;
  instructorName: string;
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.http.get<Course[]>('http://localhost:3000/api/admin/courses').subscribe({
      next: (data) => {
        this.courses = data;
        this.filteredCourses = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        // Mock data for development
        this.courses = [
          {
            id: '1',
            title: 'Introduction to Python',
            instructorName: 'Alice Johnson',
            category: 'Programming',
            level: 'Beginner',
            duration: '4 weeks',
            price: 99.99,
            learners: 50,
            rating: 4.5,
          },
          {
            id: '2',
            title: 'Advanced Calculus',
            instructorName: 'Carol White',
            category: 'Mathematics',
            level: 'Advanced',
            duration: '6 weeks',
            price: 149.99,
            learners: 30,
            rating: 4.8,
          },
          {
            id: '3',
            title: 'Web Development Basics',
            instructorName: 'Alice Johnson',
            category: 'Web Development',
            level: 'Intermediate',
            duration: '5 weeks',
            price: 79.99,
            learners: 70,
            rating: 4.2,
          },
        ];
        this.filteredCourses = this.courses;
        this.isLoading = false;
      },
    });
  }

  searchCourses(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredCourses = this.courses.filter((course) =>
      course.title.toLowerCase().includes(query) ||
      course.instructorName.toLowerCase().includes(query) ||
      course.category.toLowerCase().includes(query) ||
      course.level.toLowerCase().includes(query)
    );
  }

  deleteCourse(id: string): void {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      this.http.delete(`http://localhost:3000/api/admin/courses/${id}`).subscribe({
        next: () => {
          this.courses = this.courses.filter((course) => course.id !== id);
          this.filteredCourses = this.filteredCourses.filter((course) => course.id !== id);
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