import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryProvider } from './cloudinary.provider';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContentController],
  providers: [ContentService, JwtStrategy, CloudinaryProvider],
  exports: [ContentService],
})
export class ContentModule {}
