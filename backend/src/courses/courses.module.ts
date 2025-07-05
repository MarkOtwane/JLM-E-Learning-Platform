import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService, JwtStrategy],
  exports: [CoursesService],
})
export class CoursesModule {}
