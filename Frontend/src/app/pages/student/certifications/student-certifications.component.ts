import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface Certificate {
  id: string;
  course: { title: string; description: string };
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
  isLoading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.apiService.getAuth<Certificate[]>('/certificates').subscribe({
      next: (certs) => {
        this.certificates = certs;
        this.isLoading = false;
      },
      error: () => {
        this.certificates = [];
        this.isLoading = false;
      },
    });
  }

  downloadCertificate(certificateUrl: string) {
    window.open(certificateUrl, '_blank');
  }
}
