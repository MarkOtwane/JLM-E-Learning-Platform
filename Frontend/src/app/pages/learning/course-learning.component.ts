import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  url?: string; // <-- Added for Cloudinary/URL support
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
  imports: [CommonModule, HttpClientModule, FormsModule],
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

  // Calendar activity properties
  selectedDate: string = '';
  activityText: string = '';
  calendarActivities: { [date: string]: string[] } = {};

  // Editing state for activities
  editIndex: number | null = null;
  editText: string = '';

  // Recent activity (placeholder, can be replaced with real data)
  recentActivity: string[] = [
    'Completed "Module 1: Introduction"',
    'Scored 90% on "Quiz 1"',
    'Watched "Lesson 2: Advanced Topics"',
    'Downloaded certificate for "Course A"',
  ];

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
            topics: (mod.contents || []).map((c: any) => ({
              title: c.title,
              contentType: c.type ? c.type.toLowerCase() : 'text',
              url: c.url,
              fileName: c.fileName, // in case you add this in the future
              hasQuiz: false, // set as needed
              questions: [], // set as needed
              textContent: c.textContent, // in case you add this in the future
            })),
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

  getCourseCompletionPercentage(): number {
    if (!this.courseContent.modules.length) return 0;

    let totalTopics = 0;
    let completed = 0;

    this.courseContent.modules.forEach((module, mIndex) => {
      module.topics.forEach((_, tIndex) => {
        totalTopics++;
        if (this.isTopicCompleted(mIndex, tIndex)) {
          completed++;
        }
      });
    });

    return Math.round((completed / totalTopics) * 100);
  }

  markAsComplete(): void {
    const key = `${this.currentModuleIndex}_${this.currentTopicIndex}`;
    this.completedTopics.add(key);
    this.saveCompletedTopics();
  }

  isTopicCompleted(moduleIndex: number, topicIndex: number): boolean {
    return this.completedTopics.has(`${moduleIndex}_${topicIndex}`);
  }

  getCompletedTopicsCount(mIndex: number): number {
    if (!this.courseContent.modules[mIndex]) return 0;
    return this.courseContent.modules[mIndex].topics.filter((_, tIndex) =>
      this.isTopicCompleted(mIndex, tIndex)
    ).length;
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

  addActivity() {
    if (!this.selectedDate || !this.activityText.trim()) return;
    if (!this.calendarActivities[this.selectedDate]) {
      this.calendarActivities[this.selectedDate] = [];
    }
    this.calendarActivities[this.selectedDate].push(this.activityText.trim());
    this.activityText = '';
  }

  startEditActivity(index: number, text: string) {
    this.editIndex = index;
    this.editText = text;
  }

  saveEditActivity(index: number) {
    if (this.selectedDate && this.editText.trim()) {
      this.calendarActivities[this.selectedDate][index] = this.editText.trim();
    }
    this.editIndex = null;
    this.editText = '';
  }

  cancelEditActivity() {
    this.editIndex = null;
    this.editText = '';
  }

  deleteActivity(index: number) {
    if (this.selectedDate && this.calendarActivities[this.selectedDate]) {
      this.calendarActivities[this.selectedDate].splice(index, 1);
      if (this.calendarActivities[this.selectedDate].length === 0) {
        delete this.calendarActivities[this.selectedDate];
      }
    }
    this.cancelEditActivity();
  }
}

export default CourseLearningComponent;
