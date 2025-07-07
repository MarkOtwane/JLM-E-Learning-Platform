import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css'],
  imports: [FormsModule, CommonModule]
})
export class InstructorDashboardComponent implements OnInit {
  instructorName: string = '';
  courseCount: number = 0;
  totalStudents: number = 0;
  totalEarnings: number = 0;
  recentActivity: string[] = [];

  ngOnInit(): void {
    // These values would eventually come from the backend
    this.instructorName = 'Jane Smith';
    this.courseCount = 4;
    this.totalStudents = 123;
    this.totalEarnings = 4200;
    this.recentActivity = [
      'Published "Intro to Web Development"',
      'Updated lesson content for "Angular Basics"',
      'New enrollment in "Node.js API Design"',
      'Student review posted on "TypeScript Essentials"'
    ];
  }
}
