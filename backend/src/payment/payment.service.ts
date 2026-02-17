/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  InitiatePaymentDto,
  PaymentProvider,
} from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { TaxService } from './tax/tax.service';
import { PaymentStatus } from './types/payment-status.type';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeStrategy,
    private readonly mpesa: MpesaStrategy,
    private readonly taxService: TaxService,
  ) {}

  async initiatePayment(studentId: string, dto: InitiatePaymentDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.isPremium)
      throw new BadRequestException('Course is free, no payment required');

    const alreadyEnrolled = await this.prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: dto.courseId,
      },
    });
    if (alreadyEnrolled)
      throw new ForbiddenException('Already enrolled in this course');

    // Use course price if available, fallback to 100
    const amount = course.price || 100;
    const currency = course.currency || 'USD';
    const { tax, total } = this.taxService.calculateTax(amount, dto.country);

    if (dto.provider === PaymentProvider.STRIPE) {
      return this.stripe.createCheckoutSession(
        dto.phoneOrEmail,
        dto.courseId,
        total,
        studentId,
        { amount, tax, total, currency },
      );
    } else if (dto.provider === PaymentProvider.MPESA) {
      return this.mpesa.initiateStkPush(
        dto.phoneOrEmail,
        dto.courseId,
        total,
      );
    }

    throw new BadRequestException('Unsupported payment provider');
  }

  async verifyPayment(studentId: string, dto: VerifyPaymentDto) {
    let result;

    if (dto.provider === PaymentProvider.STRIPE) {
      result = await this.stripe.verifySession(dto.transactionId);
    } else if (dto.provider === PaymentProvider.MPESA) {
      result = await this.mpesa.verifyStkPush(dto.transactionId);
    } else {
      throw new BadRequestException('Unsupported payment provider');
    }

    if (result.status !== PaymentStatus.SUCCESS) {
      throw new ForbiddenException('Payment not completed');
    }

    // Enroll student if not already enrolled
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: result.courseId,
      },
    });

    if (!existing) {
      await this.prisma.enrollment.create({
        data: {
          userId: studentId,
          courseId: result.courseId,
        },
      });
    }

    return {
      message: 'Payment verified and enrollment successful',
      transactionId: result.transactionId,
      status: result.status,
      paidAt: result.paidAt,
    };
  }

  // NEW: Called by webhook after payment verified by Stripe
  async processSuccessfulPayment(
    userId: string,
    courseId: string,
    transactionId: string,
    amount: number,
    paid: boolean,
    metadata?: { amount: number; tax: number; total: number; currency: string },
  ): Promise<void> {
    if (!paid) return;

    try {
      // Use Prisma transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // 1. Create payment record
        const payment = await tx.payment.create({
          data: {
            userId,
            courseId,
            amount: metadata?.amount ?? amount,
            tax: metadata?.tax ?? 0,
            total: metadata?.total ?? amount,
            currency: metadata?.currency ?? 'USD',
            status: 'completed',
            provider: 'stripe',
            transactionId,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });

        // 2. Check if already enrolled
        const existingEnrollment = await tx.enrollment.findFirst({
          where: { userId, courseId },
        });

        // 3. Create enrollment if not exists
        if (!existingEnrollment) {
          await tx.enrollment.create({
            data: { userId, courseId },
          });
        }

        return payment;
      });

      this.logger.log(
        `Payment processed: ${transactionId} for user ${userId}`,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Enrollment already exists (unique constraint violation)
        this.logger.log(
          `Enrollment already exists: user ${userId}, course ${courseId}`,
        );
      } else {
        this.logger.error(
          `Error processing payment: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    }
  }

  // NEW: Handle refunds
  async handleRefund(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return;

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' },
    });

    this.logger.log(`Refund processed for payment: ${paymentId}`);
  }

  // Get payment history for a user
  async getPaymentHistory(
    userId: string,
    status?: string,
    pagination?: PaginationDto,
  ): Promise<{
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      provider: string;
      createdAt: Date;
      course: { id: string; title: string; price: number };
    }>;
    total: number;
  }> {
    const where = {
      userId,
      ...(status && { status }),
    };

    const total = await this.prisma.payment.count({ where });

    const payments = await this.prisma.payment.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.limit,
      include: {
        course: {
          select: { id: true, title: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { payments, total };
  }

  // Get single payment details
  async getPaymentDetails(
    userId: string,
    paymentId: string,
  ): Promise<{
    id: string;
    amount: number;
    status: string;
    provider: string;
    createdAt: Date;
    course: { id: string; title: string };
    user: { email: string; name: string };
  }> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { email: true, name: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // Get all payments (admin)
  async getAllPayments(
    status?: string,
    pagination?: PaginationDto,
  ): Promise<{
    payments: Array<{
      id: string;
      amount: number;
      status: string;
      provider: string;
      createdAt: Date;
      user: { id: string; email: string; name: string };
      course: { id: string; title: string };
    }>;
    total: number;
  }> {
    const where = {
      ...(status && { status }),
    };

    const total = await this.prisma.payment.count({ where });

    const payments = await this.prisma.payment.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.limit,
      include: {
        user: { select: { id: true, email: true, name: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { payments, total };
  }
}
