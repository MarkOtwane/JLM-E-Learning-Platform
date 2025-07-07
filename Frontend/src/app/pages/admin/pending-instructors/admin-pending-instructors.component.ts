import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface PendingInstructor {
  id: string;
  name: string;
  email: string;
  expertise: string;
  cvUrl: string;
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPendingInstructors();
  }

  loadPendingInstructors(): void {
    this.isLoading = true;
    this.http.get<PendingInstructor[]>('http://localhost:3000/api/admin/pending-instructors').subscribe({
      next: (data) => {
        this.pendingInstructors = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending instructors:', error);
        // Mock data for development
        this.pendingInstructors = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            expertise: 'Computer Science',
            cvUrl: 'http://localhost:3000/files/john_doe_cv.pdf',
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            expertise: 'Mathematics',
            cvUrl: 'http://localhost:3000/files/jane_smith_cv.pdf',
          },
        ];
        this.isLoading = false;
      },
    });
  }

  acceptInstructor(id: string): void {
    this.http.patch(`http://localhost:3000/api/admin/pending-instructors/${id}/accept`, {}).subscribe({
      next: () => {
        this.pendingInstructors = this.pendingInstructors.filter((instructor) => instructor.id !== id);
        alert('Instructor approved successfully.');
      },
      error: (error) => {
        console.error('Error approving instructor:', error);
        alert('Failed to approve instructor.');
      },
    });
  }

  rejectInstructor(id: string): void {
    this.http.delete(`http://localhost:3000/api/admin/pending-instructors/${id}`).subscribe({
      next: () => {
        this.pendingInstructors = this.pendingInstructors.filter((instructor) => instructor.id !== id);
        alert('Instructor rejected successfully.');
      },
      error: (error) => {
        console.error('Error rejecting instructor:', error);
        alert('Failed to reject instructor.');
      },
    });
  }

  downloadCv(url: string): void {
    window.open(url, '_blank');
  }
}

export default AdminPendingInstructorsComponent;