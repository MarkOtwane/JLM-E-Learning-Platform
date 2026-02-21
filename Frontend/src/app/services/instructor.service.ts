import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/instructors/dashboard`);
  }

  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/courses`);
  }

  // Lessons
  createLesson(moduleId: string, lessonData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/instructors/modules/${moduleId}/lessons`, lessonData);
  }

  updateLesson(lessonId: string, lessonData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/instructors/lessons/${lessonId}`, lessonData);
  }

  deleteLesson(lessonId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/instructors/lessons/${lessonId}`);
  }

  reorderLessons(moduleId: string, lessons: { lessonId: string; order: number }[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/instructors/modules/${moduleId}/lessons/reorder`, { lessons });
  }

  getModuleLessons(moduleId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/modules/${moduleId}/lessons`);
  }

  // Assignments
  createAssignment(assignmentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/instructors/assignments`, assignmentData);
  }

  getCourseAssignments(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/courses/${courseId}/assignments`);
  }

  getAssignmentSubmissions(assignmentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/assignments/${assignmentId}/submissions`);
  }

  gradeSubmission(submissionId: string, gradeData: { score: number; feedback?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/instructors/submissions/${submissionId}/grade`, gradeData);
  }

  // Announcements
  createAnnouncement(announcementData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/instructors/announcements`, announcementData);
  }

  getCourseAnnouncements(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/courses/${courseId}/announcements`);
  }

  deleteAnnouncement(announcementId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/instructors/announcements/${announcementId}`);
  }

  // Students
  getCourseStudents(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/courses/${courseId}/students`);
  }

  // Q&A
  getLessonQuestions(lessonId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors/lessons/${lessonId}/questions`);
  }

  answerQuestion(questionId: string, answer: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/instructors/questions/${questionId}/answer`, { answer });
  }

  // Analytics
  getCourseAnalytics(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/instructors/courses/${courseId}/analytics`);
  }

  // Gradebook
  getCourseGradebook(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/instructors/courses/${courseId}/gradebook`);
  }

  exportGradebookCSV(courseId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/instructors/courses/${courseId}/gradebook/export`, {
      responseType: 'blob'
    });
  }
}
