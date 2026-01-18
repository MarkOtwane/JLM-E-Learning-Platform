import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Management', () => {
    it('should set and get auth token', () => {
      const testToken = 'test-token';
      service.setAuthToken(testToken);
      expect(service.getToken()).toBe(testToken);
    });

    it('should clear auth token', () => {
      service.setAuthToken('test-token');
      service.clearToken();
      expect(service.getToken()).toBeNull();
    });

    it('should check if user is logged in', () => {
      expect(service.isLoggedIn()).toBeFalse();
      service.setAuthToken('test-token');
      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  describe('Auth Headers', () => {
    it('should return headers with authorization when token exists', () => {
      service.setAuthToken('test-token');
      const headers = service.getAuthHeaders();
      expect(headers.get('Authorization')).toBe('Bearer test-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should return headers without authorization when no token', () => {
      const headers = service.getAuthHeaders();
      expect(headers.get('Authorization')).toBeNull();
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('HTTP Methods', () => {
    const testEndpoint = '/test';
    const testData = { id: 1, name: 'Test' };

    it('should make GET request', () => {
      service.get(testEndpoint).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(testData);
    });

    it('should make POST request', () => {
      service.post(testEndpoint, testData).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(testData);
    });

    it('should make PUT request', () => {
      service.put(testEndpoint, testData).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(testData);
      req.flush(testData);
    });

    it('should make DELETE request', () => {
      service.delete(testEndpoint).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(testData);
    });

    it('should make PATCH request', () => {
      service.patch(testEndpoint, testData).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(testData);
      req.flush(testData);
    });
  });

  describe('Authenticated Methods', () => {
    const testEndpoint = '/test';
    const testData = { id: 1, name: 'Test' };

    beforeEach(() => {
      service.setAuthToken('test-token');
    });

    it('should make authenticated GET request', () => {
      service.getAuth(testEndpoint).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(testData);
    });

    it('should make authenticated POST request', () => {
      service.postAuth(testEndpoint, testData).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(req.request.body).toEqual(testData);
      req.flush(testData);
    });

    it('should handle 401 error and redirect to login', () => {
      spyOn(service['router'], 'navigate');
      
      service.getAuth(testEndpoint).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${testEndpoint}`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      
      expect(service['router'].navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Role Checking', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should return null when no user in localStorage', () => {
      expect(service.getUserRole()).toBeNull();
    });

    it('should return user role from localStorage', () => {
      const testUser = { role: 'STUDENT' };
      localStorage.setItem('user', JSON.stringify(testUser));
      expect(service.getUserRole()).toBe('STUDENT');
    });

    it('should check if user is instructor', () => {
      const testUser = { role: 'INSTRUCTOR' };
      localStorage.setItem('user', JSON.stringify(testUser));
      expect(service.isInstructor()).toBeTrue();
    });

    it('should check if user is admin', () => {
      const testUser = { role: 'ADMIN' };
      localStorage.setItem('user', JSON.stringify(testUser));
      expect(service.isAdmin()).toBeTrue();
    });

    it('should check if user is student', () => {
      const testUser = { role: 'STUDENT' };
      localStorage.setItem('user', JSON.stringify(testUser));
      expect(service.isStudent()).toBeTrue();
    });
  });
});