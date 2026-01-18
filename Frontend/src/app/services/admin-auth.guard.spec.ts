import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminAuthGuard, StudentAuthGuard } from './admin-auth.guard';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('Auth Guards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAdminUser', 'isLoggedIn', 'isStudent']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AdminAuthGuard,
        StudentAuthGuard,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  describe('AdminAuthGuard', () => {
    it('should allow activation for admin users', () => {
      authService.isAdminUser.and.returnValue(true);
      const guard = TestBed.inject(AdminAuthGuard);
      expect(guard.canActivate()).toBeTrue();
    });

    it('should not allow activation for non-admin users and redirect to login', () => {
      authService.isAdminUser.and.returnValue(false);
      const guard = TestBed.inject(AdminAuthGuard);
      spyOn(router, 'navigate');
      
      expect(guard.canActivate()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('StudentAuthGuard', () => {
    it('should allow activation for logged in students', () => {
      authService.isLoggedIn.and.returnValue(true);
      authService.isStudent.and.returnValue(of(true));
      const guard = TestBed.inject(StudentAuthGuard);
      expect(guard.canActivate()).toBeTrue();
    });

    it('should not allow activation for non-student users and redirect to login', () => {
      authService.isLoggedIn.and.returnValue(true);
      authService.isStudent.and.returnValue(of(false));
      const guard = TestBed.inject(StudentAuthGuard);
      spyOn(router, 'navigate');
      
      expect(guard.canActivate()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not allow activation for logged out users and redirect to login', () => {
      authService.isLoggedIn.and.returnValue(false);
      authService.isStudent.and.returnValue(of(false));
      const guard = TestBed.inject(StudentAuthGuard);
      spyOn(router, 'navigate');
      
      expect(guard.canActivate()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});