import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
})
export class AdminSidebarComponent implements OnInit {
  isCollapsed = false;
  stats: any = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAuth<any>('/admin/stats').subscribe({
      next: (data) => (this.stats = data),
      error: (err) => console.error('Failed to load admin stats', err),
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}

export default AdminSidebarComponent;
