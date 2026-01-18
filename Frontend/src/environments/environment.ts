export const environment = {
  production: false,
  apiUrl: 'https://jlm-e-learning-platform.onrender.com/api',
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
    notifications: '/notifications'
  },
  // Feature flags
  featureFlags: {
    enableCertificateDownload: true,
    enablePaymentIntegration: false,
    enableLiveClasses: true
  }
}; 