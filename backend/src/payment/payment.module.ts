// src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payment.controller';
import { PaymentsService } from './payment.service';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeStrategy,
    MpesaStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
