import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtStrategy,
  ],
  exports: [AdminService],
})
export class AdminModule {}
