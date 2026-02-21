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

        const errorMessage =
          error.error?.message ||
          error.message ||
          'Login failed. Please try again.';
        this.showNotification(errorMessage, 'error');
      },
    });
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
