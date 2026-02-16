import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { Public } from '../../auth/decorators';
import { PaymentsService } from '../payment.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger('StripeWebhook');
  private stripe: Stripe;

  constructor(private paymentsService: PaymentsService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });
  }

  @Public()
  @Post()
  async handleWebhook(
    @Req() request: Request & { rawBody?: Buffer },
  ): Promise<{ received: boolean }> {
    const sig = request.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify signature
      event = this.stripe.webhooks.constructEvent(
        request.rawBody || Buffer.alloc(0),
        sig,
        webhookSecret,
      );
    } catch (error: any) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    try {
      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      // Still return 200 to prevent Stripe retry
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    this.logger.log(`Processing checkout session: ${session.id}`);

    const courseId = session.metadata?.courseId;
    const userId = session.metadata?.userId;
    const amountTotal = (session.amount_total ?? 0) / 100;
    const metadata = session.metadata || {};
    const parsedMetadata = {
      amount: metadata.amount ? parseFloat(metadata.amount) : amountTotal,
      tax: metadata.tax ? parseFloat(metadata.tax) : 0,
      total: metadata.total ? parseFloat(metadata.total) : amountTotal,
      currency: metadata.currency ? metadata.currency.toUpperCase() : 'USD',
    };

    if (!courseId || !userId) {
      this.logger.error('Missing courseId or userId in session metadata');
      return;
    }

    // Delegate to payment service for atomic transaction
    await this.paymentsService.processSuccessfulPayment(
      userId,
      courseId,
      session.id,
      amountTotal,
      session.payment_status === 'paid',
      parsedMetadata,
    );
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // Additional tracking if needed
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Charge refunded: ${charge.id}`);
    // Handle refund logic
    if (charge.metadata?.paymentId) {
      await this.paymentsService.handleRefund(charge.metadata.paymentId);
    }
  }
}
