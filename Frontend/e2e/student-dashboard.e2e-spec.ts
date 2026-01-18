import { test, expect } from '@playwright/test';

// Base URL for the application
test.use({ baseURL: 'http://localhost:4200' });

// Test data
const testUser = {
  email: 'test.student@example.com',
  password: 'password123'
};

test.describe('Student Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[formControlName="email"]', testUser.email);
    await page.fill('input[formControlName="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/student/dashboard');
  });

  test('should load student dashboard and display user information', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/student/dashboard');
    
    // Check for welcome message
    const welcomeMessage = page.locator('h1:has-text("Good")');
    await expect(welcomeMessage).toBeVisible();
    
    // Check for user profile section
    const profileSection = page.locator('.profile-section');
    await expect(profileSection).toBeVisible();
  });

  test('should display enrolled courses', async ({ page }) => {
    // Navigate to courses page
    await page.click('a[href="/student/courses"]');
    await page.waitForURL('/student/courses');
    
    // Check for enrolled courses section
    const enrolledCourses = page.locator('.enrolled-courses');
    await expect(enrolledCourses).toBeVisible();
    
    // Check for at least one course card
    const courseCards = page.locator('.course-card');
    await expect(courseCards).toHaveCount(1);
  });

  test('should allow course enrollment', async ({ page }) => {
    // Navigate to courses page
    await page.click('a[href="/student/courses"]');
    await page.waitForURL('/student/courses');
    
    // Find an available course and enroll
    const availableCourses = page.locator('.available-courses');
    await expect(availableCourses).toBeVisible();
    
    const enrollButton = page.locator('.enroll-btn').first();
    await enrollButton.click();
    
    // Wait for enrollment to complete
    await page.waitForSelector('.enroll-btn:disabled', { state: 'hidden' });
    
    // Verify course is now in enrolled section
    const courseCards = page.locator('.enrolled-courses .course-card');
    await expect(courseCards).toHaveCount(1);
  });

  test('should navigate to course learning page', async ({ page }) => {
    // Navigate to courses page
    await page.click('a[href="/student/courses"]');
    await page.waitForURL('/student/courses');
    
    // Click on a course to continue learning
    const continueButton = page.locator('.continue-btn').first();
    await continueButton.click();
    
    // Verify navigation to learning page
    await page.waitForURL(/\/learning\/course\/.*/);
    expect(page.url()).toMatch(/\/learning\/course\/.*/);
  });

  test('should display certificates', async ({ page }) => {
    // Navigate to certificates page
    await page.click('a[href="/student/certifications"]');
    await page.waitForURL('/student/certifications');
    
    // Check for certificates section
    const certificatesSection = page.locator('.certificates-section');
    await expect(certificatesSection).toBeVisible();
    
    // Check for certificate cards
    const certificateCards = page.locator('.certificate-card');
    await expect(certificateCards).toHaveCount(0);
  });

  test('should allow certificate download', async ({ page }) => {
    // Navigate to certificates page
    await page.click('a[href="/student/certifications"]');
    await page.waitForURL('/student/certifications');
    
    // Check if there are certificates available
    const certificateCards = page.locator('.certificate-card');
    const count = await certificateCards.count();
    
    if (count > 0) {
      // Click download on first certificate
      const downloadButton = page.locator('.download-btn').first();
      
      // Set up page to handle the download
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });

  test('should navigate to profile page', async ({ page }) => {
    // Click on profile link
    await page.click('a[href="/student/profile"]');
    await page.waitForURL('/student/profile');
    
    // Verify profile page loads
    const profilePage = page.locator('.profile-page');
    await expect(profilePage).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Click on logout button
    await page.click('button.logout-btn');
    
    // Verify redirection to login page
    await page.waitForURL('/login');
    expect(page.url()).toBe('http://localhost:4200/login');
    
    // Verify login form is visible
    const loginForm = page.locator('form[action="/login"]');
    await expect(loginForm).toBeVisible();
  });

  test('should handle protected routes for unauthenticated users', async ({ page }) => {
    // Logout first
    await page.click('button.logout-btn');
    await page.waitForURL('/login');
    
    // Try to access student dashboard directly
    await page.goto('/student/dashboard');
    
    // Should be redirected to login
    await page.waitForURL('/login');
    expect(page.url()).toBe('http://localhost:4200/login');
  });

  test('should show loading states during API calls', async ({ page }) => {
    // Navigate to courses page
    await page.click('a[href="/student/courses"]');
    await page.waitForURL('/student/courses');
    
    // Check for loading spinner
    const loadingSpinner = page.locator('.loading-spinner');
    await expect(loadingSpinner).toBeVisible();
    
    // Wait for loading to complete
    await expect(loadingSpinner).toBeHidden({ timeout: 10000 });
  });
});