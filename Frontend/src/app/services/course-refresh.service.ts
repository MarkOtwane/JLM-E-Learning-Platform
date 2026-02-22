import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CourseRefreshService {
  private courseCreatedSubject = new Subject<void>();
  public courseCreated$ = this.courseCreatedSubject.asObservable();

  notifyCourseCreated(): void {
    this.courseCreatedSubject.next();
  }
}
