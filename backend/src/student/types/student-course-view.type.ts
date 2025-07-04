import { Content, Course, Module } from '@prisma/client';

export type StudentCourseView = Course & {
  modules: (Module & {
    contents: Content[];
  })[];
};
