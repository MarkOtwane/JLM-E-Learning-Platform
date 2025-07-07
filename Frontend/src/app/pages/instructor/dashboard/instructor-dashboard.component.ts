import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css'],
  imports: [FormsModule, CommonModule],
})
export class InstructorDashboardComponent implements OnInit {
  instructorName: string = '';
  instructorEmail: string = '';
  courseCount: number = 0;
  totalStudents: number = 0;
  totalEarnings: number = 0;
  recentActivity: string[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.instructorEmail = user.email;
        this.instructorName = user.firstName || user.email;
      }
    });
    // These values would eventually come from the backend
    this.courseCount = 4;
    this.totalStudents = 123;
    this.totalEarnings = 4200;
    this.recentActivity = [
      'Published "Intro to Web Development"',
      'Updated lesson content for "Angular Basics"',
      'New enrollment in "Node.js API Design"',
      'Student review posted on "TypeScript Essentials"',
    ];
  }

  goToCreateCourse(): void {
    this.router.navigate(['/instructor/create-course']);
  }
}
