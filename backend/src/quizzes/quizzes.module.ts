import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [QuizzesController],
  providers: [
    QuizzesService,
    JwtStrategy,
  ],
  exports: [QuizzesService],
})
export class QuizzesModule {}
