import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { User } from 'src/auth/decorators';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './user.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@User('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  async updateProfile(@User('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Put('me')
  async putUpdateProfile(
    @User('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @User('id') userId: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(userId, dto);
  }

  @Post('/profile/:userId/picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const profilePictureUrl = `/uploads/profile-pictures/${file.filename}`;
    await this.usersService.updateProfile(userId, {
      profilePicture: profilePictureUrl,
    });
    return { profilePictureUrl };
  }
}
