import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [PrismaModule],
  controllers: [QuizzesController],
  providers: [
    QuizzesService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [QuizzesService],
})
export class QuizzesModule {}
