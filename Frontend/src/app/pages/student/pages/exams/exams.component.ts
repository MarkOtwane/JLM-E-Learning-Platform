import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <h1 class="page-title">Exams & Quizzes</h1>
        <p class="page-description">View your exam schedule and results</p>
      </div>

      <!-- Upcoming Exams -->
      <section>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Upcoming Exams</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let exam of upcomingExams" class="card border-l-4 border-l-orange-500">
            <div class="card-body">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <span class="badge badge-primary text-xs mb-2">{{ exam.course }}</span>
                  <h3 class="text-lg font-semibold text-gray-900">{{ exam.title }}</h3>
                </div>
              </div>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ exam.date | date:'EEEE, MMMM d, yyyy' }}
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ exam.duration }} minutes
                </div>
              </div>
              <button class="mt-4 btn-primary w-full text-sm">View Details</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Past Results -->
      <section>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Past Results</h2>
        <div class="card">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let result of pastResults" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ result.exam }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ result.course }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ result.date | date:'MMM d, yyyy' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{{ result.score }}%</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getGradeBadgeClass(result.grade)" class="badge">{{ result.grade }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class ExamsComponent {
  upcomingExams = [
    {
      title: 'Midterm Examination',
      course: 'Web Development',
      date: new Date('2026-02-20'),
      duration: 90
    },
    {
      title: 'Final Assessment',
      course: 'UI/UX Design',
      date: new Date('2026-02-25'),
      duration: 120
    }
  ];

  pastResults = [
    { exam: 'Quiz 1', course: 'Advanced React', date: new Date('2026-01-10'), score: 95, grade: 'A' },
    { exam: 'Midterm', course: 'Web Development', date: new Date('2026-01-15'), score: 88, grade: 'B+' },
    { exam: 'Final Exam', course: 'UI/UX Design', date: new Date('2026-01-20'), score: 92, grade: 'A-' }
  ];

  getGradeBadgeClass(grade: string): string {
    if (grade.startsWith('A')) return 'badge-success';
    if (grade.startsWith('B')) return 'badge-info';
    if (grade.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }
}
