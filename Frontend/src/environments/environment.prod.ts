export const environment = {
  production: true,
  apiUrl: 'https://jlm-e-learning-platform.onrender.com/api', // Update this with your actual production API URL
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
