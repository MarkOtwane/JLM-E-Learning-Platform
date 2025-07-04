// src/payments/payments.controller.ts

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './payment.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @Roles(UserRole.STUDENT)
  async initiatePayment(
    @User('id') studentId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(studentId, dto);
  }

  @Post('verify')
  @Roles(UserRole.STUDENT)
  async verifyPayment(
    @User('id') studentId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(studentId, dto);
  }
}
