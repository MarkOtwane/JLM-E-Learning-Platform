import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { StudentsController } from './student.controller';
import { StudentsService } from './student.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [StudentsService],
})
export class StudentsModule {}
