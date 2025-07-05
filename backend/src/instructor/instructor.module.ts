// src/instructors/instructors.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { InstructorsController } from './instructor.controller';
import { InstructorsService } from './instructor.service';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorsController],
  providers: [InstructorsService, JwtStrategy],
  exports: [InstructorsService],
})
export class InstructorsModule {}
