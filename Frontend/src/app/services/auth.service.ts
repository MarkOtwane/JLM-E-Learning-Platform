import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface AppUser {
  id: string;
  email: string;
  role: string; // 'instructor', 'student', 'admin'
  firstName?: string;
  lastName?: string;
  isApproved?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'instructor' | 'student';
}

export interface AuthResponse {
  user: AppUser;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  user$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Check for existing token on app start
    this.checkAuthStatus();
  }

  // Login user
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.apiService.setAuthToken(response.token);
        this.currentUserSubject.next(response.user);
        this.checkAuthStatus(); // Force reload user from backend
      })
    );
  }

  // Register user
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/register', userData).pipe(
      tap((response) => {
        this.apiService.setAuthToken(response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map((user) => !!user));
  }

  // Check if user is instructor
  isInstructor(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.role === 'instructor'));
  }

  // Check if user is student
  isStudent(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.role === 'student'));
  }

  // Check if user is admin
  isAdmin(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.role === 'admin'));
  }

  // Get current user
  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  // Check authentication status on app start
  private checkAuthStatus(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token with backend
      this.apiService.getAuth<AppUser>('/auth/me').subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: () => {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
          this.currentUserSubject.next(null);
        },
      });
    }
  }

  // Synchronous check for student login (for route guards)
  isStudentLoggedIn(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'student';
  }
}
