import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ContentService } from '../content/content.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService, JwtStrategy, ContentService],
  exports: [CoursesService],
})
export class CoursesModule {}
