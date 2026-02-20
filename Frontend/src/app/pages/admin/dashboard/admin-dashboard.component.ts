import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  pendingInstructors: number;
  totalEarnings: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalStudents: 0,
    totalInstructors: 0,
    pendingInstructors: 0,
    totalEarnings: 0,
  };
  isLoading: boolean = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.api.getAuth<DashboardStats>('/admin/stats').subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoading = false;
      },
    });
  }
}

export default AdminDashboardComponent;
