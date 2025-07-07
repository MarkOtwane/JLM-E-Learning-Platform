import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationComponent } from '../../../shared/notifications/notification.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NotificationComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;

  // 👇 Notification state
  showMessage = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  constructor(private router: Router, private authService: AuthService) {}

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

  const payload = {
    email: this.email,
      password: this.password,
    };

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showNotification('Login successful!', 'success');

        // Clear form
    this.email = '';
    this.password = '';

        // Navigate based on user role
        if (response.user.role.toLowerCase() === 'instructor') {
          if (!response.user.isApproved) {
            setTimeout(() => this.router.navigate(['/under-review']), 0);
          } else {
            setTimeout(() => this.router.navigate(['/instructor/dashboard']), 0);
          }
        } else if (response.user.role.toLowerCase() === 'student') {
          setTimeout(() => this.router.navigate(['/student/dashboard']), 0);
        } else if (response.user.role.toLowerCase() === 'admin') {
          setTimeout(() => this.router.navigate(['/admin/dashboard']), 0);
        } else {
          setTimeout(() => this.router.navigate(['/courses']), 0);
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
    type: 'success' | 'error' | 'info'
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
