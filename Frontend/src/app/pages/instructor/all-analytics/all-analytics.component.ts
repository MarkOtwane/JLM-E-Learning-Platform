import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-all-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Analytics Overview</h1>
          <p class="subtitle">
            Track performance metrics across all your courses
          </p>
        </div>
      </div>

      <div class="feature-notice">
        <i class="fas fa-chart-bar icon"></i>
        <h2>Course Analytics</h2>
        <p>
          View comprehensive analytics including student engagement, completion
          rates, quiz scores, and assignment submissions.
        </p>
        <p class="note">
          For detailed course-specific analytics, go to
          <strong>My Courses</strong> and select a course, then click on
          Analytics.
        </p>
        <button class="btn-primary" routerLink="/instructor/my-courses">
          <i class="fas fa-book"></i>
          View My Courses
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 2rem;
      }

      .page-header {
        margin-bottom: 2rem;
      }

      .page-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0;
      }

      .subtitle {
        color: #6b7280;
        margin-top: 0.5rem;
      }

      .feature-notice {
        background: white;
        border-radius: 0.75rem;
        padding: 3rem;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        max-width: 600px;
        margin: 0 auto;
      }

      .icon {
        font-size: 4rem;
        color: #4f46e5;
        margin-bottom: 1.5rem;
      }

      .feature-notice h2 {
        font-size: 1.5rem;
        color: #1a202c;
        margin-bottom: 1rem;
      }

      .feature-notice p {
        color: #6b7280;
        margin-bottom: 1rem;
        line-height: 1.6;
      }

      .note {
        background: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1.5rem 0;
      }

      .btn-primary {
        background: #4f46e5;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .btn-primary:hover {
        background: #4338ca;
      }
    `,
  ],
})
export class AllAnalyticsComponent {}
