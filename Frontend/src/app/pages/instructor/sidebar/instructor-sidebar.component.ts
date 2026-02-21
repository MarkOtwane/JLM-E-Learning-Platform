import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-instructor-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './instructor-sidebar.component.html',
  styleUrls: ['./instructor-sidebar.component.css']
})
export class InstructorSidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  instructorName: string = '';
  instructorEmail: string = '';
  profilePicture: string | null = null;
  
  menuItems = [
    { 
      icon: 'fas fa-home', 
      label: 'Dashboard', 
      route: '/instructor/dashboard',
      active: true
    },
    { 
      icon: 'fas fa-book', 
      label: 'My Courses', 
      route: '/instructor/dashboard',
      children: []
    },
    { 
      icon: 'fas fa-plus-circle', 
      label: 'Create Course', 
      route: '/instructor/create-course'
    },
    { 
      icon: 'fas fa-tasks', 
      label: 'Assignments', 
      route: '/instructor/dashboard',
      badge: 0
    },
    { 
      icon: 'fas fa-users', 
      label: 'Students', 
      route: '/instructor/dashboard'
    },
    { 
      icon: 'fas fa-chart-bar', 
      label: 'Analytics', 
      route: '/instructor/dashboard'
    },
    { 
      icon: 'fas fa-bullhorn', 
      label: 'Announcements', 
      route: '/instructor/dashboard'
    },
    { 
      icon: 'fas fa-envelope', 
      label: 'Messages', 
      route: '/instructor/dashboard',
      badge: 0
    },
    { 
      icon: 'fas fa-question-circle', 
      label: 'Q&A', 
      route: '/instructor/dashboard',
      badge: 0
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.instructorEmail = user.email;
          this.instructorName = user.firstName || user.email;
          this.profilePicture = user.profilePicture || null;
        }
      });
    
    this.setActiveMenu();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveMenu(): void {
    const currentUrl = this.router.url;
    this.menuItems.forEach(item => {
      item.active = currentUrl.includes(item.route.split('?')[0]);
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
