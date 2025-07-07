import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppUser, AuthService } from '../../../services/auth.service';
import {
  ProfileUpdateRequest,
  StudentProfile,
  UserProfileService,
} from '../../../services/user-profile.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css'],
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  // ========================================
  // COMPONENT PROPERTIES
  // ========================================

  // Current profile data
  profile: StudentProfile = {
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

  // Store logged-in user
  loggedInUser: AppUser | null = null;

  // Profile completion percentage
  profileCompletion = 0;

  // Modal visibility flags
  showEditModal = false;
  showPasswordModal = false;

  // Temporary profile data for editing
  updatedProfile: StudentProfile = { ...this.profile };

  // Password change form data
  emailCode = '';
  oldPassword = '';
  newPassword = '';
  codeSent = false;

  // Loading states
  isLoading = false;
  isUpdatingPicture = false;
  isSendingCode = false;

  // Subscription to profile changes
  private profileSubscription?: Subscription;

  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {}

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.loggedInUser = user;
      if (user) {
        this.subscribeToProfile();
        this.loadProfile(user.id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  // ========================================
  // PROFILE DATA METHODS
  // ========================================

  /**
   * Subscribe to profile changes
   */
  private subscribeToProfile(): void {
    this.profileSubscription = this.userProfileService.profile$.subscribe(
      (profile: StudentProfile) => {
        this.profile = profile;
        this.updateProfileCompletion();
      }
    );
  }

  /**
   * Load profile data (for initial load or refresh)
   */
  private loadProfile(userId: string): void {
    this.isLoading = true;
    this.userProfileService.loadProfileFromBackend(userId).subscribe({
      next: (profile: any) => {
        this.isLoading = false;
        // Profile is automatically updated through subscription
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
      },
    });
  }

  // ========================================
  // PROFILE PICTURE METHODS
  // ========================================

  /**
   * Handles profile picture upload
   */
  updateProfilePicture(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    this.isUpdatingPicture = true;

    this.userProfileService.updateProfilePicture(file).subscribe({
      next: (profilePictureUrl: any) => {
        this.isUpdatingPicture = false;
        console.log('Profile picture updated successfully');
        // Profile is automatically updated through subscription
      },
      error: (error: any) => {
        this.isUpdatingPicture = false;
        console.error('Error updating profile picture:', error);
        alert(error || 'Error updating profile picture. Please try again.');
      },
    });
  }

  // ========================================
  // PROFILE COMPLETION METHODS
  // ========================================

  /**
   * Updates profile completion percentage
   */
  updateProfileCompletion(): void {
    this.profileCompletion =
      this.userProfileService.calculateProfileCompletion();
  }

  // ========================================
  // EDIT PROFILE MODAL METHODS
  // ========================================

  /**
   * Opens the edit profile modal
   */
  openEditModal(): void {
    this.updatedProfile = { ...this.profile };
    this.showEditModal = true;
  }

  /**
   * Saves the updated profile and closes modal
   */
  onSaveProfile(): void {
    // Client-side validation
    if (!this.updatedProfile.name || !this.updatedProfile.email) {
      alert('Name and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.updatedProfile.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Prepare update request
    const updateRequest: ProfileUpdateRequest = {
      name: this.updatedProfile.name,
      email: this.updatedProfile.email,
      phone: this.updatedProfile.phone,
      gender: this.updatedProfile.gender,
      bio: this.updatedProfile.bio,
      yearOfStudy: this.updatedProfile.yearOfStudy,
      program: this.updatedProfile.program,
    };

    this.isLoading = true;

    this.userProfileService.updateProfile(updateRequest).subscribe({
      next: (updatedProfile: any) => {
        this.isLoading = false;
        this.closeEditModal();
        console.log('Profile updated successfully');
        // Profile is automatically updated through subscription
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
      },
    });
  }

  /**
   * Closes the edit profile modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.updatedProfile = { ...this.profile };
  }

  // ========================================
  // CHANGE PASSWORD MODAL METHODS
  // ========================================

  /**
   * Opens the change password modal and sends verification code
   */
  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.resetPasswordForm();
    this.sendVerificationCode();
  }

  /**
   * Sends verification code to user's email
   */
  sendVerificationCode(): void {
    this.isSendingCode = true;

    this.userProfileService.sendVerificationCode().subscribe({
      next: (success: any) => {
        this.isSendingCode = false;
        if (success) {
          this.codeSent = true;
          console.log('Verification code sent successfully');
        }
      },
      error: (error: any) => {
        this.isSendingCode = false;
        console.error('Error sending verification code:', error);
        alert('Error sending verification code. Please try again.');
      },
    });
  }

  /**
   * Handles password change form submission
   */
  onChangePassword(): void {
    // Client-side validation
    if (!this.emailCode || !this.oldPassword || !this.newPassword) {
      alert('All fields are required');
      return;
    }

    if (this.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    if (this.oldPassword === this.newPassword) {
      alert('New password must be different from current password');
      return;
    }

    this.isLoading = true;

    this.userProfileService
      .changePassword({
        emailCode: this.emailCode,
        oldPassword: this.oldPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (success: any) => {
          this.isLoading = false;
          if (success) {
            alert('Password changed successfully');
            this.closePasswordModal();
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error changing password:', error);
          alert('Error changing password. Please try again.');
        },
      });
  }

  /**
   * Closes the change password modal
   */
  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.resetPasswordForm();
  }

  /**
   * Resets password form fields
   */
  private resetPasswordForm(): void {
    this.emailCode = '';
    this.oldPassword = '';
    this.newPassword = '';
    this.codeSent = false;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get user initials for placeholder avatar
   */
  getUserInitials(): string {
    return this.userProfileService.getUserInitials();
  }

  /**
   * Generic method to close any modal (for backward compatibility)
   */
  onClose(): void {
    this.showEditModal = false;
    this.showPasswordModal = false;
  }
}
