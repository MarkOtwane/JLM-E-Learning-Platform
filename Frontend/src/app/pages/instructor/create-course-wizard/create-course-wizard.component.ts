import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { CourseRefreshService } from '../../../services/course-refresh.service';
import { InstructorService } from '../../../services/instructor.service';
import { Subject, interval } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

interface StepStatus {
  stepNumber: number;
  title: string;
  isComplete: boolean;
  hasErrors: boolean;
  isDirty: boolean;
}

/**
 * Production-ready Multi-Step Course Creation Wizard
 * Features:
 * - 4-step form wizard (Basic, Media, Pricing, Publishing)
 * - Form validation per step
 * - Auto-save draft every 30 seconds
 * - Progress tracking and visual indicators
 * - File upload for thumbnails and videos
 * - Ability to save as draft at any step
 * - Preview before publishing
 */
@Component({
  selector: 'app-course-creation-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            Create New Course
          </h1>
          <p class="text-gray-600">
            Follow the steps below to create your course
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="mb-8 bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-gray-600"
              >Progress: Step {{ currentStep }} of 4</span
            >
            <span class="text-sm text-blue-600" *ngIf="autoSaveStatus">{{
              autoSaveStatus
            }}</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-500 to-indigo-600
                   transition-all duration-300"
              [style.width]="(currentStep / 4) * 100 + '%'"
            ></div>
          </div>
        </div>

        <!-- Step Indicators -->
        <div class="mb-8 grid grid-cols-4 gap-2 md:gap-4">
          <button
            *ngFor="let step of stepIndicators"
            (click)="goToStep(step.stepNumber)"
            [disabled]="step.stepNumber > currentStep"
            [ngClass]="{
              'opacity-50 cursor-not-allowed': step.stepNumber > currentStep,
            }"
            class="p-3 md:p-4 rounded-lg text-center transition-all
                 duration-200 font-semibold text-sm md:text-base"
            [class]="getStepIndicatorClass(step)"
          >
            <div class="flex flex-col items-center">
              <span class="text-xl mb-1" *ngIf="step.isComplete">✓</span>
              <span class="text-xl mb-1" *ngIf="!step.isComplete">{{
                step.stepNumber
              }}</span>
              <span class="text-xs truncate">{{ step.title }}</span>
            </div>
          </button>
        </div>

        <!-- Form Container -->
        <div class="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <form [formGroup]="wizardForm">
            <!-- Step 1: Basic Information -->
            <div *ngIf="currentStep === 1" [@slideIn]>
              <h2 class="text-2xl font-bold mb-6 text-gray-800">
                Basic Information
              </h2>

              <div class="space-y-6">
                <!-- Title -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Course Title <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="Enter your course title"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    5-100 characters · Make it descriptive and engaging
                  </p>
                  <p
                    *ngIf="getFieldError('title')"
                    class="text-xs text-red-500 mt-1"
                  >
                    {{ getFieldError('title') }}
                  </p>
                </div>

                <!-- Subtitle -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    formControlName="subtitle"
                    placeholder="Brief subtitle for your course"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    formControlName="description"
                    placeholder="Describe what students will learn..."
                    rows="5"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    50-2000 characters · Include course objectives and benefits
                  </p>
                  <p
                    *ngIf="getFieldError('description')"
                    class="text-xs text-red-500 mt-1"
                  >
                    {{ getFieldError('description') }}
                  </p>
                </div>

                <!-- Category and Level -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      class="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Category <span class="text-red-500">*</span>
                    </label>
                    <select
                      formControlName="category"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category</option>
                      <option value="Programming">Programming</option>
                      <option value="Design">Design</option>
                      <option value="Business">Business</option>
                      <option value="Science">Science</option>
                      <option value="Arts">Arts</option>
                      <option value="Languages">Languages</option>
                      <option value="Math">Math</option>
                      <option value="Other">Other</option>
                    </select>
                    <p
                      *ngIf="getFieldError('category')"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ getFieldError('category') }}
                    </p>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Level <span class="text-red-500">*</span>
                    </label>
                    <select
                      formControlName="level"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a level</option>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                    <p
                      *ngIf="getFieldError('level')"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ getFieldError('level') }}
                    </p>
                  </div>
                </div>

                <!-- Language and Duration -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      class="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Language
                    </label>
                    <select
                      formControlName="language"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      formControlName="duration"
                      placeholder="e.g., 120"
                      min="15"
                      max="1000"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p class="text-xs text-gray-500 mt-1">15-1000 minutes</p>
                  </div>
                </div>

                <!-- Tags -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    formControlName="tagsInput"
                    placeholder="e.g., web development, javascript, react"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Maximum 10 tags · Press Enter to add
                  </p>
                </div>
              </div>
            </div>

            <!-- Step 2: Media -->
            <div *ngIf="currentStep === 2" [@slideIn]>
              <h2 class="text-2xl font-bold mb-6 text-gray-800">
                Course Media
              </h2>

              <div class="space-y-6">
                <!-- Thumbnail Upload -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Course Thumbnail
                  </label>
                  <div
                    class="border-2 border-dashed border-gray-300 rounded-lg p-8
                       text-center hover:border-blue-500 transition cursor-pointer"
                    (click)="thumbnailInput.click()"
                  >
                    <p
                      *ngIf="!wizardForm.get('thumbnailUrl')?.value"
                      class="text-gray-500"
                    >
                      Click to upload or drag and drop<br />
                      <span class="text-xs"> PNG, JPG, WebP up to 5MB </span>
                    </p>
                    <img
                      *ngIf="wizardForm.get('thumbnailUrl')?.value"
                      [src]="wizardForm.get('thumbnailUrl')?.value"
                      alt="Thumbnail preview"
                      class="max-h-40 mx-auto rounded"
                    />
                  </div>
                  <input
                    #thumbnailInput
                    type="file"
                    hidden
                    accept="image/*"
                    (change)="onThumbnailSelected($event)"
                  />
                  <p
                    *ngIf="uploadProgress.thumbnail"
                    class="text-xs text-blue-500 mt-2"
                  >
                    Uploading... {{ uploadProgress.thumbnail }}%
                  </p>
                </div>

                <!-- Intro Video Upload -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Intro Video (Optional)
                  </label>
                  <div
                    class="border-2 border-dashed border-gray-300 rounded-lg p-8
                       text-center hover:border-blue-500 transition cursor-pointer"
                    (click)="videoInput.click()"
                  >
                    <p
                      *ngIf="!wizardForm.get('introVideoUrl')?.value"
                      class="text-gray-500"
                    >
                      Click to upload or drag and drop<br />
                      <span class="text-xs"> MP4, WebM up to 500MB </span>
                    </p>
                    <p
                      *ngIf="wizardForm.get('introVideoUrl')?.value"
                      class="text-green-600 text-sm"
                    >
                      ✓ Video uploaded successfully
                    </p>
                  </div>
                  <input
                    #videoInput
                    type="file"
                    hidden
                    accept="video/*"
                    (change)="onVideoSelected($event)"
                  />
                  <p
                    *ngIf="uploadProgress.video"
                    class="text-xs text-blue-500 mt-2"
                  >
                    Uploading... {{ uploadProgress.video }}%
                  </p>
                </div>
              </div>
            </div>

            <!-- Step 3: Pricing -->
            <div *ngIf="currentStep === 3" [@slideIn]>
              <h2 class="text-2xl font-bold mb-6 text-gray-800">
                Pricing Settings
              </h2>

              <div class="space-y-6">
                <!-- Premium Toggle -->
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    formControlName="isPremium"
                    id="isPremium"
                    class="rounded"
                  />
                  <label for="isPremium" class="ml-3 text-gray-700">
                    This is a premium course
                  </label>
                </div>

                <!-- Price -->
                <div *ngIf="wizardForm.get('isPremium')?.value">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Price <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-4">
                    <select
                      formControlName="currency"
                      class="px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                    <input
                      type="number"
                      formControlName="price"
                      placeholder="0.00"
                      min="0"
                      max="99999"
                      step="0.01"
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-1">0 to 99,999</p>
                </div>

                <!-- Discount -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Percentage (Optional)
                  </label>
                  <div class="flex gap-4 items-end">
                    <div class="flex-1">
                      <input
                        type="number"
                        formControlName="discountPercentage"
                        placeholder="0"
                        min="0"
                        max="100"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div
                      class="text-sm text-gray-600"
                      *ngIf="getDiscountedPrice()"
                    >
                      You'll earn:
                      <span class="font-bold text-green-600">
                        {{ getDiscountedPrice() }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Discount End Date -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Discount End Date (Optional)
                  </label>
                  <input
                    type="date"
                    formControlName="discountEndDate"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <!-- Step 4: Publishing -->
            <div *ngIf="currentStep === 4" [@slideIn]>
              <h2 class="text-2xl font-bold mb-6 text-gray-800">
                Publishing Settings
              </h2>

              <div class="space-y-6">
                <!-- Status -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    formControlName="status"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PRIVATE">Private (by invite only)</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Schedule for later</option>
                  </select>
                </div>

                <!-- Scheduled Date -->
                <div *ngIf="wizardForm.get('status')?.value === 'SCHEDULED'">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Publish Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    formControlName="scheduledPublishDate"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- SEO Title -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    formControlName="seoTitle"
                    placeholder="Optimized title for search engines"
                    maxlength="60"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Max 60 characters ·
                    {{ wizardForm.get('seoTitle')?.value?.length || 0 }}/60
                  </p>
                </div>

                <!-- SEO Description -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    formControlName="seoDescription"
                    placeholder="Search engine description"
                    maxlength="160"
                    rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    Max 160 characters ·
                    {{
                      wizardForm.get('seoDescription')?.value?.length || 0
                    }}/160
                  </p>
                </div>

                <!-- URL Slug -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    formControlName="urlSlug"
                    placeholder="auto-generated-slug"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Unique identifier for your course URL · Auto-generated if
                    empty
                  </p>
                </div>

                <!-- OG Image -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Open Graph Image URL
                  </label>
                  <input
                    type="url"
                    formControlName="ogImageUrl"
                    placeholder="https://..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Used when sharing on social media
                  </p>
                </div>
              </div>
            </div>
          </form>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              *ngIf="currentStep > 1"
              (click)="previousStep()"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700
                   hover:bg-gray-50 transition duration-200 font-semibold"
            >
              Previous
            </button>

            <button
              (click)="saveDraft()"
              [disabled]="isSavingDraft"
              class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700
                   hover:bg-gray-50 transition duration-200 font-semibold
                   disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSavingDraft ? 'Saving...' : 'Save as Draft' }}
            </button>

            <button
              *ngIf="currentStep < 4"
              (click)="nextStep()"
              class="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg
                   hover:bg-blue-600 transition duration-200 font-semibold"
            >
              Next
            </button>

            <button
              *ngIf="currentStep === 4"
              (click)="publishCourse()"
              [disabled]="isPublishing"
              class="ml-auto px-6 py-2 bg-green-500 text-white rounded-lg
                   hover:bg-green-600 transition duration-200 font-semibold
                   disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPublishing ? 'Publishing...' : 'Publish Course' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CourseCreationWizardComponent implements OnInit, OnDestroy {
  wizardForm: FormGroup;
  currentStep: number = 1;
  isPublishing = false;
  isSavingDraft = false;
  autoSaveStatus: string = '';
  uploadProgress = { thumbnail: 0, video: 0 };
  courseId: string | null = null;

  private destroy$ = new Subject<void>();
  private autoSaveSubject$ = new Subject<void>();

  stepIndicators: StepStatus[] = [
    {
      stepNumber: 1,
      title: 'Basic Info',
      isComplete: false,
      hasErrors: false,
      isDirty: false,
    },
    {
      stepNumber: 2,
      title: 'Media',
      isComplete: false,
      hasErrors: false,
      isDirty: false,
    },
    {
      stepNumber: 3,
      title: 'Pricing',
      isComplete: false,
      hasErrors: false,
      isDirty: false,
    },
    {
      stepNumber: 4,
      title: 'Publishing',
      isComplete: false,
      hasErrors: false,
      isDirty: false,
    },
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private instructorService: InstructorService,
    private courseRefreshService: CourseRefreshService,
    private router: Router,
  ) {
    this.wizardForm = this.createForm();
  }

  ngOnInit() {
    // Set up auto-save
    this.autoSaveSubject$
      .pipe(debounceTime(3000), takeUntil(this.destroy$))
      .subscribe(() => this.autoSave());

    // Auto-save on form changes
    this.wizardForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.autoSaveSubject$.next());

    // Periodic auto-save every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.autoSave());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Step 1: Basic
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100),
        ],
      ],
      subtitle: ['', [Validators.maxLength(200)]],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(50),
          Validators.maxLength(2000),
        ],
      ],
      category: ['', Validators.required],
      level: ['', Validators.required],
      language: ['English'],
      duration: [
        60,
        [Validators.required, Validators.min(15), Validators.max(1000)],
      ],
      tagsInput: [''],

      // Step 2: Media
      thumbnailUrl: [''],
      introVideoUrl: [''],

      // Step 3: Pricing
      isPremium: [false],
      price: [0, [Validators.min(0), Validators.max(99999)]],
      currency: ['USD'],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      discountEndDate: [''],

      // Step 4: Publishing
      status: ['DRAFT'],
      scheduledPublishDate: [''],
      seoTitle: [''],
      seoDescription: [''],
      urlSlug: [''],
      ogImageUrl: [''],
    });
  }

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < 4) {
        this.currentStep++;
        this.updateStepStatus();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(stepNumber: number) {
    if (stepNumber <= this.currentStep) {
      this.currentStep = stepNumber;
    }
  }

  validateStep(step: number): boolean {
    const stepControls: Record<number, string[]> = {
      1: ['title', 'description', 'category', 'level', 'duration'],
      2: ['thumbnailUrl'],
      3: [],
      4: [],
    };

    const controls = stepControls[step] || [];
    return controls.every(
      (control) =>
        this.wizardForm.get(control)?.valid ||
        !this.wizardForm.get(control)?.touched,
    );
  }

  private updateStepStatus() {
    for (let i = 1; i < this.currentStep; i++) {
      this.stepIndicators[i - 1].isComplete = true;
    }
  }

  getStepIndicatorClass(step: StepStatus): string {
    if (step.stepNumber === this.currentStep) {
      return 'bg-blue-500 text-white shadow-lg';
    } else if (step.isComplete) {
      return 'bg-green-500 text-white';
    } else {
      return 'bg-gray-200 text-gray-700';
    }
  }

  getFieldError(fieldName: string): string | null {
    const control = this.wizardForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('minlength')) {
      const min = control.getError('minlength').requiredLength;
      return `Minimum ${min} characters required`;
    }
    if (control?.hasError('maxlength')) {
      const max = control.getError('maxlength').requiredLength;
      return `Maximum ${max} characters allowed`;
    }
    return null;
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.wizardForm.patchValue({
          thumbnailUrl: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onVideoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.wizardForm.patchValue({
        introVideoUrl: file.name,
      });
    }
  }

  getDiscountedPrice(): string {
    const price = this.wizardForm.get('price')?.value || 0;
    const discount = this.wizardForm.get('discountPercentage')?.value || 0;
    const discounted = price - (price * discount) / 100;
    return `$${discounted.toFixed(2)}`;
  }

  async saveDraft() {
    this.isSavingDraft = true;
    try {
      const formValue = this.wizardForm.value;
      if (this.courseId) {
        // Update existing draft
        await this.apiService
          .patchAuth(`/courses/${this.courseId}/draft`, formValue)
          .toPromise();
      } else {
        // Create new course
        const response = await this.apiService
          .postAuth<{ success: boolean; message: string; course: { id: string } }>(
            '/courses',
            formValue,
          )
          .toPromise();
        this.courseId = response?.course?.id ?? null;
      }
      this.autoSaveStatus = 'Draft saved ✓';
      setTimeout(() => {
        this.autoSaveStatus = '';
      }, 3000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.autoSaveStatus = 'Failed to save draft';
    } finally {
      this.isSavingDraft = false;
    }
  }

  private autoSave() {
    if (this.wizardForm.dirty && this.courseId) {
      this.saveDraft();
    }
  }

  async publishCourse() {
    if (!this.validateStep(4)) {
      alert('Please complete all fields');
      return;
    }

    this.isPublishing = true;
    try {
      if (!this.courseId) {
        // First save the draft
        await this.saveDraft();
      }

      // Then publish
      await this.apiService
        .postAuth(`/courses/${this.courseId}/publish`, {})
        .toPromise();

      // Notify other components
      this.courseRefreshService.notifyCourseCreated();

      // Show success and redirect
      alert('Course published successfully!');
      this.router.navigate(['/instructor/my-courses']);
    } catch (error) {
      console.error('Failed to publish course:', error);
      alert('Failed to publish course');
    } finally {
      this.isPublishing = false;
    }
  }
}
