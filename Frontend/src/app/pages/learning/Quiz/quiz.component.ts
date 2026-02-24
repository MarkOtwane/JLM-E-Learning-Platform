import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Topic {
  title: string;
  contentType: 'text' | 'video' | 'pdf';
  textContent?: string;
  fileName?: string;
  hasQuiz: boolean;
  questions: QuizQuestion[];
  assignmentInstructions?: string; // Rich text instructions for the assignment
}

interface Module {
  title: string;
  topics: Topic[];
}

interface CourseContent {
  modules: Module[];
  hasFinalExam: boolean;
  finalExamQuestions: QuizQuestion[];
  finalExamInstructions?: string; // Rich text instructions for final exam
}

interface SubmissionResponse {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  certificateUrl?: string;
  projectLink?: string;
  linkType?: string;
  notes?: string;
  feedback?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule, MarkdownPipe],
})
export class QuizComponent implements OnInit {
  courseId: string = '';
  moduleIndex: number | null = null;
  topicIndex: number | null = null;
  isFinalExam: boolean = false;
  courseContent: CourseContent = {
    modules: [],
    hasFinalExam: false,
    finalExamQuestions: [],
  };
  questions: QuizQuestion[] = [];
  answers: number[] = [];
  isSubmitted: boolean = false;
  score: number = 0;
  isLoading: boolean = true;

  // Assignment instructions (rich text HTML)
  assignmentInstructions: string = '';

  // Link submission properties
  projectLink: string = '';
  linkType: 'github' | 'demo' | 'social' | 'video' | 'other' = 'github';
  submissionNotes: string = '';
  submissionStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected' =
    'not_submitted';
  certificateUrl: string = '';
  isSubmitting: boolean = false;
  feedback: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    this.moduleIndex = Number(this.route.snapshot.paramMap.get('moduleIndex'));
    this.topicIndex = Number(this.route.snapshot.paramMap.get('topicIndex'));
    this.isFinalExam = this.router.url.includes('final-exam');
    this.loadCourseContent();
    this.checkProjectSubmission();
  }

  loadCourseContent(): void {
    this.isLoading = true;
    this.http
      .get<CourseContent>(
        `http://localhost:3000/api/courses/${this.courseId}/content`
      )
      .subscribe({
        next: (content) => {
          this.courseContent = content;
          if (this.isFinalExam) {
            this.questions = content.finalExamQuestions;
            this.assignmentInstructions = content.finalExamInstructions || '';
          } else if (this.moduleIndex !== null && this.topicIndex !== null) {
            const topic = content.modules[this.moduleIndex].topics[this.topicIndex];
            this.questions = topic.questions;
            this.assignmentInstructions = topic.assignmentInstructions || '';
          }
          this.answers = new Array(this.questions.length).fill(-1);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading content:', error);
          this.isLoading = false;
        },
      });
  }

  // Getter to validate link format
  get isValidLink(): boolean {
    if (!this.projectLink || this.projectLink.trim() === '') {
      return false;
    }
    try {
      const url = new URL(this.projectLink);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Sanitize HTML for safe display
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  selectAnswer(questionIndex: number, optionIndex: number): void {
    if (!this.isSubmitted) {
      this.answers[questionIndex] = optionIndex;
    }
  }

  submitQuiz(): void {
    if (this.isSubmitted) return;
    this.isSubmitted = true;
    this.score = this.answers.reduce((score, answer, index) => {
      return answer === this.questions[index].correctAnswer ? score + 1 : score;
    }, 0);
  }

  backToCourse(): void {
    this.router.navigate([`/student/course/${this.courseId}`]);
  }

  isQuizIncomplete(): boolean {
    return this.answers.some((answer: number) => answer === -1);
  }

  checkProjectSubmission() {
    const endpoint = this.isFinalExam
      ? `http://localhost:3000/api/courses/${this.courseId}/project-submission/status`
      : `http://localhost:3000/api/courses/${this.courseId}/quiz-submission/status?moduleIndex=${this.moduleIndex}&topicIndex=${this.topicIndex}`;

    this.http.get<SubmissionResponse>(endpoint).subscribe({
      next: (res) => {
        this.submissionStatus = res.status;
        this.certificateUrl = res.certificateUrl || '';
        this.projectLink = res.projectLink || '';
        this.linkType = (res.linkType as any) || 'github';
        this.submissionNotes = res.notes || '';
        this.feedback = res.feedback || '';
      },
      error: () => {
        this.submissionStatus = 'not_submitted';
      },
    });
  }

  submitProject() {
    if (!this.projectLink || !this.isValidLink) return;

    this.isSubmitting = true;

    const payload = {
      projectLink: this.projectLink,
      linkType: this.linkType,
      notes: this.submissionNotes,
      moduleIndex: this.moduleIndex,
      topicIndex: this.topicIndex,
    };

    const endpoint = this.isFinalExam
      ? `http://localhost:3000/api/courses/${this.courseId}/project-submission`
      : `http://localhost:3000/api/courses/${this.courseId}/quiz-submission`;

    this.http.post<SubmissionResponse>(endpoint, payload).subscribe({
      next: (res) => {
        this.submissionStatus = res.status;
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error submitting:', error);
        this.isSubmitting = false;
        alert('Failed to submit. Please try again.');
      },
    });
  }

  downloadCertificate() {
    if (this.certificateUrl) {
      window.open(this.certificateUrl, '_blank');
    }
  }
}

export default QuizComponent;
