import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule, HttpClientModule],
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
  isSubmitting: boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    public router: Router
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
          this.router.navigate(['/create-course']);
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoadingCourses = false;
        // alert('Failed to load your courses. Please try again.');
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
        }
      },
      error: (error) => {
        // If no content exists yet, that's fine - start fresh
        console.log('No existing content found, starting fresh');
        this.modules = [];
        this.hasFinalExam = false;
        this.finalExamQuestions = [];
      },
    });
  }

  // Module Management
  addModule(): void {
    if (!this.selectedCourse) {
      // alert('Please select a course first.');
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
        // alert('Please select a valid video file.');
        return;
      }

      if (topic.contentType === 'pdf' && file.type !== 'application/pdf') {
        // alert('Please select a valid PDF file.');
        return;
      }

      // File size validation (max 100MB for videos, 10MB for PDFs)
      const maxSize =
        topic.contentType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        // alert(
        //   `File size should be less than ${
        //     topic.contentType === 'video' ? '100MB' : '10MB'
        //   }.`
        // );
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
    questionIndex: number
  ): void {
    this.modules[moduleIndex].topics[topicIndex].questions.splice(
      questionIndex,
      1
    );
  }

  addOption(
    moduleIndex: number,
    topicIndex: number,
    questionIndex: number
  ): void {
    this.modules[moduleIndex].topics[topicIndex].questions[
      questionIndex
    ].options.push('');
  }

  removeOption(
    moduleIndex: number,
    topicIndex: number,
    questionIndex: number,
    optionIndex: number
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

  // Save Course Content
  onSave(): void {
    if (!this.selectedCourse) {
      // alert('Please select a course first.');
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
      JSON.stringify(this.finalExamQuestions)
    );

    // Add files
    this.modules.forEach((module, moduleIndex) => {
      module.topics.forEach((topic, topicIndex) => {
        if (topic.file) {
          formData.append(
            `moduleFile_${moduleIndex}_${topicIndex}`,
            topic.file
          );
        }
      });
    });

    // Submit to backend
    this.apiService.postAuth('/courses/content', formData).subscribe({
      next: (response: any) => {
        // alert('Course content saved successfully!');
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (error) => {
        console.error('Error saving course content:', error);
        // alert('Failed to save course content. Please try again.');
        this.isSubmitting = false;
      },
    });
  }

  // Validation
  validateContent(): boolean {
    if (this.modules.length === 0) {
      // alert('Please add at least one module.');
      return false;
    }

    for (let i = 0; i < this.modules.length; i++) {
      const module = this.modules[i];

      if (!module.title.trim()) {
        // alert(`Please enter a title for Module ${i + 1}.`);
        return false;
      }

      if (module.topics.length === 0) {
        // alert(`Please add at least one topic to Module ${i + 1}.`);
        return false;
      }

      for (let j = 0; j < module.topics.length; j++) {
        const topic = module.topics[j];

        if (!topic.title.trim()) {
          // alert(`Please enter a title for Topic ${j + 1} in Module ${i + 1}.`);
          return false;
        }

        // Validate content
        if (topic.contentType === 'text' && !topic.textContent?.trim()) {
          // alert(
          //   `Please add content for Topic "${topic.title}" in Module ${i + 1}.`
          // );
          return false;
        }

        if (
          (topic.contentType === 'video' || topic.contentType === 'pdf') &&
          !topic.file
        ) {
          // alert(
          //   `Please upload a file for Topic "${topic.title}" in Module ${
          //     i + 1
          //   }.`
          // );
          return false;
        }

        // Validate quiz questions
        if (topic.hasQuiz) {
          if (topic.questions.length === 0) {
            // alert(
            //   `Please add at least one question to the quiz for Topic "${
            //     topic.title
            //   }" in Module ${i + 1}.`
            // );
            return false;
          }

          for (let k = 0; k < topic.questions.length; k++) {
            const question = topic.questions[k];

            if (!question.question.trim()) {
              // alert(
              //   `Please enter Question ${k + 1} for Topic "${
              //     topic.title
              //   }" in Module ${i + 1}.`
              // );
              return false;
            }

            if (question.options.some((opt: string) => !opt.trim())) {
              // alert(
              //   `Please fill all options for Question ${k + 1} in Topic "${
              //     topic.title
              //   }" in Module ${i + 1}.`
              // );
              return false;
            }

            if (
              question.correctAnswer === undefined ||
              question.correctAnswer === null
            ) {
              // alert(
              //   `Please select the correct answer for Question ${
              //     k + 1
              //   } in Topic "${topic.title}" in Module ${i + 1}.`
              // );
              return false;
            }
          }
        }
      }
    }

    // Validate final exam
    if (this.hasFinalExam) {
      if (this.finalExamQuestions.length === 0) {
        // alert('Please add at least one question to the final exam.');
        return false;
      }

      for (let i = 0; i < this.finalExamQuestions.length; i++) {
        const question = this.finalExamQuestions[i];

        if (!question.question.trim()) {
          // alert(`Please enter Final Exam Question ${i + 1}.`);
          return false;
        }

        if (question.options.some((opt: string) => !opt.trim())) {
          // alert(`Please fill all options for Final Exam Question ${i + 1}.`);
          return false;
        }

        if (
          question.correctAnswer === undefined ||
          question.correctAnswer === null
        ) {
          // alert(
          //   `Please select the correct answer for Final Exam Question ${i + 1}.`
          // );
          return false;
        }
      }
    }

    return true;
  }
}

// Export the component to make it a module
export default CourseContentBuilderComponent;
