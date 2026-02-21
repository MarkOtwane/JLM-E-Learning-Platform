import { CommonModule } from '@angular/common'; // Import this
import { Component, OnInit } from '@angular/core';

interface Payment {
  course: string;
  amount: number;
  date: string;
  method: string;
  status: 'Paid' | 'Failed' | 'Pending';
}

@Component({
  selector: 'app-student-payment',
  standalone: true, // if you're using standalone components
  imports: [CommonModule], // Fix: Add CommonModule here
  templateUrl: './student-payment.component.html',
  styleUrls: ['./student-payment.component.css'],
})
export class StudentPaymentComponent implements OnInit {
  totalPaid = 0;
  totalCourses = 0;
  lastPaymentDate = '';

  payments: Payment[] = [];

  ngOnInit(): void {
    this.payments = [
      {
        course: 'Angular Basics',
        amount: 30,
        date: '2025-07-01',
        method: 'M-Pesa',
        status: 'Paid',
      },
      {
        course: 'NestJS Advanced',
        amount: 45,
        date: '2025-06-25',
        method: 'Card',
        status: 'Paid',
      },
    ];

    this.calculateSummary();
  }

  calculateSummary() {
    const paidPayments = this.payments.filter((p) => p.status === 'Paid');
    this.totalCourses = paidPayments.length;
    this.totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    this.lastPaymentDate = paidPayments.length ? paidPayments[0].date : 'N/A';
  }
}
