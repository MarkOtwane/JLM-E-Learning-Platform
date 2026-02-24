import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import {
  MessagingService,
  Message,
  Contact,
  ContactsResponse,
  ConversationSummary,
} from '../../../../services/messaging.service';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';

interface Conversation {
  partner: Contact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, TruncatePipe],
  template: `
    <div class="messages-container">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Messages</h1>
          <p class="page-description">Communicate with instructors and fellow students</p>
        </div>
        <button class="btn-primary new-message-btn" (click)="showNewMessageModal = true">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </div>

      <div class="card messages-card">
        <div class="messages-layout">
          <!-- Sidebar - Conversations List -->
          <div class="conversations-sidebar">
            <div class="sidebar-header">
              <div class="search-box">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchChange($event)"
                  class="search-input"
                />
              </div>
            </div>

            <div class="conversations-tabs">
              <button
                [class.active]="activeTab === 'all'"
                (click)="activeTab = 'all'"
                class="tab-btn"
              >
                All
              </button>
              <button
                [class.active]="activeTab === 'instructors'"
                (click)="activeTab = 'instructors'"
                class="tab-btn"
              >
                Instructors
              </button>
              <button
                [class.active]="activeTab === 'students'"
                (click)="activeTab = 'students'"
                class="tab-btn"
              >
                Students
              </button>
            </div>

            <div class="conversations-list" #conversationsList>
              <div *ngIf="loadingConversations" class="loading-state">
                <div class="spinner"></div>
                <p>Loading conversations...</p>
              </div>

              <div *ngIf="!loadingConversations && filteredConversations.length === 0" class="empty-state">
                <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p>No conversations yet</p>
                <p class="empty-hint">Start by messaging an instructor or fellow student</p>
              </div>

              <div
                *ngFor="let conv of filteredConversations"
                class="conversation-item"
                [class.active]="selectedConversation && selectedConversation.partner.id === conv.partner.id"
                (click)="selectConversation(conv)"
              >
                <div class="avatar-container">
                  <div class="avatar" *ngIf="!conv.partner.profilePicture">
                    {{ getInitials(conv.partner.name) }}
                  </div>
                  <img
                    *ngIf="conv.partner.profilePicture"
                    [src]="conv.partner.profilePicture"
                    [alt]="conv.partner.name"
                    class="avatar-img"
                  />
                  <span *ngIf="conv.partner.type === 'instructor'" class="role-badge instructor">I</span>
                  <span *ngIf="conv.partner.type === 'student'" class="role-badge student">S</span>
                </div>
                <div class="conversation-info">
                  <div class="conversation-header">
                    <h3 class="partner-name">{{ conv.partner.name }}</h3>
                    <span class="time-stamp">{{ formatTime(conv.lastMessageTime) }}</span>
                  </div>
                  <p class="last-message">{{ conv.lastMessage | truncate:50 }}</p>
                  <div class="conversation-meta">
                    <span *ngIf="conv.partner.courseTitle" class="course-tag">
                      {{ conv.partner.courseTitle }}
                    </span>
                    <span *ngIf="conv.unreadCount > 0" class="unread-badge">
                      {{ conv.unreadCount }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Chat Area -->
          <div class="chat-area">
            <div *ngIf="!selectedConversation" class="no-conversation-selected">
              <svg class="no-chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list or start a new message</p>
            </div>

            <div *ngIf="selectedConversation" class="chat-container">
              <!-- Chat Header -->
              <div class="chat-header">
                <div class="chat-partner-info">
                  <div class="avatar-container small">
                    <div class="avatar" *ngIf="!selectedConversation.partner.profilePicture">
                      {{ getInitials(selectedConversation.partner.name) }}
                    </div>
                    <img
                      *ngIf="selectedConversation.partner.profilePicture"
                      [src]="selectedConversation.partner.profilePicture"
                      [alt]="selectedConversation.partner.name"
                      class="avatar-img"
                    />
                  </div>
                  <div class="partner-details">
                    <h3>{{ selectedConversation.partner.name }}</h3>
                    <p class="partner-role">
                      {{ selectedConversation.partner.type === 'instructor' ? 'Instructor' : 'Student' }}
                      <span *ngIf="selectedConversation.partner.courseTitle">
                        - {{ selectedConversation.partner.courseTitle }}
                      </span>
                    </p>
                  </div>
                </div>
                <div class="chat-actions">
                  <button class="action-btn" title="Refresh" (click)="refreshConversation()">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Messages -->
              <div class="messages-list" #messagesContainer>
                <div *ngIf="loadingMessages" class="loading-messages">
                  <div class="spinner"></div>
                </div>

                <div *ngIf="!loadingMessages && messages.length === 0" class="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>

                <div *ngIf="!loadingMessages && messages.length > 0" class="messages-wrapper">
                  <div
                    *ngFor="let msg of messages; trackBy: trackByMessageId"
                    class="message-row"
                    [class.sent]="msg.senderId === currentUserId"
                    [class.received]="msg.senderId !== currentUserId"
                  >
                    <div class="message-bubble">
                      <div class="message-subject" *ngIf="msg.subject && msg.subject !== 'No Subject'">
                        {{ msg.subject }}
                      </div>
                      <p class="message-body">{{ msg.body }}</p>
                      <div class="message-footer">
                        <span class="message-time">{{ formatMessageTime(msg.createdAt) }}</span>
                        <span *ngIf="msg.senderId === currentUserId && msg.isRead" class="read-status">
                          <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Message Input -->
              <div class="message-input-area">
                <div class="input-wrapper">
                  <textarea
                    [(ngModel)]="newMessage"
                    placeholder="Type your message..."
                    class="message-textarea"
                    (keydown.enter)="onEnterKey($event)"
                    rows="1"
                    #messageInput
                  ></textarea>
                  <button
                    class="send-btn"
                    [disabled]="!newMessage.trim() || sendingMessage"
                    (click)="sendMessage()"
                  >
                    <svg *ngIf="!sendingMessage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <div *ngIf="sendingMessage" class="spinner small"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Message Modal -->
      <div *ngIf="showNewMessageModal" class="modal-overlay" (click)="closeNewMessageModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>New Message</h2>
            <button class="close-btn" (click)="closeNewMessageModal()">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>To:</label>
              <div class="recipient-selector">
                <input
                  type="text"
                  [(ngModel)]="recipientSearchQuery"
                  placeholder="Search instructors or students..."
                  class="form-input"
                  (ngModelChange)="filterRecipients($event)"
                />
                <div *ngIf="recipientSearchQuery && filteredRecipients.length > 0" class="recipient-dropdown">
                  <div
                    *ngFor="let recipient of filteredRecipients"
                    class="recipient-option"
                    (click)="selectRecipient(recipient)"
                  >
                    <div class="avatar small">
                      {{ getInitials(recipient.name) }}
                    </div>
                    <div class="recipient-info">
                      <span class="recipient-name">{{ recipient.name }}</span>
                      <span class="recipient-role">{{ recipient.type === 'instructor' ? 'Instructor' : 'Student' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="selectedRecipient" class="selected-recipient">
                <span>{{ selectedRecipient.name }}</span>
                <button class="remove-recipient" (click)="selectedRecipient = null">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Subject:</label>
              <input
                type="text"
                [(ngModel)]="newMessageSubject"
                placeholder="Message subject"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Message:</label>
              <textarea
                [(ngModel)]="newMessageBody"
                placeholder="Type your message..."
                class="form-textarea"
                rows="5"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeNewMessageModal()">Cancel</button>
            <button
              class="btn-primary"
              [disabled]="!selectedRecipient || !newMessageBody.trim() || sendingNewMessage"
              (click)="sendNewMessage()"
            >
              <span *ngIf="!sendingNewMessage">Send Message</span>
              <span *ngIf="sendingNewMessage">Sending...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .page-description {
      color: #6b7280;
      margin: 0.25rem 0 0 0;
    }

    .new-message-btn {
      display: flex;
      align-items: center;
    }

    .messages-card {
      flex: 1;
      overflow: hidden;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .messages-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - 200px);
      min-height: 500px;
    }

    /* Conversations Sidebar */
    .conversations-sidebar {
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .search-box {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1.25rem;
      height: 1.25rem;
      color: #9ca3af;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 0.75rem 0.625rem 2.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .conversations-tabs {
      display: flex;
      padding: 0.5rem;
      gap: 0.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab-btn {
      flex: 1;
      padding: 0.5rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f3f4f6;
    }

    .tab-btn.active {
      background: #3b82f6;
      color: white;
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
      border-bottom: 1px solid #f3f4f6;
    }

    .conversation-item:hover {
      background: #f9fafb;
    }

    .conversation-item.active {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
    }

    .avatar-container {
      position: relative;
      flex-shrink: 0;
    }

    .avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .avatar-img {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      object-fit: cover;
    }

    .role-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      font-size: 0.625rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }

    .role-badge.instructor {
      background: #10b981;
      color: white;
    }

    .role-badge.student {
      background: #f59e0b;
      color: white;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
    }

    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .partner-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .time-stamp {
      font-size: 0.75rem;
      color: #9ca3af;
      flex-shrink: 0;
    }

    .last-message {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conversation-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .course-tag {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 0.25rem;
    }

    .unread-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: #3b82f6;
      color: white;
      border-radius: 9999px;
      font-weight: 600;
    }

    /* Chat Area */
    .chat-area {
      display: flex;
      flex-direction: column;
    }

    .no-conversation-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .no-chat-icon {
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
    }

    .no-conversation-selected h3 {
      font-size: 1.125rem;
      font-weight: 500;
      color: #6b7280;
      margin: 0 0 0.5rem 0;
    }

    .no-conversation-selected p {
      font-size: 0.875rem;
      margin: 0;
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .chat-partner-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar-container.small .avatar,
    .avatar-container.small .avatar-img {
      width: 2rem;
      height: 2rem;
      font-size: 0.75rem;
    }

    .partner-details h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .partner-role {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }

    .chat-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem;
      border: none;
      background: #f3f4f6;
      border-radius: 0.375rem;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #e5e7eb;
      color: #1f2937;
    }

    .action-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Messages List */
    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #f9fafb;
    }

    .loading-messages {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner.small {
      width: 1.25rem;
      height: 1.25rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .no-messages {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .messages-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message-row {
      display: flex;
    }

    .message-row.sent {
      justify-content: flex-end;
    }

    .message-row.received {
      justify-content: flex-start;
    }

    .message-bubble {
      max-width: 70%;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
    }

    .message-row.sent .message-bubble {
      background: #3b82f6;
      color: white;
      border-bottom-right-radius: 0.25rem;
    }

    .message-row.received .message-bubble {
      background: white;
      color: #1f2937;
      border-bottom-left-radius: 0.25rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .message-subject {
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      opacity: 0.9;
    }

    .message-body {
      font-size: 0.875rem;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .message-time {
      font-size: 0.625rem;
      opacity: 0.7;
    }

    .read-status svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    /* Message Input */
    .message-input-area {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      background: white;
    }

    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .message-textarea {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      resize: none;
      outline: none;
      font-family: inherit;
      max-height: 120px;
      transition: border-color 0.2s;
    }

    .message-textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .send-btn {
      padding: 0.75rem;
      border: none;
      background: #3b82f6;
      color: white;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .send-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .send-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .send-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }

    .modal-content {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      padding: 0.25rem;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #6b7280;
      border-radius: 0.25rem;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #1f2937;
    }

    .close-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      resize: vertical;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .recipient-selector {
      position: relative;
    }

    .recipient-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
    }

    .recipient-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .recipient-option:hover {
      background: #f3f4f6;
    }

    .recipient-info {
      display: flex;
      flex-direction: column;
    }

    .recipient-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .recipient-role {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .selected-recipient {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      border-radius: 9999px;
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .remove-recipient {
      padding: 0.125rem;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #3b82f6;
      display: flex;
    }

    .remove-recipient svg {
      width: 1rem;
      height: 1rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary {
      padding: 0.625rem 1.25rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.625rem 1.25rem;
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    /* Loading & Empty States */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    .loading-state p {
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #9ca3af;
    }

    .empty-icon {
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    .empty-hint {
      margin-top: 0.25rem !important;
      font-size: 0.75rem !important;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .messages-layout {
        grid-template-columns: 1fr;
      }

      .conversations-sidebar {
        display: none;
      }

      .conversations-sidebar.show {
        display: flex;
        position: absolute;
        inset: 0;
        z-index: 10;
        background: white;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  currentUserId: string = '';
  searchQuery: string = '';
  activeTab: 'all' | 'instructors' | 'students' = 'all';

  // Conversations
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  loadingConversations = false;

  // Messages
  messages: Message[] = [];
  loadingMessages = false;
  newMessage = '';
  sendingMessage = false;

  // New Message Modal
  showNewMessageModal = false;
  recipientSearchQuery = '';
  selectedRecipient: Contact | null = null;
  filteredRecipients: Contact[] = [];
  newMessageSubject = '';
  newMessageBody = '';
  sendingNewMessage = false;

  // Contacts
  contacts: ContactsResponse | null = null;

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(private messagingService: MessagingService) {
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.filterConversations(query);
    });
  }

  ngOnInit(): void {
    this.loadCurrentUserId();
    this.loadContacts();
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.searchSubject.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private loadCurrentUserId(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserId = user.id;
      } catch (e) {
        console.error('Error parsing user from localStorage');
      }
    }
  }

  loadContacts(): void {
    this.messagingService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
      },
    });
  }

  loadConversations(): void {
    this.loadingConversations = true;
    this.messagingService
      .getConversationsSummary()
      .pipe(finalize(() => (this.loadingConversations = false)))
      .subscribe({
        next: (summaries) => {
          this.conversations = summaries.map((summary) => ({
            partner: {
              id: summary.partner.id,
              name: summary.partner.name,
              email: summary.partner.email,
              profilePicture: summary.partner.profilePicture,
              role: summary.partner.role,
              type: summary.partner.role.toLowerCase() as 'instructor' | 'student',
            },
            lastMessage: summary.lastMessage,
            lastMessageTime: summary.lastMessageTime,
            unreadCount: summary.unreadCount,
          }));
          this.filterConversations(this.searchQuery);
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
        },
      });
  }

  filterConversations(query: string): void {
    let filtered = this.conversations;

    // Filter by tab
    if (this.activeTab === 'instructors') {
      filtered = filtered.filter((c) => c.partner.type === 'instructor');
    } else if (this.activeTab === 'students') {
      filtered = filtered.filter((c) => c.partner.type === 'student');
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.partner.name.toLowerCase().includes(lowerQuery) ||
          c.partner.email.toLowerCase().includes(lowerQuery) ||
          c.lastMessage.toLowerCase().includes(lowerQuery)
      );
    }

    this.filteredConversations = filtered;
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.loadMessages(conv.partner.id);

    // Mark messages as read
    if (conv.unreadCount > 0) {
      this.markConversationAsRead(conv.partner.id);
    }
  }

  loadMessages(partnerId: string): void {
    this.loadingMessages = true;
    this.messagingService
      .getConversation(partnerId)
      .pipe(finalize(() => (this.loadingMessages = false)))
      .subscribe({
        next: (response) => {
          this.messages = response.messages;
          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          console.error('Error loading messages:', error);
        },
      });
  }

  refreshConversation(): void {
    if (this.selectedConversation) {
      this.loadMessages(this.selectedConversation.partner.id);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sendingMessage) {
      return;
    }

    this.sendingMessage = true;
    const partnerId = this.selectedConversation.partner.id;
    const messageBody = this.newMessage.trim();

    this.messagingService
      .sendMessage(partnerId, 'No Subject', messageBody)
      .pipe(finalize(() => (this.sendingMessage = false)))
      .subscribe({
        next: (message) => {
          this.messages.push(message);
          this.newMessage = '';
          this.shouldScrollToBottom = true;

          // Update conversation list
          this.updateConversationWithMessage(partnerId, messageBody);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        },
      });
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private markConversationAsRead(partnerId: string): void {
    // Find unread messages from this partner and mark them as read
    const unreadMessages = this.messages.filter(
      (m) => m.senderId === partnerId && !m.isRead
    );

    unreadMessages.forEach((msg) => {
      this.messagingService.markAsRead(msg.id).subscribe({
        next: () => {
          msg.isRead = true;
        },
        error: (error) => {
          console.error('Error marking message as read:', error);
        },
      });
    });

    // Update local unread count
    const conv = this.conversations.find((c) => c.partner.id === partnerId);
    if (conv) {
      conv.unreadCount = 0;
    }
  }

  private updateConversationWithMessage(partnerId: string, messageBody: string): void {
    const conv = this.conversations.find((c) => c.partner.id === partnerId);
    if (conv) {
      conv.lastMessage = messageBody;
      conv.lastMessageTime = new Date().toISOString();
    }
  }

  // New Message Modal Methods
  closeNewMessageModal(): void {
    this.showNewMessageModal = false;
    this.selectedRecipient = null;
    this.recipientSearchQuery = '';
    this.newMessageSubject = '';
    this.newMessageBody = '';
    this.filteredRecipients = [];
  }

  filterRecipients(query: string): void {
    if (!query.trim() || !this.contacts) {
      this.filteredRecipients = [];
      return;
    }

    const lowerQuery = query.toLowerCase();
    const allContacts: Contact[] = [
      ...this.contacts.instructors,
      ...this.contacts.fellowStudents,
    ];

    this.filteredRecipients = allContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }

  selectRecipient(recipient: Contact): void {
    this.selectedRecipient = recipient;
    this.recipientSearchQuery = '';
    this.filteredRecipients = [];
  }

  sendNewMessage(): void {
    if (!this.selectedRecipient || !this.newMessageBody.trim() || this.sendingNewMessage) {
      return;
    }

    this.sendingNewMessage = true;
    const subject = this.newMessageSubject.trim() || 'No Subject';
    const body = this.newMessageBody.trim();

    this.messagingService
      .sendMessage(this.selectedRecipient.id, subject, body)
      .pipe(finalize(() => (this.sendingNewMessage = false)))
      .subscribe({
        next: (message) => {
          // Create or update conversation
          const existingConv = this.conversations.find(
            (c) => c.partner.id === this.selectedRecipient!.id
          );

          if (existingConv) {
            existingConv.lastMessage = body;
            existingConv.lastMessageTime = new Date().toISOString();
            this.selectConversation(existingConv);
          } else {
            // Create new conversation
            const newConv: Conversation = {
              partner: this.selectedRecipient!,
              lastMessage: body,
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
            };
            this.conversations.unshift(newConv);
            this.filterConversations(this.searchQuery);
            this.selectConversation(newConv);
          }

          this.closeNewMessageModal();
        },
        error: (error) => {
          console.error('Error sending message:', error);
        },
      });
  }

  // Utility Methods
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (e) {
      console.error('Error scrolling to bottom:', e);
    }
  }
}
