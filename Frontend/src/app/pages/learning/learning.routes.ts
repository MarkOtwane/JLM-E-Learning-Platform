import { Routes } from '@angular/router';
import { CourseLearningComponent } from './course-learning.component';
import { QuizComponent } from './Quiz/quiz.component';

export const LEARNING_ROUTES: Routes = [
  {
    path: 'course/:id',
    component: CourseLearningComponent,
  },
  {
    path: 'course/:id/quiz/:moduleIndex/:topicIndex',
    component: QuizComponent,
  },
  {
    path: 'course/:id/final-exam',
    component: QuizComponent,
  },
];