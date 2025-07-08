import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

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
  selector: 'app-course-learning',
  standalone: true,
  templateUrl: './course-learning.component.html',
  styleUrls: ['./course-learning.component.css'],
  imports: [CommonModule, HttpClientModule],
})
export class CourseLearningComponent implements OnInit {
  courseId: string = '';
  courseContent: CourseContent = {
    modules: [],
    hasFinalExam: false,
    finalExamQuestions: [],
  };
  currentModuleIndex: number = 0;
  currentTopicIndex: number = 0;
  completedTopics: Set<string> = new Set();
  isLoading: boolean = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCourseContent();
    this.loadCompletedTopics();
  }

  loadCourseContent(): void {
    this.isLoading = true;
    this.apiService.getAuth(`/students/courses/${this.courseId}`).subscribe({
      next: (content: any) => {
        if (content && content.modules) {
          content.modules = content.modules.map((mod: any) => ({
            ...mod,
            topics: mod.contents || [],
          }));
        }
        this.courseContent = content;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course content:', error);
        alert('Failed to load course content. Please try again.');
        this.isLoading = false;
      },
    });
  }

  loadCompletedTopics(): void {
    const saved = localStorage.getItem(`completedTopics_${this.courseId}`);
    if (saved) {
      this.completedTopics = new Set(JSON.parse(saved));
    }
  }

  saveCompletedTopics(): void {
    localStorage.setItem(
      `completedTopics_${this.courseId}`,
      JSON.stringify([...this.completedTopics])
    );
  }

  markAsComplete(): void {
    const key = `${this.currentModuleIndex}_${this.currentTopicIndex}`;
    this.completedTopics.add(key);
    this.saveCompletedTopics();
  }

  isTopicCompleted(moduleIndex: number, topicIndex: number): boolean {
    return this.completedTopics.has(`${moduleIndex}_${topicIndex}`);
  }

  goToTopic(moduleIndex: number, topicIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.currentTopicIndex = topicIndex;
  }

  goToPrevious(): void {
    if (this.currentTopicIndex > 0) {
      this.currentTopicIndex--;
    } else if (this.currentModuleIndex > 0) {
      this.currentModuleIndex--;
      this.currentTopicIndex =
        this.courseContent.modules[this.currentModuleIndex].topics.length - 1;
    }
  }

  goToNext(): void {
    const currentModule = this.courseContent.modules[this.currentModuleIndex];
    if (this.currentTopicIndex < currentModule.topics.length - 1) {
      this.currentTopicIndex++;
    } else if (
      this.currentModuleIndex <
      this.courseContent.modules.length - 1
    ) {
      this.currentModuleIndex++;
      this.currentTopicIndex = 0;
    } else if (this.courseContent.hasFinalExam) {
      this.router.navigate([`/student/course/${this.courseId}/final-exam`]);
    }
  }

  takeQuiz(moduleIndex: number, topicIndex: number): void {
    this.router.navigate([
      `/student/course/${this.courseId}/quiz/${moduleIndex}/${topicIndex}`,
    ]);
  }

  takeFinalExam(): void {
    this.router.navigate([`/student/course/${this.courseId}/final-exam`]);
  }

  getCurrentTopic(): Topic | null {
    if (
      this.courseContent.modules.length > 0 &&
      this.courseContent.modules[this.currentModuleIndex]?.topics[
        this.currentTopicIndex
      ]
    ) {
      return this.courseContent.modules[this.currentModuleIndex].topics[
        this.currentTopicIndex
      ];
    }
    return null;
  }

  goToDashboard(): void {
    this.router.navigate(['/student/dashboard']);
  }
}

export default CourseLearningComponent;
