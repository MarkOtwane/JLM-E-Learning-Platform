// src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payment.controller';
import { PaymentsService } from './payment.service';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, JwtStrategy, StripeStrategy, MpesaStrategy],
  exports: [PaymentsService],
})
export class PaymentModule {}
