import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  imports: [PrismaModule],
  controllers: [ContentController],
  providers: [
    ContentService,
    JwtStrategy,
    CloudinaryProvider,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [ContentService],
})
export class ContentModule {}
