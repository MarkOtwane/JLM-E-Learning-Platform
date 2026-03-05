/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger('EmailVerification');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Generate and send email verification token
   * NOTE: Email verification frozen - this is a no-op for now
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Email verification disabled - frozen for future implementation
    this.logger.log(`Email verification requested for ${email} but disabled`);
    return;
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // Find verification record
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    // Check if token is expired
    if (new Date() > verification.expiresAt) {
      // Delete expired token
      await this.prisma.emailVerification.delete({
        where: { token },
      });
      throw new BadRequestException('Verification token has expired');
    }

    // Update user
    await this.prisma.$transaction(async (tx) => {
      // Mark email as verified
      await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      });

      // Delete verification token
      await tx.emailVerification.delete({
        where: { token },
      });
    });

    this.logger.log(`Email verified for user: ${verification.userId}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Send verification email
    await this.sendVerificationEmail(userId, user.email);

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return user?.emailVerified || false;
  }
}
