import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    JwtStrategy,
  ],
  exports: [ProgressService],
})
export class ProgressModule {}
