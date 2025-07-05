import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentsController } from './student.controller';
import { StudentsService } from './student.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [StudentsService, JwtStrategy],
  exports: [StudentsService],
})
export class StudentsModule {}
