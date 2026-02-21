import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-test-connection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="test-container">
      <h2>Backend Connection Test</h2>

      <div class="test-section">
        <h3>API Connection Test</h3>
        <button (click)="testApiConnection()" [disabled]="testing">
          {{ testing ? 'Testing...' : 'Test API Connection' }}
        </button>
        <div *ngIf="apiResult" class="result" [ngClass]="apiStatus">
          <i
            class="fas fa-check-circle result-icon"
            *ngIf="apiStatus === 'success'"
            aria-hidden="true"
          ></i>
          <i
            class="fas fa-times-circle result-icon"
            *ngIf="apiStatus === 'error'"
            aria-hidden="true"
          ></i>
          <i
            class="fas fa-spinner result-icon fa-spin"
            *ngIf="apiStatus === 'pending'"
            aria-hidden="true"
          ></i>
          <span class="result-label"><strong>Result:</strong></span>
          {{ apiResult }}
        </div>
      </div>

      <div class="test-section">
        <h3>Authentication Test</h3>
        <div class="login-form">
          <input [(ngModel)]="testEmail" placeholder="Email" type="email" />
          <input
            [(ngModel)]="testPassword"
            placeholder="Password"
            type="password"
          />
          <button (click)="testLogin()" [disabled]="testingAuth">
            {{ testingAuth ? 'Logging in...' : 'Test Login' }}
          </button>
        </div>
        <div *ngIf="authResult" class="result" [ngClass]="authStatus">
          <i
            class="fas fa-check-circle result-icon"
            *ngIf="authStatus === 'success'"
            aria-hidden="true"
          ></i>
          <i
            class="fas fa-times-circle result-icon"
            *ngIf="authStatus === 'error'"
            aria-hidden="true"
          ></i>
          <i
            class="fas fa-spinner result-icon fa-spin"
            *ngIf="authStatus === 'pending'"
            aria-hidden="true"
          ></i>
          <span class="result-label"><strong>Result:</strong></span>
          {{ authResult }}
        </div>
      </div>

      <div class="test-section">
        <h3>Current User Status</h3>
        <div *ngIf="currentUser; else noUser">
          <p><strong>Logged in as:</strong> {{ currentUser.email }}</p>
          <p><strong>Role:</strong> {{ currentUser.role }}</p>
          <button (click)="logout()">Logout</button>
        </div>
        <ng-template #noUser>
          <p>No user logged in</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .test-container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
      .test-section {
        margin-bottom: 30px;
        padding: 15px;
        border: 1px solid #eee;
        border-radius: 5px;
      }
      .login-form {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      .login-form input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      button {
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .result {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
      }
      .result.success {
        border-left: 3px solid #16a34a;
      }
      .result.error {
        border-left: 3px solid #dc2626;
      }
      .result.pending {
        border-left: 3px solid #2563eb;
      }
      .result-icon {
        font-size: 1rem;
      }
      .result.success .result-icon {
        color: #16a34a;
      }
      .result.error .result-icon {
        color: #dc2626;
      }
      .result.pending .result-icon {
        color: #2563eb;
      }
      .result-label {
        margin-right: 4px;
      }
    `,
  ],
})
export class TestConnectionComponent implements OnInit {
  testing = false;
  testingAuth = false;
  apiResult = '';
  authResult = '';
  apiStatus: 'idle' | 'pending' | 'success' | 'error' = 'idle';
  authStatus: 'idle' | 'pending' | 'success' | 'error' = 'idle';
  currentUser: any = null;
  testEmail = 'test@example.com';
  testPassword = 'password123';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  testApiConnection() {
    this.testing = true;
    this.apiStatus = 'pending';
    this.apiResult = 'Testing connection...';

    // Test a simple GET request to the backend
    this.apiService.get('/auth/login').subscribe({
      next: (response) => {
        this.apiStatus = 'success';
        this.apiResult = 'API connection successful. Backend is reachable.';
        this.testing = false;
      },
      error: (error) => {
        this.apiStatus = 'error';
        this.apiResult = `API connection failed: ${
          error.message || 'Unknown error'
        }`;
        this.testing = false;
      },
    });
  }

  testLogin() {
    this.testingAuth = true;
    this.authStatus = 'pending';
    this.authResult = 'Attempting login...';

    this.authService.login(this.testEmail, this.testPassword).subscribe({
      next: (response) => {
        this.authStatus = 'success';
        this.authResult = 'Login successful. User authenticated.';
        this.testingAuth = false;
      },
      error: (error) => {
        this.authStatus = 'error';
        this.authResult = `Login failed: ${
          error.error?.message || error.message || 'Unknown error'
        }`;
        this.testingAuth = false;
      },
    });
  }

  logout() {
    this.authService.logout();
    this.authResult = 'User logged out';
  }
}
