import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <h1 class="page-title">Messages</h1>
        <p class="page-description">Communicate with instructors and support</p>
      </div>

      <div class="card overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-300px)]">
          <!-- Conversations List -->
          <div class="lg:col-span-1 border-r border-gray-200 overflow-y-auto">
            <div class="p-4 border-b border-gray-200">
              <input type="text" placeholder="Search messages..." class="input text-sm">
            </div>
            <div class="divide-y divide-gray-100">
              <div *ngFor="let conversation of conversations" 
                   (click)="selectedConversation = conversation"
                   [class.bg-primary-50]="selectedConversation?.id === conversation.id"
                   class="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div class="flex gap-3">
                  <div class="relative flex-shrink-0">
                    <div class="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      <img *ngIf="conversation.avatar" [src]="conversation.avatar" [alt]="conversation.name" class="w-full h-full object-cover">
                    </div>
                    <span *ngIf="conversation.online" class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class="text-sm font-semibold text-gray-900 truncate">{{ conversation.name }}</h3>
                      <span class="text-xs text-gray-500">{{ conversation.time }}</span>
                    </div>
                    <p class="text-sm text-gray-600 truncate">{{ conversation.lastMessage }}</p>
                    <span *ngIf="conversation.unread" class="mt-1 inline-block px-2 py-0.5 text-xs font-semibold bg-primary-600 text-white rounded-full">
                      {{ conversation.unread }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Thread -->
          <div class="lg:col-span-2 flex flex-col">
            <div *ngIf="selectedConversation" class="flex-1 flex flex-col">
              <!-- Chat Header -->
              <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <img *ngIf="selectedConversation.avatar" [src]="selectedConversation.avatar" [alt]="selectedConversation.name">
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">{{ selectedConversation.name }}</h3>
                    <p class="text-xs text-gray-500">{{ selectedConversation.role }}</p>
                  </div>
                </div>
              </div>

              <!-- Messages -->
              <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                <div class="text-center">
                  <span class="text-xs text-gray-500">Today</span>
                </div>
                <div class="flex justify-end">
                  <div class="max-w-md bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                    <p class="text-sm">Hi, I have a question about the assignment</p>
                    <span class="text-xs opacity-75 mt-1 block">10:30 AM</span>
                  </div>
                </div>
                <div class="flex justify-start">
                  <div class="max-w-md bg-white rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
                    <p class="text-sm text-gray-900">Sure! How can I help you?</p>
                    <span class="text-xs text-gray-500 mt-1 block">10:32 AM</span>
                  </div>
                </div>
              </div>

              <!-- Input -->
              <div class="p-4 border-t border-gray-200">
                <div class="flex gap-2">
                  <input type="text" placeholder="Type a message..." class="input flex-1">
                  <button class="btn-primary">Send</button>
                </div>
              </div>
            </div>

            <div *ngIf="!selectedConversation" class="flex-1 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MessagesComponent {
  selectedConversation: any = null;

  conversations = [
    {
      id: '1',
      name: 'John Doe',
      role: 'Instructor - Web Development',
      avatar: 'https://i.pravatar.cc/100?u=john',
      lastMessage: 'Great work on your last assignment!',
      time: '2h ago',
      unread: 2,
      online: true
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Instructor - React',
      avatar: 'https://i.pravatar.cc/100?u=jane',
      lastMessage: 'The next live class is tomorrow',
      time: '5h ago',
      unread: 0,
      online: false
    },
    {
      id: '3',
      name: 'Support Team',
      role: 'Student Support',
      avatar: 'https://i.pravatar.cc/100?u=support',
      lastMessage: 'How can we help you today?',
      time: '1d ago',
      unread: 0,
      online: true
    }
  ];
}
