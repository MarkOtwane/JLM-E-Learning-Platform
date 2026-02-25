export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Add other environment-specific variables here
  appName: 'JLM E-Learning Platform',
  version: '1.0.0',
  // API endpoints
  apiEndpoints: {
    me: '/me',
    courses: '/courses',
    studentCourses: '/students/courses',
    certificates: '/certificates',
    assignments: '/assignments',
    payments: '/payments',
    notifications: '/notifications',
  },
  // Feature flags
  featureFlags: {
    enableCertificateDownload: true,
    enablePaymentIntegration: false,
    enableLiveClasses: true,
  },
};
