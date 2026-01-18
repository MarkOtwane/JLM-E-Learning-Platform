import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-classes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <h1 class="page-title">Live Classes</h1>
        <p class="page-description">Join live sessions and interact with instructors</p>
      </div>

      <!-- Live Now -->
      <section *ngIf="liveNow.length > 0">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Live Now
        </h2>
        <div class="grid grid-cols-1 gap-4">
          <div *ngFor="let session of liveNow" class="card border-2 border-red-500">
            <div class="card-body">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <span class="badge bg-red-100 text-red-800 text-xs mb-2">🔴 LIVE</span>
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ session.title }}</h3>
                  <p class="text-sm text-gray-600 mb-3">{{ session.instructor }}</p>
                  <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span>{{ session.participants }} participants</span>
                    <span>Started {{ session.startedAgo }}</span>
                  </div>
                </div>
                <button class="btn-primary flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Upcoming Sessions -->
      <section>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let session of upcomingSessions" class="card">
            <div class="card-body">
              <div class="flex gap-4">
                <div class="flex-shrink-0 text-center">
                  <div class="w-16 h-16 rounded-lg bg-primary-100 flex flex-col items-center justify-center">
                    <span class="text-2xl font-bold text-primary-600">{{ session.date | date:'d' }}</span>
                    <span class="text-xs text-primary-600">{{ session.date | date:'MMM' }}</span>
                  </div>
                </div>
                <div class="flex-1">
                  <span class="badge badge-primary text-xs mb-2">{{ session.course }}</span>
                  <h3 class="text-base font-semibold text-gray-900 mb-1">{{ session.title }}</h3>
                  <p class="text-sm text-gray-600 mb-2">{{ session.instructor }}</p>
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ session.date | date:'h:mm a' }} - {{ session.duration }} min
                  </div>
                  <button class="mt-3 btn-outline w-full text-sm">Set Reminder</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Past Sessions -->
      <section>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Recordings</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div *ngFor="let recording of recordings" class="card hover:shadow-md transition-shadow cursor-pointer">
            <div class="relative h-40 bg-gray-900 rounded-t-xl overflow-hidden group">
              <img [src]="recording.thumbnail" [alt]="recording.title" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
              <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {{ recording.duration }}
              </div>
            </div>
            <div class="p-4">
              <span class="badge badge-primary text-xs mb-2">{{ recording.course }}</span>
              <h3 class="text-sm font-semibold text-gray-900 line-clamp-2">{{ recording.title }}</h3>
              <p class="text-xs text-gray-500 mt-1">{{ recording.date | date:'MMM d, yyyy' }}</p>
            </div>
          </div>
        </div>
      </section>
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
export class LiveClassesComponent {
  liveNow = [
    {
      title: 'Advanced React Patterns Workshop',
      instructor: 'Jane Smith',
      participants: 24,
      startedAgo: '15 mins ago'
    }
  ];

  upcomingSessions = [
    {
      title: 'Q&A Session: Web Development Best Practices',
      course: 'Web Development',
      instructor: 'John Doe',
      date: new Date('2026-01-20T15:00:00'),
      duration: 60
    },
    {
      title: 'Design Systems Masterclass',
      course: 'UI/UX Design',
      instructor: 'Mike Johnson',
      date: new Date('2026-01-22T14:00:00'),
      duration: 90
    }
  ];

  recordings = [
    {
      title: 'Introduction to TypeScript',
      course: 'Web Development',
      thumbnail: 'https://picsum.photos/400/300?random=10',
      date: new Date('2026-01-10'),
      duration: '1:24:30'
    },
    {
      title: 'React Hooks Deep Dive',
      course: 'Advanced React',
      thumbnail: 'https://picsum.photos/400/300?random=11',
      date: new Date('2026-01-12'),
      duration: '2:15:45'
    },
    {
      title: 'Figma Prototyping Workshop',
      course: 'UI/UX Design',
      thumbnail: 'https://picsum.photos/400/300?random=12',
      date: new Date('2026-01-14'),
      duration: '1:45:20'
    }
  ];
}
