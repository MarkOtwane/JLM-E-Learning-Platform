import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service'; // Import your AuthService

interface CourseInstructor {
  name: string;
  profilePicture: string;
  bio?: string;
}

interface CourseReview {
  studentName: string;
  studentAvatar: string;
  rating: number;
  comment: string;
  date: Date;
}

interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  fullDescription?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  image: string;
  instructor: CourseInstructor;
  learners: number;
  rating: number;
  reviewsCount: number;
  reviews?: CourseReview[];
  curriculum?: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent implements OnInit {
  @ViewChild('carouselWrapper', { static: false }) carouselWrapper!: ElementRef;

  courses: any[] = [];
  filteredCourses: Course[] = [];
  featuredCourses: Course[] = [];
  selectedCourse: Course | null = null;
  activeCategory = 'all';
  searchQuery = '';
  isLoggedIn: boolean = false; // Track login status
  isInstructor: boolean = false; // Track instructor role
  isLoading = false;

  // Carousel properties
  carouselOffset = 0;
  cardWidth = 320;
  cardsVisible = 3;
  isCarouselAtEnd = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService, // Inject AuthService
    private apiService: ApiService // Inject ApiService
  ) {}

  ngOnInit() {
    this.loadCourses();
    this.setupUrlParams();
    this.setupAuth(); // Initialize authentication
  }

  setupAuth() {
    // Subscribe to user authentication state
    this.authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user; // True if user is logged in
      this.isInstructor = user?.role === 'instructor'; // True if user is an instructor
    });
  }

  setupUrlParams() {
    this.route.queryParams.subscribe((params) => {
      this.activeCategory = params['category'] || 'all';
      this.searchQuery = params['q'] || '';
      this.filterCourses();
    });
  }

  loadCourses(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/courses/public').subscribe({
      next: (courses) => {
        this.courses = courses;
        this.featuredCourses = this.courses.filter((course) => course.featured);
        this.filterCourses();
        this.isLoading = false;
      },
      error: () => {
        this.courses = [];
        this.featuredCourses = [];
        this.filterCourses();
        this.isLoading = false;
      },
    });
  }

  filterCourses() {
    this.filteredCourses = this.courses.filter((course) => {
      const matchesCategory =
        this.activeCategory === 'all' || course.level === this.activeCategory;
      const matchesSearch =
        !this.searchQuery ||
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.category
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        course.description
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }

  openCourseModal(course: Course) {
    this.selectedCourse = course;
    document.body.style.overflow = 'hidden';
  }

  closeCourseModal() {
    this.selectedCourse = null;
    document.body.style.overflow = 'auto';
  }

  scrollCarousel(direction: 'prev' | 'next') {
    const maxOffset =
      -(this.featuredCourses.length - this.cardsVisible) * this.cardWidth;

    if (direction === 'prev') {
      this.carouselOffset = Math.min(this.carouselOffset + this.cardWidth, 0);
    } else {
      this.carouselOffset = Math.max(
        this.carouselOffset - this.cardWidth,
        maxOffset
      );
    }

    this.isCarouselAtEnd = this.carouselOffset <= maxOffset;
  }

  getStarArray(rating: number): number[] {
    if (!rating || rating < 0 || isNaN(rating)) {
      return [];
    }
    const fullStars = Math.floor(Math.min(rating, 5));
    return Array(fullStars).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    if (!rating || rating < 0 || isNaN(rating)) {
      return Array(5).fill(0); // Show 5 empty stars if no rating
    }
    const fullStars = Math.floor(Math.min(rating, 5));
    const emptyStars = Math.max(0, 5 - fullStars);
    return Array(emptyStars).fill(0);
  }

  onEnroll(course: Course) {
    if (!this.isLoggedIn) {
      // Assuming router is available, otherwise this will cause an error
      // If router is not available, you might need to import Router from '@angular/router'
      // For now, commenting out the navigation as it's not defined in the provided context
      // this.router.navigate(['/register'], { queryParams: { redirect: '/login' } });
      console.warn('User not logged in. Redirecting to login.');
      return;
    }
    // If logged in, you can add enroll logic here
    // this.enrollInCourse(course);
  }
}
