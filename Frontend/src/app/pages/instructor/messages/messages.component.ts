import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-envelope"></i> Messages</h1>
          <p class="subtitle">Communicate with your students</p>
        </div>
        <button class="btn-primary">
          <i class="fas fa-paper-plane"></i>
          New Message
        </button>
      </div>

      <div class="feature-notice">
        <i class="fas fa-envelope icon"></i>
        <h2>Messaging System</h2>
        <p>
          Send direct messages to your students, respond to their questions, and
          maintain effective communication throughout your courses.
        </p>
        <p class="note">
          Coming soon! A comprehensive messaging system with threaded
          conversations, file attachments, and real-time notifications.
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 2rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .page-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .subtitle {
        color: #6b7280;
        margin-top: 0.5rem;
      }

      .btn-primary {
        background: #4f46e5;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-primary:hover {
        background: #4338ca;
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
        color: #374151;
      }
    `,
  ],
})
export class MessagesComponent {}
