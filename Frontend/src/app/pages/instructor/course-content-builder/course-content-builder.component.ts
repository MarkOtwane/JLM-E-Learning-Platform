import { CommonModule, NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Topic {
  title: string;
  contentType: 'text' | 'video' | 'pdf';
  textContent?: string;
  file?: File;
  fileName?: string;
  url?: string; // <-- Added for backend compatibility
  hasQuiz: boolean;
  questions: QuizQuestion[];
  assignmentInstructions?: string; // Rich text assignment instructions
}

interface Module {
  title: string;
  topics: Topic[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
}

@Component({
  selector: 'app-course-content-builder',
  standalone: true,
  templateUrl: './course-content-builder.component.html',
  styleUrls: ['./course-content-builder.component.css'],
  imports: [CommonModule, NgIf, NgFor, FormsModule, HttpClientModule],
})
export class CourseContentBuilderComponent implements OnInit {
  // Course selection
  availableCourses: Course[] = [];
  selectedCourse: Course | null = null;
  isLoadingCourses: boolean = true;

  // Course content
  courseId: string = '';
  courseName: string = '';
  modules: Module[] = [];
  hasFinalExam: boolean = false;
  finalExamQuestions: QuizQuestion[] = [];
  finalExamInstructions: string = ''; // Rich text final exam instructions
  isSubmitting: boolean = false;

  // Text formatting helpers
  formattingHelpVisible: boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadInstructorCourses();
  }

  loadInstructorCourses(): void {
    this.isLoadingCourses = true;
    this.apiService.getAuth<Course[]>('/courses').subscribe({
      next: (courses) => {
        this.availableCourses = courses;
        this.isLoadingCourses = false;
        if (courses.length === 0) {
          this.router.navigate(['/instructor/create-course']);
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoadingCourses = false;
      },
    });
  }

  onCourseSelected(): void {
    if (this.selectedCourse) {
      this.courseId = this.selectedCourse.id;
      this.courseName = this.selectedCourse.title;
      this.loadExistingCourseContent();
    } else {
      this.courseId = '';
      this.courseName = '';
      this.modules = [];
      this.hasFinalExam = false;
      this.finalExamQuestions = [];
      this.finalExamInstructions = '';
    }
  }

  loadExistingCourseContent(): void {
    // Load existing course content if any
    this.apiService.getAuth(`/courses/${this.courseId}/content`).subscribe({
      next: (response: any) => {
        if (response.modules) {
          this.modules = response.modules;
        }
        if (response.hasFinalExam) {
          this.hasFinalExam = response.hasFinalExam;
          this.finalExamQuestions = response.finalExamQuestions || [];
          this.finalExamInstructions = response.finalExamInstructions || '';
        }
      },
      error: (error) => {
        console.log('No existing content found, starting fresh');
        this.modules = [];
        this.hasFinalExam = false;
        this.finalExamQuestions = [];
        this.finalExamInstructions = '';
      },
    });
  }

  // Module Management
  addModule(): void {
    if (!this.selectedCourse) {
      return;
    }

    this.modules.push({
      title: '',
      topics: [],
    });
  }

  removeModule(index: number): void {
    if (confirm('Are you sure you want to remove this module?')) {
      this.modules.splice(index, 1);
    }
  }

  // Topic Management
  addTopic(moduleIndex: number): void {
    this.modules[moduleIndex].topics.push({
      title: '',
      contentType: 'text',
      hasQuiz: false,
      questions: [],
      assignmentInstructions: '',
    });
  }

  removeTopic(moduleIndex: number, topicIndex: number): void {
    if (confirm('Are you sure you want to remove this topic?')) {
      this.modules[moduleIndex].topics.splice(topicIndex, 1);
    }
  }

  // File Upload
  onFileSelected(moduleIndex: number, topicIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];

    if (file) {
      const topic = this.modules[moduleIndex].topics[topicIndex];

      // Validate file type
      if (topic.contentType === 'video' && !file.type.startsWith('video/')) {
        return;
      }

      if (topic.contentType === 'pdf' && file.type !== 'application/pdf') {
        return;
      }

      // File size validation (max 100MB for videos, 10MB for PDFs)
      const maxSize =
        topic.contentType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return;
      }

      topic.file = file;
      topic.fileName = file.name;
    }
  }

  // Quiz Question Management
  addQuestion(moduleIndex: number, topicIndex: number): void {
    this.modules[moduleIndex].topics[topicIndex].questions.push({
      question: '',
      options: ['', ''],
      correctAnswer: 0,
    });
  }

  removeQuestion(
    moduleIndex: number,
    topicIndex: number,
    questionIndex: number,
  ): void {
    this.modules[moduleIndex].topics[topicIndex].questions.splice(
      questionIndex,
      1,
    );
  }

  addOption(
    moduleIndex: number,
    topicIndex: number,
    questionIndex: number,
  ): void {
    this.modules[moduleIndex].topics[topicIndex].questions[
      questionIndex
    ].options.push('');
  }

  removeOption(
    moduleIndex: number,
    topicIndex: number,
    questionIndex: number,
    optionIndex: number,
  ): void {
    const question =
      this.modules[moduleIndex].topics[topicIndex].questions[questionIndex];
    question.options.splice(optionIndex, 1);

    // Adjust correct answer if needed
    if (question.correctAnswer >= optionIndex && question.correctAnswer > 0) {
      question.correctAnswer--;
    }
  }

  // Final Exam Management
  addFinalExamQuestion(): void {
    this.finalExamQuestions.push({
      question: '',
      options: ['', ''],
      correctAnswer: 0,
    });
  }

  removeFinalExamQuestion(index: number): void {
    this.finalExamQuestions.splice(index, 1);
  }

  addFinalExamOption(questionIndex: number): void {
    this.finalExamQuestions[questionIndex].options.push('');
  }

  removeFinalExamOption(questionIndex: number, optionIndex: number): void {
    const question = this.finalExamQuestions[questionIndex];
    question.options.splice(optionIndex, 1);

    // Adjust correct answer if needed
    if (question.correctAnswer >= optionIndex && question.correctAnswer > 0) {
      question.correctAnswer--;
    }
  }

  // Text Formatting Helpers
  insertFormatting(
    moduleIndex: number,
    topicIndex: number,
    formatType: string,
  ): void {
    const textarea = document.querySelector(
      `#assignment-instructions-${moduleIndex}-${topicIndex}`,
    ) as HTMLTextAreaElement;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text =
      this.modules[moduleIndex].topics[topicIndex].assignmentInstructions || '';
    const selectedText = text.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (formatType) {
      case 'numbered':
        formattedText = `\n1. ${selectedText || 'Step 1'}\n2. Step 2\n3. Step 3\n`;
        cursorOffset = 3;
        break;
      case 'bullets':
        formattedText = `\n• ${selectedText || 'Item 1'}\n• Item 2\n• Item 3\n`;
        cursorOffset = 3;
        break;
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        cursorOffset = 1;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        cursorOffset = 1;
        break;
      case 'codeblock':
        formattedText = `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n`;
        cursorOffset = 5;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = 1;
        break;
      case 'heading':
        formattedText = `\n## ${selectedText || 'Heading'}\n`;
        cursorOffset = 4;
        break;
    }

    const newText =
      text.substring(0, start) + formattedText + text.substring(end);
    this.modules[moduleIndex].topics[topicIndex].assignmentInstructions =
      newText;
  }

  insertFinalExamFormatting(formatType: string): void {
    const textarea = document.querySelector(
      '#final-exam-instructions',
    ) as HTMLTextAreaElement;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.finalExamInstructions;
    const selectedText = text.substring(start, end);

    let formattedText = '';

    switch (formatType) {
      case 'numbered':
        formattedText = `\n1. ${selectedText || 'Step 1'}\n2. Step 2\n3. Step 3\n`;
        break;
      case 'bullets':
        formattedText = `\n• ${selectedText || 'Item 1'}\n• Item 2\n• Item 3\n`;
        break;
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        formattedText = `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        break;
      case 'heading':
        formattedText = `\n## ${selectedText || 'Heading'}\n`;
        break;
    }

    this.finalExamInstructions =
      text.substring(0, start) + formattedText + text.substring(end);
  }

  toggleFormattingHelp(): void {
    this.formattingHelpVisible = !this.formattingHelpVisible;
  }

  // Save Course Content
  onSave(): void {
    if (!this.selectedCourse) {
      return;
    }

    if (!this.validateContent()) {
      return;
    }

    this.isSubmitting = true;

    // Prepare form data for submission
    const formData = new FormData();

    // Prepare modules for backend: for text topics, set url = textContent
    const modulesForBackend = this.modules.map((mod) => ({
      ...mod,
      topics: mod.topics.map((topic) => {
        const { contentType, ...rest } = topic;
        return {
          ...rest,
          type: contentType.toUpperCase(),
          url: contentType === 'text' ? topic.textContent : topic.url || '',
        };
      }),
    }));

    formData.append('courseId', this.courseId);
    formData.append('modules', JSON.stringify(modulesForBackend));
    formData.append('hasFinalExam', this.hasFinalExam.toString());
    formData.append(
      'finalExamQuestions',
      JSON.stringify(this.finalExamQuestions),
    );
    formData.append('finalExamInstructions', this.finalExamInstructions);

    // Add files
    this.modules.forEach((module, moduleIndex) => {
      module.topics.forEach((topic, topicIndex) => {
        if (topic.file) {
          formData.append(
            `moduleFile_${moduleIndex}_${topicIndex}`,
            topic.file,
          );
        }
      });
    });

    // Submit to backend
    this.apiService.postAuth('/courses/content', formData).subscribe({
      next: (response: any) => {
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (error) => {
        console.error('Error saving course content:', error);
        this.isSubmitting = false;
      },
    });
  }

  // Validation
  validateContent(): boolean {
    if (this.modules.length === 0) {
      return false;
    }

    for (let i = 0; i < this.modules.length; i++) {
      const module = this.modules[i];

      if (!module.title.trim()) {
        return false;
      }

      if (module.topics.length === 0) {
        return false;
      }

      for (let j = 0; j < module.topics.length; j++) {
        const topic = module.topics[j];

        if (!topic.title.trim()) {
          return false;
        }

        // Validate content
        if (topic.contentType === 'text' && !topic.textContent?.trim()) {
          return false;
        }

        if (
          (topic.contentType === 'video' || topic.contentType === 'pdf') &&
          !topic.file
        ) {
          return false;
        }
      }
    }

    return true;
  }

  trackByOption(index: number, option: string) {
    return index;
  }

  trackByFinalExamOption(index: number, option: string) {
    return index;
  }
}

export default CourseContentBuilderComponent;
