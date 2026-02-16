import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger('TokenCleanup');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run token cleanup every hour
   * Deletes expired password reset, email verification, and refresh tokens
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.log('Starting token cleanup process...');
    const now = new Date();

    try {
      // Clean up expired password reset tokens
      const passwordResetDeleted = await this.prisma.passwordReset.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      this.logger.debug(
        `Deleted ${passwordResetDeleted.count} expired password reset tokens`,
      );

      // Clean up expired email verification tokens
      const emailVerificationDeleted =
        await this.prisma.emailVerification.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        });
      this.logger.debug(
        `Deleted ${emailVerificationDeleted.count} expired email verification tokens`,
      );

      // Clean up expired refresh tokens
      const refreshTokenDeleted = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      this.logger.debug(
        `Deleted ${refreshTokenDeleted.count} expired refresh tokens`,
      );

      const total =
        passwordResetDeleted.count +
        emailVerificationDeleted.count +
        refreshTokenDeleted.count;

      this.logger.log(
        `Token cleanup completed. Total tokens deleted: ${total}`,
      );
    } catch (error) {
      this.logger.error(`Token cleanup failed: ${error}`, error.stack);
    }
  }
}
