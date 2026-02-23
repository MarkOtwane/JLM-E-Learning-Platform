import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private apiService: ApiService) {}

  // Dashboard
  getDashboardMetrics(): Observable<any> {
    return this.apiService.getAuth<any>(`/instructors/dashboard`);
  }

  getCourses(): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/courses`);
  }

  // Lessons
  createLesson(moduleId: string, lessonData: any): Observable<any> {
    return this.apiService.postAuth<any>(`/instructors/modules/${moduleId}/lessons`, lessonData);
  }

  updateLesson(lessonId: string, lessonData: any): Observable<any> {
    return this.apiService.putAuth<any>(`/instructors/lessons/${lessonId}`, lessonData);
  }

  deleteLesson(lessonId: string): Observable<any> {
    return this.apiService.deleteAuth<any>(`/instructors/lessons/${lessonId}`);
  }

  reorderLessons(moduleId: string, lessons: { lessonId: string; order: number }[]): Observable<any> {
    return this.apiService.postAuth<any>(`/instructors/modules/${moduleId}/lessons/reorder`, { lessons });
  }

  getModuleLessons(moduleId: string): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/modules/${moduleId}/lessons`);
  }

  // Assignments
  createAssignment(assignmentData: any): Observable<any> {
    return this.apiService.postAuth<any>(`/instructors/assignments`, assignmentData);
  }

  getCourseAssignments(courseId: string): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/courses/${courseId}/assignments`);
  }

  getAssignmentSubmissions(assignmentId: string): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/assignments/${assignmentId}/submissions`);
  }

  gradeSubmission(submissionId: string, gradeData: { score: number; feedback?: string }): Observable<any> {
    return this.apiService.putAuth<any>(`/instructors/submissions/${submissionId}/grade`, gradeData);
  }

  // Announcements
  createAnnouncement(announcementData: any): Observable<any> {
    return this.apiService.postAuth<any>(`/instructors/announcements`, announcementData);
  }

  getCourseAnnouncements(courseId: string): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/courses/${courseId}/announcements`);
  }

  deleteAnnouncement(announcementId: string): Observable<any> {
    return this.apiService.deleteAuth<any>(`/instructors/announcements/${announcementId}`);
  }

  // Students
  getCourseStudents(courseId: string): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/courses/${courseId}/students`);
  }

  // Q&A
  getLessonQuestions(lessonId: string): Observable<any[]> {
    return this.apiService.getAuth<any[]>(`/instructors/lessons/${lessonId}/questions`);
  }

  answerQuestion(questionId: string, answer: string): Observable<any> {
    return this.apiService.putAuth<any>(`/instructors/questions/${questionId}/answer`, { answer });
  }

  // Analytics
  getCourseAnalytics(courseId: string): Observable<any> {
    return this.apiService.getAuth<any>(`/instructors/courses/${courseId}/analytics`);
  }

  // Gradebook
  getCourseGradebook(courseId: string): Observable<any> {
    return this.apiService.getAuth<any>(`/instructors/courses/${courseId}/gradebook`);
  }

  exportGradebookCSV(courseId: string): Observable<Blob> {
    return this.apiService.getAuth<Blob>(`/instructors/courses/${courseId}/gradebook/export`);
  }
}
