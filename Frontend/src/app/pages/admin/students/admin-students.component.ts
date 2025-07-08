import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
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
    this.http
      .get<Student[]>('http://localhost:3000/api/admin/users?role=STUDENT')
      .subscribe({
        next: (data) => {
          this.students = data;
          this.filteredStudents = data;
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
      this.http
        .delete(`http://localhost:3000/api/admin/users/${id}`)
        .subscribe({
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
