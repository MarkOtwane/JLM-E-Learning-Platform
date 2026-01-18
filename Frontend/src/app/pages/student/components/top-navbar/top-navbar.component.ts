import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, AppUser } from '../../../../services/auth.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[var(--z-sticky)]">
      <div class="flex items-center justify-between h-16 px-4 lg:px-6">
        <!-- Left Section: Menu Toggle + Logo -->
        <div class="flex items-center gap-4">
          <!-- Mobile Menu Toggle -->
          <button 
            (click)="toggleSidebar()"
            class="lg:hidden btn-icon"
            aria-label="Toggle menu">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Desktop Menu Toggle -->
          <button 
            (click)="toggleSidebar()"
            class="hidden lg:block btn-icon"
            aria-label="Toggle sidebar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Logo / Brand -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">J</span>
            </div>
            <div class="hidden sm:block">
              <h1 class="text-xl font-bold text-gray-900">JLM Learning</h1>
              <p class="text-xs text-gray-500 -mt-1">Student Portal</p>
            </div>
          </div>
        </div>

        <!-- Right Section: Actions + Profile -->
        <div class="flex items-center gap-2 md:gap-4">
          <!-- Search Button (Mobile) -->
          <button class="lg:hidden btn-icon" aria-label="Search">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <!-- Notifications -->
          <button 
            class="btn-icon relative"
            [routerLink]="['/student/notifications']"
            aria-label="Notifications">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span *ngIf="unreadNotifications > 0" 
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
            </span>
          </button>

          <!-- Messages -->
          <button 
            class="btn-icon relative hidden md:flex"
            [routerLink]="['/student/messages']"
            aria-label="Messages">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span *ngIf="unreadMessages > 0" 
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {{ unreadMessages > 9 ? '9+' : unreadMessages }}
            </span>
          </button>

          <!-- Profile Dropdown -->
          <div class="relative" #profileDropdown>
            <button 
              (click)="toggleProfileMenu()"
              class="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
              aria-label="Profile menu"
              aria-expanded="isProfileMenuOpen">
              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 overflow-hidden flex-shrink-0">
                <img *ngIf="user && user.profilePictureUrl" 
                     [src]="user.profilePictureUrl" 
                     [alt]="getUserName()"
                     class="w-full h-full object-cover"
                />
                <div *ngIf="!user || !user.profilePictureUrl" 
                     class="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                  {{ getUserInitials() }}
                </div>
              </div>
              
              <!-- Name (Hidden on mobile) -->
              <span class="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {{ getUserName() }}
              </span>

              <!-- Dropdown Icon -->
              <svg class="hidden md:block w-4 h-4 text-gray-500 transition-transform" 
                   [class.rotate-180]="isProfileMenuOpen"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div *ngIf="isProfileMenuOpen" 
                 class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-fade-in">
              <!-- User Info -->
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-sm font-semibold text-gray-900">{{ getUserName() }}</p>
                <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
              </div>

              <!-- Menu Items -->
              <div class="py-2">
                <a [routerLink]="['/student/profile']" 
                   (click)="closeProfileMenu()"
                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </a>

                <a [routerLink]="['/student/settings']" 
                   (click)="closeProfileMenu()"
                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </a>

                <a [routerLink]="['/student/help']" 
                   (click)="closeProfileMenu()"
                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help & Support
                </a>
              </div>

              <!-- Logout -->
              <div class="border-t border-gray-100 pt-2">
                <button 
                  (click)="handleLogout()"
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class TopNavbarComponent implements OnInit, OnDestroy {
  @Output() sidebarToggle = new EventEmitter<void>();
  
  user: AppUser | null = null;
  isProfileMenuOpen = false;
  unreadNotifications = 0;
  unreadMessages = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
      });

    // TODO: Fetch unread counts from API
    // this.loadUnreadCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  getUserName(): string {
    if (!this.user) return 'Student';
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || this.user.email || 'Student';
  }

  getUserInitials(): string {
    if (!this.user) return 'S';
    const firstName = this.user.firstName || '';
    const lastName = this.user.lastName || '';
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (this.user.email) return this.user.email[0].toUpperCase();
    return 'S';
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
