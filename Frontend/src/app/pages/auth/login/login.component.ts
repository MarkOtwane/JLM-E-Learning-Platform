import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationComponent } from '../../../shared/notifications/notification.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;

  // Notification state
  showMessage = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.showNotification('All fields are required.', 'error');
      return;
    }

    this.isLoading = true;
    this.showMessage = false;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showNotification('Login successful!', 'success');

        // Clear form
        this.email = '';
        this.password = '';

        // Navigate based on user role
        if (response.user.role.toLowerCase() === 'instructor') {
          if (!response.user.isApproved) {
            this.router.navigate(['/under-review']);
          } else {
            this.router.navigate(['/instructor/dashboard']);
          }
        } else if (response.user.role.toLowerCase() === 'student') {
          this.router.navigate(['/student/dashboard']);
        } else if (response.user.role.toLowerCase() === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/courses']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);

        const errorMessage = this.getLoginErrorMessage(error);
        this.showNotification(errorMessage, 'error');
      },
    });
  }

  private getLoginErrorMessage(error: unknown): string {
    const err = error as {
      status?: number;
      error?: unknown;
      message?: unknown;
    };

    const apiMessage = this.extractMessage(err?.error);
    const genericMessage = this.extractMessage(err?.message);
    const resolvedMessage =
      apiMessage || genericMessage || 'Login failed. Please try again.';

    const status = err?.status;
    const normalized = resolvedMessage.toLowerCase();

    if (
      status === 401 &&
      normalized.includes('please verify your email before logging in')
    ) {
      return 'Your email is not verified. Please check your inbox and verify your account before logging in.';
    }

    return resolvedMessage;
  }

  private extractMessage(input: unknown): string | null {
    if (typeof input === 'string') {
      const value = input.trim();
      return value.length > 0 ? value : null;
    }

    if (Array.isArray(input)) {
      const value = input
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .join(' ');
      return value.length > 0 ? value : null;
    }

    if (input && typeof input === 'object') {
      const obj = input as {
        message?: unknown;
        error?: unknown;
      };

      return (
        this.extractMessage(obj?.message) || this.extractMessage(obj?.error)
      );
    }

    return null;
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' | 'info',
  ) {
    this.message = message;
    this.messageType = type;
    this.showMessage = true;

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.showMessage = false;
      }, 3000);
    }
  }
}
