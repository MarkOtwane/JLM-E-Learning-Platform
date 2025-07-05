import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [UsersService],
})
export class UsersModule {}
