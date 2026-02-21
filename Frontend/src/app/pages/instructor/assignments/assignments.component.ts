import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InstructorService } from '../../../services/instructor.service';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  maxScore: number;
  dueDate?: string;
  allowLateSubmission: boolean;
  createdAt: string;
  _count?: {
    submissions: number;
  };
}

interface Submission {
  id: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  status: string;
  student: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

@Component({
  selector: 'app-course-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courseId: string = '';
  assignments: Assignment[] = [];
  selectedAssignment: Assignment | null = null;
  submissions: Submission[] = [];
  isLoading: boolean = true;
  isLoadingSubmissions: boolean = false;

  // Create/Edit Assignment Modal
  showAssignmentModal: boolean = false;
  editingAssignment: Assignment | null = null;
  assignmentForm = {
    title: '',
    description: '',
    instructions: '',
    maxScore: 100,
    dueDate: '',
    allowLateSubmission: false,
  };

  // Grading Modal
  showGradingModal: boolean = false;
  selectedSubmission: Submission | null = null;
  gradeForm = {
    score: 0,
    feedback: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private instructorService: InstructorService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    if (this.courseId) {
      this.loadAssignments();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssignments(): void {
    this.isLoading = true;

    this.instructorService
      .getCourseAssignments(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Assignment[]) => {
          this.assignments = data;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load assignments', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  loadSubmissions(assignmentId: string): void {
    this.isLoadingSubmissions = true;

    this.instructorService
      .getAssignmentSubmissions(assignmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Submission[]) => {
          this.submissions = data;
          this.isLoadingSubmissions = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load submissions', err);
          this.isLoadingSubmissions = false;
          this.cdr.markForCheck();
        },
      });
  }

  selectAssignment(assignment: Assignment): void {
    this.selectedAssignment = assignment;
    this.loadSubmissions(assignment.id);
  }

  get gradedSubmissionsCount(): number {
    return this.submissions.filter((s) => s.status === 'graded').length;
  }

  get pendingSubmissionsCount(): number {
    return this.submissions.filter((s) => s.status === 'submitted').length;
  }

  openCreateModal(): void {
    this.editingAssignment = null;
    this.assignmentForm = {
      title: '',
      description: '',
      instructions: '',
      maxScore: 100,
      dueDate: '',
      allowLateSubmission: false,
    };
    this.showAssignmentModal = true;
  }

  openEditModal(assignment: Assignment): void {
    this.editingAssignment = assignment;
    this.assignmentForm = {
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions || '',
      maxScore: assignment.maxScore,
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 16) : '',
      allowLateSubmission: assignment.allowLateSubmission,
    };
    this.showAssignmentModal = true;
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal = false;
    this.editingAssignment = null;
  }

  saveAssignment(): void {
    const data = {
      ...this.assignmentForm,
      courseId: this.courseId,
    };

    this.instructorService
      .createAssignment(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newAssignment) => {
          this.assignments.unshift(newAssignment);
          this.closeAssignmentModal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to create assignment', err);
        },
      });
  }

  openGradingModal(submission: Submission): void {
    this.selectedSubmission = submission;
    this.gradeForm = {
      score: submission.score || 0,
      feedback: submission.feedback || '',
    };
    this.showGradingModal = true;
  }

  closeGradingModal(): void {
    this.showGradingModal = false;
    this.selectedSubmission = null;
  }

  submitGrade(): void {
    if (!this.selectedSubmission) return;

    this.instructorService
      .gradeSubmission(this.selectedSubmission.id, this.gradeForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedSubmission) => {
          const index = this.submissions.findIndex(
            (s) => s.id === updatedSubmission.id,
          );
          if (index !== -1) {
            this.submissions[index] = updatedSubmission;
          }
          this.closeGradingModal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to grade submission', err);
        },
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'graded':
        return 'var(--color-success, #10b981)';
      case 'submitted':
        return 'var(--color-warning, #f59e0b)';
      case 'returned':
        return 'var(--color-primary, #3b82f6)';
      default:
        return 'var(--color-muted, #64748b)';
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  goBack(): void {
    this.router.navigate(['/instructor/dashboard']);
  }

  goBackToAssignments(): void {
    this.selectedAssignment = null;
    this.submissions = [];
  }
}
