/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InitiatePaymentDto,
  PaymentProvider,
} from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { PaymentStatus } from './types/payment-status.type';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeStrategy,
    private readonly mpesa: MpesaStrategy,
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

    const amount = 1000; // Default amount since Course model doesn't have price field

    if (dto.provider === PaymentProvider.STRIPE) {
      return this.stripe.createCheckoutSession(
        dto.phoneOrEmail,
        dto.courseId,
        amount,
      );
    } else if (dto.provider === PaymentProvider.MPESA) {
      return this.mpesa.initiateStkPush(dto.phoneOrEmail, dto.courseId, amount);
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
}
