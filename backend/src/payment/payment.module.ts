// src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payment.controller';
import { PaymentsService } from './payment.service';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { TaxService } from './tax/tax.service';
import { StripeWebhookController } from './webhooks/stripe.webhook';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [
    PaymentsService,
    JwtStrategy,
    StripeStrategy,
    MpesaStrategy,
    TaxService,
    PaginationService,
  ],
  exports: [PaymentsService],
})
export class PaymentModule {}
