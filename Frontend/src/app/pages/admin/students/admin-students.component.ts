import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  createdAt?: string;
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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStudents();
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

  loadStudents(): void {
    this.isLoading = true;
    this.api.getAuth<any[]>('/admin/users?role=STUDENT').subscribe({
      next: (data) => {
        this.students = data.map((student) => ({
          ...student,
          enrollmentDate: student.createdAt || '-',
        }));
        this.filteredStudents = this.students;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
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

  deleteStudent(id: string): void {
    if (
      confirm(
        'Are you sure you want to delete this student? This action cannot be undone.'
      )
    ) {
      this.api.deleteAuth(`/admin/users/${id}`).subscribe({
        next: () => {
          this.students = this.students.filter(
            (student) => student.id !== id
          );
          this.filteredStudents = this.filteredStudents.filter(
            (student) => student.id !== id
          );
          alert('Student deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting student:', error);
          alert('Failed to delete student.');
        },
      });
    }
  }
}

export default AdminStudentsComponent;
