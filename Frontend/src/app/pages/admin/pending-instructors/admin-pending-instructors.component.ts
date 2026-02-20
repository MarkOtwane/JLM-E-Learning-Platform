import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

interface PendingInstructor {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-admin-pending-instructors',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './admin-pending-instructors.component.html',
  styleUrls: ['./admin-pending-instructors.component.css'],
})
export class AdminPendingInstructorsComponent implements OnInit {
  pendingInstructors: PendingInstructor[] = [];
  isLoading: boolean = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPendingInstructors();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  loadPendingInstructors(): void {
    this.isLoading = true;
    this.api.getAuth<PendingInstructor[]>('/admin/pending-instructors').subscribe({
      next: (data) => {
        this.pendingInstructors = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending instructors:', error);
        this.isLoading = false;
      },
    });
  }

  acceptInstructor(id: string): void {
    this.api.patchAuth(`/admin/pending-instructors/${id}/accept`, {}).subscribe({
      next: () => {
        this.pendingInstructors = this.pendingInstructors.filter(
          (instructor) => instructor.id !== id
        );
        alert('Instructor approved successfully.');
      },
      error: (error) => {
        console.error('Error approving instructor:', error);
        alert('Failed to approve instructor.');
      },
    });
  }

  rejectInstructor(id: string): void {
    this.api.deleteAuth(`/admin/pending-instructors/${id}`).subscribe({
      next: () => {
        this.pendingInstructors = this.pendingInstructors.filter(
          (instructor) => instructor.id !== id
        );
        alert('Instructor rejected successfully.');
      },
      error: (error) => {
        console.error('Error rejecting instructor:', error);
        alert('Failed to reject instructor.');
      },
    });
  }
}

export default AdminPendingInstructorsComponent;
