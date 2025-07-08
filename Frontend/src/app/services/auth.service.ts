import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  user$ = new BehaviorSubject<any>(null);

  constructor(private api: ApiService, private router: Router) {
    const user = localStorage.getItem('user');
    if (user) {
      this.user$.next(JSON.parse(user));
  }
  }

  login(email: string, password: string): Observable<any> {
    return new Observable((observer) => {
      this.api.post('/auth/login', { email, password }).subscribe({
        next: (res: any) => {
          if (res.accessToken) {
            this.api.setAuthToken(res.accessToken);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.user$.next(res.user);
            observer.next(res);
          } else {
            observer.error('No token in response');
          }
        },
        error: (err) => observer.error(err),
      });
    });
  }

  logout(): void {
    this.api.clearToken();
    localStorage.removeItem('user');
    this.user$.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.api.getToken();
  }

  isLoggedIn(): boolean {
    return this.api.isLoggedIn();
  }

  getUserRole(): string | null {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user).role || null;
    } catch {
      return null;
    }
  }

  isInstructor(): boolean {
    return this.getUserRole() === 'INSTRUCTOR';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  // Check if user is student
  isStudent(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.role === 'student'));
  }

  // Get current user
  getCurrentUser(): AppUser | null {
    return this.user$.value;
  }

  register(userData: any) {
    return this.api.post('/auth/register', userData);
  }

  isAdminUser(): boolean {
    const user = localStorage.getItem('user');
    if (!user) return false;
    try {
      const parsed = JSON.parse(user);
      return parsed.role === 'ADMIN' || parsed.role === 'admin';
    } catch {
      return false;
    }
  }
}
