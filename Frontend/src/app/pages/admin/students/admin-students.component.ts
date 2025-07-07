import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-students.component.html',
  styleUrls: ['./admin-students.component.css'],
})
export class AdminStudentsComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.http.get<Student[]>('http://localhost:3000/api/admin/students').subscribe({
      next: (data) => {
        this.students = data;
        this.filteredStudents = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        // Mock data for development
        this.students = [
          {
            id: '1',
            name: 'Emma Wilson',
            email: 'emma.wilson@example.com',
            enrollmentDate: '2025-01-15',
          },
          {
            id: '2',
            name: 'Liam Brown',
            email: 'liam.brown@example.com',
            enrollmentDate: '2025-02-10',
          },
          {
            id: '3',
            name: 'Sophia Davis',
            email: 'sophia.davis@example.com',
            enrollmentDate: '2025-03-22',
          },
        ];
        this.filteredStudents = this.students;
        this.isLoading = false;
      },
    });
  }

  searchStudents(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredStudents = this.students.filter((student) =>
      student.name.toLowerCase().includes(query)
    );
  }
}

export default AdminStudentsComponent;