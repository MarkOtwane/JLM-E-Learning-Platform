import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
})
export class AdminSidebarComponent implements OnInit {
  @Output() tabChange = new EventEmitter<
    'students' | 'instructors' | 'courses' | 'pendingInstructors'
  >();
  navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/students', label: 'Students' },
    { path: '/admin/instructors', label: 'Instructors' },
    { path: '/admin/courses', label: 'Courses' },
  ];

  stats: any = {};
  students: any[] = [];
  instructors: any[] = [];
  courses: any[] = [];
  pendingInstructors: any[] = [];
  selectedTab:
    | 'students'
    | 'instructors'
    | 'courses'
    | 'pendingInstructors'
    | null = null;

  constructor(private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAuth<any>('/admin/stats').subscribe({
      next: (data) => (this.stats = data),
      error: (err) => console.error('Failed to load admin stats', err),
    });
  }

  showDetails(
    tab: 'students' | 'instructors' | 'courses' | 'pendingInstructors'
  ) {
    this.tabChange.emit(tab);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}

export default AdminSidebarComponent;
