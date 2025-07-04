export type InstructorCourseMetrics = {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  avgProgress: number; // percentage 0 - 100
  avgQuizScore: number; // percentage 0 - 100
};

export type InstructorMetricsResponse = {
  totalCourses: number;
  totalStudents: number;
  courses: InstructorCourseMetrics[];
};
