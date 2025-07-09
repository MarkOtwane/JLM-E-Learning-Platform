import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ApiService } from './api.service';

// ========================================
// INTERFACES
// ========================================
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  bio?: string;
  profilePictureUrl?: string;
  yearOfStudy?: string;
  studentId?: string;
  program?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  yearOfStudy?: string;
  program?: string;
}

export interface PasswordChangeRequest {
  emailCode: string;
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  // ========================================
  // PRIVATE PROPERTIES
  // ========================================
  private readonly PROFILE_STORAGE_KEY = 'student_profile';
  private readonly DEFAULT_PROFILE: StudentProfile = {
    id: '',
    name: 'Leah Achieng',
    email: 'leah@example.com',
    phone: '',
    gender: '',
    bio: '',
    profilePictureUrl: '',
    yearOfStudy: '4th year',
    studentId: '',
    program: '',
  };

  // BehaviorSubject to maintain current profile state
  private profileSubject = new BehaviorSubject<StudentProfile>(
    this.DEFAULT_PROFILE
  );
  
  // ========================================
  // PUBLIC OBSERVABLES
  // ========================================
  
  /**
   * Observable to subscribe to profile changes
   */
  public profile$ = this.profileSubject.asObservable();

  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor(private api: ApiService) {
    this.loadProfileFromStorage();
  }

  // ========================================
  // PROFILE DATA METHODS
  // ========================================
  
  /**
   * Get current profile data
   */
  getCurrentProfile(): StudentProfile {
    return this.profileSubject.value;
  }

  /**
   * Update profile data
   */
  updateProfile(updates: ProfileUpdateRequest): Observable<StudentProfile> {
    // Only send allowed fields
    const allowed: any = {};
    if (updates.name) allowed.name = updates.name;
    if (updates.email) allowed.email = updates.email;
    if (updates.yearOfStudy) allowed.yearOfStudy = updates.yearOfStudy;
    if (updates.program) allowed.program = updates.program;
    return this.api.putAuth<StudentProfile>(`/users/me`, allowed);
  }

  /**
   * Update profile picture
   */
  updateProfilePicture(file: File): Observable<string> {
    const userId = this.getCurrentProfile().id;
    const formData = new FormData();
    formData.append('file', file);
    return this.api
      .postAuth<{ profilePictureUrl: string }>(
        `/users/profile/${userId}/picture`,
        formData
      )
      .pipe(map((res) => res.profilePictureUrl));
  }

  /**
   * Send verification code for password change
   */
  sendVerificationCode(): Observable<boolean> {
    return new Observable((observer) => {
      try {
        const email = this.getCurrentProfile().email;
        
        // TODO: Replace with actual API call
        console.log(`Sending verification code to ${email}`);
        
        this.simulateApiCall(() => {
          observer.next(true);
          observer.complete();
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Change password
   */
  changePassword(request: PasswordChangeRequest): Observable<boolean> {
    return new Observable((observer) => {
      try {
        // TODO: Replace with actual API call
        console.log('Password change request:', {
          email: this.getCurrentProfile().email,
          emailCode: request.emailCode,
          // Don't log actual passwords in production
        });
        
        this.simulateApiCall(() => {
          observer.next(true);
          observer.complete();
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Load profile from backend (call this on app initialization)
   */
  loadProfileFromBackend(): Observable<StudentProfile> {
    return this.api.getAuth<StudentProfile>(`/users/me`).pipe(
      map((profile) => {
        this.profileSubject.next(profile);
        this.saveProfileToStorage(profile);
        return profile;
      })
    );
  }

  // ========================================
  // UTILITY METHODS
  // ========================================
  
  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(): number {
    const profile = this.getCurrentProfile();
    const fields = [
      'name',
      'email',
      'profilePictureUrl',
      'phone',
      'gender',
      'bio',
    ];
    const filledFields = fields.filter((field) => {
      const value = profile[field as keyof StudentProfile];
      return value && value.toString().trim() !== '';
    });
    return Math.round((filledFields.length / fields.length) * 100);
  }

  /**
   * Get display name with year
   */
  getDisplayName(): string {
    const profile = this.getCurrentProfile();
    return `${profile.name} ${profile.yearOfStudy || ''}`.trim();
  }

  /**
   * Get profile picture URL or default
   */
  getProfilePictureUrl(): string {
    const profile = this.getCurrentProfile();
    return profile.profilePictureUrl || 'assets/default-profile.jpg';
  }

  /**
   * Get user initials for placeholder
   */
  getUserInitials(): string {
    const profile = this.getCurrentProfile();
    return profile.name.charAt(0).toUpperCase();
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================
  
  /**
   * Save profile to local storage
   */
  private saveProfileToStorage(profile: StudentProfile): void {
    try {
      localStorage.setItem(this.PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile to storage:', error);
    }
  }

  /**
   * Load profile from local storage
   */
  private loadProfileFromStorage(): StudentProfile {
    try {
      const stored = localStorage.getItem(this.PROFILE_STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        this.profileSubject.next(profile);
        return profile;
      }
    } catch (error) {
      console.error('Error loading profile from storage:', error);
    }
    
    return this.DEFAULT_PROFILE;
  }

  /**
   * Simulate API call delay
   */
  private simulateApiCall(callback: () => void, delay: number = 1000): void {
    setTimeout(callback, delay);
  }

  // ========================================
  // BACKEND INTEGRATION PLACEHOLDERS
  // ========================================
  
  /**
   * TODO: Replace these with actual HTTP calls
   * 
   * Example API endpoints you'll need:
   * - GET /api/profile/{userId} - Get user profile
   * - PUT /api/profile/{userId} - Update user profile
   * - POST /api/profile/{userId}/picture - Upload profile picture
   * - POST /api/auth/send-verification - Send verification code
   * - POST /api/auth/change-password - Change password
   */
  
  /*
  // Example of how to implement with HttpClient:
  
  private http = inject(HttpClient);
  private apiUrl = 'http://your-api-url.com/api';
  
  updateProfile(updates: ProfileUpdateRequest): Observable<StudentProfile> {
    const userId = this.getCurrentProfile().id;
    return this.http.put<StudentProfile>(`${this.apiUrl}/profile/${userId}`, updates);
  }
  
  uploadProfilePicture(file: File): Observable<{profilePictureUrl: string}> {
    const userId = this.getCurrentProfile().id;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{profilePictureUrl: string}>(`${this.apiUrl}/profile/${userId}/picture`, formData);
  }
  */
}
