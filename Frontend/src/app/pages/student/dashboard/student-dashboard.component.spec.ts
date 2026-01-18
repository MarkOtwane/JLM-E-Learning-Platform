import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentDashboardComponent } from './student-dashboard.component';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { UserProfileService } from '../../../services/user-profile.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('StudentDashboardComponent', () => {
  let component: StudentDashboardComponent;
  let fixture: ComponentFixture<StudentDashboardComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userProfileServiceSpy: jasmine.SpyObj<UserProfileService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getAuth', 'postAuth']);
    const authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'isStudent'], { user$: of(null) });
    const profileSpy = jasmine.createSpyObj('UserProfileService', ['getDisplayName', 'getProfilePictureUrl', 'getUserInitials'], { profile$: of({}) });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [StudentDashboardComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: UserProfileService, useValue: profileSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userProfileServiceSpy = TestBed.inject(UserProfileService) as jasmine.SpyObj<UserProfileService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(StudentDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should subscribe to profile and auth services on init', () => {
      spyOn(component as any, 'subscribeToProfile');
      spyOn(component as any, 'loadCourseData');
      spyOn(component as any, 'loadAvailableCourses');
      
      component.ngOnInit();
      
      expect(component['subscribeToProfile']).toHaveBeenCalled();
      expect(component['loadCourseData']).toHaveBeenCalled();
      expect(component['loadAvailableCourses']).toHaveBeenCalled();
    });

    it('should unsubscribe from observables on destroy', () => {
      (component as any).profileSubscription = { unsubscribe: jasmine.createSpy() };
      (component as any).authSubscription = { unsubscribe: jasmine.createSpy() };
      
      component.ngOnDestroy();
      
      expect((component as any).profileSubscription?.unsubscribe).toHaveBeenCalled();
      expect((component as any).authSubscription?.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Course Data Loading', () => {
    it('should load enrolled courses successfully', () => {
      const mockCourses = [{ id: '1', title: 'Test Course' }];
      apiServiceSpy.getAuth.and.returnValue(of(mockCourses));
      
      (component as any).loadCourseData();
      
      expect(component.isLoading).toBeTrue();
      expect(apiServiceSpy.getAuth).toHaveBeenCalledWith('/students/courses');
      
      // Simulate the observable completing
      fixture.whenStable().then(() => {
        expect(component.enrolledCourses).toEqual(mockCourses);
        expect(component.isLoading).toBeFalse();
      });
    });

    it('should handle error when loading enrolled courses', () => {
      apiServiceSpy.getAuth.and.returnValue(throwError(() => new Error('Failed to load')));
      
      (component as any).loadCourseData();
      
      expect(component.isLoading).toBeTrue();
      
      // Simulate the observable erroring
      fixture.whenStable().then(() => {
        expect(component.enrolledCourses).toEqual([]);
        expect(component.isLoading).toBeFalse();
      });
    });

    it('should load available courses successfully', () => {
      const mockEnrolled = [{ id: '1', title: 'Enrolled Course' }];
      const mockAll = [{ id: '1', title: 'Enrolled Course' }, { id: '2', title: 'Available Course' }];
      const mockAvailable = [{ id: '2', title: 'Available Course' }];
      
      component.enrolledCourses = mockEnrolled;
      apiServiceSpy.getAuth.and.returnValue(of(mockAll));
      
      (component as any).loadAvailableCourses();
      
      expect(apiServiceSpy.getAuth).toHaveBeenCalledWith('/courses');
      
      // Simulate the observable completing
      fixture.whenStable().then(() => {
        expect(component.availableCourses).toEqual(mockAvailable);
      });
    });

    it('should handle error when loading available courses', () => {
      apiServiceSpy.getAuth.and.returnValue(throwError(() => new Error('Failed to load')));
      
      (component as any).loadAvailableCourses();
      
      // Simulate the observable erroring
      fixture.whenStable().then(() => {
        expect(component.availableCourses).toEqual([]);
      });
    });
  });

  describe('Enrollment', () => {
    it('should enroll in a course successfully', () => {
      const courseId = '1';
      apiServiceSpy.postAuth.and.returnValue(of({}));
      
      spyOn(component as any, 'loadCourseData');
      spyOn(component as any, 'loadAvailableCourses');
      
      component.enrollInCourse(courseId);
      
      expect(apiServiceSpy.postAuth).toHaveBeenCalledWith('/students/enroll', { courseId });
      
      // Simulate the observable completing
      fixture.whenStable().then(() => {
        expect(component['loadCourseData']).toHaveBeenCalled();
        expect(component['loadAvailableCourses']).toHaveBeenCalled();
      });
    });

    it('should handle enrollment error', () => {
      const courseId = '1';
      const mockError = { error: { message: 'Enrollment failed' } };
      apiServiceSpy.postAuth.and.returnValue(throwError(() => mockError));
      
      spyOn(window, 'alert');
      
      component.enrollInCourse(courseId);
      
      // Simulate the observable erroring
      fixture.whenStable().then(() => {
        expect(window.alert).toHaveBeenCalledWith('Enrollment failed');
      });
    });
  });

  describe('Utility Methods', () => {
    it('should return welcome message based on time', () => {
      const hour = new Date().getHours();
      const message = component.getWelcomeMessage();
      
      expect(message).toContain('Student');
      if (hour < 12) {
        expect(message).toContain('Good morning');
      } else if (hour < 17) {
        expect(message).toContain('Good afternoon');
      } else {
        expect(message).toContain('Good evening');
      }
    });

    it('should calculate total credits', () => {
      component.enrolledCourses = [
        { credits: 3 },
        { credits: 4 },
        { credits: 2 }
      ];
      
      expect(component.getTotalCredits()).toBe(9);
    });

    it('should handle courses without credits', () => {
      component.enrolledCourses = [
        { credits: 3 },
        {},
        { credits: 2 }
      ];
      
      expect(component.getTotalCredits()).toBe(5);
    });
  });

  describe('Navigation', () => {
    it('should navigate to course learning page', () => {
      const course = { id: '1', title: 'Test Course' };
      
      component.onCourseClick(course);
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/learning/course', '1']);
    });

    it('should not navigate if course has no id', () => {
      const course = { title: 'Test Course' };
      
      component.onCourseClick(course);
      
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});