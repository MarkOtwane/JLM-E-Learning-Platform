import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    // Mock data for now; replace with actual API call
    this.http.get<DashboardStats>('http://localhost:3000/api/admin/stats').subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        // Fallback mock data
        this.stats = {
          totalStudents: 150,
          totalInstructors: 20,
          pendingInstructors: 5,
          totalEarnings: 12500.50,
        };
        this.isLoading = false;
      },
    });
  }
}

export default AdminDashboardComponent;