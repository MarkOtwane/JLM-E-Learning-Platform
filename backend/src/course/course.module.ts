// courses.module.ts (with Prisma)
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesController } from './course.controller';
import { CoursesService } from './course.service';

@Module({
  imports: [],
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}
