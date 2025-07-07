import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AppUser, AuthService } from '../../../services/auth.service';
import {
  StudentProfile,
  UserProfileService,
} from '../../../services/user-profile.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css'],
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  // ========================================
  // COMPONENT PROPERTIES
  // ========================================

  // User profile data
  userProfile: StudentProfile = {
    id: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    bio: '',
    profilePictureUrl: '',
    yearOfStudy: '',
    studentId: '',
    program: '',
  };

  // Course data
  enrolledCourses: { name: string; code?: string; credits?: number }[] = [];
  instructors: { name: string; image: string; subject?: string }[] = [];

  // Loading state
  isLoading = false;

  // Subscription to profile changes
  private profileSubscription?: Subscription;

  loggedInUser: AppUser | null = null;
  private authSubscription?: Subscription;

  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  ngOnInit(): void {
    this.subscribeToProfile();
    this.loadCourseData();
    this.authSubscription = this.authService.user$.subscribe((user) => {
      this.loggedInUser = user;
    });
  }

  ngOnDestroy(): void {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // ========================================
  // PROFILE DATA METHODS
  // ========================================

  /**
   * Subscribe to profile changes from the service
   */
  private subscribeToProfile(): void {
    this.profileSubscription = this.userProfileService.profile$.subscribe(
      (profile: StudentProfile) => {
        this.userProfile = profile;
      }
    );
  }

  /**
   * Get user display name with year
   */
  getUserDisplayName(): string {
    return this.userProfileService.getDisplayName();
  }

  /**
   * Get profile picture URL or default
   */
  getProfilePictureUrl(): string {
    return this.userProfileService.getProfilePictureUrl();
  }

  /**
   * Get user initials for placeholder
   */
  getUserInitials(): string {
    return this.userProfileService.getUserInitials();
  }

  /**
   * Check if user has profile picture
   */
  hasProfilePicture(): boolean {
    return !!this.userProfile.profilePictureUrl;
  }

  getLoggedInStudentName(): string {
    return (
      this.loggedInUser?.firstName || this.loggedInUser?.email || 'Student'
    );
  }

  // ========================================
  // COURSE DATA METHODS
  // ========================================

  /**
   * Load course and instructor data
   */
  private loadCourseData(): void {
    this.isLoading = true;
    this.apiService.getAuth<any[]>('/students/courses').subscribe({
      next: (courses) => {
        this.enrolledCourses = courses;
        this.isLoading = false;
      },
      error: () => {
        this.enrolledCourses = [];
        this.isLoading = false;
      },
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get welcome message based on time of day
   */
  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    return `${greeting}, ${this.getLoggedInStudentName()}!`;
  }

  /**
   * Get total credits from enrolled courses
   */
  getTotalCredits(): number {
    return this.enrolledCourses.reduce((total, course) => {
      return total + (course.credits || 0);
    }, 0);
  }

  /**
   * Navigate to course details (placeholder)
   */
  onCourseClick(course: any): void {
    console.log('Navigate to course:', course.name);
    // TODO: Implement navigation to course details
  }

  /**
   * Navigate to instructor profile (placeholder)
   */
  onInstructorClick(instructor: any): void {
    console.log('Navigate to instructor:', instructor.name);
    // TODO: Implement navigation to instructor profile
  }

  /**
   * Navigate to profile page (placeholder)
   */
  onProfileClick(): void {
    console.log('Navigate to profile page');
    // TODO: Implement navigation to profile page
  }

  // ========================================
  // BACKEND INTEGRATION PLACEHOLDERS
  // ========================================

  /**
   * TODO: Replace these with actual API calls
   *
   * Example API endpoints you'll need:
   * - GET /api/student/{studentId}/courses - Get enrolled courses
   * - GET /api/student/{studentId}/instructors - Get course instructors
   * - GET /api/student/{studentId}/dashboard - Get dashboard data
   */

  /*
  // Example of how to implement with HttpClient:
  
  private http = inject(HttpClient);
  private apiUrl = 'http://your-api-url.com/api';
  
  loadEnrolledCourses(): Observable<Course[]> {
    const studentId = this.userProfile.id;
    return this.http.get<Course[]>(`${this.apiUrl}/student/${studentId}/courses`);
  }
  
  loadInstructors(): Observable<Instructor[]> {
    const studentId = this.userProfile.id;
    return this.http.get<Instructor[]>(`${this.apiUrl}/student/${studentId}/instructors`);
  }
  */
}
