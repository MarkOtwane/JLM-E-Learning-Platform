import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-student-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Backdrop for mobile -->
    <div *ngIf="isOpen && isMobile" 
         (click)="closeSidebar()"
         class="fixed inset-0 bg-black/50 z-[var(--z-modal-backdrop)] lg:hidden animate-fade-in">
    </div>

    <!-- Sidebar -->
    <aside 
      class="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-[var(--z-modal)] transition-all duration-300 ease-in-out"
      [ngClass]="{
        'w-64': isOpen,
        'w-0 lg:w-20': !isOpen,
        'translate-x-0': isOpen,
        '-translate-x-full lg:translate-x-0': !isOpen
      }">
      
      <!-- Sidebar Content -->
      <div class="flex flex-col h-full overflow-hidden">
        <!-- Sidebar Header (Below navbar) -->
        <div class="h-16 border-b border-gray-200 flex items-center px-4 flex-shrink-0">
          <div *ngIf="isOpen" class="flex items-center gap-3 animate-fade-in">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="text-white font-bold text-lg">J</span>
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-900">Student Portal</h2>
              <p class="text-xs text-gray-500">Learning Hub</p>
            </div>
          </div>
          <div *ngIf="!isOpen" class="flex items-center justify-center w-full">
            <div class="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold">J</span>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 overflow-y-auto py-4 scrollbar-hidden">
          <div class="space-y-1 px-3">
            <a *ngFor="let item of menuItems"
               [routerLink]="item.route"
               routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
               [routerLinkActiveOptions]="{exact: item.route === '/student/dashboard'}"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 group relative"
               [title]="!isOpen ? item.label : ''">
              
              <!-- Icon Container -->
              <div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" [innerHTML]="getIconPath(item.icon)"></svg>
              </div>

              <!-- Label (visible when expanded) -->
              <span *ngIf="isOpen" class="flex-1 text-sm animate-fade-in">
                {{ item.label }}
              </span>

              <!-- Badge (visible when expanded) -->
              <span *ngIf="isOpen && item.badge && item.badge > 0" 
                    class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-fade-in">
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>

              <!-- Badge dot (visible when collapsed) -->
              <span *ngIf="!isOpen && item.badge && item.badge > 0"
                    class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full">
              </span>
            </a>
          </div>

          <!-- Divider -->
          <div class="my-4 border-t border-gray-200 mx-3"></div>

          <!-- Additional Menu Items -->
          <div class="space-y-1 px-3">
            <a *ngFor="let item of additionalItems"
               [routerLink]="item.route"
               routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
               [title]="!isOpen ? item.label : ''">
              
              <div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" [innerHTML]="getIconPath(item.icon)"></svg>
              </div>

              <span *ngIf="isOpen" class="flex-1 text-sm animate-fade-in">
                {{ item.label }}
              </span>
            </a>
          </div>
        </nav>

        <!-- Sidebar Footer -->
        <div class="border-t border-gray-200 p-4 flex-shrink-0">
          <div *ngIf="isOpen" class="bg-primary-50 rounded-lg p-4 animate-fade-in">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm font-semibold text-gray-900 mb-1">Need Help?</p>
                <p class="text-xs text-gray-600 mb-2">Check our help center or contact support</p>
                <button routerLink="/student/help" class="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  Get Help →
                </button>
              </div>
            </div>
          </div>
          
          <div *ngIf="!isOpen" class="flex justify-center">
            <button routerLink="/student/help" class="btn-icon">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: []
})
export class StudentSidebarComponent {
  @Input() isOpen = true;
  @Output() close = new EventEmitter<void>();

  isMobile = window.innerWidth < 1024;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'home', route: '/student/dashboard' },
    { label: 'My Courses', icon: 'book-open', route: '/student/courses' },
    { label: 'Course Catalog', icon: 'academic-cap', route: '/student/catalog' },
    { label: 'Certificates', icon: 'badge-check', route: '/student/certifications' },
    { label: 'Assignments', icon: 'clipboard-list', route: '/student/assignments' },
    { label: 'Exams', icon: 'document-text', route: '/student/exams' },
    { label: 'Live Classes', icon: 'video-camera', route: '/student/live-classes' },
    { label: 'Messages', icon: 'chat', route: '/student/messages', badge: 3 },
    { label: 'Notifications', icon: 'bell', route: '/student/notifications', badge: 5 },
    { label: 'Payments', icon: 'credit-card', route: '/student/payment' },
  ];

  additionalItems: MenuItem[] = [
    { label: 'Profile', icon: 'user', route: '/student/profile' },
    { label: 'Settings', icon: 'cog', route: '/student/settings' },
    { label: 'Help & Support', icon: 'question-mark-circle', route: '/student/help' },
  ];

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 1024;
  }

  closeSidebar(): void {
    this.close.emit();
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      'home': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />',
      'book-open': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />',
      'academic-cap': '<path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />',
      'badge-check': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />',
      'clipboard-list': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />',
      'document-text': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
      'video-camera': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />',
      'chat': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />',
      'bell': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />',
      'credit-card': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />',
      'user': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />',
      'cog': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
      'question-mark-circle': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
    };
    return icons[iconName] || '';
  }
}
