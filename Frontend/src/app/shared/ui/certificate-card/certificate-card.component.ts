import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CertificateData {
  id: string;
  courseName: string;
  studentName: string;
  issueDate: Date;
  certificateUrl?: string;
  thumbnailUrl?: string;
  verificationCode?: string;
  grade?: string;
  instructor?: string;
}

@Component({
  selector: 'app-certificate-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <!-- Certificate Preview -->
      <div class="relative h-56 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 overflow-hidden">
        <img *ngIf="certificate.thumbnailUrl; else defaultCertificate"
             [src]="certificate.thumbnailUrl"
             [alt]="certificate.courseName"
             class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        />
        <ng-template #defaultCertificate>
          <div class="w-full h-full flex flex-col items-center justify-center text-white p-6">
            <!-- Certificate Icon -->
            <svg class="w-16 h-16 mb-4 opacity-80" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            
            <!-- Certificate Title -->
            <div class="text-center">
              <p class="text-sm font-medium opacity-90 mb-1">Certificate of Completion</p>
              <h4 class="text-lg font-bold line-clamp-2">{{ certificate.courseName }}</h4>
            </div>
          </div>
        </ng-template>

        <!-- Verification Badge -->
        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
          <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="text-xs font-semibold text-gray-800">Verified</span>
        </div>
      </div>

      <!-- Content -->
      <div class="card-body">
        <!-- Course Name -->
        <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {{ certificate.courseName }}
        </h3>

        <!-- Student Name -->
        <p class="text-sm text-gray-600 mb-1">
          Awarded to <span class="font-medium text-gray-900">{{ certificate.studentName }}</span>
        </p>

        <!-- Issue Date -->
        <p class="text-sm text-gray-500 mb-4">
          Issued on {{ certificate.issueDate | date: 'MMMM d, yyyy' }}
        </p>

        <!-- Additional Info -->
        <div class="flex items-center gap-4 mb-4 text-sm">
          <span *ngIf="certificate.grade" class="badge badge-success">
            Grade: {{ certificate.grade }}
          </span>
          <span *ngIf="certificate.instructor" class="text-gray-600">
            By {{ certificate.instructor }}
          </span>
        </div>

        <!-- Verification Code -->
        <div *ngIf="certificate.verificationCode" class="bg-gray-50 rounded-lg p-3 mb-4">
          <p class="text-xs text-gray-600 mb-1">Verification Code</p>
          <p class="text-sm font-mono font-semibold text-gray-900">{{ certificate.verificationCode }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button (click)="handleDownload()" 
                  class="flex-1 btn-primary text-sm py-2">
            <svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button (click)="handleShare()" 
                  class="flex-1 btn-outline text-sm py-2">
            <svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button (click)="handleView()" 
                  class="btn-ghost text-sm py-2 px-3"
                  title="View Full Certificate">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class CertificateCardComponent {
  @Input() certificate!: CertificateData;
  
  @Output() download = new EventEmitter<CertificateData>();
  @Output() share = new EventEmitter<CertificateData>();
  @Output() view = new EventEmitter<CertificateData>();

  handleDownload(): void {
    this.download.emit(this.certificate);
  }

  handleShare(): void {
    this.share.emit(this.certificate);
  }

  handleView(): void {
    this.view.emit(this.certificate);
  }
}
