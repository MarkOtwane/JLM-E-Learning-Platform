import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
}

interface Module {
  title: string;
  topics: Topic[];
}

interface CourseContent {
  modules: Module[];
  hasFinalExam: boolean;
  finalExamQuestions: QuizQuestion[];
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
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
  projectLink: string = '';
  submissionStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected' =
    'not_submitted';
  certificateUrl: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    this.moduleIndex = Number(this.route.snapshot.paramMap.get('moduleIndex'));
    this.topicIndex = Number(this.route.snapshot.paramMap.get('topicIndex'));
    this.isFinalExam = this.router.url.includes('final-exam');
    this.loadCourseContent();
    if (this.isFinalExam) {
      this.checkProjectSubmission();
    }
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
          } else if (this.moduleIndex !== null && this.topicIndex !== null) {
            this.questions =
              content.modules[this.moduleIndex].topics[
                this.topicIndex
              ].questions;
          }
          this.answers = new Array(this.questions.length).fill(-1);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading quiz:', error);
          alert('Failed to load quiz. Please try again.');
          this.isLoading = false;
        },
      });
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
    this.http
      .get<any>(
        `http://localhost:3000/api/courses/${this.courseId}/project-submission/status`
      )
      .subscribe({
        next: (res) => {
          this.submissionStatus = res.status;
          this.certificateUrl = res.certificateUrl || '';
          this.projectLink = res.projectLink || '';
        },
        error: () => {
          this.submissionStatus = 'not_submitted';
        },
      });
  }

  submitProject() {
    if (!this.projectLink) return;
    this.http
      .post<any>(
        `http://localhost:3000/api/courses/${this.courseId}/project-submission`,
        { projectLink: this.projectLink }
      )
      .subscribe({
        next: () => {
          this.submissionStatus = 'pending';
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
