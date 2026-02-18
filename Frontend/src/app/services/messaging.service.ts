import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Message {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  private readonly apiUrl = '/api/messages';
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public messages$ = this.messagesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUnreadCount();
  }

  /**
   * Send a message to another user
   */
  sendMessage(
    receiverId: string,
    subject: string,
    body: string,
  ): Observable<Message> {
    return this.http
      .post<Message>(`${this.apiUrl}/send`, {
        receiverId,
        subject,
        body,
      })
      .pipe(tap(() => this.loadUnreadCount()));
  }

  /**
   * Get received messages
   */
  getReceivedMessages(
    skip: number = 0,
    take: number = 50,
  ): Observable<MessagesResponse> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());

    return this.http.get<MessagesResponse>(`${this.apiUrl}/received`, {
      params,
    });
  }

  /**
   * Get sent messages
   */
  getSentMessages(
    skip: number = 0,
    take: number = 50,
  ): Observable<MessagesResponse> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());

    return this.http.get<MessagesResponse>(`${this.apiUrl}/sent`, { params });
  }

  /**
   * Get unread message count
   */
  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(
      `${this.apiUrl}/unread-count`,
    );
  }

  /**
   * Load unread count and update subject
   */
  loadUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCountSubject.next(response.unreadCount);
      },
    });
  }

  /**
   * Get conversation with another user
   */
  getConversation(
    otherUserId: string,
    skip: number = 0,
    take: number = 50,
  ): Observable<MessagesResponse> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());

    return this.http.get<MessagesResponse>(
      `${this.apiUrl}/conversation/${otherUserId}`,
      { params },
    );
  }

  /**
   * Get a single message
   */
  getMessageById(messageId: string): Observable<Message> {
    return this.http.get<Message>(`${this.apiUrl}/${messageId}`);
  }

  /**
   * Mark a message as read
   */
  markAsRead(messageId: string): Observable<Message> {
    return this.http
      .patch<Message>(`${this.apiUrl}/${messageId}/read`, {})
      .pipe(tap(() => this.loadUnreadCount()));
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${messageId}`);
  }

  /**
   * Update messages in the subject
   */
  updateMessages(messages: Message[]): void {
    this.messagesSubject.next(messages);
  }
}
