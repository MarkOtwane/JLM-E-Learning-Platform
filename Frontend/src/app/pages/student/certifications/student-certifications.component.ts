import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface Certificate {
  course: {
    title: string;
    description?: string;
  };
  issuedAt: string;
  certificateUrl: string;
}

@Component({
  selector: 'app-student-certifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-certifications.component.html',
  styleUrls: ['./student-certifications.component.css'],
})
export class StudentCertificationsComponent implements OnInit {
  certificates: Certificate[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAuth<Certificate[]>('/certificates').subscribe({
      next: (certs) => {
        this.certificates = certs;
      },
      error: () => {
        this.certificates = [];
      },
    });
  }

  async downloadCertificate(certUrl: string) {
    // For now, just open the certificate URL in a new tab
    window.open(certUrl, '_blank');
  }
}
