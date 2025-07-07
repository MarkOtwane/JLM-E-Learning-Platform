import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading = true;
    this.http.get<Instructor[]>('http://localhost:3000/api/admin/instructors').subscribe({
      next: (data) => {
        this.instructors = data;
        this.filteredInstructors = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
        // Mock data for development
        this.instructors = [
          {
            id: '1',
            name: 'Alice Johnson',
            email: 'alice.johnson@example.com',
            courseCount: 3,
            totalStudentsEnrolled: 120,
          },
          {
            id: '2',
            name: 'Bob Smith',
            email: 'bob.smith@example.com',
            courseCount: 0,
            totalStudentsEnrolled: 0,
          },
          {
            id: '3',
            name: 'Carol White',
            email: 'carol.white@example.com',
            courseCount: 2,
            totalStudentsEnrolled: 80,
          },
        ];
        this.filteredInstructors = this.instructors;
        this.isLoading = false;
      },
    });
  }

  searchInstructors(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredInstructors = this.instructors.filter((instructor) =>
      instructor.name.toLowerCase().includes(query) ||
      instructor.email.toLowerCase().includes(query) ||
      instructor.courseCount.toString().includes(query)
    );
  }

  suspendInstructor(id: string): void {
    if (confirm('Are you sure you want to suspend this instructor?')) {
      this.http.delete(`http://localhost:3000/api/admin/instructors/${id}`).subscribe({
        next: () => {
          this.instructors = this.instructors.filter((instructor) => instructor.id !== id);
          this.filteredInstructors = this.filteredInstructors.filter((instructor) => instructor.id !== id);
          alert('Instructor suspended successfully.');
        },
        error: (error) => {
          console.error('Error suspending instructor:', error);
          alert('Failed to suspend instructor.');
        },
      });
    }
  }
}

export default AdminInstructorsComponent;