import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // --- Token Management ---
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  clearToken(): void {
    localStorage.removeItem('authToken');
  }

  // --- Auth Header ---
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  // --- Error Handler ---
  private handleAuthError = (error: any) => {
    if (error.status === 401) {
      this.clearToken();
      this.router.navigate(['/login']);
    } else if (error.status === 404) {
      console.warn('Resource not found:', error.url);
    } else if (error.status >= 500) {
      console.error('Server error:', error);
    }
    return throwError(() => error);
  };

  // --- HTTP Methods ---
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.get<T>(url, { params }).pipe(
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.post<T>(url, data).pipe(
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.put<T>(url, data).pipe(
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.delete<T>(url).pipe(
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.patch<T>(url, data).pipe(
      catchError((error) => {
        console.error('API Error:', error);
        return throwError(() => error);
      }),
    );
  }

  // --- Authenticated Methods ---
  getAuth<T>(
    endpoint: string,
    params?: HttpParams,
    retryCount: number = 0,
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http
      .get<T>(url, {
        params,
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && retryCount < 1) {
            // Auto-refresh token logic could be added here
            return this.getAuth<T>(endpoint, params, retryCount + 1);
          }
          return this.handleAuthError(error);
        }),
      );
  }

  postAuth<T>(
    endpoint: string,
    data: any,
    retryCount: number = 0,
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // If data is FormData, do not set Content-Type (let browser set it)
    const isFormData =
      typeof FormData !== 'undefined' && data instanceof FormData;
    const headers = isFormData
      ? this.getAuthHeaders().delete('Content-Type')
      : this.getAuthHeaders();
    return this.http
      .post<T>(url, data, {
        headers,
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && retryCount < 1) {
            // Auto-refresh token logic could be added here
            return this.postAuth<T>(endpoint, data, retryCount + 1);
          }
          return this.handleAuthError(error);
        }),
      );
  }

  putAuth<T>(
    endpoint: string,
    data: any,
    retryCount: number = 0,
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http
      .put<T>(url, data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && retryCount < 1) {
            // Auto-refresh token logic could be added here
            return this.putAuth<T>(endpoint, data, retryCount + 1);
          }
          return this.handleAuthError(error);
        }),
      );
  }

  deleteAuth<T>(endpoint: string, retryCount: number = 0): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http
      .delete<T>(url, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && retryCount < 1) {
            // Auto-refresh token logic could be added here
            return this.deleteAuth<T>(endpoint, retryCount + 1);
          }
          return this.handleAuthError(error);
        }),
      );
  }

  patchAuth<T>(
    endpoint: string,
    data: any,
    retryCount: number = 0,
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http
      .patch<T>(url, data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && retryCount < 1) {
            // Auto-refresh token logic could be added here
            return this.patchAuth<T>(endpoint, data, retryCount + 1);
          }
          return this.handleAuthError(error);
        }),
      );
  }

  // --- Role Checking (optional, if user info is stored) ---
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

  isStudent(): boolean {
    return this.getUserRole() === 'STUDENT';
  }
}
