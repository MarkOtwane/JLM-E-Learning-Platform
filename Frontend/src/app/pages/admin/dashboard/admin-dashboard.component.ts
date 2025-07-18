import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AdminSidebarComponent } from '../sidebar/admin-sidebar.component';

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  pendingInstructors: number;
  totalEarnings: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  courseCount: number;
  totalStudentsEnrolled: number;
}

interface Course {
  id: string;
  title: string;
  instructor: { id: string; name: string; email: string };
  instructorName?: string; // for convenience
  category: string;
  level: string;
  duration: string;
  price: number;
  learners: number;
  rating: number;
}

interface PendingInstructor {
  id: string;
  name: string;
  email: string;
  // add other fields as needed
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AdminSidebarComponent],
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
  students: Student[] = [];
  instructors: Instructor[] = [];
  courses: Course[] = [];
  pendingInstructors: PendingInstructor[] = [];
  tab: 'students' | 'instructors' | 'courses' | 'pendingInstructors' | null =
    null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadStudents();
    this.loadInstructors();
    this.loadCourses();
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
        // Do not set dummy data; keep stats at zero if error
        this.isLoading = false;
      },
    });
  }

  loadStudents(): void {
    this.api.getAuth<any[]>('/admin/users?role=STUDENT').subscribe({
      next: (data) => {
        this.students = data.map((student) => ({
          ...student,
          enrollmentDate: student.createdAt || '-',
        }));
      },
      error: (err) => console.error('Error loading students:', err),
    });
  }

  loadInstructors(): void {
    this.api.getAuth<Instructor[]>('/admin/users?role=INSTRUCTOR').subscribe({
      next: (data) => (this.instructors = data),
      error: (err) => console.error('Error loading instructors:', err),
    });
  }

  loadCourses(): void {
    this.api.getAuth<Course[]>('/admin/courses').subscribe({
      next: (data) => {
        // Map instructorName for template compatibility
        this.courses = data.map((course) => ({
          ...course,
          instructorName: course.instructor?.name || '-',
        }));
      },
      error: (err) => console.error('Error loading courses:', err),
    });
  }

  loadPendingInstructors(): void {
    this.api
      .getAuth<PendingInstructor[]>('/admin/pending-instructors')
      .subscribe({
        next: (data) => (this.pendingInstructors = data),
        error: (err) =>
          console.error('Error loading pending instructors:', err),
      });
  }

  approvePendingInstructor(id: string): void {
    this.api.patchAuth(`/admin/pending-instructors/${id}/accept`, {}).subscribe({
      next: () => {
        this.pendingInstructors = this.pendingInstructors.filter((instructor) => instructor.id !== id);
      },
      error: (error) => {
        console.error('Error approving instructor:', error);
      },
    });
  }

  rejectPendingInstructor(id: string): void {
    this.api.deleteAuth(`/admin/pending-instructors/${id}`).subscribe({
      next: () => {
        this.pendingInstructors = this.pendingInstructors.filter((instructor) => instructor.id !== id);
      },
      error: (error) => {
        console.error('Error rejecting instructor:', error);
      },
    });
  }

  deleteStudent(id: string): void {
    this.api.deleteAuth(`/admin/users/${id}`).subscribe({
      next: () => {
        this.students = this.students.filter((student) => student.id !== id);
      },
      error: (error) => {
        console.error('Error deleting student:', error);
      },
    });
  }

  deleteInstructor(id: string): void {
    this.api.deleteAuth(`/admin/users/${id}`).subscribe({
      next: () => {
        this.instructors = this.instructors.filter((instructor) => instructor.id !== id);
      },
      error: (error) => {
        console.error('Error deleting instructor:', error);
      },
    });
  }

  deleteCourse(id: string): void {
    this.api.deleteAuth(`/admin/courses/${id}`).subscribe({
      next: () => {
        this.courses = this.courses.filter((course) => course.id !== id);
      },
      error: (error) => {
        console.error('Error deleting course:', error);
      },
    });
  }

  onTabChange(
    tab: 'students' | 'instructors' | 'courses' | 'pendingInstructors' | null
  ) {
    this.tab = tab;
    if (tab === 'pendingInstructors') {
      this.loadPendingInstructors();
    }
  }
}

export default AdminDashboardComponent;
