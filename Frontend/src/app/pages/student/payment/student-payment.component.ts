import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

interface Payment {
  course: string;
  amount: number;
  date: string;
  method: string;
  status: 'Paid' | 'Failed' | 'Pending';
}

@Component({
  selector: 'app-student-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-payment.component.html',
  styleUrls: ['./student-payment.component.css'],
})
export class StudentPaymentComponent implements OnInit {
  totalPaid = 0;
  totalCourses = 0;
  lastPaymentDate = '';
  payments: Payment[] = [];
  isLoading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.apiService.getAuth<Payment[]>('/payments').subscribe({
      next: (payments) => {
        this.payments = payments;
        this.calculateSummary();
        this.isLoading = false;
      },
      error: () => {
        this.payments = [];
        this.isLoading = false;
      },
    });
  }

  calculateSummary() {
    const paidPayments = this.payments.filter((p) => p.status === 'Paid');
    this.totalCourses = paidPayments.length;
    this.totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    this.lastPaymentDate = paidPayments.length ? paidPayments[0].date : 'N/A';
  }
}
