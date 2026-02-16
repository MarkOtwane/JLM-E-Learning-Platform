import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { addHours } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger('EmailVerification');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Generate and send email verification token
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate verification token
    const token = uuidv4();
    const expiresAt = addHours(new Date(), 24); // Valid for 24 hours

    // Delete existing verification token if any
    await this.prisma.emailVerification.deleteMany({
      where: { userId },
    });

    // Create new verification token
    await this.prisma.emailVerification.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - JLM E-Learning Platform',
        template: 'email-verification',
        context: {
          name: user.name,
          verificationUrl,
          expiresAt: expiresAt.toISOString(),
        },
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error}`);
      throw new BadRequestException('Failed to send verification email');
    }
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
