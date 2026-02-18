import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AppUser, AuthService } from '../../../services/auth.service';
import { Message, MessagingService } from '../../../services/messaging.service';
import {
  StudentProfile,
  UserProfileService,
} from '../../../services/user-profile.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
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
  enrolledCourses: any[] = [];
  availableCourses: any[] = [];
  instructors: { name: string; image: string; subject?: string }[] = [];

  // Message data
  receivedMessages: Message[] = [];
  selectedMessage: Message | null = null;
  messageReplyText: string = '';
  unreadCount: number = 0;
  showMessageReply: boolean = false;

  // Loading state
  isLoading = false;
  isLoadingMessages = false;
  isReplyLoading = false;

  // Subscription to profile changes
  private profileSubscription?: Subscription;
  private authSubscription?: Subscription;
  private unreadSubscription?: Subscription;

  loggedInUser: AppUser | null = null;

  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private apiService: ApiService,
    private messagingService: MessagingService,
    private router: Router,
  ) {}

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  ngOnInit(): void {
    this.subscribeToProfile();
    this.subscribeToUnreadCount();
    this.loadCourseData();
    this.loadAvailableCourses();
    this.loadMessages();
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
    if (this.unreadSubscription) {
      this.unreadSubscription.unsubscribe();
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
      },
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
        this.extractInstructors();
        this.isLoading = false;
        this.loadAvailableCourses();
      },
      error: (error) => {
        console.error('Failed to load enrolled courses:', error);
        this.enrolledCourses = [];
        this.instructors = [];
        this.isLoading = false;
        this.loadAvailableCourses();
      },
    });
  }

  /**
   * Extract unique instructors from enrolled courses
   */
  private extractInstructors(): void {
    const instructorMap = new Map<
      string,
      { name: string; image: string; subject?: string }
    >();

    this.enrolledCourses.forEach((course) => {
      if (course.instructor && !instructorMap.has(course.instructor.id)) {
        instructorMap.set(course.instructor.id, {
          name: course.instructor.name,
          image:
            course.instructor.profilePicture || '/assets/default-avatar.png',
          subject: course.category,
        });
      }
    });

    this.instructors = Array.from(instructorMap.values());
  }

  /**
   * Load all available courses (not just enrolled)
   */
  private loadAvailableCourses(): void {
    this.apiService.getAuth<any[]>('/courses').subscribe({
      next: (courses) => {
        // Filter out already enrolled courses
        const enrolledIds = new Set(this.enrolledCourses.map((c) => c.id));
        this.availableCourses = courses.filter((c) => !enrolledIds.has(c.id));
        this.extractInstructors();
      },
      error: (error) => {
        console.error('Failed to load available courses:', error);
        this.availableCourses = [];
      },
    });
  }

  /**
   * Enroll in a course
   */
  enrollInCourse(courseId: string): void {
    this.apiService.postAuth('/students/enroll', { courseId }).subscribe({
      next: () => {
        this.loadCourseData();
        this.loadAvailableCourses();
      },
      error: (err) => {
        console.error('Enrollment error:', err);
        alert(err?.error?.message || 'Failed to enroll in course.');
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
   * Navigate to course details (now navigates to course learning page)
   */
  onCourseClick(course: any): void {
    if (course && course.id) {
      this.router.navigate(['/learning/course', course.id]);
    }
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
  // MESSAGING METHODS
  // ========================================

  /**
   * Subscribe to unread message count
   */
  private subscribeToUnreadCount(): void {
    this.unreadSubscription = this.messagingService.unreadCount$.subscribe(
      (count) => {
        this.unreadCount = count;
      },
    );
  }

  /**
   * Load received messages
   */
  private loadMessages(): void {
    this.isLoadingMessages = true;
    this.messagingService.getReceivedMessages(0, 10).subscribe({
      next: (response) => {
        this.receivedMessages = response.messages;
        this.isLoadingMessages = false;
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
        this.receivedMessages = [];
        this.isLoadingMessages = false;
      },
    });
  }

  /**
   * Select a message to view and mark as read
   */
  selectMessage(message: Message): void {
    this.selectedMessage = message;
    this.showMessageReply = false;
    this.messageReplyText = '';

    // Mark as read if not already read
    if (!message.isRead) {
      this.messagingService.markAsRead(message.id).subscribe({
        next: (updatedMessage) => {
          const index = this.receivedMessages.findIndex(
            (m) => m.id === message.id,
          );
          if (index !== -1) {
            this.receivedMessages[index] = updatedMessage;
            this.selectedMessage = updatedMessage;
          }
          this.messagingService.loadUnreadCount();
        },
        error: (error) => {
          console.error('Failed to mark message as read:', error);
        },
      });
    }
  }

  /**
   * Open reply form for selected message
   */
  openReplyForm(): void {
    this.showMessageReply = true;
  }

  /**
   * Close reply form
   */
  closeReplyForm(): void {
    this.showMessageReply = false;
    this.messageReplyText = '';
  }

  /**
   * Send reply to selected message
   */
  sendReply(): void {
    if (!this.selectedMessage || !this.messageReplyText.trim()) {
      return;
    }

    this.isReplyLoading = true;
    const replySubject = `Re: ${this.selectedMessage.subject}`;

    this.messagingService
      .sendMessage(
        this.selectedMessage.senderId,
        replySubject,
        this.messageReplyText,
      )
      .subscribe({
        next: () => {
          this.messageReplyText = '';
          this.showMessageReply = false;
          this.isReplyLoading = false;
          // Show success message (could use a toast service)
          alert('Reply sent successfully!');
          this.loadMessages();
        },
        error: (error) => {
          console.error('Failed to send reply:', error);
          this.isReplyLoading = false;
          alert('Failed to send reply. Please try again.');
        },
      });
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.messagingService.deleteMessage(messageId).subscribe({
        next: () => {
          this.receivedMessages = this.receivedMessages.filter(
            (m) => m.id !== messageId,
          );
          if (this.selectedMessage?.id === messageId) {
            this.selectedMessage = null;
          }
          this.loadMessages();
        },
        error: (error) => {
          console.error('Failed to delete message:', error);
          alert('Failed to delete message. Please try again.');
        },
      });
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year:
          date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  }
}
