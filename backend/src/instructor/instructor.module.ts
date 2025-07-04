// src/instructors/instructors.module.ts

import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InstructorsController } from './instructor.controller';
import { InstructorsService } from './instructor.service';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorsController],
  providers: [
    InstructorsService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [InstructorsService],
})
export class InstructorsModule {}
