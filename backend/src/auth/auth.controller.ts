// src/auth/auth.controller.ts

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/regtister.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}

/**
 * @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin-only')
getAdminData() {
  return { secure: true };
}

 */
