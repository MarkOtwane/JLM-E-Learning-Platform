import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <h1 class="page-title">Help & Support</h1>
        <p class="page-description">Get assistance and find answers to your questions</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="card-body text-center">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Documentation</h3>
            <p class="text-sm text-gray-600">Browse our comprehensive guides</p>
          </div>
        </div>

        <div class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="card-body text-center">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Contact Support</h3>
            <p class="text-sm text-gray-600">Chat with our support team</p>
          </div>
        </div>

        <div class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="card-body text-center">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Video Tutorials</h3>
            <p class="text-sm text-gray-600">Watch how-to videos</p>
          </div>
        </div>
      </div>

      <!-- FAQs -->
      <div class="card">
        <div class="card-body">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div class="space-y-4">
            <div *ngFor="let faq of faqs" class="border-b border-gray-200 pb-4 last:border-b-0">
              <button 
                (click)="faq.open = !faq.open"
                class="w-full flex items-start justify-between text-left">
                <span class="font-medium text-gray-900">{{ faq.question }}</span>
                <svg class="w-5 h-5 text-gray-500 flex-shrink-0 transition-transform" 
                     [class.rotate-180]="faq.open"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div *ngIf="faq.open" class="mt-2 text-sm text-gray-600">
                {{ faq.answer }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="card">
        <div class="card-body">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Still need help?</h3>
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input type="text" class="input" placeholder="What do you need help with?">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea class="input" rows="4" placeholder="Describe your issue..."></textarea>
            </div>
            <button type="submit" class="btn-primary">Submit Request</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class HelpComponent {
  faqs = [
    {
      question: 'How do I enroll in a course?',
      answer: 'Navigate to the Course Catalog, find your desired course, and click the "Enroll Now" button. You\'ll be guided through the enrollment process.',
      open: false
    },
    {
      question: 'Can I download my certificates?',
      answer: 'Yes! Once you complete a course, you can download your certificate from the Certificates page. Click the download button on any certificate card.',
      open: false
    },
    {
      question: 'How do I submit assignments?',
      answer: 'Go to the Assignments page, select the assignment you want to submit, and click the "Submit" button. You can upload files or submit text depending on the assignment type.',
      open: false
    },
    {
      question: 'What if I miss a live class?',
      answer: 'Don\'t worry! All live classes are recorded and available in the Live Classes page under the Recordings section.',
      open: false
    }
  ];
}
