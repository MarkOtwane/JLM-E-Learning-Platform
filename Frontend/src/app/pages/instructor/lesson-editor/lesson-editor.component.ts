import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InstructorService } from '../../../services/instructor.service';

@Component({
  selector: 'app-lesson-editor',
  templateUrl: './lesson-editor.component.html',
  styleUrls: ['./lesson-editor.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonEditorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  courseId: string = '';
  lessonId: string = '';
  moduleId: string = '';
  isEditing: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  
  // Form data
  lessonForm = {
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    videoFile: '',
    duration: 0,
    isLocked: false,
    releaseDate: ''
  };

  // Rich text editor options
  editorOptions = {
    placeholder: 'Enter lesson content...',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        ['clean']
      ]
    }
  };

  // File upload
  selectedFile: File | null = null;
  uploadProgress: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private instructorService: InstructorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';
    this.isEditing = !!this.lessonId;
    
    if (this.isEditing) {
      this.loadLesson();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLesson(): void {
    this.isLoading = true;
    // Load lesson data from API
    // This would be implemented with actual API call
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.cdr.markForCheck();
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.lessonForm.videoFile = '';
    this.cdr.markForCheck();
  }

  saveLesson(): void {
    if (!this.lessonForm.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    this.isSaving = true;

    const data = {
      ...this.lessonForm,
      releaseDate: this.lessonForm.releaseDate || null
    };

    if (this.isEditing) {
      this.instructorService.updateLesson(this.lessonId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.router.navigate(['/instructor/build-course'], { 
              queryParams: { courseId: this.courseId } 
            });
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to update lesson', err);
            this.isSaving = false;
            this.cdr.markForCheck();
          }
        });
    } else {
      // For new lessons, we need a moduleId - this would come from course builder
      this.instructorService.createLesson(this.moduleId, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.router.navigate(['/instructor/build-course'], { 
              queryParams: { courseId: this.courseId } 
            });
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to create lesson', err);
            this.isSaving = false;
            this.cdr.markForCheck();
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/instructor/build-course'], { 
      queryParams: { courseId: this.courseId } 
    });
  }

  // Preview as student
  previewLesson(): void {
    // Open preview in new tab or modal
    window.open(`/learning/${this.courseId}/lessons/${this.lessonId}`, '_blank');
  }
}
