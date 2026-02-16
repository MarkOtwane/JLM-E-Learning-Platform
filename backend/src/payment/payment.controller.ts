// src/payments/payments.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './payment.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paginationService: PaginationService,
  ) {}

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

  @Get('history')
  @Roles(UserRole.STUDENT)
  async getPaymentHistory(
    @User('id') userId: string,
    @Query('status') status?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const { payments, total } = await this.paymentsService.getPaymentHistory(
      userId,
      status,
      pagination,
    );
    return this.paginationService.paginate(
      payments,
      total,
      pagination || new PaginationDto(),
    );
  }

  @Get(':paymentId')
  @Roles(UserRole.STUDENT)
  async getPaymentDetails(
    @User('id') userId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.getPaymentDetails(userId, paymentId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllPayments(
    @Query('status') status?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const { payments, total } = await this.paymentsService.getAllPayments(
      status,
      pagination,
    );
    return this.paginationService.paginate(
      payments,
      total,
      pagination || new PaginationDto(),
    );
  }
}
