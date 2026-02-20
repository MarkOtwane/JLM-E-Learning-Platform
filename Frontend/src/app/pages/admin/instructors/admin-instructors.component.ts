import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface Instructor {
  id: string;
  name: string;
  email: string;
  courseCount: number;
  totalStudentsEnrolled: number;
}

@Component({
  selector: 'app-admin-instructors',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-instructors.component.html',
  styleUrls: ['./admin-instructors.component.css'],
})
export class AdminInstructorsComponent implements OnInit {
  instructors: Instructor[] = [];
  filteredInstructors: Instructor[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadInstructors();
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

  loadInstructors(): void {
    this.isLoading = true;
    this.api.getAuth<Instructor[]>('/admin/users?role=INSTRUCTOR').subscribe({
      next: (data) => {
        this.instructors = data;
        this.filteredInstructors = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
        this.isLoading = false;
      },
    });
  }

  searchInstructors(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredInstructors = this.instructors.filter(
      (instructor) =>
        instructor.name.toLowerCase().includes(query) ||
        instructor.email.toLowerCase().includes(query) ||
        instructor.courseCount.toString().includes(query)
    );
  }

  deleteInstructor(id: string): void {
    if (
      confirm(
        'Are you sure you want to delete this instructor? This action cannot be undone.'
      )
    ) {
      this.api.deleteAuth(`/admin/users/${id}`).subscribe({
        next: () => {
          this.instructors = this.instructors.filter(
            (instructor) => instructor.id !== id
          );
          this.filteredInstructors = this.filteredInstructors.filter(
            (instructor) => instructor.id !== id
          );
          alert('Instructor deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting instructor:', error);
          alert('Failed to delete instructor.');
        },
      });
    }
  }
}

export default AdminInstructorsComponent;
