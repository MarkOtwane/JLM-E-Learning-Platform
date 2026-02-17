import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CacheService } from '../common/services/cache.service';
import { PaginationService } from '../common/services/pagination.service';
import { ContentService } from '../content/content.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    JwtStrategy,
    ContentService,
    PaginationService,
    CacheService,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
