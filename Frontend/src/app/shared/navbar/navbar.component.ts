import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  hideAuthButtons = false;
  hideSecondNavbar = false;
  userName: string | null = null;
  userRole: string | null = null;
  searchQuery = '';
  selectedCategory = 'all';

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;

        const hiddenAuthRoutes = [
          '/login',
          '/register',
          '/pending',
          '/under-review',
        ];
        // Hide auth buttons for all /learning, /student, and /instructor pages
        this.hideAuthButtons =
          hiddenAuthRoutes.includes(url) ||
          url.startsWith('/student') ||
          url.startsWith('/learning') ||
          url.startsWith('/instructor');

        const hiddenSecondNavbarRoutes = [
          '/login',
          '/register',
          '/pending',
          '/under-review',
        ];
        this.hideSecondNavbar =
          hiddenSecondNavbarRoutes.includes(url) ||
          url.startsWith('/student') ||
          url.startsWith('/instructor') ||
          url.startsWith('/admin');

        this.userName = localStorage.getItem('userName');
        this.userRole = localStorage.getItem('userRole');

        this.route.queryParams.subscribe((params) => {
          if (params['category']) {
            this.selectedCategory = params['category'];
          }
        });
      }
    });
  }

  ngOnInit() {
    // Initialize selected category from URL params
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
    });
  }

  performSearch() {
    if (this.searchQuery.trim()) {
      // Navigate to courses page with search query and maintain category filter
      const queryParams: any = { q: this.searchQuery.trim() };
      if (this.selectedCategory !== 'all') {
        queryParams.category = this.selectedCategory;
      }

      this.router.navigate(['/courses'], { queryParams });
      this.searchQuery = '';
    }
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;

    // Build query params
    const queryParams: any = {};
    if (category !== 'all') {
      queryParams.category = category;
    }

    // If there's an active search, maintain it
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        queryParams.q = params['q'];
      }
    });

    // Navigate to courses page with category filter
    this.router.navigate(['/courses'], { queryParams });
  }

  goToDashboard() {
    if (this.userRole === 'instructor') {
      this.router.navigate(['/instructor-dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
