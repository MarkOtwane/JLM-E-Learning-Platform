// src/auth/auth.controller.ts

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/regtister.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import {
  ResendVerificationEmailDto,
  VerifyEmailDto,
} from './dto/verify-email.dto';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } }) // 3 per hour
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } }) // 5 per 15 minutes
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } }) // 3 per hour
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(dto.token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } }) // 3 per hour
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    // Find user by email and resend verification
    // Note: In production, you might want to limit this differently
    // For now, we'll accept email instead of userId for the public case
    return {
      message: 'If email exists in our system, verification email will be sent',
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } }) // 10 per minute
  @Post('refresh-token')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Body('userId') userId: string,
  ) {
    return this.authService.refreshAccessToken(userId, refreshToken);
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
