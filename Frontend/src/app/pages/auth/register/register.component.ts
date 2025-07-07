import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationComponent } from '../../../shared/notifications/notification.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, NotificationComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  showPassword = false;
  role: 'learner' | 'instructor' = 'learner';
  expertise = '';
  cvFile: File | null = null;

  showMessage = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  constructor(private router: Router, private authService: AuthService) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (file && file.type === 'application/pdf') {
      this.cvFile = file;
    } else {
      this.cvFile = null;
      this.showMessage = true;
      this.message = 'Please upload a valid PDF file.';
      this.messageType = 'error';
    }
  }

  isFormInvalid(): boolean {
    if (!this.fullName || !this.email || !this.password) return true;
    return false;
  }

  onRegister() {
    if (this.isFormInvalid()) {
      this.message = 'All fields are required.';
      this.messageType = 'error';
      this.showMessage = true;
      return;
    }

    const payload: any = {
      name: this.fullName,
      email: this.email,
      password: this.password,
      role: this.role === 'learner' ? 'STUDENT' : 'INSTRUCTOR',
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.message = 'Registration successful!';
        this.messageType = 'success';
        this.showMessage = true;
        this.fullName = '';
        this.email = '';
        this.password = '';
        this.expertise = '';
        this.cvFile = null;
        this.role = 'learner';
        setTimeout(() => {
          if (payload.role === 'INSTRUCTOR') {
            this.router.navigate(['/pending']);
          } else {
            this.router.navigate(['/login']);
          }
        }, 1000);
      },
      error: (error) => {
        this.message =
          error.error?.message || 'Registration failed. Please try again.';
        this.messageType = 'error';
        this.showMessage = true;
      },
    });
  }
}
