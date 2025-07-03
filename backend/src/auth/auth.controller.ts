/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { Roles } from './decorators/roles.decorator';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: any) {
    return this.authService.getUserById(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@GetUser() user: any) {
    return { user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Protected routes examples
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin-only')
  async adminOnly() {
    return { message: 'This is an admin-only route' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @Get('instructor-only')
  async instructorOnly() {
    return { message: 'This is an instructor or admin route' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  @Get('authenticated-only')
  async authenticatedOnly(@GetUser() user: any) {
    return {
      message: 'This route requires authentication',
      user: user,
    };
  }
}
